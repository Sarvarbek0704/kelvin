import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { type SearchResponse, type SortOption } from '@kelvin/contracts';

import { Public } from '../../shared/auth/auth.decorators';
import { SearchService, type SearchQuery } from './search.service';

const SORTS: SortOption[] = ['relevance', 'flux_asc', 'flux_desc', 'cri_desc', 'new'];

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Faceted qidiruv (facet count + o‘zini istisno qilish)' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'category', required: false, description: 'kategoriya slug (subtree)' })
  @ApiQuery({ name: 'ct', required: false, description: 'rang harorati, vergul bilan' })
  @ApiQuery({ name: 'ip', required: false, description: 'kamida IP (masalan IP44)' })
  search(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('ct') ct?: string,
    @Query('socket') socket?: string,
    @Query('light') light?: string,
    @Query('mount') mount?: string,
    @Query('voltage') voltage?: string,
    @Query('brand') brand?: string,
    @Query('ip') ip?: string,
    @Query('dim') dim?: string,
    @Query('fluxMin') fluxMin?: string,
    @Query('fluxMax') fluxMax?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ): Promise<SearchResponse> {
    const nums = (v?: string): number[] | undefined => {
      if (v === undefined || v === '') {
        return undefined;
      }
      const arr = v
        .split(',')
        .map((x) => Number(x))
        .filter((x) => !Number.isNaN(x));
      return arr.length > 0 ? arr : undefined;
    };
    const strs = (v?: string): string[] | undefined => {
      if (v === undefined || v === '') {
        return undefined;
      }
      const arr = v.split(',').filter((x) => x.length > 0);
      return arr.length > 0 ? arr : undefined;
    };
    const num = (v?: string): number | undefined =>
      v !== undefined && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : undefined;

    const query: SearchQuery = {};
    if (q !== undefined) {
      query.q = q;
    }
    if (category !== undefined) {
      query.category = category;
    }
    const ctv = nums(ct);
    if (ctv !== undefined) {
      query.colorTemperature = ctv;
    }
    const socketv = strs(socket);
    if (socketv !== undefined) {
      query.socketType = socketv;
    }
    const lightv = strs(light);
    if (lightv !== undefined) {
      query.lightSource = lightv;
    }
    const mountv = strs(mount);
    if (mountv !== undefined) {
      query.mountType = mountv;
    }
    const voltagev = nums(voltage);
    if (voltagev !== undefined) {
      query.voltage = voltagev;
    }
    const brandv = strs(brand);
    if (brandv !== undefined) {
      query.brand = brandv;
    }
    if (ip !== undefined) {
      query.ip = ip;
    }
    if (dim !== undefined) {
      query.dimmable = dim === '1' || dim === 'true';
    }
    const fMin = num(fluxMin);
    if (fMin !== undefined) {
      query.fluxMin = fMin;
    }
    const fMax = num(fluxMax);
    if (fMax !== undefined) {
      query.fluxMax = fMax;
    }
    if (sort !== undefined && SORTS.includes(sort as SortOption)) {
      query.sort = sort as SortOption;
    }
    const pageN = num(page);
    if (pageN !== undefined) {
      query.page = pageN;
    }
    const perPageN = num(perPage);
    if (perPageN !== undefined) {
      query.perPage = perPageN;
    }

    return this.service.search(query);
  }
}
