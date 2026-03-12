import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { plainToInstance } from 'class-transformer';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { Role } from '../../domain/enums/role.enum';

import { GetClientsUseCase } from '../../application/clients/get-clients.use-case';
import { GetClientByIdUseCase } from '../../application/clients/get-client-by-id.use-case';
import { CreateClientUseCase } from '../../application/clients/create-client.use-case';
import { UpdateClientUseCase } from '../../application/clients/update-client.use-case';
import { DeleteClientUseCase } from '../../application/clients/delete-client.use-case';
import { ImportClientsUseCase } from 'src/application/clients/import-clients.use-case';
import { ExportClientsUseCase } from 'src/application/clients/export-clients.use-case';
import { ExportClientsExcelUseCase } from '../../application/clients/export-clients-excel.use-case';
import { ExportClientsTemplateUseCase } from '../../application/clients/export-clients-template.use-case';

import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientResponseDto } from './dto/client-response.dto';
import { ClientType } from '../../domain/enums/client-type.enum';
import { ClientStatut } from '../../domain/enums/client-statut.enum';

import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly getClients: GetClientsUseCase,
    private readonly getClientById: GetClientByIdUseCase,
    private readonly createClient: CreateClientUseCase,
    private readonly updateClient: UpdateClientUseCase,
    private readonly deleteClient: DeleteClientUseCase,
    private readonly importClients: ImportClientsUseCase,
    private readonly exportClients: ExportClientsUseCase,
    private readonly exportClientsExcel: ExportClientsExcelUseCase,
    private readonly exportClientsTemplate: ExportClientsTemplateUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lister tous les clients avec pagination et filtres',
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
    name: 'search',
    required: false,
    type: String,
    description: 'Rechercher par nom ou email',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ClientType,
    description: 'Filtrer par type: APPORTEUR ou ACHETEUR',
  })
  @ApiQuery({
    name: 'statut',
    required: false,
    enum: ClientStatut,
    description: 'Filtrer par statut: ACTIF, PROSPECT ou INACTIF',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des clients récupérée avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('type') type?: ClientType,
    @Query('statut') statut?: ClientStatut,
    @Request() req?: any,
  ) {
    const result = await this.getClients.execute({
      page: +page,
      limit: +limit,
      search,
      type,
      statut,
      userRole: req.user.role,
    });
    return { success: true, data: result };
  }

  @Get('export')
  @ApiOperation({ summary: 'Exporter les clients en fichier CSV' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ClientType,
    description: 'Filtrer par type de client',
  })
  @ApiQuery({
    name: 'statut',
    required: false,
    enum: ClientStatut,
    description: 'Filtrer par statut du client',
  })
  @ApiResponse({
    status: 200,
    description: 'Fichier CSV généré',
    content: { 'text/csv': { schema: { type: 'string' } } },
  })
  async export(
    @Request() req: any,
    @Res() res: any,
    @Query('type') type?: ClientType,
    @Query('statut') statut?: ClientStatut,
  ) {
    const csv = await this.exportClients.execute(
      { type, statut },
      req.user.role,
      req.user.id,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=clients.csv');
    res.send(csv);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Exporter les clients en fichier Excel (.xlsx)' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ClientType,
    description: 'Filtrer par type de client',
  })
  @ApiQuery({
    name: 'statut',
    required: false,
    enum: ClientStatut,
    description: 'Filtrer par statut du client',
  })
  @ApiResponse({
    status: 200,
    description: 'Fichier Excel généré',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  async exportExcel(
    @Request() req: any,
    @Res() res: any,
    @Query('type') type?: ClientType,
    @Query('statut') statut?: ClientStatut,
  ) {
    const buffer = await this.exportClientsExcel.execute(
      { type, statut },
      req.user.role,
      req.user.id,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=clients.xlsx');
    res.send(buffer);
  }

  @Get('template')
  @ApiOperation({
    summary: 'Télécharger le template Excel pour import de clients',
  })
  @ApiResponse({
    status: 200,
    description: 'Fichier template.xlsx généré',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  async template(@Res() res: any) {
    const buffer = await this.exportClientsTemplate.execute();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=template_clients.xlsx',
    );
    res.send(buffer);
  }

  @Post('import')
  @ApiOperation({
    summary: 'Importer des clients depuis un fichier Excel (.xlsx)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Fichier Excel contenant les clients à importer',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Fichier Excel (.xlsx)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Clients importés avec succès' })
  @ApiResponse({ status: 400, description: 'Format de fichier invalide' })
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: any, @Request() req: any) {
    const result = await this.importClients.execute(
      file.buffer,
      file.originalname,
      req.user.id,
      req.user.role,
      req.user.directeurId,
    );
    return { success: true, data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un client par son ID' })
  @ApiResponse({ status: 200, description: 'Client récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const client = await this.getClientById.execute(id, req.user.role);
    return {
      success: true,
      data: plainToInstance(ClientResponseDto, client, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau client' })
  @ApiResponse({ status: 201, description: 'Client créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(@Body() dto: CreateClientDto, @Request() req: any) {
    const client = await this.createClient.execute({
      ...dto,
      userRole: req.user.role,
      userId: req.user.id,
      directeurId: req.user.directeurId,
    });
    return {
      success: true,
      data: plainToInstance(ClientResponseDto, client, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: "Modifier les informations d'un client" })
  @ApiResponse({ status: 200, description: 'Client mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @Request() req: any,
  ) {
    const client = await this.updateClient.execute(
      id,
      dto,
      req.user.role,
      req.user.id,
    );
    return {
      success: true,
      data: plainToInstance(ClientResponseDto, client, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Delete(':id')
  @Roles(Role.DIRECTEUR)
  @ApiOperation({ summary: 'Supprimer un client (réservé au Directeur)' })
  @ApiResponse({ status: 200, description: 'Client supprimé avec succès' })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Réservé au Directeur',
  })
  @ApiResponse({ status: 404, description: 'Client non trouvé' })
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteClient.execute(id, req.user.id);
    return {
      success: true,
      message: 'Client supprimé avec succès',
    };
  }
}
