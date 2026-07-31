export interface PaymentProviderSubmission {
  tenantId: string;
  amountCents: number;
  currency: string;
  channel: string;
  externalReference?: string;
}

export interface PaymentProviderResult {
  provider: string;
  status: 'pending' | 'confirmed' | 'failed';
  externalReference?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Contract reserved for future gateways. Manual payments do not invoke a
 * provider: an administrator confirms them after reviewing private evidence.
 */
export interface PaymentProvider {
  readonly name: string;
  submit(input: PaymentProviderSubmission): Promise<PaymentProviderResult>;
  getStatus(externalReference: string): Promise<PaymentProviderResult>;
  refund?(
    externalReference: string,
    amountCents: number,
    reason: string
  ): Promise<PaymentProviderResult>;
}
