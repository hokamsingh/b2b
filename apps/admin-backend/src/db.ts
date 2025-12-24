import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: false, // Disable logging for production
});

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');
        // await sequelize.sync(); // Sync removed in favor of migrations
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};
