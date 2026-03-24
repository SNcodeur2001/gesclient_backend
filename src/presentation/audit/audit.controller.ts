import { Controller, Get, Query, Request, UseGuards, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { Role } from '../../domain/enums/role.enum';
import { AuditAction } from '../../domain/enums/audit-action.enum';

import { GetAuditLogsUseCase } from '../../application/audit/get-audit-logs.use-case';
import { GetAuditLogByIdUseCase } from '../../application/audit/get-audit-log-by-id.use-case';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(
    private readonly getAuditLogs: GetAuditLogsUseCase,
    private readonly getAuditLogById: GetAuditLogByIdUseCase,
  ) {}

  @Get()
  @Roles(Role.DIRECTEUR)
  @ApiOperation({
    summary: "Récupérer les logs d'audit (réservé au Directeur)",
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page (défaut: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre de résultats par page (max: 7)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filtrer par utilisateur',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: AuditAction,
    description: "Filtrer par type d'action",
  })
  @ApiQuery({
    name: 'entite',
    required: false,
    type: String,
    description: 'Filtrer par entité (Client, Commande, etc.)',
  })
  @ApiQuery({
    name: 'dateDebut',
    required: false,
    type: Date,
    description: 'Date de début du filtre',
  })
  @ApiQuery({
    name: 'dateFin',
    required: false,
    type: Date,
    description: 'Date de fin du filtre',
  })
  @ApiResponse({
    status: 200,
    description: "Logs d'audit récupérés avec succès",
    type: [AuditLogResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Réservé au Directeur',
  })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 7,
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('entite') entite?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
    @Request() req?: any,
  ) {
    const result = await this.getAuditLogs.execute({
      page: +page,
      limit: Math.min(+limit || 7, 7),
      userId,
      action,
      entite,
      dateDebut: dateDebut ? new Date(dateDebut) : undefined,
      dateFin: dateFin ? new Date(dateFin) : undefined,
    });
    return { success: true, data: result };
  }

  @Get(':id')
  @Roles(Role.DIRECTEUR)
  @ApiOperation({ summary: "Détail d'un log d'audit" })
  @ApiResponse({ status: 200, description: "Log d'audit récupéré", type: AuditLogResponseDto })
  @ApiResponse({ status: 404, description: 'Log non trouvé' })
  async findOne(@Param('id') id: string) {
    const log = await this.getAuditLogById.execute(id);
    return { success: true, data: log };
  }
}
