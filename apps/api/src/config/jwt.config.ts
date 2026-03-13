import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET || 'change-me-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-in-production',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: process.env.JWT_ISSUER || 'facturado',
  audience: process.env.JWT_AUDIENCE || 'facturado-api',
}));
