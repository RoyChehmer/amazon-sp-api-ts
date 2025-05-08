import { DataSource } from 'typeorm';
import { AmazonOrder } from '../models/Order';
import { OrderDetails } from '../models/OrderDetails';
import { OrderItem } from '../models/OrderItem';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'amazon_orders',
    synchronize: true,
    logging: true,
    entities: [AmazonOrder, OrderDetails, OrderItem],
    subscribers: [],
    migrations: [],
}); 