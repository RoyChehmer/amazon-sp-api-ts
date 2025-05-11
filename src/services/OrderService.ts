import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { AmazonOrder } from '../models/Order';
import { OrderDetails } from '../models/OrderDetails';
import { OrderItem } from '../models/OrderItem';
import logger from '../config/logger';

export class OrderService {
    private orderRepository: Repository<AmazonOrder>;
    private orderDetailsRepository: Repository<OrderDetails>;
    private orderItemRepository: Repository<OrderItem>;

    constructor() {
        this.orderRepository = AppDataSource.getRepository(AmazonOrder);
        this.orderDetailsRepository = AppDataSource.getRepository(OrderDetails);
        this.orderItemRepository = AppDataSource.getRepository(OrderItem);
    }

    async saveOrder(orderData: any, orderDetailsData: any, orderItemsData: any): Promise<{ order: AmazonOrder; details: OrderDetails; items: OrderItem[] }> {
        // Validate input data
        if (!orderData || !orderData.AmazonOrderId) {
            throw new Error('Invalid order data: AmazonOrderId is required');
        }

        // Debug logging
        logger.info(JSON.stringify(orderItemsData));
        logger.info('orderItemsData type:', typeof orderItemsData);
        logger.info('orderItemsData keys:', Object.keys(orderItemsData));

        // Extract order items from the nested structure
        let items;
        if (typeof orderItemsData === 'string') {
            try {
                orderItemsData = JSON.parse(orderItemsData);
            } catch (error) {
                logger.error('Failed to parse orderItemsData as JSON:', error);
                throw new Error('Invalid orderItemsData format');
            }
        }

        // Handle the payload structure
        if (orderItemsData?.payload?.OrderItems) {
            items = orderItemsData.payload.OrderItems;
            logger.info('Extracted OrderItems from payload:', JSON.stringify(items, null, 2));
        } else if (orderItemsData?.OrderItems) {
            items = orderItemsData.OrderItems;
            logger.info('Extracted OrderItems:', JSON.stringify(items, null, 2));
        } else {
            logger.warn('No OrderItems found in data, using empty array');
            items = [];
        }

        if (!Array.isArray(items)) {
            logger.warn('OrderItems is not an array, converting to array');
            items = [items];
        }

        logger.info('Final items array:', JSON.stringify(items, null, 2));

        // Save main order
        const order = this.orderRepository.create({
            amazonOrderId: orderData.AmazonOrderId,
            sellerOrderId: orderData.SellerOrderId,
            purchaseDate: new Date(orderData.PurchaseDate),
            lastUpdateDate: orderData.LastUpdateDate ? new Date(orderData.LastUpdateDate) : undefined,
            orderStatus: orderData.OrderStatus,
            fulfillmentChannel: orderData.FulfillmentChannel,
            salesChannel: orderData.SalesChannel,
            orderChannel: orderData.OrderChannel,
            shipServiceLevel: orderData.ShipServiceLevel,
            orderTotal: orderData.OrderTotal?.Amount,
            currency: orderData.OrderTotal?.CurrencyCode,
            shippingAddress: orderData.ShippingAddress,
            buyerInfo: orderData.BuyerInfo,
            numberOfItemsShipped: orderData.NumberOfItemsShipped || 0,
            numberOfItemsUnshipped: orderData.NumberOfItemsUnshipped || 0,
            paymentExecutionDetail: orderData.PaymentExecutionDetail || [],
            paymentMethod: orderData.PaymentMethod || 'Unknown',
            marketplaceId: orderData.MarketplaceId
        });
        const savedOrder = await this.orderRepository.save(order);

        // Save order details
        const details = this.orderDetailsRepository.create({
            amazonOrderId: orderData.AmazonOrderId,
            purchaseDate: new Date(orderData.PurchaseDate),
            lastUpdateDate: orderData.LastUpdateDate ? new Date(orderData.LastUpdateDate) : new Date(),
            orderStatus: orderData.OrderStatus,
            fulfillmentChannel: orderData.FulfillmentChannel || 'Unknown',
            salesChannel: orderData.SalesChannel || 'Unknown',
            orderChannel: orderData.OrderChannel || 'Unknown',
            shipServiceLevel: orderData.ShipServiceLevel || 'Unknown',
            shippingAddress: orderData.ShippingAddress || {},
            orderTotal: orderData.OrderTotal || {},
            numberOfItemsShipped: orderData.NumberOfItemsShipped || 0,
            numberOfItemsUnshipped: orderData.NumberOfItemsUnshipped || 0,
            paymentExecutionDetail: orderData.PaymentExecutionDetail || [],
            paymentMethod: orderData.PaymentMethod || 'Unknown',
            marketplaceId: orderData.MarketplaceId,
            buyerInfo: orderData.BuyerInfo || {},
            ...orderDetailsData
        });
        await this.orderDetailsRepository.save(details);

        // Save order items
        const orderItems = items.map(itemData => {
            if (!itemData) {
                logger.warn('Skipping null or undefined order item');
                return null;
            }    

            logger.info('Processing item data:', JSON.stringify(itemData, null, 2));

            try {
                const createdItem = this.orderItemRepository.create({
                    amazonOrderId: orderData.AmazonOrderId,
                    asin: itemData.ASIN,
                    sellerSku: itemData.SellerSKU || '',
                    orderItemId: itemData.OrderItemId,
                    title: itemData.Title || '',
                    quantityOrdered: itemData.QuantityOrdered || 0,
                    quantityShipped: itemData.QuantityShipped || 0,
                    productInfo: itemData.ProductInfo || {},
                    pointsGranted: itemData.PointsGranted || {},
                    itemPrice: itemData.ItemPrice || {},
                    shippingPrice: itemData.ShippingPrice || {},
                    itemTax: itemData.ItemTax || {},
                    shippingTax: itemData.ShippingTax || {},
                    shippingDiscount: itemData.ShippingDiscount || {},
                    shippingDiscountTax: itemData.ShippingDiscountTax || {},
                    promotionDiscount: itemData.PromotionDiscount || {},
                    promotionDiscountTax: itemData.PromotionDiscountTax || {},
                    promotionIds: itemData.PromotionIds || [],
                    codFee: itemData.CODFee || {},
                    codFeeDiscount: itemData.CODFeeDiscount || {},
                    isGift: itemData.IsGift === 'true' || false,
                    conditionNote: itemData.ConditionNote || '',
                    conditionId: itemData.ConditionId || '',
                    conditionSubtypeId: itemData.ConditionSubtypeId || '',
                    scheduledDeliveryStartDate: itemData.ScheduledDeliveryStartDate ? new Date(itemData.ScheduledDeliveryStartDate) : undefined,
                    scheduledDeliveryEndDate: itemData.ScheduledDeliveryEndDate ? new Date(itemData.ScheduledDeliveryEndDate) : undefined,
                    priceDesignation: itemData.PriceDesignation || '',
                    taxCollection: itemData.TaxCollection || {},
                    serialNumberRequired: itemData.SerialNumberRequired || false,
                    isTransparency: itemData.IsTransparency || false,
                    iossNumber: itemData.IossNumber || '',
                    storeChainStoreId: itemData.StoreChainStoreId || '',
                    deemedResellerCategory: itemData.DeemedResellerCategory || ''
                });                
                return createdItem;
            } catch (error) {
                logger.error(`Error creating order item for order ${orderData.AmazonOrderId}:`, error);
                return null;
            }
        });
        
        const filteredNullRecordsItems = orderItems.filter(item => item !== null) as OrderItem[];        
        if (filteredNullRecordsItems.length === 0) {
            logger.warn(`No valid order items found for order ${orderData.AmazonOrderId}`);
        }

        const savedItems = await this.orderItemRepository.save(filteredNullRecordsItems);
        logger.info('Saved items:'+ JSON.stringify(savedItems));

        // Fetch the complete saved details
        const completeDetails = await this.orderDetailsRepository.findOne({ where: { amazonOrderId: orderData.AmazonOrderId } });
        if (!completeDetails) {
            throw new Error('Failed to save order details');
        }

        return {
            order: savedOrder,
            details: completeDetails,
            items: savedItems
        };
    }

    async getOrder(amazonOrderId: string): Promise<{ order: AmazonOrder | null; details: OrderDetails | null; items: OrderItem[] }> {
        const order = await this.orderRepository.findOne({ where: { amazonOrderId } });
        const details = await this.orderDetailsRepository.findOne({ where: { amazonOrderId } });
        const items = await this.orderItemRepository.find({ where: { amazonOrderId } });
        return { order, details, items };
    }

    async getAllOrders(): Promise<Array<{ order: AmazonOrder; details: OrderDetails | null; items: OrderItem[] }>> {
        const orders = await this.orderRepository.find();
        const result = await Promise.all(orders.map(async (order) => {
            const details = await this.orderDetailsRepository.findOne({ where: { amazonOrderId: order.amazonOrderId } });
            const items = await this.orderItemRepository.find({ where: { amazonOrderId: order.amazonOrderId } });
            return { order, details, items };
        }));
        return result;
    }
} 