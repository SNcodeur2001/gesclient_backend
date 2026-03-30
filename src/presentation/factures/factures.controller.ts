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
    @Query('download') download?: string,
    @Request() req?: any,
    @Res() res?: any,
  ) {
    // If token provided, its an external download (no auth required)
    if (token) {
      // If no explicit download flag, return a confirmation page (previews won't click)
      if (!download) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(this.renderDownloadPage(id, token));
        return;
      }

      const { pdf, facture } = await this.getFacturePdf.execute(id, {
        token,
        consumeToken: true,
      });

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

  private renderDownloadPage(factureId: string, token: string): string {
    const downloadUrl = `/api/v1/factures/${factureId}/pdf?token=${token}&download=1`;
    return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Téléchargement facture</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;background:#f6f7fb;margin:0;padding:32px;color:#1f2937}
      .card{max-width:520px;margin:12vh auto;background:#fff;border-radius:10px;padding:28px;box-shadow:0 10px 25px rgba(0,0,0,.08)}
      h1{font-size:20px;margin:0 0 10px}
      p{margin:0 0 18px;color:#4b5563}
      a.btn{display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px}
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Téléchargement de votre facture</h1>
      <p>Cliquez sur le bouton ci-dessous pour lancer le téléchargement.</p>
      <a class="btn" href="${downloadUrl}">Télécharger la facture</a>
    </div>
  </body>
</html>`;
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
