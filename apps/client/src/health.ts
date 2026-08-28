export async function loadHealth(
  getHealth: () => Promise<{ data?: { status: 'ok' }; error?: unknown }>,
): Promise<'ok' | 'error'> {
  const { data } = await getHealth();
  return data?.status === 'ok' ? 'ok' : 'error';
}
