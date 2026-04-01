import { randomUUID } from 'crypto';

function generateCardNumber(): string {
  const groups = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 9000 + 1000),
  );
  return `4${groups[0].toString().slice(1)} ${groups[1]} ${groups[2]} ${groups[3]}`;
}

function generateCvv(): string {
  return String(Math.floor(Math.random() * 900 + 100));
}

function generateExpiresAt(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 4);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${month}/${date.getFullYear()}`;
}

export function generateCardData() {
  return {
    cardId: randomUUID(),
    cardNumber: generateCardNumber(),
    cvv: generateCvv(),
    expiresAt: generateExpiresAt(),
  };
}
