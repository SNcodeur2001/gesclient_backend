import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  Res,
  HttpStatus,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { Role } from '../../domain/enums/role.enum';

import { GenerateFactureUseCase } from '../../application/factures/generate-facture.use-case';
import { GetFacturePdfUseCase } from '../../application/factures/get-facture-pdf.use-case';
import { SendFactureWhatsAppUseCase } from '../../application/factures/send-facture-whatsapp.use-case';
import { FactureType } from '../../domain/enums/facture-type.enum';
import { FacturePaginationDto } from './dto/facture-pagination.dto';
import { PrismaFactureRepository } from '../../infrastructure/database/repositories/prisma-facture.repository';

@ApiTags('Factures')
@ApiBearerAuth()
@Controller('factures')
export class FacturesController {
  constructor(
    private readonly generateFacture: GenerateFactureUseCase,
    private readonly getFacturePdf: GetFacturePdfUseCase,
    private readonly sendFactureWhatsApp: SendFactureWhatsAppUseCase,
    private readonly factureRepository: PrismaFactureRepository,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMMERCIAL, Role.DIRECTEUR)
  @ApiOperation({ summary: 'Liste paginée des factures' })
  @ApiResponse({ status: 200, description: 'Liste des factures' })
  async findAll(@Query() pagination: FacturePaginationDto) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const result = await this.factureRepository.findAll(
      page,
      limit,
      pagination.type,
      pagination.search,
    );
    return {
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  @Get('commande/:commandeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMMERCIAL, Role.DIRECTEUR)
  @ApiOperation({ summary: 'Dernière facture liée à une commande' })
  @ApiResponse({ status: 200, description: 'Facture trouvée' })
  @ApiResponse({
    status: 404,
    description: 'Aucune facture pour cette commande',
  })
  async findByCommande(@Param('commandeId') commandeId: string) {
    const factures = await this.factureRepository.findByCommandeId(commandeId);
    if (!factures.length) {
      throw new NotFoundException('Aucune facture pour cette commande');
    }
    return { success: true, data: factures[0] };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMMERCIAL, Role.DIRECTEUR)
  @ApiOperation({ summary: 'Détail d’une facture' })
  @ApiResponse({ status: 200, description: 'Facture trouvée' })
  @ApiResponse({ status: 404, description: 'Facture introuvable' })
  async findOne(@Param('id') id: string) {
    const facture = await this.factureRepository.findById(id);
    if (!facture) {
      throw new NotFoundException('Facture introuvable');
    }
    return { success: true, data: facture };
  }

  @Post('commandes/:commandeId/facture/proforma')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMMERCIAL, Role.DIRECTEUR)
  @ApiOperation({ summary: 'Générer une facture proforma pour une commande' })
  @ApiResponse({ status: 201, description: 'Facture proforma générée' })
  @ApiResponse({ status: 404, description: 'Commande introuvable' })
  async generateProforma(
    @Param('commandeId') commandeId: string,
    @Request() req: any,
  ) {
    const { facture, pdf } = await this.generateFacture.execute({
      commandeId,
      type: FactureType.PROFORMA,
      genereParId: req.user.id,
    });
    return {
      success: true,
      data: {
        id: facture.id,
        numero: facture.numero,
        type: facture.type,
        montantTTC: facture.montantTTC,
      },
    };
  }

  @Post('commandes/:commandeId/facture/definitive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMMERCIAL, Role.DIRECTEUR)
  @ApiOperation({ summary: 'Générer une facture définitive pour une commande' })
  @ApiResponse({ status: 201, description: 'Facture définitive générée' })
  @ApiResponse({ status: 404, description: 'Commande introuvable' })
  async generateDefinitive(
    @Param('commandeId') commandeId: string,
    @Request() req: any,
  ) {
    const { facture } = await this.generateFacture.execute({
      commandeId,
      type: FactureType.DEFINITIVE,
      genereParId: req.user.id,
    });
    return {
      success: true,
      data: {
        id: facture.id,
        numero: facture.numero,
        type: facture.type,
        montantTTC: facture.montantTTC,
      },
    };
  }

  @Get(':id/pdf')
  @UseGuards(ThrottlerGuard, OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Télécharger le PDF dune facture' })
  @ApiResponse({ status: 200, description: 'PDF de la facture' })
  @ApiResponse({ status: 404, description: 'Facture introuvable' })
  async downloadPdf(
    @Param('id') id: string,
    @Query('token') token?: string,
    @Request() req?: any,
    @Res() res?: any,
  ) {
    // If token provided, its an external download (no auth required)
    if (token) {
      const { pdf, facture } = await this.getFacturePdf.execute(id, { token });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${facture.numero}.pdf`,
      );
      res.send(pdf);
      return;
    }

    // Authenticated download
    const userId = req?.user?.id;
    const { pdf, facture } = await this.getFacturePdf.execute(id, { userId });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${facture.numero}.pdf`,
    );
    res.send(pdf);
  }

  @Post(':id/envoyer-whatsapp')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMMERCIAL, Role.DIRECTEUR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Envoyer une facture par WhatsApp' })
  @ApiResponse({ status: 200, description: 'Facture envoyée par WhatsApp' })
  @ApiResponse({ status: 400, description: 'Erreur lors de lenvoi' })
  async sendWhatsApp(
    @Param('id') id: string,
    @Query('redirect') redirect?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const result = await this.sendFactureWhatsApp.execute(id);
    if (redirect && result.waLink && res) {
      res.redirect(result.waLink);
    }
    return {
      success: result.success,
      message: result.message,
      waLink: result.waLink,
    };
  }
}
