import { randomUUID } from 'node:crypto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Request, type Response } from 'express';
import { type Actor } from '@kelvin/contracts';

import { BusinessRuleError } from '../../core/errors/domain.error';
import { CurrentActor, OptionalAuth, RequirePermission } from '../../shared/auth/auth.decorators';
import { CartService, type CartView, type MergeSummary } from './cart.service';
import { type CartWithItems } from './cart.repository';
import { AddItemDto, SetQuantityDto } from './dto/cart.dto';

const CART_COOKIE = 'cart_token';
const CART_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 kun

/**
 * Savat — mehmon ham, mijoz ham (docs/07 §1). ⚠️ @OptionalAuth: token bo'lsa
 * mijoz savati (customerId), bo'lmasa mehmon savati (cart_token cookie).
 * cart:manage_own — GUEST'da ham, CUSTOMER'da ham bor (RBAC).
 */
@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  @OptionalAuth()
  @RequirePermission('cart:manage_own')
  @ApiOperation({ summary: 'Joriy savat (narx qayta hisoblanadi)' })
  async get(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentActor() actor: Actor,
  ): Promise<CartView> {
    const cart = await this.resolveCart(req, res, actor);
    return await this.cart.view(cart);
  }

  @Post('items')
  @OptionalAuth()
  @RequirePermission('cart:manage_own')
  @ApiOperation({ summary: 'Savatga qo‘shish (mavjud bo‘lsa miqdor oshadi)' })
  async add(
    @Body() dto: AddItemDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentActor() actor: Actor,
  ): Promise<CartView> {
    const cart = await this.resolveCart(req, res, actor);
    await this.cart.addItem(cart.id, dto.variantId, dto.quantity);
    return await this.cart.viewById(cart.id);
  }

  @Patch('items/:variantId')
  @OptionalAuth()
  @RequirePermission('cart:manage_own')
  @ApiOperation({ summary: 'Miqdorni o‘rnatish (0 → o‘chirish)' })
  async setQuantity(
    @Param('variantId', new ParseUUIDPipe({ version: '7' })) variantId: string,
    @Body() dto: SetQuantityDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentActor() actor: Actor,
  ): Promise<CartView> {
    const cart = await this.resolveCart(req, res, actor);
    await this.cart.setQuantity(cart.id, variantId, dto.quantity);
    return await this.cart.viewById(cart.id);
  }

  @Delete('items/:variantId')
  @OptionalAuth()
  @RequirePermission('cart:manage_own')
  @ApiOperation({ summary: 'Qator­ni o‘chirish' })
  async remove(
    @Param('variantId', new ParseUUIDPipe({ version: '7' })) variantId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentActor() actor: Actor,
  ): Promise<CartView> {
    const cart = await this.resolveCart(req, res, actor);
    await this.cart.removeItem(cart.id, variantId);
    return await this.cart.viewById(cart.id);
  }

  @Delete()
  @OptionalAuth()
  @RequirePermission('cart:manage_own')
  @ApiOperation({ summary: 'Savatni bo‘shatish' })
  async clear(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentActor() actor: Actor,
  ): Promise<CartView> {
    const cart = await this.resolveCart(req, res, actor);
    await this.cart.clear(cart.id);
    return await this.cart.viewById(cart.id);
  }

  @Post('merge')
  @RequirePermission('cart:manage_own')
  @ApiOperation({ summary: 'Login’dan keyin: mehmon savatini birlashtirish (union+max)' })
  async merge(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentActor() actor: Actor,
  ): Promise<{ cart: CartView; summary: MergeSummary }> {
    if (actor.customerId === undefined) {
      throw new BusinessRuleError('VALIDATION_FAILED', 'Merge faqat mijoz uchun');
    }
    const token = this.readCartToken(req);
    if (token === undefined) {
      const cart = await this.cart.getOrCreateForCustomer(actor.customerId);
      return { cart: await this.cart.view(cart), summary: { added: 0, updated: 0, totalItems: cart.items.length } };
    }
    const { cart, summary } = await this.cart.merge(token, actor.customerId);
    res.clearCookie(CART_COOKIE, { path: '/' }); // mehmon savati iste'mol qilindi
    return { cart: await this.cart.view(cart), summary };
  }

  // --- Yordamchilar ---------------------------------------------------------

  private async resolveCart(req: Request, res: Response, actor: Actor): Promise<CartWithItems> {
    if (actor.customerId !== undefined) {
      return await this.cart.getOrCreateForCustomer(actor.customerId);
    }
    let token = this.readCartToken(req);
    if (token === undefined) {
      token = randomUUID();
      res.cookie(CART_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: CART_COOKIE_MAX_AGE,
      });
    }
    return await this.cart.getOrCreateForSession(token);
  }

  private readCartToken(req: Request): string | undefined {
    const cookies = (req as unknown as { cookies?: Record<string, unknown> }).cookies;
    const raw = cookies?.[CART_COOKIE];
    return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
  }
}
