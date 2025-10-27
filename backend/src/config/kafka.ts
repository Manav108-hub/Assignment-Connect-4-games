import { Kafka, Producer, Consumer } from 'kafkajs';
import { config } from './env';
import { logger } from '../utils/logger';

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: [config.kafka.broker],
  retry: {
    retries: 0, // Don't retry if Kafka is not available
  },
  logLevel: 1, // Only log errors
});

let producer: Producer | null = null;
let consumer: Consumer | null = null;
let kafkaEnabled = true; // Track if Kafka is available

export const getProducer = async (): Promise<Producer | null> => {
  if (!kafkaEnabled) return null;
  
  if (!producer) {
    try {
      producer = kafka.producer();
      await producer.connect();
      logger.info('✅ Kafka producer connected');
    } catch (error) {
      logger.warn('⚠️  Kafka not available - analytics disabled');
      kafkaEnabled = false;
      return null;
    }
  }
  return producer;
};

export const getConsumer = async (): Promise<Consumer | null> => {
  if (!kafkaEnabled) return null;
  
  if (!consumer) {
    try {
      consumer = kafka.consumer({ groupId: config.kafka.groupId });
      await consumer.connect();
      await consumer.subscribe({ topic: config.kafka.topic, fromBeginning: true });
      logger.info('✅ Kafka consumer connected');
    } catch (error) {
      logger.warn('⚠️  Kafka not available - analytics disabled');
      kafkaEnabled = false;
      return null;
    }
  }
  return consumer;
};

export const disconnectKafka = async (): Promise<void> => {
  if (producer) {
    await producer.disconnect();
    logger.info('Kafka producer disconnected');
  }
  if (consumer) {
    await consumer.disconnect();
    logger.info('Kafka consumer disconnected');
  }
};