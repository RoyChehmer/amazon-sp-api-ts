import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('amazon_marketplace_participations')
export class MarketplaceParticipation {
    @PrimaryColumn()
    marketplaceId!: string;

    @Column()
    name!: string;

    @Column()
    countryCode!: string;

    @Column()
    defaultLanguageCode!: string;

    @Column()
    defaultCurrencyCode!: string;

    @Column()
    domainName!: string;

    @Column({ nullable: true })
    sellerId?: string;

    @Column({ nullable: true })
    sellerName?: string;

    @Column({ nullable: true })
    sellerEmail?: string;

    @Column({ type: 'jsonb', nullable: true })
    additionalInfo?: any;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 