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

    private async makeRequest(endpoint: string, params: any = {}, method: string = 'GET'): Promise<any> {
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
                const url = `${this.baseUrl}${endpoint}`;
                
                // Special handling for marketplace IDs
                let requestParams = { ...params };
                if (params.MarketplaceIds && Array.isArray(params.MarketplaceIds)) {
                    // Keep marketplace IDs as an array but use a different serialization approach
                    requestParams = {
                        ...params, 
                        OrderStatuses: params.OrderStatuses.join(','),             
                        MarketplaceIds: params.MarketplaceIds.join(',')
                    };
                }

                const requestUrl = axios.getUri({
                    url,
                    params: requestParams,
                    paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
                });
                
                logger.info(`Making ${method} request to: ${requestUrl}`);
                logger.info('Request params:', JSON.stringify(requestParams, null, 2));

                let response;
                if (method === 'POST') {
                    response = await axios.post(url, requestParams, {
                        headers,
                        timeout: 30000
                    });
                } else {
                    response = await axios.get(requestUrl, {
                        headers,
                        timeout: 30000
                    });
                }

                logger.info(`Response status: ${response.status}`);
                logger.info('Response data:', JSON.stringify(response.data, null, 2));

                return response.data;
            } catch (error: any) {
                if (error.code === 'ECONNRESET' && retryCount < this.maxRetries) {
                    logger.warning(`Connection reset. Waiting ${waitTime} seconds before retry ${retryCount + 1}/${this.maxRetries}`);
                    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                    waitTime = Math.min(waitTime * 2, this.maxWaitTime);
                    retryCount++;
                    continue;
                }
                
                if (error.response?.status === 429 && retryCount < this.maxRetries) {
                    logger.warning(`Rate limit exceeded. Waiting ${waitTime} seconds before retry ${retryCount + 1}/${this.maxRetries}`);
                    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                    waitTime = Math.min(waitTime * 2, this.maxWaitTime);
                    retryCount++;
                    continue;
                }

                logger.error('API Error:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message,
                    code: error.code
                });
                throw error;
            }
        }
    }

    async getOrders(createdAfter?: string, createdBefore?: string, orderStatuses?: string[], 
                   marketplaceIds?: string[], nextToken?: string): Promise<any> {
        if (!marketplaceIds || marketplaceIds.length === 0) {
            throw new Error('MarketplaceIds is required');
        }

        // Process one marketplace at a time
        const allOrders = [];
        let combinedNextToken = null;

        for (const marketplaceId of marketplaceIds) {
            try {
                logger.info(`Fetching orders for marketplace: ${marketplaceId}`);
                
                const params = {
                    CreatedAfter: createdAfter,
                    CreatedBefore: createdBefore,
                    OrderStatuses: orderStatuses,
                    MarketplaceIds: marketplaceId,
                    NextToken: nextToken
                };

                // Get all pages for this marketplace
                const pages = await this.getAllPages('/orders/v0/orders', params);
                
                // Extract orders from all pages
                for (const page of pages) {
                    if (page.payload?.Orders) {
                        allOrders.push(...page.payload.Orders);
                    }
                    // Keep track of the last nextToken
                    if (page.payload?.NextToken) {
                        combinedNextToken = page.payload.NextToken;
                    }
                }

                // Add a small delay between marketplaces to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                logger.error(`Error fetching orders for marketplace ${marketplaceId}:`, error);
                // Continue with other marketplaces even if one fails
                continue;
            }
        }

        // Return in the same format as the original response
        return {
            payload: {
                Orders: allOrders,
                NextToken: combinedNextToken
            }
        };
    }

    async getOrderDetails(orderId: string): Promise<any> {
        return this.makeRequest(`/orders/v0/orders/${orderId}`);
    }

    async getOrderItems(orderId: string): Promise<any> {
        return this.makeRequest(`/orders/v0/orders/${orderId}/orderItems`);
    }

    async getMarketplaceParticipations(): Promise<any> {
        const response = await this.makeRequest('/sellers/v1/marketplaceParticipations');
        logger.info('Raw marketplace participations response:', JSON.stringify(response, null, 2));
        return response;
    }

    async createReport(reportType: string, marketplaceIds: string[], dataStartTime?: string, dataEndTime?: string): Promise<any> {
        const params = {
            reportType,
            marketplaceIds,
            dataStartTime,
            dataEndTime
        };
        return this.makeRequest('/reports/2021-06-30/reports', params, 'POST');
    }

    async getReport(reportId: string): Promise<any> {
        return this.makeRequest(`/reports/2021-06-30/reports/${reportId}`);
    }

    async getReportDocument(reportDocumentId: string): Promise<any> {
        return this.makeRequest(`/reports/2021-06-30/documents/${reportDocumentId}`);
    }

    async getAllPages(endpoint: string, params: any = {}, pageLimit?: number): Promise<any[]> {
        const allResponses = [];
        let nextToken = params.NextToken;
        let pageCount = 0;

        logger.info(`Starting to fetch pages for ${endpoint} with params:`, JSON.stringify(params, null, 2));

        while (true) {
            if (pageLimit && pageCount >= pageLimit) {
                logger.info(`Reached page limit of ${pageLimit}`);
                break;
            }

            const currentParams = { ...params };
            if (nextToken) {
                currentParams.NextToken = nextToken;
                logger.info(`Fetching page ${pageCount + 1} with NextToken: ${nextToken}`);
            } else {
                logger.info(`Fetching page ${pageCount + 1} (first page)`);
            }

            let response;
            if (endpoint === '/orders/v0/orders') {
                // For orders endpoint, use makeRequest directly to avoid recursion
                response = await this.makeRequest(endpoint, currentParams);
            } else {
                response = await this.makeRequest(endpoint, currentParams);
            }

            logger.info(`Raw response for page ${pageCount + 1}:`, JSON.stringify(response, null, 2));
            
            if (!response.payload) {
                logger.warning('No payload in response:', JSON.stringify(response, null, 2));
                break;
            }

            logger.info(`Page ${pageCount + 1} response payload:`, JSON.stringify(response.payload, null, 2));
            allResponses.push(response);

            nextToken = response.payload.NextToken;
            if (!nextToken) {
                logger.info('No more pages available');
                break;
            }

            pageCount++;
        }

        logger.info(`Completed fetching ${pageCount + 1} pages`);
        return allResponses;
    }
} 