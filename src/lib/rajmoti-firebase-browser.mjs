/**
 * Browser-only Firebase client for Rajmoti OS.
 *
 * Uses Google's supported version-pinned modular browser distribution.
 * No Firebase Admin credentials are used or shipped to the browser.
 * Replace CDN imports with npm Firebase imports when the dependency lockfile
 * is regenerated in an environment with npm registry access.
 */
import { FIREBASE_DATABASE_ID, firebaseWebConfigFromEnv } from "./rajmoti-firebase-web-config.mjs";

const CDN = "https://www.gstatic.com/firebasejs/12.18.0";
let pending;

export async function getRajmotiFirebase() {
  if (typeof window === "undefined") throw new Error("Firebase login is available in the browser only.");
  if (!pending) pending = initialize().catch(error => { pending = undefined; throw error; });
  return pending;
}

async function initialize() {
  const [appSdk, authSdk, dbSdk] = await Promise.all([
    import(/* @vite-ignore */ `${CDN}/firebase-app.js`),
    import(/* @vite-ignore */ `${CDN}/firebase-auth.js`),
    import(/* @vite-ignore */ `${CDN}/firebase-firestore.js`),
  ]);
  // The supplied Firebase apiKey is an ordinary public Web SDK config value,
  // not a privileged service-account credential.
  const config = firebaseWebConfigFromEnv({
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDckkH4YjspBJ6b4ZVLJ3LEI2FQq0Vtci4",
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rajmoti-os",
  });
  const name = "rajmoti-os-web";
  const app = appSdk.getApps().find(value => value.name === name) || appSdk.initializeApp(config, name);
  const auth = authSdk.getAuth(app);
  const db = dbSdk.getFirestore(app, FIREBASE_DATABASE_ID);
  return {app, auth, db, authSdk, dbSdk};
}

export async function connectRajmotiGoogle() {
  const {auth, authSdk} = await getRajmotiFirebase();
  const provider = new authSdk.GoogleAuthProvider();
  provider.setCustomParameters({prompt:"select_account"});
  await authSdk.signInWithPopup(auth, provider);
  return auth.currentUser;
}

export async function disconnectRajmotiGoogle() {
  const {auth, authSdk} = await getRajmotiFirebase();
  await authSdk.signOut(auth);
}

export async function verifyRajmotiMembership(user) {
  if (!user?.uid) return {ok:false, reason:"Sign in to Firebase first."};
  const {db, dbSdk} = await getRajmotiFirebase();
  const member = await dbSdk.getDoc(dbSdk.doc(db, "studios", "rajmoti_studio", "members", user.uid));
  if (!member.exists()) return {ok:false, reason:"No studio membership found for this Firebase account."};
  const role = member.data()?.role;
  const active = member.data()?.active;
  if (role !== "ADMIN" || active !== true)
    return {ok:false, reason:"This Firebase account has no active ADMIN membership."};
  return {ok:true, uid:user.uid, email:user.email || "", reason:"Existing active ADMIN membership verified."};
}

export async function watchRajmotiOperationalData(callbacks) {
  const {db, dbSdk} = await getRajmotiFirebase();
  const unsubscribers = [];
  const make = (collectionName, callback) => {
    // Scoped to canonical studio only. Cap live read costs until pagination lands.
    const ref = dbSdk.query(
      dbSdk.collection(db, "studios", "rajmoti_studio", collectionName),
      dbSdk.limit(300)
    );
    const stop = dbSdk.onSnapshot(ref,
      snapshot => callback(snapshot.docs.map(doc => ({id:doc.id,data:doc.data()}))),
      error => callbacks.onError(error));
    unsubscribers.push(stop);
  };
  try {
    make("sessions", callbacks.onSessions);
    make("families", callbacks.onFamilies);
  } catch (error) {
    unsubscribers.forEach(stop => stop());
    throw error;
  }
  return () => unsubscribers.forEach(stop => stop());
}
