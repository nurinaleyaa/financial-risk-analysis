import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MarketDataService {
    constructor(private readonly httpService: HttpService) {}

    async searchCompanies(query: string) {
        if (!query || query.trim().length < 2) return [];

        const searchQuery = `${query.trim()} Malaysia`;
        const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
            searchQuery,
        )}&quotesCount=8&newsCount=0&enableFuzzyQuery=true`;

        try {
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    headers: {
                        'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    },
                }),
            );

            const quotes = response.data?.quotes || [];

            return quotes
                .filter(
                    (q: any) =>
                        q.quoteType === 'EQUITY' &&
                        (q.symbol.endsWith('.KL') || q.exchDisp === 'Kuala Lumpur'),
                )
                .map((q: any) => ({
                    code: q.symbol,
                    name: q.longname || q.shortname || q.symbol,
                    exchange: q.exchDisp || 'Bursa Malaysia',
                }));
        } catch (error) {
            return [];
        }
    }

    async getHistoricalReturns(ticker: string, days: number = 60): Promise<number[]> {
        const formattedTicker = ticker.endsWith('.KL') || ticker.includes('.')
            ? ticker.toUpperCase()
            : `${ticker}.KL`;

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedTicker}?interval=1d&range=6mo`;

        try {
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    },
                }),
            );

            const result = response.data?.chart?.result?.[0];
            if (!result) {
                throw new Error('Invalid ticker response');
            }

            const closingPrices: number[] = result.indicators.quote[0].close;
            const validPrices = closingPrices.filter((price) => price !== null && price !== undefined);

            if (validPrices.length < 2) {
                throw new Error('Insufficient hostorical data');
            }

            // Calculate percentage daily returns: (Price_t - Price_t-1) / Price_t-1
            const dailyReturns: number[] = [];
            for (let i = 1; i < validPrices.length; i++) {
                const dailyReturn = (validPrices[i] - validPrices[i - 1]) / validPrices[i - 1];
                dailyReturns.push(Number(dailyReturn.toFixed(6)));
            }

            return dailyReturns.slice(-days);
        }   catch (error) {
            throw new HttpException(
                `Unable to fetch Bursa Malaysia market data for ticker ${formattedTicker}. Please verify the stock code.`,
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    private readonly companyNames: Record<string, string> = {
        '1155.KL': 'Maybank',
        '1023.KL': 'CIMB Group',
        '1295.KL': 'Public Bank',
        '5347.KL': 'Tenaga Nasional',
    };

    async getLiveStockQuotes(tickers: string[]) {
        // Filter out empty, malformed, or non-numeric ticker entries
        const validTickers = tickers.filter((t) => {
            if (!t || t.trim() === '' || t.trim() === '.KL') return false;
            const codeNum = t.split('.')[0].trim();
            // Ensures ticker starts with a 4-digit Bursa code (e.g., '4197')
            return /^\d{4}$/.test(codeNum);
        });

        const quotes = await Promise.all(
            validTickers.map(async (rawTicker) => {
            const cleanNum = rawTicker.split('.')[0].trim();
            const formattedTicker = `${cleanNum}.KL`;

            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedTicker}?interval=1m&range=1d`;

            try {
                const response = await firstValueFrom(
                this.httpService.get(url, {
                    headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    },
                }),
                );

                const result = response.data?.chart?.result?.[0];
                const meta = result?.meta;
                const currentPrice = meta?.regularMarketPrice || 0;
                const previousClose = meta?.chartPreviousClose || currentPrice;
                const change = currentPrice - previousClose;
                const changePct = previousClose ? (change / previousClose) * 100 : 0;

                const displayName =
                this.companyNames[formattedTicker] ||
                meta?.shortName ||
                formattedTicker;

                return {
                ticker: formattedTicker,
                name: displayName,
                currentPrice: Number(currentPrice.toFixed(2)),
                change: Number(change.toFixed(2)),
                changePct: Number(changePct.toFixed(2)),
                };
            } catch (error) {
                return {
                ticker: formattedTicker,
                name: formattedTicker,
                currentPrice: 0,
                change: 0,
                changePct: 0,
                };
            }
            }),
        );

        return quotes;
        }
}