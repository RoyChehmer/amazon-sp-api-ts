import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { OrderItem as IOrderItem } from '../utils/types';

@Entity('amazon_order_items')
export class OrderItem implements IOrderItem {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    amazonOrderId!: string;

    @Column()
    asin!: string;

    @Column()
    sellerSku!: string;

    @Column()
    orderItemId!: string;

    @Column()
    title!: string;

    @Column()
    quantityOrdered!: number;

    @Column()
    quantityShipped!: number;

    @Column('jsonb', { nullable: true })
    productInfo?: any;

    @Column('jsonb', { nullable: true })
    pointsGranted?: any;

    @Column('jsonb', { nullable: true })
    itemPrice?: any;

    @Column('jsonb', { nullable: true })
    shippingPrice?: any;

    @Column('jsonb', { nullable: true })
    itemTax?: any;

    @Column('jsonb', { nullable: true })
    shippingTax?: any;

    @Column('jsonb', { nullable: true })
    shippingDiscount?: any;

    @Column('jsonb', { nullable: true })
    shippingDiscountTax?: any;

    @Column('jsonb', { nullable: true })
    promotionDiscount?: any;

    @Column('jsonb', { nullable: true })
    promotionDiscountTax?: any;

    @Column('jsonb', { nullable: true })
    promotionIds?: any;

    @Column('jsonb', { nullable: true })
    codFee?: any;

    @Column('jsonb', { nullable: true })
    codFeeDiscount?: any;

    @Column({ nullable: true })
    isGift?: boolean;

    @Column({ nullable: true })
    conditionNote?: string;

    @Column({ nullable: true })
    conditionId?: string;

    @Column({ nullable: true })
    conditionSubtypeId?: string;

    @Column({ type: 'timestamp with time zone', nullable: true })
    scheduledDeliveryStartDate?: Date;

    @Column({ type: 'timestamp with time zone', nullable: true })
    scheduledDeliveryEndDate?: Date;

    @Column({ nullable: true })
    priceDesignation?: string;

    @Column('jsonb', { nullable: true })
    taxCollection?: any;

    @Column({ nullable: true })
    serialNumberRequired?: boolean;

    @Column({ nullable: true })
    isTransparency?: boolean;

    @Column({ nullable: true })
    iossNumber?: string;

    @Column({ nullable: true })
    storeChainStoreId?: string;

    @Column({ nullable: true })
    deemedResellerCategory?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 