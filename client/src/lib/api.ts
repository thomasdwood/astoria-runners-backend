import type { ApiError } from '@/types';

class ApiClient {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (res.status === 204) {
      return undefined as T;
    }

    const data = await res.json();

    if (!res.ok) {
      const error = data as ApiError;
      throw new ApiResponseError(res.status, error.error, error.details);
    }

    return data as T;
  }

  get<T>(url: string) {
    return this.request<T>(url);
  }

  post<T>(url: string, body: unknown) {
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put<T>(url: string, body: unknown) {
    return this.request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  patch<T>(url: string, body: unknown) {
    return this.request<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete(url: string) {
    return this.request<void>(url, { method: 'DELETE' });
  }
}

export class ApiResponseError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: { field: string; message: string }[]
  ) {
    super(message);
    this.name = 'ApiResponseError';
  }
}

export const api = new ApiClient();
