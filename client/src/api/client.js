const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function buildErrorMessage(response, data) {
  if (data?.message) {
    return data.message;
  }
  if (Array.isArray(data?.errors) && data.errors[0]?.message) {
    return data.errors[0].message;
  }
  if (response.status === 401) {
    return 'Sign-in failed. Check your email and password.';
  }
  if (response.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (response.status >= 500) {
    return 'Something went wrong on the server. Try again in a moment.';
  }
  const statusText = response.statusText ? ` (${response.status})` : '';
  return `Request failed${statusText}. Is the API running? Use npm run dev in the server folder and open http://localhost:5173.`;
}

async function parseApiResponse(response) {
  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `Unexpected response from the server (${response.status}). Check that the API is running on port 5000.`
      );
    }
  }

  if (!response.ok) {
    const message = buildErrorMessage(response, data);
    const error = new Error(message);
    error.status = response.status;
    error.details = data.errors;
    throw error;
  }

  return data;
}

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error(
      'Cannot reach the API. Start the server (npm run dev in the server folder), then use the app at http://localhost:5173 — not a file:// link or preview without the API.'
    );
  }

  return parseApiResponse(response);
}

export async function apiFormRequest(path, { method = 'POST', body, token } = {}) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body
    });
  } catch {
    throw new Error(
      'Cannot reach the API. Start the server (npm run dev in the server folder), then use the app at http://localhost:5173 — not a file:// link or preview without the API.'
    );
  }

  return parseApiResponse(response);
}

export async function apiBlobRequest(path, { token } = {}) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { headers });
  } catch {
    throw new Error('Cannot reach the API.');
  }

  if (!response.ok) {
    return parseApiResponse(response);
  }

  return response.blob();
}
