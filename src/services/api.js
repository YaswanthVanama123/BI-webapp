import axios from 'axios';
import config from '@/config';

const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('authToken');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    if (status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem('authToken');
      if (!window.location.pathname.startsWith('/login')) window.location.assign('/login');
    }
    const message = error.response?.data?.error?.message || error.response?.data?.message || error.message;
    return Promise.reject({ status, message: message || 'Request failed', original: error });
  }
);

function cleanParams(params = {}) {
  const out = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '' && v !== 'all') out[k] = v;
  }
  return out;
}

export async function get(url, params = {}) {
  return api.get(url, { params: cleanParams(params) });
}

export async function post(url, body = {}, config) {
  return api.post(url, body, config);
}

export async function patch(url, body = {}) {
  return api.patch(url, body);
}

export async function del(url) {
  return api.delete(url);
}

export async function upload(url, file, field = 'file') {
  const form = new FormData();
  form.append(field, file);
  return api.post(url, form);
}

export default { get, post, patch, del, upload };
