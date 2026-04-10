import { ExpiresAt } from './expires-at.vo';

describe('ExpiresAt', () => {
  it('tiene formato MM/YY', () => {
    expect(ExpiresAt.generate().value).toMatch(/^\d{2}\/\d{2}$/);
  });

  it('genera una fecha 4 años en el futuro', () => {
    const expectedYear = (new Date().getFullYear() + 4).toString().slice(-2);
    const [, year] = ExpiresAt.generate().value.split('/');
    expect(year).toBe(expectedYear);
  });

  it('el mes es un valor válido entre 01 y 12', () => {
    const [month] = ExpiresAt.generate().value.split('/');
    const m = Number(month);
    expect(m).toBeGreaterThanOrEqual(1);
    expect(m).toBeLessThanOrEqual(12);
  });

  it('el mes tiene siempre 2 dígitos', () => {
    const [month] = ExpiresAt.generate().value.split('/');
    expect(month).toHaveLength(2);
  });
});
