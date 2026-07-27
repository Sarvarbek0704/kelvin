import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ROLES, type Role } from '@kelvin/contracts';

import { RequirePermission } from '../../shared/auth/auth.decorators';
import { AuthService } from './auth.service';

/**
 * users — xodim tanlash ro'yxatlari (lidga sotuvchi tayinlash, docs/10). ⚠️ To'liq
 * user CRUD emas — rol bo'yicha o'qish (couriers alohida: /shipments/couriers).
 */
@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  @RequirePermission('user:read')
  @ApiOperation({ summary: 'Rol bo‘yicha faol xodimlar (?role=SALES)' })
  async byRole(@Query('role') role?: string): Promise<{ id: string; name: string }[]> {
    if (role === undefined || !ROLES.includes(role as Role)) {
      throw new BadRequestException('role parametri kerak (masalan SALES)');
    }
    return await this.auth.listUsersByRole(role as Role);
  }
}
