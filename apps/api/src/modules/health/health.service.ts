import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

export interface ServiceHealth {
  status: 'ok' | 'error';
  latencyMs: number;
  error?: string;
}

export interface HealthStatus {
  status: 'ok' | 'error';
  version: string;
  environment: string;
  uptimeSeconds: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
  };
}

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly logger = new Logger(HealthService.name);
  private readonly redisClient: Redis;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
      password: this.configService.get<string>('redis.password') || undefined,
      db: this.configService.get<number>('redis.db', 0),
      lazyConnect: true,
      connectTimeout: 3000,
      commandTimeout: 3000,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  async check(): Promise<HealthStatus> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const allOk = database.status === 'ok' && redis.status === 'ok';

    return {
      status: allOk ? 'ok' : 'error',
      version: process.env.npm_package_version ?? '1.0.0',
      environment: this.configService.get<string>('app.nodeEnv', 'development'),
      uptimeSeconds: Math.floor(process.uptime()),
      services: { database, redis },
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch (error) {
      this.logger.warn('Database health check failed', error);
      return { status: 'error', latencyMs: Date.now() - start, error: 'Database unreachable' };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await this.redisClient.ping();
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch (error) {
      this.logger.warn('Redis health check failed', error);
      return { status: 'error', latencyMs: Date.now() - start, error: 'Redis unreachable' };
    }
  }
}
