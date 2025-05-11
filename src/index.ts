import dotenv from 'dotenv';
import { AmazonApiService } from './services/AmazonApiService';
import { AmazonApiConfig } from './utils/types';
import logger from './config/logger';
import { AppDataSource } from './config/database';
import { OrderService } from './services/OrderService';
import { MarketplaceService } from './services/MarketplaceService';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
    'AMAZON_CLIENT_ID',
    'AMAZON_CLIENT_SECRET',
    'AMAZON_REFRESH_TOKEN',
    'AMAZON_REGION',
    'DB_HOST',
    'DB_PORT',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_NAME'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

async function main() {
    try {
        await AppDataSource.initialize();
        logger.info('Database connection initialized');

        const amazonConfig: AmazonApiConfig = {
            clientId: process.env.AMAZON_CLIENT_ID!,
            clientSecret: process.env.AMAZON_CLIENT_SECRET!,
            refreshToken: process.env.AMAZON_REFRESH_TOKEN!,
            region: process.env.AMAZON_REGION || 'na'
        };
        const amazonApiService = new AmazonApiService(amazonConfig);
        const orderService = new OrderService();
        const marketplaceService = new MarketplaceService();

        // Get marketplace participations
        const marketplaceData = await amazonApiService.getMarketplaceParticipations();
        const savedMarketplaces = await marketplaceService.saveMarketplaceParticipations(marketplaceData);
        logger.info(`Saved ${savedMarketplaces.length} marketplace participations`);

        // Get marketplace IDs for the report
        const marketplaceIds = savedMarketplaces.map(m => m.marketplaceId);
        
        // Create report for orders
        const reportType = 'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_LAST_UPDATE_GENERAL';
        //TODO: Date range are optional, but if provided, they must be in ISO 8601 format
        const reportResponse = await amazonApiService.createReport(
            reportType, 
            marketplaceIds, 
            '2025-05-05T00:00:00Z', 
            '2025-05-06T00:00:00Z'
        );
        logger.info('Created report:', reportResponse);

        // Poll for report completion
        let reportStatus = 'IN_PROGRESS';
        let reportId = reportResponse.reportId;
        let reportDocumentId;

        while (reportStatus === 'IN_PROGRESS') {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
            const report = await amazonApiService.getReport(reportId);
            reportStatus = report.processingStatus;
            logger.info(`Report status: ${reportStatus}`);
            
            if (reportStatus === 'DONE') {
                reportDocumentId = report.reportDocumentId;
                break;
            } else if (reportStatus === 'FATAL' || reportStatus === 'CANCELLED') {
                throw new Error(`Report failed with status: ${reportStatus}`);
            }
        }

        // Get report document
        if (reportDocumentId) {
            const reportDocument = await amazonApiService.getReportDocument(reportDocumentId);
            logger.info('Got report document:', reportDocument);
            // TODO: Process the report document data
        }

        // Get orders
        const ordersParams = {
            CreatedAfter: '2025-05-05T15:17:10.745Z',
            CreatedBefore: '2025-05-06T15:17:10.747Z',
            OrderStatuses: ['Shipped', 'Unshipped', 'PartiallyShipped'],
            MarketplaceIds: marketplaceIds
            //MarketplaceIds: ['ATVPDKIKX0DER']
        };

        logger.info('Fetching orders with params:', JSON.stringify(ordersParams, null, 2));
        
        const ordersResponse = await amazonApiService.getAllPages('/orders/v0/orders', ordersParams);        

        // Extract orders from the response
        const orders = ordersResponse.flatMap(response => {
            const orders = response.payload?.Orders || [];
            logger.info(`Extracted ${orders.length} orders from page response`);
            return orders;
        });
        logger.info(`Total orders found across all pages: ${orders.length}`);

        if (orders.length === 0) {
            logger.info('No orders found in the specified time range. Response structure:', 
                JSON.stringify(ordersResponse.map(r => ({
                    hasPayload: !!r.payload,
                    payloadKeys: r.payload ? Object.keys(r.payload) : [],
                    ordersCount: r.payload?.Orders?.length || 0
                })), null, 2)
            );
            return;
        }

        for (const order of orders) {
            try {
                const orderDetails = await amazonApiService.getOrderDetails(order.AmazonOrderId);
                const orderItems = await amazonApiService.getOrderItems(order.AmazonOrderId);

                await orderService.saveOrder(order, orderDetails, orderItems);
                logger.info(`Saved order ${order.AmazonOrderId}`);
            } catch (error) {
                logger.error(`Error processing order ${order.AmazonOrderId}:`, error);
                continue;
            }
        }

        logger.info('All orders processed successfully');
    } catch (error) {
        logger.error('Error:', error);
        process.exit(1);
    }
}

// Helper function to retry operations
async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number,
    delayMs: number
): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error as Error;
            logger.warn(`Attempt ${attempt} failed: ${error.message}`);
            
            if (attempt < maxRetries) {
                logger.info(`Retrying in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    
    throw lastError;
}

// Execute the main function
main(); 