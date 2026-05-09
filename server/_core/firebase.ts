import * as admin from "firebase-admin";

let _app: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App {
  if (_app) return _app;

  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountEnv) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set");
  }

  const serviceAccount = JSON.parse(serviceAccountEnv) as admin.ServiceAccount;

  _app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return _app;
}

export async function verifyFirebaseToken(idToken: string) {
  const app = getFirebaseAdmin();
  const decoded = await admin.auth(app).verifyIdToken(idToken);
  return decoded;
}