import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Company, CompanyStatus } from './company.entity';
import { User, UserRole } from '../auth/user.entity';
import { CreateCompanyDto, UpdateCompanyDto, CompanyQueryDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateCompanyDto, owner: User): Promise<Company> {
    const existing = await this.companyRepository.findOne({ where: { rnc: dto.rnc } });
    if (existing) {
      throw new ConflictException('RNC already registered');
    }

    const company = this.companyRepository.create({
      ...dto,
      status: CompanyStatus.PENDING_APPROVAL,
    });
    await this.companyRepository.save(company);

    // Associate the owner with the company
    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'companies')
      .of(owner.id)
      .add(company.id);

    return company;
  }

  async findAll(query: CompanyQueryDto, user: User): Promise<{ data: Company[]; total: number }> {
    const { search, status, page = 1, limit = 20 } = query;

    const where: FindOptionsWhere<Company> = {};

    if (status) {
      where.status = status as CompanyStatus;
    }

    let qb = this.companyRepository.createQueryBuilder('company');

    if (user.role !== UserRole.SUPER_ADMIN) {
      qb = qb.innerJoin('company.users', 'user', 'user.id = :userId', { userId: user.id });
    }

    if (search) {
      qb = qb.andWhere(
        '(company.name ILIKE :search OR company.rnc ILIKE :search OR company.commercialName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb = qb.andWhere('company.status = :status', { status });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string, user: User): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      const userCompanyIds = user.companies?.map((c) => c.id) ?? [];
      if (!userCompanyIds.includes(id)) {
        throw new ForbiddenException('Access denied to this company');
      }
    }

    return company;
  }

  async update(id: string, dto: UpdateCompanyDto, user: User): Promise<Company> {
    const company = await this.findOne(id, user);
    Object.assign(company, dto);
    return this.companyRepository.save(company);
  }

  async remove(id: string, user: User): Promise<void> {
    const company = await this.findOne(id, user);
    await this.companyRepository.softDelete(company.id);
  }

  async addUser(companyId: string, userId: string, requester: User): Promise<void> {
    await this.findOne(companyId, requester);

    const targetUser = await this.userRepository.findOne({ where: { id: userId } });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'companies')
      .of(userId)
      .add(companyId);
  }

  async removeUser(companyId: string, userId: string, requester: User): Promise<void> {
    await this.findOne(companyId, requester);

    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'companies')
      .of(userId)
      .remove(companyId);
  }
}
