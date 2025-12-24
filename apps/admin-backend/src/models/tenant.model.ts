import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db';

export class Tenant extends Model {
    public id!: number;
    public name!: string;
    public subdomain!: string;
    public status!: 'active' | 'provisioning' | 'failed';
}

Tenant.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    subdomain: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    status: {
        type: DataTypes.ENUM('active', 'provisioning', 'failed'),
        defaultValue: 'provisioning',
    },
}, {
    sequelize,
    tableName: 'tenants',
});
