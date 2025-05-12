import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('amazon_documents')
export class AmazonDocument {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    reportId!: string;

    @Column()
    reportDocumentId!: string;

    @Column('jsonb')
    headers!: string[];

    @Column('jsonb')
    record!: Record<string, string>;

    @Column()
    recordIndex!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 