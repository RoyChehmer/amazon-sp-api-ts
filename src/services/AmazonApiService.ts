import axios from 'axios';
import { AmazonApiConfig } from '../utils/types';
import logger from '../config/logger';
import qs from 'qs';

export class AmazonApiService {
    private clientId: string;
    private clientSecret: string;
    private refreshToken: string;
    private region: string;
    private baseUrl: string;
    private accessToken: string | null = null;
    private tokenExpiry: Date | null = null;
    private maxRetries: number;
    private maxWaitTime: number;

    constructor(config: AmazonApiConfig, maxRetries = 5, maxWaitTime = 32) {
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.refreshToken = config.refreshToken;
        this.region = config.region;
        this.baseUrl = `https://sellingpartnerapi-${this.region}.amazon.com`;
        this.maxRetries = maxRetries;
        this.maxWaitTime = maxWaitTime;
    }

    private async getAccessToken(): Promise<void> {
        try {
            const response = await axios.post('https://api.amazon.com/auth/o2/token', {
                grant_type: 'refresh_token',
                refresh_token: this.refreshToken,
                client_id: this.clientId,
                client_secret: this.clientSecret
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
            logger.info('Successfully obtained new access token');
        } catch (error) {
            logger.error('Failed to get access token:', error);
            throw error;
        }
    }

    private async makeRequest(endpoint: string, params: any = {}): Promise<any> {
        if (!this.accessToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
            await this.getAccessToken();
        }

        const headers = {
            'x-amz-access-token': this.accessToken!,
            'Content-Type': 'application/json'
        };

        let retryCount = 0;
        let waitTime = 1;

        while (true) {
            try {
                logger.info(axios.getUri({
                    url: `${this.baseUrl}${endpoint}`,
                    params,
                    paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
                }));
                const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                    headers,
                    params,
                    timeout: 30000,
                    paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
                });

                return response.data;
            } catch (error: any) {
                if (error.response?.status === 429 && retryCount < this.maxRetries) {
                    logger.warning(`Rate limit exceeded. Waiting ${waitTime} seconds before retry ${retryCount + 1}/${this.maxRetries}`);
                    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                    waitTime = Math.min(waitTime * 2, this.maxWaitTime);
                    retryCount++;
                    continue;
                }
                logger.error(`Error: ${String(error)}`);
                throw error;
            }
        }
    }

    async getOrders(createdAfter?: string, createdBefore?: string, orderStatuses?: string[], 
                   marketplaceIds?: string[], nextToken?: string): Promise<any> {
        //const params: any = {};
        //if (createdAfter) params.CreatedAfter = createdAfter;
        //if (createdBefore) params.CreatedBefore = createdBefore;
        //if (orderStatuses) params.OrderStatuses = orderStatuses;
        //if (marketplaceIds) params.MarketplaceIds = marketplaceIds;
        //if (nextToken) params.NextToken = nextToken;

        const params: any = {
            MarketplaceIds: ['ATVPDKIKX0DER'],
            CreatedAfter: '2025-05-05T15:17:10.745Z',
            CreatedBefore: '2025-05-06T15:17:10.747Z',
            OrderStatuses: ['Shipped', 'Unshipped']
        };

        //const params_with_url_brackets = qs.stringify(params, { encode: true, arrayFormat: 'brackets' });

        return this.makeRequest('/orders/v0/orders', params);
    }

    async getOrderDetails(orderId: string): Promise<any> {
        return this.makeRequest(`/orders/v0/orders/${orderId}`);
    }

    async getOrderItems(orderId: string, nextToken?: string): Promise<any> {
        const params: any = {};
        if (nextToken) params.NextToken = nextToken;

        return this.makeRequest(`/orders/v0/orders/${orderId}/orderItems`, params);
    }

    async getAllPages(endpoint: string, params: any = {}, pageLimit?: number): Promise<any[]> {
        const allResponses = [];
        let nextToken = params.NextToken;
        let pageCount = 0;

        while (true) {
            if (pageLimit && pageCount >= pageLimit) break;

            const currentParams = { ...params };
            if (nextToken) currentParams.NextToken = nextToken;

            const response = await this.makeRequest(endpoint, currentParams);
            allResponses.push(response);

            nextToken = response.payload?.NextToken;
            if (!nextToken) break;

            pageCount++;
        }

        return allResponses;
    }
} 