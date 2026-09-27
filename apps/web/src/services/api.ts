import type { User } from "@orbit/types"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001"

export class ApiError extends Error {
  code: string
  status: number

  constructor(status: number, code: string, message: string) {
    super(message)
    this.code = code
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  })

  if (res.status === 204) return undefined as T

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(res.status, body?.code ?? "UNKNOWN", body?.message ?? "Something went wrong")
  }
  return body as T
}

export const api = {
  signup: (input: { name: string; email: string; password: string }) =>
    request<{ user: User }>("/auth/signup", { method: "POST", body: JSON.stringify(input) }),
  login: (input: { email: string; password: string; remember?: boolean }) =>
    request<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(input) }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<{ user: User }>("/auth/me"),
}
