import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

@Injectable()
export class ExportClientsTemplateUseCase {
  async execute(): Promise<Buffer> {
    // Créer le template avec les en-têtes seulement
    const templateData = [
      {
        Nom: '',
        Prénom: '',
        Email: '',
        Téléphone: '',
        Adresse: '',
        Type: '',
        Statut: '',
      },
    ];

    // Créer le workbook Excel
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Ajuster la largeur des colonnes
    worksheet['!cols'] = [
      { wch: 20 }, // Nom
      { wch: 20 }, // Prénom
      { wch: 30 }, // Email
      { wch: 20 }, // Téléphone
      { wch: 30 }, // Adresse
      { wch: 15 }, // Type
      { wch: 15 }, // Statut
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    // Retourner le buffer
    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }
}
