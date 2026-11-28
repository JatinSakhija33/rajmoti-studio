/**
 * Firebase Web App configuration for Rajmoti Studio.
 * The Web App values are PUBLIC identifiers; operational data access must
 * still be authorized by Firebase Auth and the named database's Rules.
 * Do not import firebase/analytics into TanStack Start's server runtime.
 */
export const FIREBASE_PROJECT_ID = "rajmoti-os";
export const FIREBASE_AUTH_DOMAIN = "rajmoti-os.firebaseapp.com";
export const FIREBASE_STORAGE_BUCKET = "rajmoti-os.firebasestorage.app";
export const FIREBASE_MESSAGING_SENDER_ID = "350182272734";
export const FIREBASE_WEB_APP_ID = "1:350182272734:web:93629d267be9b686f8dc4f";
export const FIREBASE_DATABASE_ID = "ai-studio-rajmotistudioai-72e2debd-055c-4ab8-a5ef-f9c759cebfaf";

export function firebaseWebConfigFromEnv(env) {
  const apiKey = env?.VITE_FIREBASE_API_KEY;
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    throw new Error("Missing VITE_FIREBASE_API_KEY: configure Firebase Web app in Cloudflare.");
  }
  if (env?.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_PROJECT_ID !== FIREBASE_PROJECT_ID) {
    throw new Error("Firebase project mismatch: refusing to connect to the wrong project.");
  }
  return {
    apiKey,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    appId: FIREBASE_WEB_APP_ID,
  };
}
