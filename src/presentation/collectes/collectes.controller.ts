import {
  Controller, Get, Post, Body,
  Param, Query, Request, UseGuards,
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

import { CreateCollecteUseCase } from
  '../../application/collectes/create-collecte.use-case';
import { GetCollectesUseCase } from
  '../../application/collectes/get-collectes.use-case';
import { GetCollecteByIdUseCase } from
  '../../application/collectes/get-collecte-by-id.use-case';
import { GetCollectesStatsUseCase } from
  '../../application/collectes/get-collectes-stats.use-case';

import { CreateCollecteDto } from
  './dto/create-collecte.dto';

@ApiTags('Collectes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('collectes')
export class CollectesController {
  constructor(
    private readonly createCollecte: CreateCollecteUseCase,
    private readonly getCollectes: GetCollectesUseCase,
    private readonly getCollecteById: GetCollecteByIdUseCase,
    private readonly getStats: GetCollectesStatsUseCase,
  ) {}

  @Post()
  @Roles(Role.COLLECTEUR)
  @ApiOperation({ summary: 'Enregistrer une collecte' })
  @ApiResponse({ status: 201 })
  async create(
    @Body() dto: CreateCollecteDto,
    @Request() req: any,
  ) {
    const collecte = await this.createCollecte.execute({
      ...dto,
      collecteurId: req.user.id,
      directeurId: req.user.directeurId,
    });
    return { success: true, data: collecte };
  }

  @Get()
  @Roles(Role.COLLECTEUR, Role.DIRECTEUR)
  @ApiOperation({ summary: 'Lister les collectes avec pagination et filtres' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre de résultats par page (défaut: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Rechercher par nom d\'apporteur' })
  @ApiQuery({ name: 'dateDebut', required: false, type: String, description: 'Date de début (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateFin', required: false, type: String, description: 'Date de fin (format: YYYY-MM-DD)' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
    @Request() req?: any,
  ) {
    const result = await this.getCollectes.execute(
      {
        page: +page,
        limit: +limit,
        search,
        dateDebut: dateDebut ? new Date(dateDebut) : undefined,
        dateFin: dateFin ? new Date(dateFin) : undefined,
      },
      req.user.role,
      req.user.id,
    );
    return { success: true, data: result };
  }

  @Get(':id')
  @Roles(Role.COLLECTEUR, Role.DIRECTEUR)
  @ApiOperation({ summary: 'Détail d\'une collecte' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const collecte = await this.getCollecteById.execute(
      id,
      req.user.role,
      req.user.id,
    );
    return { success: true, data: collecte };
  }

  @Get('stats')
  @Roles(Role.COLLECTEUR, Role.DIRECTEUR)
  @ApiOperation({ summary: 'Statistiques des collectes' })
  async stats() {
    const data = await this.getStats.execute();
    return { success: true, data };
  }
}