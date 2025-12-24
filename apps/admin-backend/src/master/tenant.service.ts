import { Tenant } from '../models/tenant.model';

export { Tenant }; // Re-export for compatibility if needed

export const createTenant = async (name: string, subdomain: string): Promise<Tenant> => {
    const tenant = await Tenant.create({
        name,
        subdomain,
        status: 'provisioning'
    });
    return tenant;
};

import { triggerProvisioning } from './provisioning.queue';

export const provisionTenantResources = async (tenant: Tenant) => {
    // Trigger the background job
    await triggerProvisioning(tenant.id, tenant.subdomain);
};
