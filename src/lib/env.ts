import { z } from 'zod';

const serverSchema = z
  .object({
    SPOTIFY_CLIENT_ID: z.string().min(1),
    SPOTIFY_CLIENT_SECRET: z.string().min(1),
    SPOTIFY_REDIRECT_URI: z.string().url(),
    SPOTIFY_SCOPES: z
      .string()
      .min(1)
      .default(
        [
          'user-library-read',
          'playlist-read-private',
          'playlist-read-collaborative',
          'user-top-read',
          'user-read-recently-played'
        ].join(' ')
      ),
    DATABASE_URL: z.string().url(),
    ENCRYPTION_SECRET: z.string().min(32),
    SESSION_SECRET: z.string().min(32),
    NEXT_PUBLIC_APP_URL: z.string().url(),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().email().optional()
  })
  .passthrough();

const devFallbacks = {
  SPOTIFY_CLIENT_ID: 'stub-client-id',
  SPOTIFY_CLIENT_SECRET: 'stub-client-secret',
  SPOTIFY_REDIRECT_URI: 'http://localhost:3000/api/auth/callback',
  SPOTIFY_SCOPES: [
    'user-library-read',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-top-read',
    'user-read-recently-played'
  ].join(' '),
  DATABASE_URL: 'postgresql://stub:stub@localhost:5432/spotrack',
  ENCRYPTION_SECRET: '0123456789abcdef0123456789abcdef',
  SESSION_SECRET: 'fedcba9876543210fedcba9876543210',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  RESEND_API_KEY: 'resend-test-key',
  EMAIL_FROM: 'alerts@example.com'
} as const;

const PLACEHOLDER_VALUES = new Set([
  'postgresql://USER:PASSWORD@HOST:PORT/DATABASE',
  'your-spotify-client-id',
  'your-spotify-client-secret',
  'replace-with-32-char-secret-key',
  'replace-with-32-char-session-secret'
]);

const sanitizeEnv = (rawEnv: NodeJS.ProcessEnv) =>
  Object.fromEntries(
    Object.entries(rawEnv).filter(([, value]) => {
      if (!value) {
        return false;
      }
      return !PLACEHOLDER_VALUES.has(value);
    })
  );

export type ServerEnv = z.infer<typeof serverSchema>;

let cachedEnv: ServerEnv | null = null;

export const getEnv = (): ServerEnv => {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[env] Missing environment variables detected. Falling back to stub values for local UI development.'
      );
      const sanitized = sanitizeEnv(process.env);
      cachedEnv = serverSchema.parse({
        ...devFallbacks,
        ...sanitized
      });
      return cachedEnv;
    }

    throw new Error(
      `Invalid environment variables: ${parsed.error.flatten().fieldErrors}`
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
};
