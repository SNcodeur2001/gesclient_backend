import { Injectable } from '@nestjs/common';

export interface WhatsAppMessage {
  to: string;
  message: string;
  mediaUrl?: string;
}

/**
 * Service WhatsApp utilisant wa.me (gratuit)
 * Génère des liens de téléchargement que le commercial peut envoyer au client
 */
@Injectable()
export class WhatsAppService {
  // Numéro de téléphone de l'entreprise (à configurer dans .env)
  private readonly businessPhone: string;

  constructor() {
    // Lire le numéro depuis les variables d'environnement
    this.businessPhone = process.env.WHATSAPP_BUSINESS_PHONE || '';
  }

  /**
   * Normalize phone number to WhatsApp format
   * Accepts: +221 77 123 45 67, 221771234567, 772202532, 77 123 45 67
   * Returns: 221771234567 (without +)
   */
  normalizePhoneNumber(phone: string): string {
    if (!phone) {
      throw new Error('Numéro de téléphone requis');
    }

    // Remove all spaces, dashes, and parentheses
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Remove + prefix if present
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }

    // If it starts with 00, replace with country code
    if (cleaned.startsWith('00')) {
      cleaned = cleaned.substring(2);
    }

    // Add Senegal country code if not present (numbers starting with 7, 8, or 9)
    if (cleaned.length === 9) {
      // Common Senegal prefixes: 77, 78, 70, 76
      if (
        cleaned.startsWith('7') ||
        cleaned.startsWith('8') ||
        cleaned.startsWith('9')
      ) {
        cleaned = '221' + cleaned;
      }
    }

    // Validate the final format (Senegal: 221 + 78/77 + 7-8 digits = 10-11 digits total)
    if (!/^221[78]\d{7,8}$/.test(cleaned)) {
      throw new Error(
        `Format de numéro invalide: ${phone}. Formats acceptés: +22177XXXXXX, 22177XXXXXX, 77XXXXXX`,
      );
    }

    return cleaned;
  }

  /**
   * Génère un lien wa.me pour le commercial
   * Le commercial clique et peut ajouter le message/PDF manuellement
   */
  generateWhatsAppLink(phoneNumber: string, message: string): string {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
  }

  /**
   * Génère un message avec un lien de téléchargement de facture
   */
  generateFactureMessage(
    clientName: string,
    factureNumero: string,
    montant: number,
    downloadLink: string,
  ): string {
    const typeLabel = 'facture';
    return `Bonjour ${clientName || 'Client'},

Votre ${typeLabel} N°${factureNumero} d'un montant de ${montant.toLocaleString('fr-FR')} XOF est disponible.

Téléchargez votre facture ici: ${downloadLink}
 
Merci pour votre confiance!
PROPLAST`;
  }

  /**
   * Send WhatsApp message (simulation for development)
   * Returns a wa.me link that the commercial can use
   */
  async sendMessage(message: WhatsAppMessage): Promise<{
    success: boolean;
    waLink?: string;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Validate phone number
      const normalizedPhone = this.normalizePhoneNumber(message.to);

      // Generate wa.me link
      const waLink = this.generateWhatsAppLink(
        normalizedPhone,
        message.message,
      );

      // Log for development
      console.log(`📱 Lien WhatsApp généré pour ${normalizedPhone}:`);
      console.log(`🔗 ${waLink}`);

      return {
        success: true,
        waLink,
        messageId: `WA_${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Préparer l'envoi d'une facture par WhatsApp
   * Retourne un lien wa.me avec le message pré-rempli
   */
  async prepareFactureMessage(
    phoneNumber: string,
    clientName: string,
    factureNumero: string,
    montant: number,
    downloadLink: string,
  ): Promise<{ success: boolean; waLink?: string; error?: string }> {
    const message = this.generateFactureMessage(
      clientName,
      factureNumero,
      montant,
      downloadLink,
    );
    return this.sendMessage({ to: phoneNumber, message });
  }

  /**
   * Envoyer une facture par WhatsApp (méthode de compatibilité)
   * Retourne un lien wa.me au lieu d'envoyer directement
   */
  async sendPdf(
    phoneNumber: string,
    pdfBuffer: Buffer,
    filename: string,
    caption?: string,
  ): Promise<{
    success: boolean;
    messageId?: string;
    waLink?: string;
    error?: string;
  }> {
    // Cette méthode génère un lien wa.me - le commercial devra envoyer manuellement
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const message = caption || `Voici votre facture: ${filename}`;

    return this.sendMessage({ to: normalizedPhone, message });
  }
}
