import dotenv from 'dotenv';
import { AmazonApiService } from './services/AmazonApiService';
import { AmazonApiConfig } from './utils/types';
import logger from './config/logger';
import { AppDataSource } from './config/database';
import { OrderService } from './services/OrderService';

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

// Create Amazon API configuration
const amazonConfig: AmazonApiConfig = {
    clientId: process.env.AMAZON_CLIENT_ID!,
    clientSecret: process.env.AMAZON_CLIENT_SECRET!,
    refreshToken: process.env.AMAZON_REFRESH_TOKEN!,
    region: process.env.AMAZON_REGION!
};

async function main() {
    try {
        // Initialize database connection
        await AppDataSource.initialize();
        logger.info('Database connection initialized');

        // Initialize services
        const amazonService = new AmazonApiService(amazonConfig);
        const orderService = new OrderService();
        
        // Example: Get orders from the last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        logger.info('Fetching orders...');
          
        const orders = await amazonService.getOrders(
            oneDayAgo.toISOString(),
            new Date().toISOString(),
            ['Shipped', 'Unshipped'],
            ['ATVPDKIKX0DER'] // US marketplace ID
        );
        
        logger.info(`Successfully fetched ${orders.payload?.Orders?.length || 0} orders`);

        // Process each order to get details and items
        if (orders.payload?.Orders) {
            //TODO: Remove the slice(0, 3) after testing
            for (const order of orders.payload.Orders.slice(0, 3)) {
                try {
                    // Add delay between requests to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

                    // Get order details with retry
                    logger.info(`Fetching details for order ${order.AmazonOrderId}...`);
                    const orderDetails = await retryOperation(
                        () => amazonService.getOrderDetails(order.AmazonOrderId),
                        3, // max retries
                        1000 // delay between retries in ms
                    );
                    logger.info(`Successfully fetched details for order ${order.AmazonOrderId}`);

                    // Get order items with retry
                    logger.info(`Fetching items for order ${order.AmazonOrderId}...`);
                    const orderItems = await retryOperation(
                        () => amazonService.getOrderItems(order.AmazonOrderId),
                        3, // max retries
                        1000 // delay between retries in ms
                    );
                    logger.info(`Successfully fetched items for order ${order.AmazonOrderId}`);

                    // Save order, details, and items to database
                    await orderService.saveOrder(order, orderDetails, orderItems.payload?.OrderItems || []);
                    logger.info(`Successfully saved order ${order.AmazonOrderId} and related data to database`);

                    // Add delay between requests
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error) {
                    logger.error(`Error processing order ${order.AmazonOrderId}:`, error);
                    // Continue with next order even if one fails
                    continue;
                }
            }
        }
        
    } catch (error) {
        logger.error('Error executing Amazon API service:', error);
        process.exit(1);
    } finally {
        // Close database connection
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            logger.info('Database connection closed');
        }
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