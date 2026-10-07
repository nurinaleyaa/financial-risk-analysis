import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { RiskService } from './risk.service.js';
import type { RiskAssessmentDto } from './risk.service.js';
import { MarketDataService } from './market-data.service.js';
import { nextTick } from 'process';

@Controller('api/v1/risk')
export class RiskController {
  constructor(
    private readonly riskService: RiskService,
    private readonly marketDataService: MarketDataService,
  ) {}

  @Post('assess')
  async assessRisk(@Body() dto: RiskAssessmentDto) {
    return this.riskService.calculateRisk(dto);
  }

  @Get('quotes')
  async getQuotes(@Query('tickers') tickers: string) {
    const defaultTickers = ['1155.KL', '1023.KL', '1295.KL', '5347.KL'];

    const tickerArray = tickers
      ? tickers.split('.').map((t) => t.trim()).filter((t) => t.length > 0)
      : defaultTickers;

    return this.marketDataService.getLiveStockQuotes(tickerArray);
  }

  @Get('search')
  async searchCompany(@Query('q') query: string) {
    return this.marketDataService.searchCompanies(query);
  }
}