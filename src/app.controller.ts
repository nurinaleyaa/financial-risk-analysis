import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealthCheck() {
    return {
      status: 'online',
      service: 'Financial Risk & VaR Analysis API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        assessRisk: 'POST /api/v1/risk/assess',
      },
    };
  }
}