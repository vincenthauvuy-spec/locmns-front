export function normalizeEmpruntStatus(status: string): string {
  if (status === 'REFUSÉ') return 'REFUSE';
  return status;
}
