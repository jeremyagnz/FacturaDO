import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { parseStringPromise, Builder } from 'xml2js';

export interface DgiiSubmissionResult {
  trackingId: string;
  status: 'accepted' | 'rejected' | 'pending';
  message?: string;
  responseXml?: string;
}

export interface DgiiStatusResult {
  trackingId: string;
  status: 'accepted' | 'rejected' | 'pending' | 'processing';
  message?: string;
  ecfNumber?: string;
}

export interface DgiiRncInfo {
  rnc: string;
  name: string;
  status: string;
  category?: string;
  paymentType?: string;
}

@Injectable()
export class DgiiService {
  private readonly logger = new Logger(DgiiService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const env = this.configService.get<string>('dgii.environment', 'sandbox');
    this.baseUrl =
      env === 'production'
        ? this.configService.get<string>('dgii.productionUrl', 'https://ecf.dgii.gov.do')
        : this.configService.get<string>('dgii.sandboxUrl', 'https://ecf.dgii.gov.do/testecf');
  }

  /**
   * Submits a signed e-CF XML to DGII.
   */
  async submitECF(signedXml: string, companyRnc: string): Promise<DgiiSubmissionResult> {
    const url = `${this.baseUrl}/CertificacionApi/api/Eecf/Submit`;

    this.logger.log(`Submitting e-CF to DGII for RNC: ${companyRnc}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, signedXml, {
          headers: {
            'Content-Type': 'application/xml',
            'Accept': 'application/json',
          },
          timeout: this.configService.get<number>('dgii.timeout', 30000),
        }),
      );

      return {
        trackingId: response.data?.trackingId ?? '',
        status: response.data?.estado === 'Aceptado' ? 'accepted' : 'pending',
        message: response.data?.mensaje,
        responseXml: JSON.stringify(response.data),
      };
    } catch (error) {
      this.logger.error('DGII submission failed', error);
      throw error;
    }
  }

  /**
   * Queries the status of a previously submitted e-CF.
   */
  async checkStatus(trackingId: string): Promise<DgiiStatusResult> {
    const url = `${this.baseUrl}/CertificacionApi/api/Eecf/Status/${trackingId}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: this.configService.get<number>('dgii.timeout', 30000),
        }),
      );

      return {
        trackingId,
        status: this.mapDgiiStatus(response.data?.estado),
        message: response.data?.mensaje,
        ecfNumber: response.data?.ncf,
      };
    } catch (error) {
      this.logger.error(`DGII status check failed for tracking ID: ${trackingId}`, error);
      throw error;
    }
  }

  /**
   * Validates an RNC against the DGII registry.
   */
  async validateRnc(rnc: string): Promise<DgiiRncInfo | null> {
    const url = `${this.baseUrl}/TbComprobantes/GetContribuyentes/${rnc}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 10000,
        }),
      );

      if (!response.data) {
        return null;
      }

      return {
        rnc: response.data.rnc ?? rnc,
        name: response.data.nombre ?? '',
        status: response.data.estado ?? '',
        category: response.data.categoria,
        paymentType: response.data.regimen_de_pago,
      };
    } catch (error) {
      this.logger.warn(`RNC validation failed for: ${rnc}`, error);
      return null;
    }
  }

  /**
   * Builds an e-CF XML structure from invoice data.
   */
  buildECFXml(invoiceData: Record<string, unknown>): string {
    const builder = new Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      rootName: 'FCFE',
    });
    return builder.buildObject({ eCF: invoiceData });
  }

  /**
   * Parses a DGII XML response.
   */
  async parseXmlResponse(xml: string): Promise<Record<string, unknown>> {
    return parseStringPromise(xml, {
      explicitArray: false,
      ignoreAttrs: false,
    });
  }

  private mapDgiiStatus(
    estado: string,
  ): 'accepted' | 'rejected' | 'pending' | 'processing' {
    const statusMap: Record<string, 'accepted' | 'rejected' | 'pending' | 'processing'> = {
      Aceptado: 'accepted',
      Rechazado: 'rejected',
      Pendiente: 'pending',
      EnProceso: 'processing',
    };
    return statusMap[estado] ?? 'pending';
  }
}
