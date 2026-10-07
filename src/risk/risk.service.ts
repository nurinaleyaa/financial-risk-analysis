import { Injectable } from '@nestjs/common';
import { MarketDataService } from './market-data.service.js';

export interface HoldingInput {
  ticker: string;
  weight: number;
  historicalReturns?: number[];
}

export interface RiskAssessmentDto {
  portfolioValue: number;
  confidenceLevel: number;
  horizonDays: number;
  holdings: HoldingInput[];
}

@Injectable()
export class RiskService {
  constructor(private readonly marketDataService: MarketDataService) {}

  async calculateRisk(dto: RiskAssessmentDto) {
    const { portfolioValue, confidenceLevel, horizonDays, holdings } = dto;

    // Fetch live market data for holdings missing historical returns
    const processedHoldings = await Promise.all(
      holdings.map(async (holding) => {
        if (!holding.historicalReturns || holding.historicalReturns.length === 0) {
          const returns = await this.marketDataService.getHistoricalReturns(holding.ticker);
          return { ...holding, historicalReturns: returns };
        }
        return holding;
      }),
    );

    // Calculate Portfolio Return Series
    const minLen = Math.min(...processedHoldings.map((h) => h.historicalReturns!.length));
    const portfolioDailyReturns: number[] = [];

    for (let i = 0; i < minLen; i++) {
      let dayReturn = 0;
      processedHoldings.forEach((h) => {
        dayReturn += h.historicalReturns![i] * h.weight;
      });
      portfolioDailyReturns.push(dayReturn);
    }

    // Standard Deviation (Volatility) Calculation
    const mean = portfolioDailyReturns.reduce((a, b) => a + b, 0) / portfolioDailyReturns.length;
    const variance =
      portfolioDailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      (portfolioDailyReturns.length - 1);
    const dailyVolatility = Math.sqrt(variance);
    const annualizedVolatility = dailyVolatility * Math.sqrt(252);

    // Z-Score mapping for confidence levels
    const zScores: Record<number, number> = {
      0.9: 1.282,
      0.95: 1.645,
      0.99: 2.326,
    };
    const z = zScores[confidenceLevel] || 1.645;

    // Parametric VaR formula
    const parametricVaR = portfolioValue * z * dailyVolatility * Math.sqrt(horizonDays);
    const riskFreeRate = 0.03; // ~3.00% OPR/FD baseline rate for MYR
    const annualReturn = mean * 252;
    const sharpeRatio = (annualReturn - riskFreeRate) / annualizedVolatility;

    return {
      portfolioValue,
      confidenceLevelPercentage: confidenceLevel * 100,
      horizonDays,
      parametricVaR: Number(parametricVaR.toFixed(2)),
      annualizedVolatilityPct: Number((annualizedVolatility * 100).toFixed(2)),
      sharpeRatio: Number(sharpeRatio.toFixed(2)),
      interpretation: `With ${confidenceLevel * 100}% confidence, the maximum potential loss over ${horizonDays} day(s) will not exceed RM ${parametricVaR.toFixed(2)}.`,
    };
  }
}