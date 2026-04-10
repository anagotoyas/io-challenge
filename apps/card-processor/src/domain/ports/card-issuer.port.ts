export interface CardIssuerPort {
  issue(forceError: boolean): Promise<void>;
}
