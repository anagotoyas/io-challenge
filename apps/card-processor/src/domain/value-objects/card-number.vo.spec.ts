import { CardNumber } from './card-number.vo';

describe('CardNumber', () => {
  it('genera un número de exactamente 16 dígitos', () => {
    expect(CardNumber.generate().value).toHaveLength(16);
  });

  it('siempre empieza con 4 (formato Visa)', () => {
    expect(CardNumber.generate().value.startsWith('4')).toBe(true);
  });

  it('solo contiene dígitos', () => {
    expect(CardNumber.generate().value).toMatch(/^\d{16}$/);
  });

  it('masked() oculta los primeros 12 dígitos', () => {
    expect(CardNumber.generate().masked()).toMatch(/^\*{4} \*{4} \*{4} \d{4}$/);
  });

  it('masked() expone los últimos 4 dígitos correctamente', () => {
    const cn = CardNumber.generate();
    const lastFour = cn.value.slice(-4);
    expect(cn.masked()).toBe(`**** **** **** ${lastFour}`);
  });
});
