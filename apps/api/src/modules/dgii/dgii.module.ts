import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DgiiController } from './dgii.controller';
import { DgiiService } from './dgii.service';

@Module({
  imports: [HttpModule],
  controllers: [DgiiController],
  providers: [DgiiService],
  exports: [DgiiService],
})
export class DgiiModule {}
