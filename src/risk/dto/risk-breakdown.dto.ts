import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class PortfolioRiskRequestDto {
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((t) => t.trim());
    }
    return value;
  })
  tickers: string[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  weights?: number[];

  @IsNumber()
  portfolioValue: number;

  @IsOptional()
  @IsNumber()
  confidenceLevel?: number;

  @IsOptional()
  @IsNumber()
  horizonDays?: number;
}