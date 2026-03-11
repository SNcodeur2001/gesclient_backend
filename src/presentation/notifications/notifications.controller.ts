import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetNotificationsUseCase } from '../../application/notifications/get-notifications.use-case';
import { MarkAsReadUseCase } from '../../application/notifications/mark-as-read.use-case';
import { NotificationResponseDto } from './dto/notification-response.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly getNotifications: GetNotificationsUseCase,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: "Récupérer les notifications de l'utilisateur connecté",
  })
  @ApiQuery({
    name: 'lu',
    required: false,
    type: Boolean,
    description: 'Filtrer par statut de lecture (true/false)',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications récupérées avec succès',
    type: [NotificationResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async findAll(@Query('lu') lu?: string, @Request() req?: any) {
    const luBoolean = lu === 'true' ? true : lu === 'false' ? false : undefined;
    const result = await this.getNotifications.execute({
      userId: req.user.id,
      lu: luBoolean,
    });
    return { success: true, data: result };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiResponse({ status: 200, description: 'Notification marquée comme lue' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    await this.markAsReadUseCase.execute({
      id,
      userId: req.user.id,
    });
    return {
      success: true,
      message: 'Notification marquée comme lue',
    };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  @ApiResponse({
    status: 200,
    description: 'Toutes les notifications marquées comme lues',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async markAllAsRead(@Request() req: any) {
    const count = await this.markAsReadUseCase.execute({
      userId: req.user.id,
      all: true,
    });
    return {
      success: true,
      message: `${count} notification(s) marquée(s) comme lue(s)`,
    };
  }
}
