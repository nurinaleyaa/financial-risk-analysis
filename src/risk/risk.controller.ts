import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RiskBreakdownService } from './risk-breakdown.service.js';
import { PortfolioRiskRequestDto } from './dto/risk-breakdown.dto.js';

@Controller('api/v1/risk')
export class RiskController {
  constructor(private readonly riskBreakdownService: RiskBreakdownService) {}

  @Post('assess')
  @HttpCode(HttpStatus.OK)
  async getRiskBreakdown(@Body() dto: PortfolioRiskRequestDto) {
    return this.riskBreakdownService.calculatePortfolioRiskBreakdown(
      dto.tickers,
      dto.weights,
      dto.portfolioValue,
      dto.confidenceLevel,
      dto.horizonDays,
    );
  }
}