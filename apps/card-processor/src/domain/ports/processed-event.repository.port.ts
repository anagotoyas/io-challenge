export interface ProcessedEventRepositoryPort {
  exists(eventId: string): Promise<boolean>;
  /**
   * Guarda el eventId y ejecuta fn dentro de una misma transacción atómica.
   * Si fn lanza, el guardado del eventId también se revierte.
   */
  saveWithTransaction(eventId: string, fn: () => Promise<void>): Promise<void>;
}
