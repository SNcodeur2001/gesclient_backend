import { Injectable } from '@nestjs/common';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { FactureType } from '../../domain/enums/facture-type.enum';

// Initialize pdfmake with fonts
function initializePdfMake() {
  if (pdfMake && pdfFonts) {
    // For pdfmake 0.2.x - use pdfFonts as vfs directly
    if (typeof pdfFonts === 'object' && !pdfFonts.pdfMake) {
      pdfMake.vfs = pdfFonts as any;
    } else if (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
      // For newer versions
      pdfMake.vfs = pdfFonts.pdfMake.vfs;
    }
  }
}
initializePdfMake();

export interface FactureData {
  numero: string;
  type: FactureType;
  date: Date;
  client: {
    nom: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    adresse?: string;
  };
  produit: string;
  quantite: number;
  prixUnitaire: number;
  items?: {
    produit: string;
    quantite: number;
    prixUnitaire: number;
  }[];
  montantHT: number;
  tva: number;
  montantTTC: number;
  acomteVerse?: number;
  soldeRestant?: number;
  commercial: {
    nom: string;
    prenom: string;
  };
}

@Injectable()
export class PdfGeneratorService {
  async generateFacture(data: FactureData): Promise<Buffer> {
    const docDefinition = this.createDocDefinition(data);
    return new Promise((resolve, reject) => {
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      pdfDocGenerator.getBuffer((buffer: Buffer) => {
        resolve(buffer);
      });
    });
  }

  private createDocDefinition(data: FactureData): any {
    const isProforma = data.type === FactureType.PROFORMA;
    const documentTitle = isProforma ? 'FACTURE PROFORMA' : 'FACTURE DÉFINITIVE';

    // Calculate TVA percentage from data
    const tvaPercentage =
      data.montantHT > 0 ? (data.tva / data.montantHT) * 100 : 0;

    const items = (data.items && data.items.length > 0)
      ? data.items.map((i) => ({
        label: i.produit,
        qty: i.quantite,
        price: i.prixUnitaire,
        total: i.quantite * i.prixUnitaire,
      }))
      : [
          {
            label: data.produit,
            qty: data.quantite,
            price: data.prixUnitaire,
            total: data.quantite * data.prixUnitaire,
          },
        ];

    return {
      pageMargins: [40, 40, 40, 40],
      content: [
        // Header
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'PROPLAST', style: 'companyName' },
                {
                  text: 'Zone Industrielle de Dakar\nSénégal, BP 12345\ncontact@proplast.sn',
                  style: 'companySub',
                },
              ],
            },
            {
              width: 'auto',
              stack: [
                {
                  text: documentTitle,
                  style: 'documentType',
                },
                { text: `N° ${data.numero}`, style: 'invoiceNumber' },
                { text: `Date: ${this.formatDate(data.date)}`, style: 'invoiceDate' },
              ],
              alignment: 'right',
            },
          ],
        },
        { text: '\n' },

        // Client info box
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    { text: 'FACTURÉ À :', style: 'sectionTitle' },
                    {
                      text: `${data.client.prenom || ''} ${data.client.nom}`.trim(),
                      style: 'clientName',
                    },
                    {
                      text: [
                        data.client.adresse ? `${data.client.adresse}\n` : '',
                        data.client.email ? `${data.client.email}` : '',
                        data.client.telephone ? ` | ${data.client.telephone}` : '',
                      ].join(''),
                      style: 'clientMeta',
                    },
                  ],
                  margin: [0, 2, 0, 2],
                },
              ],
            ],
          },
          layout: {
            fillColor: () => '#F8FAFC',
            hLineWidth: () => 0,
            vLineWidth: () => 0,
          },
        },
        { text: '\n' },

        // Products table
        {
          text: 'DÉTAIL DE LA COMMANDE',
          style: 'tableTitle',
          margin: [0, 0, 0, 6],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 60, 90, 90],
            body: [
              [
                { text: 'Désignation', style: 'tableHeader' },
                { text: 'Qté', style: 'tableHeader', alignment: 'center' },
                { text: 'Prix Unit. (FCFA)', style: 'tableHeader', alignment: 'right' },
                { text: 'Sous-total (FCFA)', style: 'tableHeader', alignment: 'right' },
              ],
              ...items.map((i) => ([
                { text: i.label, style: 'tableCell' },
                { text: String(i.qty), style: 'tableCell', alignment: 'center' },
                { text: this.formatCurrency(i.price), style: 'tableCell', alignment: 'right' },
                { text: this.formatCurrency(i.total), style: 'tableCellBold', alignment: 'right' },
              ])),
            ],
          },
          layout: {
            fillColor: (rowIndex: number) => (rowIndex === 0 ? '#F1F5F9' : null),
            hLineColor: () => '#E2E8F0',
            vLineColor: () => '#E2E8F0',
          },
        },
        { text: '\n' },

        // Totals
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 200,
              table: {
                widths: ['*', 'auto'],
                body: [
                  [
                    { text: 'Total HT', style: 'totalLabel' },
                    {
                      text: this.formatCurrency(data.montantHT),
                      style: 'totalValue',
                      alignment: 'right',
                    },
                  ],
                  [
                    {
                      text: `TVA (${tvaPercentage.toFixed(0)}%)`,
                      style: 'totalLabel',
                    },
                    {
                      text: this.formatCurrency(data.tva),
                      style: 'totalValue',
                      alignment: 'right',
                    },
                  ],
                  [
                    { text: 'Total TTC', style: 'totalLabelBold' },
                    {
                      text: this.formatCurrency(data.montantTTC),
                      style: 'totalValueBold',
                      alignment: 'right',
                    },
                  ],
                  [
                    { text: 'Acompte', style: 'totalLabelSmall' },
                    {
                      text: this.formatCurrency(data.acomteVerse || 0),
                      style: 'totalValueSmall',
                      alignment: 'right',
                    },
                  ],
                  [
                    { text: 'Solde réglé', style: 'totalLabelSmall' },
                    {
                      text: this.formatCurrency(
                        (data.acomteVerse || 0) - (data.soldeRestant || 0),
                      ),
                      style: 'totalValueSmall',
                      alignment: 'right',
                    },
                  ],
                  [
                    { text: 'Solde restant', style: 'totalLabelBold' },
                    {
                      text: this.formatCurrency(data.soldeRestant || 0),
                      style: 'totalValueGreen',
                      alignment: 'right',
                    },
                  ],
                ],
              },
              layout: 'noBorders',
            },
          ],
        },
        { text: '\n' },
        {
          text: 'Merci pour votre confiance — Proplast © 2026',
          style: 'footer',
        },
        {
          text: `Document généré automatiquement le ${this.formatDate(
            data.date,
          )}`,
          style: 'footerSub',
        },
      ],

      styles: {
        companyName: { fontSize: 22, bold: true, color: '#0F172A' },
        companySub: { fontSize: 9, color: '#64748B' },
        documentType: {
          fontSize: 14,
          bold: true,
          color: '#2563EB',
          uppercase: true,
        },
        invoiceNumber: { fontSize: 10, bold: true, color: '#0F172A' },
        invoiceDate: { fontSize: 9, color: '#64748B' },
        sectionTitle: {
          fontSize: 9,
          bold: true,
          color: '#94A3B8',
          uppercase: true,
          margin: [0, 0, 0, 4],
        },
        clientName: { fontSize: 12, bold: true, color: '#0F172A' },
        clientMeta: { fontSize: 9, color: '#475569' },
        tableTitle: {
          fontSize: 9,
          bold: true,
          color: '#0F172A',
          uppercase: true,
        },
        tableHeader: { fontSize: 9, bold: true, color: '#64748B' },
        tableCell: { fontSize: 9, color: '#0F172A' },
        tableCellBold: { fontSize: 9, bold: true, color: '#0F172A' },
        totalLabel: { fontSize: 9, color: '#64748B' },
        totalValue: { fontSize: 9, color: '#0F172A' },
        totalLabelSmall: { fontSize: 8, color: '#94A3B8' },
        totalValueSmall: { fontSize: 8, color: '#64748B' },
        totalLabelBold: { fontSize: 9, bold: true, color: '#0F172A' },
        totalValueBold: { fontSize: 11, bold: true, color: '#2563EB' },
        totalValueGreen: { fontSize: 9, bold: true, color: '#059669' },
        footer: { fontSize: 8, color: '#94A3B8', alignment: 'center' },
        footerSub: { fontSize: 8, color: '#CBD5E1', alignment: 'center' },
      },

      defaultStyle: {},
    };
  }

  private formatCurrency(amount: number): string {
    // Use French locale for number formatting (spaces as thousand separators)
    // and append "FCFA" as plain text to avoid font rendering issues
    // with the XOF currency symbol in pdfmake's default fonts
    const formattedNumber = new Intl.NumberFormat('fr-FR').format(amount);
    return `${formattedNumber} FCFA`;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  }
}
