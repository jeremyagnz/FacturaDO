import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModuleAsyncOptions } from '@nestjs/bull';

export const redisModuleOptions: BullModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    redis: {
      host: configService.get('redis.host'),
      port: configService.get<number>('redis.port'),
      password: configService.get('redis.password'),
      db: configService.get<number>('redis.db'),
      tls: configService.get('redis.tls'),
    },
    prefix: configService.get('redis.keyPrefix', 'facturado:'),
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  }),
};
