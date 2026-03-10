import { Module } from '@nestjs/common';

import { FacturesController } from './factures.controller';

import { GenerateFactureUseCase } from '../../application/factures/generate-facture.use-case';
import { GetFacturePdfUseCase } from '../../application/factures/get-facture-pdf.use-case';
import { SendFactureWhatsAppUseCase } from '../../application/factures/send-facture-whatsapp.use-case';

import { PrismaFactureRepository } from '../../infrastructure/database/repositories/prisma-facture.repository';
import { PrismaCommandeRepository } from '../../infrastructure/database/repositories/prisma-commande.repository';
import { FACTURE_REPOSITORY } from '../../domain/ports/repositories/facture.repository';
import { COMMANDE_REPOSITORY } from '../../domain/ports/repositories/commande.repository';

import { PdfGeneratorService } from '../../infrastructure/services/pdf-generator.service';
import { WhatsAppService } from '../../infrastructure/services/whatsapp.service';
import { FileStorageService } from '../../infrastructure/services/file-storage.service';

import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FacturesController],
  providers: [
    // Use Cases
    GenerateFactureUseCase,
    GetFacturePdfUseCase,
    SendFactureWhatsAppUseCase,

    // Repositories
    {
      provide: FACTURE_REPOSITORY,
      useClass: PrismaFactureRepository,
    },
    {
      provide: COMMANDE_REPOSITORY,
      useClass: PrismaCommandeRepository,
    },

    // Repository (for direct injection in controller)
    PrismaFactureRepository,

    // Services
    PdfGeneratorService,
    WhatsAppService,
    FileStorageService,
  ],
  exports: [GenerateFactureUseCase, GetFacturePdfUseCase, SendFactureWhatsAppUseCase, PrismaFactureRepository],
})
export class FacturesModule {}
