import { useEffect, useRef, useState, useCallback } from 'react';

export function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, page: null, loading: true, error: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetcherRef.current();
      setState({ data: res?.data ?? null, meta: res?.meta ?? null, page: res?.page ?? null, loading: false, error: null });
    } catch (err) {
      setState({ data: null, meta: null, page: null, loading: false, error: err?.message || 'Failed to load' });
    }

  }, []);

  useEffect(() => {
    let alive = true;
    (async () => { if (alive) await run(); })();
    return () => { alive = false; };

  }, deps);

  return { ...state, reload: run };
}

export default useApi;
