import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RiskController } from './risk.controller.js';
import { RiskService } from './risk.service.js';
import { MarketDataService } from './market-data.service.js';

@Module({
  imports: [HttpModule],
  controllers: [RiskController],
  providers: [RiskService, MarketDataService],
  exports: [RiskService, MarketDataService],
})
export class RiskModule {}
