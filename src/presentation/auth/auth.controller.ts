import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LoginUseCase } from
  '../../application/auth/login.use-case';
import { RefreshTokenUseCase } from
  '../../application/auth/refresh-token.use-case';
import { LogoutUseCase } from
  '../../application/auth/logout.use-case';
import { GetProfileUseCase } from
  '../../application/auth/get-profile.use-case';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401,
    description: 'Identifiants incorrects' })
  async login(@Body() dto: LoginDto) {
    const result = await this.loginUseCase.execute(
      dto.email,
      dto.password,
    );
    return { success: true, data: result };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rafraîchir le token d\'accès' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401,
    description: 'Refresh token invalide ou expiré' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await this.refreshTokenUseCase.execute(
      dto.refresh_token,
    );
    return { success: true, data: result };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnexion utilisateur' })
  @ApiResponse({ status: 200 })
  async logout(
    @Request() req: any,
    @Headers('authorization') authorization: string,
    @Body() body: { refresh_token?: string },
  ) {
    // Extract access token from Authorization header (Bearer token)
    const accessToken = authorization?.replace('Bearer ', '');
    await this.logoutUseCase.execute(req.user.id, accessToken, body.refresh_token);
    return { success: true, message: 'Déconnexion réussie' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil connecté' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401,
    description: 'Non authentifié' })
  async me(@Request() req: any) {
    const user = await this.getProfileUseCase.execute(
      req.user.id,
    );
    return { success: true, data: user };
  }
}