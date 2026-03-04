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
import { LogoutDto } from './dto/logout.dto';
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
  @ApiOperation({ summary: 'Connexion utilisateur', description: 'Authentifie un utilisateur et retourne les tokens d\'accès et de rafraîchissement' })
  @ApiResponse({ status: 200, type: AuthResponseDto, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants incorrects' })
  async login(@Body() dto: LoginDto) {
    const result = await this.loginUseCase.execute(
      dto.email,
      dto.password,
    );
    return { success: true, data: result };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rafraîchir le token d\'accès', description: 'Échange un refresh token expiré contre un nouveau token d\'accès' })
  @ApiResponse({ status: 200, description: 'Nouveau token généré avec succès' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide ou expiré' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await this.refreshTokenUseCase.execute(
      dto.refresh_token,
    );
    return { success: true, data: result };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnexion utilisateur', description: 'Révoque les tokens de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async logout(
    @Request() req: any,
    @Headers('authorization') authorization: string,
    @Body() body: LogoutDto,
  ) {
    // Extract access token from Authorization header (Bearer token)
    const accessToken = authorization?.replace('Bearer ', '');
    await this.logoutUseCase.execute(
      req.user.id,
      accessToken,
      body?.refresh_token,
    );
    return { success: true, message: 'Déconnexion réussie' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil de l\'utilisateur connecté', description: 'Retourne les informations de l\'utilisateur actuellement authentifié' })
  @ApiResponse({ status: 200, description: 'Profil récupéré avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async me(@Request() req: any) {
    const user = await this.getProfileUseCase.execute(
      req.user.id,
    );
    return { success: true, data: user };
  }
}