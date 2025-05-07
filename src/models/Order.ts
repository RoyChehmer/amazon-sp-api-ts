import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AmazonOrder as IAmazonOrder } from '../utils/types';

@Entity('amazon_orders')
export class AmazonOrder implements IAmazonOrder {
    @PrimaryColumn()
    amazonOrderId!: string;

    @Column({ type: 'timestamp with time zone' })
    purchaseDate!: Date;

    @Column({ type: 'timestamp with time zone' })
    lastUpdateDate!: Date;

    @Column()
    orderStatus!: string;

    @Column()
    fulfillmentChannel!: string;

    @Column()
    salesChannel!: string;

    @Column()
    orderChannel!: string;

    @Column()
    shipServiceLevel!: string;

    @Column('jsonb')
    shippingAddress!: any;

    @Column('jsonb')
    orderTotal!: any;

    @Column()
    numberOfItemsShipped!: number;

    @Column()
    numberOfItemsUnshipped!: number;

    @Column('jsonb')
    paymentExecutionDetail!: any;

    @Column()
    paymentMethod!: string;

    @Column()
    marketplaceId!: string;

    @Column('jsonb')
    buyerInfo!: any;

    @Column({ nullable: true })
    buyerEmail?: string;

    @Column({ nullable: true })
    shippingState?: string;

    @Column({ nullable: true })
    shippingPostalCode?: string;

    @Column({ nullable: true })
    shippingCity?: string;

    @Column({ nullable: true })
    shippingCountryCode?: string;

    @Column({ nullable: true })
    orderCurrency?: string;

    @Column({ nullable: true })
    orderAmount?: string;

    @Column('jsonb', { nullable: true })
    automatedShippingSettings?: any;

    @Column({ nullable: true })
    hasRegulatedItems?: boolean;

    @Column({ nullable: true })
    easyShipShipmentStatus?: string;

    @Column({ nullable: true })
    cbaDisplayableShippingLabel?: string;

    @Column({ nullable: true })
    orderType?: string;

    @Column({ type: 'timestamp with time zone', nullable: true })
    earliestShipDate?: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    latestShipDate?: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    earliestDeliveryDate?: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    latestDeliveryDate?: Date;

    @Column({ nullable: true })
    isBusinessOrder?: boolean;

    @Column({ nullable: true })
    isPrime?: boolean;

    @Column({ nullable: true })
    isPremiumOrder?: boolean;

    @Column({ nullable: true })
    isGlobalExpressEnabled?: boolean;

    @Column({ nullable: true })
    replacedOrderId?: string;

    @Column({ nullable: true })
    isReplacementOrder?: boolean;

    @Column({ type: 'timestamp with time zone', nullable: true })
    promiseResponseDueDate?: Date;

    @Column({ nullable: true })
    isEstimatedShipDateSet?: boolean;

    @Column({ nullable: true })
    isSoldByAB?: boolean;

    @Column({ nullable: true })
    isIBA?: boolean;

    @Column('jsonb', { nullable: true })
    defaultShipFromLocationAddress?: any;

    @Column({ nullable: true })
    buyerInvoicePreference?: string;

    @Column({ nullable: true })
    isAccessPointOrder?: boolean;

    @Column({ nullable: true })
    sellerOrderId?: string;

    @Column({ nullable: true })
    sellerNote?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 