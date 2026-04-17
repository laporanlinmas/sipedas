const PROXY_URL = '/api/proxy'
const CLIENT_TIMEOUT_MS = 95000 // sedikit lebih dari proxy timeout 90s

/** POST ke GAS via proxy dengan timeout AbortController */
export async function apiPost(action: string, payload: Record<string, any> = {}): Promise<any> {
  const controller = new AbortController()
  const tid = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS)
  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    })
    clearTimeout(tid)
    return await res.json()
  } catch (e: any) {
    clearTimeout(tid)
    console.error('apiPost error:', e)
    return { success: false, message: e.name === 'AbortError' ? 'Request timeout (95s).' : e.message }
  }
}

/** GET dari GAS via proxy */
export async function apiGet(action: string, params: Record<string, any> = {}): Promise<any> {
  const controller = new AbortController()
  const tid = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS)
  const query = new URLSearchParams({ action })
  Object.keys(params).forEach(k => {
    if (params[k] !== undefined && params[k] !== null) query.set(k, params[k])
  })
  try {
    const res = await fetch(`${PROXY_URL}?${query.toString()}`, {
      signal: controller.signal,
    })
    clearTimeout(tid)
    return await res.json()
  } catch (e: any) {
    clearTimeout(tid)
    console.error('apiGet error:', e)
    return { success: false, message: e.name === 'AbortError' ? 'Request timeout (95s).' : e.message }
  }
}

/**
 * Upload beberapa item secara paralel dengan batas concurrency.
 * @param items        array data yang akan diproses
 * @param worker       fungsi async yang memproses satu item (idx, item)
 * @param concurrency  jumlah maksimal request paralel (default 3)
 */
export async function parallelLimit<T, R>(
  items: T[],
  worker: (idx: number, item: T) => Promise<R>,
  concurrency = 3
): Promise<(R | Error)[]> {
  const results: (R | Error)[] = new Array(items.length)
  let nextIdx = 0

  async function runWorker() {
    while (nextIdx < items.length) {
      const idx = nextIdx++
      try {
        results[idx] = await worker(idx, items[idx])
      } catch (e: any) {
        results[idx] = e instanceof Error ? e : new Error(String(e))
      }
    }
  }

  const pool = Array.from({ length: Math.min(concurrency, items.length) }, runWorker)
  await Promise.all(pool)
  return results
}
