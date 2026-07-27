import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { AuthService } from './auth.service';
import { IdentityRepository } from './identity.repository';
import { PasswordService } from './password/password.service';
import { AccessTokenService } from './token/access-token.service';
import { RefreshTokenRepository } from './token/refresh-token.repository';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionGuard } from './guards/permission.guard';

/**
 * identity — auth, RBAC, sessiya, token rotatsiya (docs/02-architecture.md §5 №1).
 *
 * Guard'lar GLOBAL: JwtAuthGuard (authn) → PermissionGuard (authz, deny-by-default).
 * Ular shu modulda ro'yxatdan o'tadi, chunki AccessTokenService shu yerda.
 */
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController, UserController],
  providers: [
    IdentityRepository,
    PasswordService,
    AccessTokenService,
    RefreshTokenRepository,
    AuthService,
    // Global guard'lar — tartib muhim: avval authn, keyin authz.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
  exports: [AccessTokenService],
})
export class IdentityModule {}
