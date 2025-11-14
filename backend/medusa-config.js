import { loadEnv, Modules, defineConfig } from '@medusajs/utils';
import {
    ADMIN_CORS,
    AUTH_CORS,
    BACKEND_URL,
    COOKIE_SECRET,
    DATABASE_URL,
    JWT_SECRET,
    REDIS_URL,
    RESEND_API_KEY,
    RESEND_FROM_EMAIL,
    SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL,
    SHOULD_DISABLE_ADMIN,
    STORE_CORS,
    STRIPE_API_KEY,
    STRIPE_WEBHOOK_SECRET,
    WORKER_MODE,
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_BUCKET,
    MEILISEARCH_HOST,
    MEILISEARCH_ADMIN_KEY,
    PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET,
    PAYPAL_ENVIRONMENT,
    // Add R2 imports
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_PUBLIC_URL,
} from 'lib/constants';

loadEnv(process.env.NODE_ENV, process.cwd());

const medusaConfig = {
    projectConfig: {
        databaseUrl: DATABASE_URL,
        databaseLogging: false,
        redisUrl: REDIS_URL,
        workerMode: WORKER_MODE,
        http: {
            adminCors: ADMIN_CORS,
            authCors: AUTH_CORS,
            storeCors: STORE_CORS,
            jwtSecret: JWT_SECRET,
            cookieSecret: COOKIE_SECRET
        },
        build: {
            rollupOptions: {
                external: ["@medusajs/dashboard"]
            }
        }
    },
    admin: {
        backendUrl: BACKEND_URL,
        disable: SHOULD_DISABLE_ADMIN,
    },
    modules: [
        {
            key: Modules.FILE,
            resolve: '@medusajs/file',
            options: {
                providers: [
                    {
                        resolve: '@medusajs/file-s3',
                        id: 's3',
                        options: {
                            file_url: 'https://pub-41e0f453538b43ba89b1ad3707c8ed4c.r2.dev',
                            access_key_id: R2_ACCESS_KEY_ID,
                            secret_access_key: R2_SECRET_ACCESS_KEY,
                            region: 'auto',
                            bucket: 'medusa-media',
                            endpoint: 'https://b9fc34201c2995d57e0c26c9b49be143.r2.cloudflarestorage.com',
                            s3_force_path_style: false,
                        }
                    }
                ]
            }
        },
        ...(REDIS_URL ? [{
                key: Modules.EVENT_BUS,
                resolve: '@medusajs/event-bus-redis',
                options: {
                    redisUrl: REDIS_URL
                }
            },
            {
                key: Modules.WORKFLOW_ENGINE,
                resolve: '@medusajs/workflow-engine-redis',
                options: {
                    redis: {
                        url: REDIS_URL,
                    }
                }
            }
        ] : []),
        ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL || RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
            key: Modules.NOTIFICATION,
            resolve: '@medusajs/notification',
            options: {
                providers: [
                    ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL ? [{
                        resolve: '@medusajs/notification-sendgrid',
                        id: 'sendgrid',
                        options: {
                            channels: ['email'],
                            api_key: SENDGRID_API_KEY,
                            from: SENDGRID_FROM_EMAIL,
                        }
                    }] : []),
                    ...(RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
                        resolve: './src/modules/email-notifications',
                        id: 'resend',
                        options: {
                            channels: ['email'],
                            api_key: RESEND_API_KEY,
                            from: RESEND_FROM_EMAIL,
                        },
                    }] : []),
                ]
            }
        }] : []),
        ...(((STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET) || (PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET && PAYPAL_ENVIRONMENT)) ? [{
            key: Modules.PAYMENT,
            resolve: '@medusajs/payment',
            options: {
                providers: [
                    ...(STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET ? [{
                        resolve: '@medusajs/payment-stripe',
                        id: 'stripe',
                        options: {
                            apiKey: STRIPE_API_KEY,
                            webhookSecret: STRIPE_WEBHOOK_SECRET,
                        },
                    }] : []),
                    ...(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET && PAYPAL_ENVIRONMENT ? [{
                        resolve: '@rsc-labs/medusa-paypal-payment/providers/paypal-payment',
                        id: 'paypal-payment',
                        options: {
                            oAuthClientId: PAYPAL_CLIENT_ID,
                            oAuthClientSecret: PAYPAL_CLIENT_SECRET,
                            environment: PAYPAL_ENVIRONMENT,
                        },
                    }] : []),
                ],
            },
        }] : [])
    ],
    plugins: [
        ...(MEILISEARCH_HOST && MEILISEARCH_ADMIN_KEY ? [{
            resolve: '@rokmohar/medusa-plugin-meilisearch',
            options: {
                config: {
                    host: MEILISEARCH_HOST,
                    apiKey: MEILISEARCH_ADMIN_KEY
                },
                settings: {
                    products: {
                        type: 'products',
                        enabled: true,
                        fields: ['id', 'title', 'description', 'handle', 'variant_sku', 'thumbnail'],
                        indexSettings: {
                            searchableAttributes: ['title', 'description', 'variant_sku'],
                            displayedAttributes: ['id', 'handle', 'title', 'description', 'variant_sku', 'thumbnail'],
                            filterableAttributes: ['id', 'handle'],
                        },
                        primaryKey: 'id',
                    }
                }
            }
        }] : []),
    ]
};

console.log(JSON.stringify(medusaConfig, null, 2));
export default defineConfig(medusaConfig);