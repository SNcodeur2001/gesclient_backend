import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { Role } from '../../domain/enums/role.enum';

import { GetDashboardUseCase } from '../../application/stats/get-dashboard.use-case';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

@ApiTags('Stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly getDashboard: GetDashboardUseCase) {}

  @Get('dashboard')
  @Roles(Role.DIRECTEUR)
  @ApiOperation({ summary: 'Dashboard du directeur' })
  async getDashboardData(): Promise<DashboardResponseDto> {
    const data = await this.getDashboard.execute();
    return data as DashboardResponseDto;
  }
}
