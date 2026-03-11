import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
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
import { AuditLogResponseDto } from './dto/audit-log-response.dto';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly getAuditLogs: GetAuditLogsUseCase) {}

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
    description: 'Nombre de résultats par page (défaut: 10)',
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
    @Query('limit') limit = 10,
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('entite') entite?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
    @Request() req?: any,
  ) {
    const result = await this.getAuditLogs.execute({
      page: +page,
      limit: +limit,
      userId,
      action,
      entite,
      dateDebut: dateDebut ? new Date(dateDebut) : undefined,
      dateFin: dateFin ? new Date(dateFin) : undefined,
    });
    return { success: true, data: result };
  }
}
