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
    const documentTitle = isProforma
      ? 'FACTURE PROFORMA'
      : 'FACTURE DÉFINITIVE';

    // Calculate TVA percentage from data
    const tvaPercentage =
      data.montantHT > 0 ? (data.tva / data.montantHT) * 100 : 0;

    return {
      content: [
        // Header
        {
          columns: [
            {
              width: '*',
              text: 'PROPLAST',
              style: 'companyName',
            },
            {
              width: 'auto',
              text: documentTitle,
              style: 'documentType',
            },
          ],
        },
        { text: '\n' },

        // Invoice details
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'PROPLAST', style: 'bold' },
                { text: 'Dakar, Sénégal', style: 'small' },
                { text: 'Tel: +221 77 123 45 67', style: 'small' },
              ],
            },
            {
              width: 'auto',
              stack: [
                { text: `N°: ${data.numero}`, style: 'bold' },
                { text: `Date: ${this.formatDate(data.date)}`, style: 'small' },
                {
                  text: isProforma ? 'Type: PROFORMA' : 'Type: DÉFINITIVE',
                  style: 'small',
                },
              ],
            },
          ],
        },
        { text: '\n\n' },

        // Client info
        {
          text: 'CLIENT:',
          style: 'sectionTitle',
        },
        {
          text: `${data.client.prenom || ''} ${data.client.nom}`.trim(),
          style: 'clientName',
        },
        {
          text: [
            data.client.email ? `Email: ${data.client.email}\n` : '',
            data.client.telephone ? `Tél: ${data.client.telephone}\n` : '',
            data.client.adresse ? `Adresse: ${data.client.adresse}` : '',
          ].join(''),
          style: 'small',
        },
        { text: '\n\n' },

        // Products table
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Désignation', style: 'tableHeader' },
                { text: 'Qté', style: 'tableHeader', alignment: 'center' },
                { text: 'P.U', style: 'tableHeader', alignment: 'right' },
                {
                  text: 'Montant HT',
                  style: 'tableHeader',
                  alignment: 'right',
                },
                { text: 'TVA', style: 'tableHeader', alignment: 'right' },
              ],
              [
                { text: data.produit, style: 'tableCell' },
                {
                  text: data.quantite.toString(),
                  style: 'tableCell',
                  alignment: 'center',
                },
                {
                  text: this.formatCurrency(data.prixUnitaire),
                  style: 'tableCell',
                  alignment: 'right',
                },
                {
                  text: this.formatCurrency(data.montantHT),
                  style: 'tableCell',
                  alignment: 'right',
                },
                {
                  text: this.formatCurrency(data.tva),
                  style: 'tableCell',
                  alignment: 'right',
                },
              ],
            ],
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
                    { text: 'Montant HT:', style: 'totalLabel' },
                    {
                      text: this.formatCurrency(data.montantHT),
                      style: 'totalValue',
                      alignment: 'right',
                    },
                  ],
                  [
                    {
                      text: `TVA (${tvaPercentage.toFixed(0)}%):`,
                      style: 'totalLabel',
                    },
                    {
                      text: this.formatCurrency(data.tva),
                      style: 'totalValue',
                      alignment: 'right',
                    },
                  ],
                  [
                    { text: 'Montant TTC:', style: 'totalLabelBold' },
                    {
                      text: this.formatCurrency(data.montantTTC),
                      style: 'totalValueBold',
                      alignment: 'right',
                    },
                  ],
                ],
              },
              layout: 'noBorders',
            },
          ],
        },

        // Payment info for proforma
        ...(isProforma && data.acomteVerse !== undefined
          ? [
              { text: '\n\n' },
              {
                text: 'INFORMATIONS DE PAIEMENT:',
                style: 'sectionTitle',
              },
              {
                text: [
                  `Acompte versé: ${this.formatCurrency(data.acomteVerse)}\n`,
                  `Solde restant: ${this.formatCurrency(data.soldeRestant || 0)}`,
                ],
                style: 'small',
              },
            ]
          : []),

        // Footer
        {
          text: '\n\n\n',
        },
        {
          text: [
            'Merci de votre confiance!\n',
            'Conditions de paiement: 50% à la commande, 50% à la livraison\n',
            'Délai de validité: 30 jours',
          ],
          style: 'footer',
        },
      ],

      styles: {
        companyName: {
          fontSize: 24,
          bold: true,
          color: '#1a365d',
        },
        documentType: {
          fontSize: 18,
          bold: true,
          color: isProforma ? '#805ad5' : '#38a169',
        },
        sectionTitle: {
          fontSize: 12,
          bold: true,
          color: '#2d3748',
          margin: [0, 10, 0, 5],
        },
        clientName: {
          fontSize: 14,
          bold: true,
        },
        bold: {
          bold: true,
        },
        small: {
          fontSize: 10,
          color: '#4a5568',
        },
        tableHeader: {
          fontSize: 10,
          bold: true,
          color: '#2d3748',
          fillColor: '#edf2f7',
        },
        tableCell: {
          fontSize: 10,
        },
        totalLabel: {
          fontSize: 10,
          color: '#4a5568',
        },
        totalValue: {
          fontSize: 10,
        },
        totalLabelBold: {
          fontSize: 12,
          bold: true,
        },
        totalValueBold: {
          fontSize: 12,
          bold: true,
          color: '#1a365d',
        },
        footer: {
          fontSize: 9,
          color: '#718096',
          alignment: 'center',
        },
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
