import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let kafkaProducer: Producer | null = null;
let kafkaConsumer: Consumer | null = null;
let isKafkaAvailable = false;

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: [config.kafka.broker],
  logLevel: logLevel.ERROR,
  retry: {
    initialRetryTime: 300,
    retries: 5,
    maxRetryTime: 30000,
  },
  connectionTimeout: 10000,
  requestTimeout: 30000,
});

export const initKafkaProducer = async (): Promise<void> => {
  try {
    logger.info('🔄 Attempting to connect to Kafka...');
    logger.info(`📍 Kafka broker: ${config.kafka.broker}`);

    const producer = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
      retry: {
        retries: 5,
      },
    });

    logger.info('🔌 Connecting producer...');
    await producer.connect();
    logger.info('✅ Producer connected!');

    // ✅ Ensure topic exists
    const admin = kafka.admin();
    logger.info('🔌 Connecting admin...');
    await admin.connect();
    logger.info('✅ Admin connected!');
    
    logger.info('📋 Listing topics...');
    const topics = await admin.listTopics();
    logger.info(`📋 Existing topics: ${topics.join(', ') || 'none'}`);
    
    if (!topics.includes('game-analytics')) {
      logger.info('🆕 Creating game-analytics topic...');
      await admin.createTopics({
        topics: [{
          topic: 'game-analytics',
          numPartitions: 1,
          replicationFactor: 1,
        }],
      });
      logger.info('✅ Created Kafka topic: game-analytics');
    } else {
      logger.info('✅ Topic game-analytics already exists');
    }
    
    await admin.disconnect();

    kafkaProducer = producer;
    isKafkaAvailable = true;
    logger.info('✅ Kafka producer connected successfully');
  } catch (error: any) {
    logger.error('❌ Kafka connection failed:');
    logger.error(`   Error: ${error.message}`);
    if (error.stack) {
      logger.error(`   Stack: ${error.stack.split('\n')[0]}`);
    }
    logger.warn('⚠️  Kafka not available - analytics disabled');
    isKafkaAvailable = false;
  }
};

export const initKafkaConsumer = async (): Promise<void> => {
  if (!isKafkaAvailable) {
    logger.warn('⚠️  Analytics consumer disabled (Kafka unavailable)');
    return;
  }

  try {
    const consumer = kafka.consumer({ 
      groupId: config.kafka.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    await consumer.connect();
    await consumer.subscribe({ 
      topic: 'game-analytics', 
      fromBeginning: false 
    });

    kafkaConsumer = consumer;
    logger.info('✅ Kafka consumer connected successfully');
  } catch (error) {
    logger.error('❌ Kafka consumer initialization failed:', error);
  }
};

export const getKafkaProducer = (): Producer | null => {
  return kafkaProducer;
};

export const getKafkaConsumer = (): Consumer | null => {
  return kafkaConsumer;
};

export const isKafkaEnabled = (): boolean => {
  return isKafkaAvailable;
};

export const disconnectKafka = async (): Promise<void> => {
  if (kafkaProducer) {
    await kafkaProducer.disconnect();
    logger.info('Kafka producer disconnected');
  }
  if (kafkaConsumer) {
    await kafkaConsumer.disconnect();
    logger.info('Kafka consumer disconnected');
  }
};