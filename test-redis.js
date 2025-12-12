// Quick test script to verify Redis connection
require('dotenv').config({ path: '.env.local' });
const { Redis } = require('@upstash/redis');

const getRedisConfig = () => {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }
  }
  
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return {
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    }
  }
  
  return null
}

const config = getRedisConfig();
if (!config) {
  console.error('❌ No Redis configuration found!');
  console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('KV') || k.includes('REDIS') || k.includes('UPSTASH')));
  process.exit(1);
}

const redis = new Redis({ url: config.url, token: config.token });

async function testConnection() {
  try {
    console.log('🔍 Testing Redis connection...');
    console.log('URL:', config.url);
    
    // Test connection with a simple ping-like operation
    const testKey = 'test:connection';
    await redis.set(testKey, 'connected');
    const value = await redis.get(testKey);
    await redis.del(testKey);
    
    if (value === 'connected') {
      console.log('✅ Redis connection successful!');
      
      // Check existing test IDs
      const testIds = await redis.smembers('test:ids');
      console.log(`📊 Found ${testIds.length} existing test(s) in database`);
      
      process.exit(0);
    } else {
      console.error('❌ Connection test failed - unexpected value');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Redis connection failed:');
    console.error(error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

testConnection();

