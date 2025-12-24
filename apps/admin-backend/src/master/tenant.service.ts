import { Client } from 'pg';

export interface Tenant {
    id: number;
    name: string;
    subdomain: string;
    status: 'active' | 'provisioning' | 'failed';
}

const getClient = () => {
    return new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '5432')
    });
}

export const createTenant = async (name: string, subdomain: string): Promise<Tenant> => {
    const client = getClient();
    await client.connect();
    // Assuming 'tenants' table exists in Master DB
    const res = await client.query(
        'INSERT INTO tenants(name, subdomain, status) VALUES($1, $2, $3) RETURNING *',
        [name, subdomain, 'provisioning']
    );
    await client.end();
    return res.rows[0];
};

import { triggerProvisioning } from './provisioning.queue';

export const provisionTenantResources = async (tenant: Tenant) => {
    // Trigger the background job
    await triggerProvisioning(tenant.id, tenant.subdomain);
};
