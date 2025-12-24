import { Kafka } from 'kafkajs';
import { Client } from 'cassandra-driver';

const kafka = new Kafka({
    clientId: 'admin-backend-analytics',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});

const cassandraClient = new Client({
    contactPoints: [process.env.CASSANDRA_CONTACT_POINT || 'cassandra'],
    localDataCenter: 'datacenter1',
    keyspace: 'analytics',
});

const consumer = kafka.consumer({ groupId: 'analytics-group' });

export const startAnalyticsConsumer = async () => {
    console.log('[Analytics] Connecting to Kafka & Cassandra...');
    await consumer.connect();
    await consumer.subscribe({ topic: 'tenant-events', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const event = message.value?.toString();
            console.log(`[Analytics] Received event: ${event}`);

            if (event) {
                try {
                    const parsed = JSON.parse(event);
                    // Insert into Cassandra
                    const query = 'INSERT INTO events (tenant_id, event_type, payload, created_at) VALUES (?, ?, ?, toTimestamp(now()))';
                    await cassandraClient.execute(query, [parsed.tenantId, parsed.eventType, parsed.payload], { prepare: true });
                } catch (e) {
                    console.error('[Analytics] Error processing event', e);
                }
            }
        },
    });
};
