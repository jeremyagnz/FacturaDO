import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DgiiService } from './dgii.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('dgii')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('dgii')
export class DgiiController {
  constructor(private readonly dgiiService: DgiiService) {}

  @Get('rnc/:rnc')
  @ApiOperation({ summary: 'Validate RNC against DGII registry' })
  validateRnc(@Param('rnc') rnc: string) {
    return this.dgiiService.validateRnc(rnc);
  }

  @Get('status/:trackingId')
  @ApiOperation({ summary: 'Check e-CF submission status at DGII' })
  checkStatus(@Param('trackingId') trackingId: string) {
    return this.dgiiService.checkStatus(trackingId);
  }
}
