import {
  Controller, Get, Post, Patch,
  Body, Param, Query,
  Request, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth,
  ApiOperation, ApiResponse, ApiQuery,
} from '@nestjs/swagger';

import { JwtAuthGuard } from
  '../auth/guards/jwt-auth.guard';
import { RolesGuard } from
  '../auth/guards/roles.guard';
import { Roles } from
  '../auth/guards/roles.decorator';
import { Role } from
  '../../domain/enums/role.enum';

import { CreateCommandeUseCase } from
  '../../application/commandes/create-commande.use-case';
import { AddPaiementUseCase } from
  '../../application/commandes/add-paiement.use-case';
import { ChangeStatutUseCase } from
  '../../application/commandes/change-statut.use-case';
import { GetCommandesUseCase } from
  '../../application/commandes/get-commandes.use-case';
import { GetCommandeByIdUseCase } from
  '../../application/commandes/get-commande-by-id.use-case';

import { CreateCommandeDto } from
  './dto/create-commande.dto';
import { CreatePaiementDto } from
  './dto/create-paiement.dto';
import { ChangeStatutDto } from
  './dto/change-statut.dto';
import { CommandeStatut } from
  '../../domain/enums/commande-statut.enum';
import { CommandeType } from
  '../../domain/enums/commande-type.enum';

@ApiTags('Commandes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('commandes')
export class CommandesController {
  constructor(
    private readonly createCommande: CreateCommandeUseCase,
    private readonly addPaiementUseCase: AddPaiementUseCase,
    private readonly changeStatut: ChangeStatutUseCase,
    private readonly getCommandes: GetCommandesUseCase,
    private readonly getCommandeById: GetCommandeByIdUseCase,
  ) {}

  @Post()
  @Roles(Role.COMMERCIAL)
  @ApiOperation({ summary: 'Créer une commande' })
  async create(
    @Body() dto: CreateCommandeDto,
    @Request() req: any,
  ) {
    const commande = await this.createCommande.execute({
      ...dto,
      commercialId: req.user.id,
      directeurId: req.user.directeurId,
    });
    return { success: true, data: commande };
  }

  @Get()
  @Roles(Role.COMMERCIAL, Role.DIRECTEUR)
  @ApiOperation({ summary: 'Lister les commandes avec pagination et filtres' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre de résultats par page (défaut: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Rechercher par référence ou produit' })
  @ApiQuery({ name: 'statut', required: false, enum: CommandeStatut, description: 'Filtrer par statut' })
  @ApiQuery({ name: 'type', required: false, enum: CommandeType, description: 'Filtrer par type' })
  @ApiQuery({ name: 'dateDebut', required: false, type: String, description: 'Date de début (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateFin', required: false, type: String, description: 'Date de fin (format: YYYY-MM-DD)' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('statut') statut?: CommandeStatut,
    @Query('type') type?: CommandeType,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
    @Request() req?: any,
  ) {
    const result = await this.getCommandes.execute(
      {
        page: +page,
        limit: +limit,
        search,
        statut,
        type,
        dateDebut: dateDebut ? new Date(dateDebut) : undefined,
        dateFin: dateFin ? new Date(dateFin) : undefined,
      },
      req.user.role,
      req.user.id,
    );
    return { success: true, data: result };
  }

  @Get(':id')
  @Roles(Role.COMMERCIAL, Role.DIRECTEUR)
  @ApiOperation({ summary: 'Détail d\'une commande' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const commande = await this.getCommandeById.execute(
      id,
      req.user.role,
      req.user.id,
    );
    return { success: true, data: commande };
  }

  @Post(':id/paiements')
  @Roles(Role.COMMERCIAL)
  @ApiOperation({ summary: 'Enregistrer un paiement' })
  async addPaiement(
    @Param('id') id: string,
    @Body() dto: CreatePaiementDto,
    @Request() req: any,
  ) {
    const result = await this.addPaiementUseCase.execute({
      commandeId: id,
      ...dto,
      valideParId: req.user.id,
      directeurId: req.user.directeurId,
      commercialId: req.user.commercialId,
    });
    return { success: true, data: result };
  }

  @Patch(':id/statut')
  @Roles(Role.COMMERCIAL)
  @ApiOperation({ summary: 'Changer le statut' })
  async changeStatutHandler(
    @Param('id') id: string,
    @Body() dto: ChangeStatutDto,
    @Request() req: any,
  ) {
    const commande = await this.changeStatut.execute(
      id,
      dto.statut,
      req.user.id,
      req.user.directeurId,
      req.user.commercialId,
    );
    return { success: true, data: commande };
  }
}