import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Actor } from '@kelvin/contracts';

import { ForbiddenError } from '../../core/errors/domain.error';
import { Authenticated, CurrentActor } from '../../shared/auth/auth.decorators';
import { AddressService } from './address.service';
import { type CustomerProfile } from './address.repository';
import { UpdateProfileDto } from './dto/profile.dto';

/** customer — kabinet profili (o'ziniki). Xodim (customerId yo'q) → 403. */
@ApiTags('customer: profile')
@Controller('customers')
export class ProfileController {
  constructor(private readonly customers: AddressService) {}

  private customerId(actor: Actor): string {
    if (actor.customerId === undefined) {
      throw new ForbiddenError('Faqat mijoz profili bor');
    }
    return actor.customerId;
  }

  @Get('me')
  @Authenticated()
  @ApiOperation({ summary: 'Mening profilim (ism, telefon, email)' })
  me(@CurrentActor() actor: Actor): Promise<CustomerProfile> {
    return this.customers.getProfile(this.customerId(actor));
  }

  @Patch('me')
  @Authenticated()
  @ApiOperation({ summary: 'Profilni yangilash (ism/familiya/telefon)' })
  update(@Body() dto: UpdateProfileDto, @CurrentActor() actor: Actor): Promise<CustomerProfile> {
    return this.customers.updateProfile(this.customerId(actor), {
      ...(dto.firstName !== undefined && { firstName: dto.firstName }),
      ...(dto.lastName !== undefined && { lastName: dto.lastName }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
    });
  }
}
