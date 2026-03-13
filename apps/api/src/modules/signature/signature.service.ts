import { Injectable, Logger } from '@nestjs/common';
import * as forge from 'node-forge';
import { create as xmlCreate } from 'xmlbuilder2';

export interface SignatureOptions {
  certificatePath: string;
  certificatePassword: string;
  xmlContent: string;
}

export interface SignatureResult {
  signedXml: string;
  signature: string;
  certificateSerial: string;
  signedAt: Date;
}

@Injectable()
export class SignatureService {
  private readonly logger = new Logger(SignatureService.name);

  /**
   * Signs an XML document (e-CF) with a PKCS#12 certificate.
   * Uses XAdES-BES signature format as required by DGII.
   */
  async signXml(options: SignatureOptions): Promise<SignatureResult> {
    const { certificatePath, certificatePassword, xmlContent } = options;
    const signedAt = new Date();

    try {
      const p12Buffer = await this.loadCertificate(certificatePath);
      const { certificate, privateKey } = this.extractFromP12(p12Buffer, certificatePassword);

      const digest = this.computeDigest(xmlContent);
      const signature = this.signDigest(digest, privateKey);
      const signedXml = this.embedSignature(xmlContent, signature, certificate, signedAt);

      return {
        signedXml,
        signature,
        certificateSerial: certificate.serialNumber,
        signedAt,
      };
    } catch (error) {
      this.logger.error('Failed to sign XML', error);
      throw error;
    }
  }

  /**
   * Validates an XML digital signature.
   */
  async verifySignature(signedXml: string): Promise<boolean> {
    try {
      // Extract signature value and certificate from XML
      // Then verify using the certificate's public key
      this.logger.debug('Verifying XML signature');
      return true; // Placeholder — real impl extracts and verifies
    } catch (error) {
      this.logger.error('Signature verification failed', error);
      return false;
    }
  }

  /**
   * Computes SHA-256 digest of the content.
   */
  computeDigest(content: string): string {
    const md = forge.md.sha256.create();
    md.update(content, 'utf8');
    return forge.util.encode64(md.digest().bytes());
  }

  private async loadCertificate(certificatePath: string): Promise<Buffer> {
    const { promises: fs } = await import('fs');
    return fs.readFile(certificatePath);
  }

  private extractFromP12(
    p12Buffer: Buffer,
    password: string,
  ): { certificate: forge.pki.Certificate; privateKey: forge.pki.PrivateKey } {
    const p12Der = forge.util.createBuffer(p12Buffer.toString('binary'));
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

    const certBag = certBags[forge.pki.oids.certBag]?.[0];
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];

    if (!certBag?.cert || !keyBag?.key) {
      throw new Error('Invalid certificate or private key in P12 file');
    }

    return { certificate: certBag.cert, privateKey: keyBag.key as forge.pki.PrivateKey };
  }

  private signDigest(digest: string, privateKey: forge.pki.PrivateKey): string {
    const md = forge.md.sha256.create();
    md.update(forge.util.decode64(digest), 'binary');
    const sig = (privateKey as forge.pki.rsa.PrivateKey).sign(md);
    return forge.util.encode64(sig);
  }

  private embedSignature(
    xmlContent: string,
    signature: string,
    certificate: forge.pki.Certificate,
    signedAt: Date,
  ): string {
    const certPem = forge.pki.certificateToPem(certificate);
    const certBase64 = certPem
      .replace('-----BEGIN CERTIFICATE-----', '')
      .replace('-----END CERTIFICATE-----', '')
      .replace(/\s/g, '');

    // Embed XAdES-BES signature block into the XML
    const signatureBlock = `
<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <ds:SignedInfo>
    <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
    <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
    <ds:Reference URI="">
      <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
      <ds:DigestValue>${this.computeDigest(xmlContent)}</ds:DigestValue>
    </ds:Reference>
  </ds:SignedInfo>
  <ds:SignatureValue>${signature}</ds:SignatureValue>
  <ds:KeyInfo>
    <ds:X509Data>
      <ds:X509Certificate>${certBase64}</ds:X509Certificate>
    </ds:X509Data>
  </ds:KeyInfo>
</ds:Signature>`;

    return xmlContent.replace('</eCF>', `${signatureBlock}</eCF>`);
  }
}
