export async function simulateExternalCall(forceError: boolean): Promise<void> {
  const delay = Math.floor(Math.random() * 300) + 200;
  await new Promise((r) => setTimeout(r, delay));

  const shouldFail = forceError || Math.random() < 0.4;

  if (shouldFail) {
    throw new Error('Error simulado en servicio externo');
  }
}
