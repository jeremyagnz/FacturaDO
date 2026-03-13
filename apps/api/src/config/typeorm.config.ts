import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const typeOrmModuleOptions: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get('database.host'),
    port: configService.get<number>('database.port'),
    username: configService.get('database.username'),
    password: configService.get('database.password'),
    database: configService.get('database.database'),
    ssl: configService.get('database.ssl') ? { rejectUnauthorized: false } : false,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsRun: false,
    synchronize: configService.get('app.nodeEnv') === 'development',
    logging: configService.get<boolean>('database.logging'),
    extra: {
      max: configService.get<number>('database.maxConnections'),
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    },
  }),
};
