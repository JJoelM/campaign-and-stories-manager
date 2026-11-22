export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  gmKey?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (gmKey) {
    headers['x-thyrenia-gm-key'] = gmKey;
  }
  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Error HTTP ${res.status}`);
  }
  return data as T;
}

export async function downloadAuthenticatedFile(
  url: string,
  fileName: string,
  gmKey?: string,
): Promise<void> {
  const headers: Record<string, string> = {};
  if (gmKey) {
    headers['x-thyrenia-gm-key'] = gmKey;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`No se pudo descargar (${res.status})`);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}
