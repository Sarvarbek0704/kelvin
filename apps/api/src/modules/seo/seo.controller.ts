import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

import { Public } from '../../shared/auth/auth.decorators';
import { SeoService } from './seo.service';

const BASE_URL = process.env.STOREFRONT_URL ?? 'https://kelvin.uz';

/**
 * seo — sitemap.xml + robots.txt (docs/13 §6). ⚠️ API prefiksi ostida; web-server
 * root'ni (kelvin.uz/sitemap.xml) shu yerga proksilaydi. Dinamik (mahsulot/blog).
 */
@Controller('seo')
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  @Get('sitemap.xml')
  @Public()
  @ApiExcludeEndpoint()
  @Header('Content-Type', 'application/xml; charset=utf-8')
  sitemap(): Promise<string> {
    return this.seo.sitemap(BASE_URL);
  }

  @Get('robots.txt')
  @Public()
  @ApiExcludeEndpoint()
  @Header('Content-Type', 'text/plain; charset=utf-8')
  robots(): string {
    return this.seo.robots(BASE_URL);
  }
}
