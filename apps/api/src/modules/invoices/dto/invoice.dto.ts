import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsDateString,
  ValidateNested,
  IsEmail,
  Min,
  Max,
  Length,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ECFType, PaymentMethod } from '../invoice.entity';

export class CreateInvoiceItemDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  lineNumber: number;

  @ApiPropertyOptional({ example: 'PROD-001' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'Servicio de consultoría' })
  @IsString()
  @Length(1, 1000)
  description: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiPropertyOptional({ example: 'unidad' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 18, description: 'ITBIS rate %' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  taxRate?: number;

  @ApiPropertyOptional({ example: 0, description: 'Discount rate %' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountRate?: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: 'uuid-company-id' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ enum: ECFType, example: ECFType.FACTURA_CREDITO_FISCAL })
  @IsEnum(ECFType)
  ecfType: ECFType;

  @ApiProperty({ example: '2025-01-15' })
  @IsDateString()
  issueDate: string;

  @ApiPropertyOptional({ example: '2025-02-14' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ example: '130000001' })
  @IsString()
  @Length(9, 11)
  @IsOptional()
  buyerRnc?: string;

  @ApiPropertyOptional({ example: 'Empresa Cliente SRL' })
  @IsString()
  @IsOptional()
  buyerName?: string;

  @ApiPropertyOptional({ example: 'Av. 27 de Febrero #200' })
  @IsString()
  @IsOptional()
  buyerAddress?: string;

  @ApiPropertyOptional({ example: 'cliente@empresa.do' })
  @IsEmail()
  @IsOptional()
  buyerEmail?: string;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.CREDIT })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: 'DOP' })
  @IsString()
  @Length(3, 3)
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  exchangeRate?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreateInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}

export class InvoiceQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ecfType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}
