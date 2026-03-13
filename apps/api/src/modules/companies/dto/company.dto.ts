import {
  IsString,
  IsEmail,
  IsOptional,
  Length,
  IsEnum,
  IsUrl,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaxRegime } from '../company.entity';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Mi Empresa SRL' })
  @IsString()
  @Length(2, 255)
  name: string;

  @ApiProperty({ example: '130000001', description: 'RNC (9 digits) or cédula (11 digits)' })
  @IsString()
  @Length(9, 11)
  rnc: string;

  @ApiPropertyOptional({ example: 'Mi Empresa' })
  @IsString()
  @IsOptional()
  commercialName?: string;

  @ApiPropertyOptional({ enum: TaxRegime, default: TaxRegime.ORDINARIO })
  @IsEnum(TaxRegime)
  @IsOptional()
  taxRegime?: TaxRegime;

  @ApiPropertyOptional({ example: 'Av. 27 de Febrero #100, Santo Domingo' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Santo Domingo' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: '+18095551234' })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'info@miempresa.do' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'https://miempresa.do' })
  @IsUrl()
  @IsOptional()
  website?: string;
}

export class UpdateCompanyDto extends CreateCompanyDto {}

export class CompanyQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}
