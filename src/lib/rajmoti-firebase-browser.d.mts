export function getRajmotiFirebase(): Promise<{
  auth: any; db: any; authSdk: any; dbSdk: any; app: any;
}>;
export function connectRajmotiGoogle(): Promise<any>;
export function disconnectRajmotiGoogle(): Promise<void>;
export function verifyRajmotiMembership(user: any): Promise<{
  ok: boolean; reason: string; uid?: string; email?: string;
}>;
export function watchRajmotiOperationalData(callbacks: {
  onSessions: (documents: Array<{id: string; data: Record<string, any>}>) => void;
  onFamilies: (documents: Array<{id: string; data: Record<string, any>}>) => void;
  onError: (error: unknown) => void;
}): Promise<() => void>;
