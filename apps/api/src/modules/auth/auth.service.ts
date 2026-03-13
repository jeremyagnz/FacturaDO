import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from './user.entity';
import { RefreshToken } from './refresh-token.entity';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  companyIds: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: Partial<User> }> {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      status: UserStatus.PENDING,
    });
    await this.userRepository.save(user);

    const { passwordHash: _ph, ...safeUser } = user as User & { passwordHash: string };
    return { user: safeUser };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<TokenPair> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'passwordHash', 'role', 'status'],
      relations: ['companies'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.INACTIVE || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    return this.generateTokenPair(user, ipAddress, userAgent);
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<TokenPair> {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: dto.refreshToken, isRevoked: false },
      relations: ['user', 'user.companies'],
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.refreshTokenRepository.update(storedToken.id, { isRevoked: true });

    return this.generateTokenPair(storedToken.user);
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['companies'],
    });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }

  private async generateTokenPair(
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const companyIds = user.companies?.map((c) => c.id) ?? [];

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyIds,
    };

    const accessExpiresIn = this.configService.get<string>('jwt.accessExpiresIn', '15m');
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '7d');
    const expiresInSeconds = 15 * 60;

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: accessExpiresIn,
    });

    const refreshTokenValue = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: refreshExpiresIn,
      },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshToken = this.refreshTokenRepository.create({
      token: refreshTokenValue,
      expiresAt,
      userId: user.id,
      ipAddress,
      userAgent,
    });
    await this.refreshTokenRepository.save(refreshToken);

    return { accessToken, refreshToken: refreshTokenValue, expiresIn: expiresInSeconds };
  }
}
