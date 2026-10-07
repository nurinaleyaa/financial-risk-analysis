import { IsArray, IsNumber, IsOptional, IsString, Max, Min, ValidateNested  } from "class-validator";
import { Type } from "class-transformer";

export class HoldingDto {
    @IsString()
    ticker: string;

    @IsNumber()
    @Min(0)
    @Max(1)
    weight: number;

    @IsArray()
    @IsNumber({}, { each: true })
    historicalReturns: number[];
}

export class AnalyzeRiskDto {
    @IsNumber()
    @Min(1)
    portfolioValue: number;

    @IsOptional()
    @IsNumber()
    confidenceLevel?: 0.90 | 0.95 | 0.99 = 0.95;

    @IsOptional()
    @IsNumber()
    horizonDays?: number = 1;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => HoldingDto)
    holdings: HoldingDto[];
}