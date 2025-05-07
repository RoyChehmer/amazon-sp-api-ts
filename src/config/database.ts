import { DataSource } from 'typeorm';
import { AmazonOrder } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { OrderDetails } from '../models/OrderDetails';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'amazon',
    synchronize: true,
    logging: true,
    entities: [AmazonOrder, OrderItem, OrderDetails],
    subscribers: [],
    migrations: [],
}); 