import { Controller, Get, Post, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('storage')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('presigned-url')
  @ApiOperation({ summary: 'Get a pre-signed download URL for a stored file' })
  async getPresignedUrl(
    @Query('key') key: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    const url = await this.storageService.getPresignedUrl(key, expiresIn ?? 3600);
    return { url };
  }

  @Post('presigned-upload')
  @ApiOperation({ summary: 'Get a pre-signed upload URL for client-side uploads' })
  async getPresignedUploadUrl(
    @Query('key') key: string,
    @Query('contentType') contentType: string,
  ) {
    const url = await this.storageService.getPresignedUploadUrl(key, contentType);
    return { url };
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a file from storage' })
  async delete(@Param('key') key: string) {
    await this.storageService.delete(key);
    return { deleted: true };
  }
}
