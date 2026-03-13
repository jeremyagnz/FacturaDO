import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, InvoiceQueryDto } from './dto/invoice.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../auth/user.entity';

@ApiTags('invoices')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new e-CF invoice (draft)' })
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: User) {
    return this.invoicesService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List invoices' })
  findAll(@Query() query: InvoiceQueryDto, @CurrentUser() user: User) {
    return this.invoicesService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post(':id/sign')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Queue digital signature for invoice' })
  sign(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.sign(id);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Submit signed invoice to DGII' })
  submitToDgii(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.submitToDgii(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel invoice' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.cancel(id);
  }
}
