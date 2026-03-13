import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import storageConfig from './config/storage.config';
import dgiiConfig from './config/dgii.config';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { SignatureModule } from './modules/signature/signature.module';
import { DgiiModule } from './modules/dgii/dgii.module';
import { ReportsModule } from './modules/reports/reports.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { StorageModule } from './modules/storage/storage.module';
import { typeOrmModuleOptions } from './config/typeorm.config';
import { redisModuleOptions } from './config/bull.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, storageConfig, dgiiConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database (PostgreSQL via TypeORM)
    TypeOrmModule.forRootAsync(typeOrmModuleOptions),

    // Rate limiting
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),

    // Redis + BullMQ
    BullModule.forRootAsync(redisModuleOptions),

    // Feature modules
    AuthModule,
    CompaniesModule,
    InvoicesModule,
    SignatureModule,
    DgiiModule,
    ReportsModule,
    JobsModule,
    StorageModule,
  ],
})
export class AppModule {}
