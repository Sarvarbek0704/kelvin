import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { type Request, type Response } from 'express';
import { type Actor, type AuthTokensResponse, type AuthUserView } from '@kelvin/contracts';

import { type AppConfig, NodeEnv } from '../../config/configuration';
import { parseTtlSeconds } from './token/access-token.service';
import { AuthService, type AuthResult } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Authenticated, CurrentActor, Public } from '../../shared/auth/auth.decorators';

const REFRESH_COOKIE = 'kelvin_rt';

/**
 * Auth endpoint'lari.
 *
 * Access token — javob tanasida (mijoz xotirada saqlaydi).
 * Refresh token — httpOnly cookie (JS ko'ra olmaydi). docs/04-api-spec.md §5
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;
  private readonly cookiePath: string;
  private readonly refreshMaxAgeMs: number;

  constructor(
    private readonly auth: AuthService,
    config: ConfigService<AppConfig, true>,
  ) {
    this.isProduction = config.get('nodeEnv', { infer: true }) === NodeEnv.Production;
    const prefix = config.get('apiPrefix', { infer: true });
    this.cookiePath = `/${prefix}/v1/auth`;
    this.refreshMaxAgeMs = parseTtlSeconds(config.get('jwt', { infer: true }).refreshTtl) * 1000;
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Mijoz ro‘yxatdan o‘tishi (darhol kirgiziladi)' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensResponse> {
    const result = await this.auth.register(
      {
        phone: dto.phone,
        password: dto.password,
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.email !== undefined && { email: dto.email }),
      },
      this.ctx(req),
    );
    return this.respondWithTokens(result, res);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parol bilan kirish' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensResponse> {
    const result = await this.auth.login(dto.identifier, dto.password, this.ctx(req));
    return this.respondWithTokens(result, res);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(REFRESH_COOKIE)
  @ApiOperation({ summary: 'Token rotatsiyasi (eski bekor, yangi juftlik)' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensResponse> {
    const raw = this.readRefreshCookie(req);
    const result = await this.auth.refreshTokens(raw, this.ctx(req));
    return this.respondWithTokens(result, res);
  }

  @Post('logout')
  @Authenticated()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Chiqish — refresh bekor qilinadi' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const raw = this.tryReadRefreshCookie(req);
    if (raw !== null) {
      await this.auth.logout(raw);
    }
    this.clearRefreshCookie(res);
  }

  @Post('logout-all')
  @Authenticated()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Barcha qurilmalardan chiqish' })
  async logoutAll(
    @CurrentActor() actor: Actor,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logoutAll(actor.userId);
    this.clearRefreshCookie(res);
  }

  @Get('me')
  @Authenticated()
  @ApiOperation({ summary: 'Joriy foydalanuvchi + rollari + ruxsatlari' })
  async me(@CurrentActor() actor: Actor): Promise<AuthUserView> {
    return await this.auth.me(actor.userId);
  }

  // --- Yordamchi metodlar ---------------------------------------------------

  private ctx(req: Request): { ip?: string; userAgent?: string } {
    const ip = req.ip ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return {
      ...(ip !== undefined && { ip }),
      ...(typeof userAgent === 'string' && { userAgent }),
    };
  }

  private respondWithTokens(result: AuthResult, res: Response): AuthTokensResponse {
    res.cookie(REFRESH_COOKIE, result.rawRefreshToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: this.cookiePath,
      maxAge: this.refreshMaxAgeMs,
    });
    return { accessToken: result.accessToken, expiresIn: result.expiresIn, user: result.user };
  }

  private readRefreshCookie(req: Request): string {
    const raw = this.tryReadRefreshCookie(req);
    if (raw === null) {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED' });
    }
    return raw;
  }

  private tryReadRefreshCookie(req: Request): string | null {
    const cookies = (req as unknown as { cookies?: Record<string, unknown> }).cookies;
    const raw = cookies?.[REFRESH_COOKIE];
    return typeof raw === 'string' && raw.length > 0 ? raw : null;
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: this.cookiePath,
    });
  }
}
