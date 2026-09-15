const requestFailure = 'Tidak dapat menghubungi server FALAH. Silakan coba lagi.';
export const bootstrapFailure = 'Gagal memuat data FALAH. Silakan muat ulang halaman.';

export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const path = url.split('?')[0];
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
  } catch {
    console.error('[FALAH API]', { path, reason: 'network_error' });
    throw new Error(requestFailure);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const diagnose = (reason: string) => console.error('[FALAH API]', {
    path, status: response.status, contentType, redirected: response.redirected, reason,
  });
  // Do not print response bodies, redirect URLs, query strings, or credentials.
  // Protection/login HTML and Vercel plain-text errors are not API payloads.
  if (response.redirected || !contentType.toLowerCase().includes('application/json')) {
    diagnose('unexpected_response');
    throw new Error(requestFailure);
  }
  let data: Record<string, unknown>;
  try {
    data = await response.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
  } catch {
    diagnose('invalid_json');
    throw new Error(requestFailure);
  }
  if (!response.ok) {
    diagnose('http_error');
    // Expected validation messages are useful; server faults remain server-side.
    throw new Error(response.status >= 400 && response.status < 500 && typeof data.error === 'string'
      ? data.error : requestFailure);
  }
  return data as T;
}
