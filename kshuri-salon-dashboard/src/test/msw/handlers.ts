import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:3001/api/v1';

export const handlers = [
  http.get(`${API_BASE}/auth/me`, () =>
    HttpResponse.json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'No token' } }, { status: 401 }),
  ),
  http.get(`${API_BASE}/business/profile`, () =>
    HttpResponse.json({ success: true, data: null }),
  ),
  http.get(`${API_BASE}/staff`, () =>
    HttpResponse.json({ success: true, data: [], meta: { total: 0 } }),
  ),
];
