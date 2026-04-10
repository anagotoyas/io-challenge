import { Injectable } from '@nestjs/common';
import { CardIssuerPort } from '../../domain/ports/card-issuer.port';

@Injectable()
export class ExternalCardIssuerAdapter implements CardIssuerPort {
  async issue(forceError: boolean): Promise<void> {
    const delay = Math.floor(Math.random() * 300) + 200;
    await new Promise<void>((r) => setTimeout(r, delay));

    const shouldFail = forceError || Math.random() < 0.4;

    if (shouldFail) {
      throw new Error('Error simulado en servicio externo');
    }
  }
}
