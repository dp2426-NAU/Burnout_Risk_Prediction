import { Session } from 'next-auth';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

type SessionWithTokens = Session & {
  accessToken?: string;
  refreshToken?: string;
};

export async function backendFetch<T>(
  path: string,
  session: SessionWithTokens,
  init: RequestInit = {},
): Promise<T> {
  if (!session?.accessToken) {
    throw new Error('Missing access token');
  }

  const response = await fetch(`${backendUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await safeParseError(response);
    throw new Error(message || 'Failed to fetch backend data');
  }

  return response.json() as Promise<T>;
}

async function safeParseError(response: Response): Promise<string | null> {
  try {
    const data = await response.json();
    return data?.message || null;
  } catch (error) {
    return null;
  }
}
