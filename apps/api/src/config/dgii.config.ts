import { registerAs } from '@nestjs/config';

export default registerAs('dgii', () => ({
  environment: (process.env.DGII_ENV || 'sandbox') as 'sandbox' | 'production',
  sandboxUrl: process.env.DGII_SANDBOX_URL || 'https://ecf.dgii.gov.do/testecf',
  productionUrl: process.env.DGII_PRODUCTION_URL || 'https://ecf.dgii.gov.do',
  timeout: parseInt(process.env.DGII_TIMEOUT || '30000', 10),
  retries: parseInt(process.env.DGII_RETRIES || '3', 10),
  certificatePath: process.env.DGII_CERT_PATH || '',
  certificatePassword: process.env.DGII_CERT_PASSWORD || '',
}));
