import {
  Entity,
  Column,
  Index,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../database/base.entity';
import { User } from '../auth/user.entity';
import { Invoice } from '../invoices/invoice.entity';

export enum CompanyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_APPROVAL = 'pending_approval',
}

export enum TaxRegime {
  ORDINARIO = 'ordinario',
  SIMPLIFICADO = 'simplificado',
  RST = 'rst',
}

@Entity('companies')
export class Company extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 11, unique: true })
  @Index()
  rnc: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  commercialName?: string;

  @Column({ type: 'enum', enum: CompanyStatus, default: CompanyStatus.PENDING_APPROVAL })
  status: CompanyStatus;

  @Column({ type: 'enum', enum: TaxRegime, default: TaxRegime.ORDINARIO })
  taxRegime: TaxRegime;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'logo_url' })
  logoUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'certificate_path' })
  certificatePath?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'certificate_password', select: false })
  certificatePassword?: string;

  @Column({ type: 'boolean', default: false, name: 'dgii_registered' })
  dgiiRegistered: boolean;

  @Column({ type: 'jsonb', nullable: true })
  settings?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ManyToMany(() => User, (user) => user.companies)
  users: User[];

  @OneToMany(() => Invoice, (invoice) => invoice.company)
  invoices: Invoice[];
}
