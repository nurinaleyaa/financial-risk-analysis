import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RiskController } from './risk.controller.js';
import { RiskBreakdownService } from './risk-breakdown.service.js';

@Module({
  imports: [HttpModule],
  controllers: [RiskController],
  providers: [RiskBreakdownService],
})
export class RiskModule {}
