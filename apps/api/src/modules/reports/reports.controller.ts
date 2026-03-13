import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService, ReportFilter } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ECFType, InvoiceStatus } from '../invoices/invoice.entity';

@ApiTags('reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard/:companyId')
  @ApiOperation({ summary: 'Get dashboard statistics for a company' })
  getDashboardStats(@Param('companyId') companyId: string) {
    return this.reportsService.getDashboardStats(companyId);
  }

  @Get('summary/:companyId')
  @ApiOperation({ summary: 'Get invoice summary report' })
  getInvoiceSummary(
    @Param('companyId') companyId: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('ecfType') ecfType?: ECFType,
    @Query('status') status?: InvoiceStatus,
  ) {
    const filter: ReportFilter = {
      companyId,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      ecfType,
      status,
    };
    return this.reportsService.getInvoiceSummary(filter);
  }

  @Get('606/:companyId')
  @ApiOperation({ summary: 'Generate DGII 606 report (purchases)' })
  get606Report(
    @Param('companyId') companyId: string,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.reportsService.generate606Report(companyId, year, month);
  }

  @Get('607/:companyId')
  @ApiOperation({ summary: 'Generate DGII 607 report (sales)' })
  get607Report(
    @Param('companyId') companyId: string,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.reportsService.generate607Report(companyId, year, month);
  }
}
