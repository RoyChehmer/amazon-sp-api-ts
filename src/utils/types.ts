export interface AmazonOrder {
    amazonOrderId: string;
    purchaseDate: Date;
    lastUpdateDate: Date;
    orderStatus: string;
    fulfillmentChannel: string;
    salesChannel: string;
    orderChannel: string;
    shipServiceLevel: string;
    shippingAddress: any;
    orderTotal: any;
    numberOfItemsShipped: number;
    numberOfItemsUnshipped: number;
    paymentExecutionDetail: any;
    paymentMethod: string;
    marketplaceId: string;
    buyerInfo: any;
    buyerEmail?: string;
    shippingState?: string;
    shippingPostalCode?: string;
    shippingCity?: string;
    shippingCountryCode?: string;
    orderCurrency?: string;
    orderAmount?: string;
    automatedShippingSettings?: any;
    hasRegulatedItems?: boolean;
    easyShipShipmentStatus?: string;
    cbaDisplayableShippingLabel?: string;
    orderType?: string;
    earliestShipDate?: Date;
    latestShipDate?: Date;
    earliestDeliveryDate?: Date;
    latestDeliveryDate?: Date;
    isBusinessOrder?: boolean;
    isPrime?: boolean;
    isPremiumOrder?: boolean;
    isGlobalExpressEnabled?: boolean;
    replacedOrderId?: string;
    isReplacementOrder?: boolean;
    promiseResponseDueDate?: Date;
    isEstimatedShipDateSet?: boolean;
    isSoldByAB?: boolean;
    isIBA?: boolean;
    defaultShipFromLocationAddress?: any;
    buyerInvoicePreference?: string;
    isAccessPointOrder?: boolean;
    sellerOrderId?: string;
    sellerNote?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderItem {
    id?: number;
    amazonOrderId: string;
    asin: string;
    sellerSku: string;
    orderItemId: string;
    title: string;
    quantityOrdered: number;
    quantityShipped: number;
    productInfo?: any;
    pointsGranted?: any;
    itemPrice?: any;
    shippingPrice?: any;
    itemTax?: any;
    shippingTax?: any;
    shippingDiscount?: any;
    shippingDiscountTax?: any;
    promotionDiscount?: any;
    promotionDiscountTax?: any;
    promotionIds?: any;
    codFee?: any;
    codFeeDiscount?: any;
    isGift?: boolean;
    conditionNote?: string;
    conditionId?: string;
    conditionSubtypeId?: string;
    scheduledDeliveryStartDate?: Date;
    scheduledDeliveryEndDate?: Date;
    priceDesignation?: string;
    taxCollection?: any;
    serialNumberRequired?: boolean;
    isTransparency?: boolean;
    iossNumber?: string;
    storeChainStoreId?: string;
    deemedResellerCategory?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderDetails extends Omit<AmazonOrder, 'buyerEmail' | 'shippingState' | 'shippingPostalCode' | 'shippingCity' | 'shippingCountryCode' | 'orderCurrency' | 'orderAmount'> {
    // Additional fields specific to order details
}

export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
}

export interface AmazonApiConfig {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    region: string;
} 