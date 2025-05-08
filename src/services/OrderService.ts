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

    async saveOrder(orderData: any, orderDetailsData: any, orderItemsData: any[]): Promise<{ order: AmazonOrder; details: OrderDetails; items: OrderItem[] }> {
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
        const items = orderItemsData.map(itemData => this.orderItemRepository.create({
            amazonOrderId: orderData.AmazonOrderId,
            asin: itemData.ASIN,
            sellerSku: itemData.SellerSKU,
            orderItemId: itemData.OrderItemId,
            title: itemData.Title,
            quantityOrdered: itemData.QuantityOrdered,
            quantityShipped: itemData.QuantityShipped,
            productInfo: itemData.ProductInfo,
            pointsGranted: itemData.PointsGranted,
            itemPrice: itemData.ItemPrice,
            shippingPrice: itemData.ShippingPrice,
            itemTax: itemData.ItemTax,
            shippingTax: itemData.ShippingTax,
            shippingDiscount: itemData.ShippingDiscount,
            shippingDiscountTax: itemData.ShippingDiscountTax,
            promotionDiscount: itemData.PromotionDiscount,
            promotionDiscountTax: itemData.PromotionDiscountTax,
            promotionIds: itemData.PromotionIds,
            codFee: itemData.CODFee,
            codFeeDiscount: itemData.CODFeeDiscount,
            isGift: itemData.IsGift,
            conditionNote: itemData.ConditionNote,
            conditionId: itemData.ConditionId,
            conditionSubtypeId: itemData.ConditionSubtypeId,
            scheduledDeliveryStartDate: itemData.ScheduledDeliveryStartDate ? new Date(itemData.ScheduledDeliveryStartDate) : undefined,
            scheduledDeliveryEndDate: itemData.ScheduledDeliveryEndDate ? new Date(itemData.ScheduledDeliveryEndDate) : undefined,
            priceDesignation: itemData.PriceDesignation,
            taxCollection: itemData.TaxCollection,
            serialNumberRequired: itemData.SerialNumberRequired,
            isTransparency: itemData.IsTransparency,
            iossNumber: itemData.IossNumber,
            storeChainStoreId: itemData.StoreChainStoreId,
            deemedResellerCategory: itemData.DeemedResellerCategory
        }));
        const savedItems = await this.orderItemRepository.save(items);

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