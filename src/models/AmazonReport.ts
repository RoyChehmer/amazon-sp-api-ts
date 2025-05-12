import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('amazon_reports')
export class AmazonReport {
    @PrimaryColumn()
    reportId!: string;

    @Column()
    reportType!: string;

    @Column('simple-array')
    marketplaceIds!: string[];

    @Column({ nullable: true })
    dateStartTime?: string;

    @Column({ nullable: true })
    dateEndTime?: string;

    @Column({ nullable: true })
    reportDocumentId?: string;

    @Column({ nullable: true })
    processingStatus?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 