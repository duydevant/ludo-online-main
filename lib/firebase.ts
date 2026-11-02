import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, signInAnonymously } from "firebase/auth"
import { getDatabase, type Database } from "firebase/database"

/** Phải đọc từng biến NEXT_PUBLIC_* trực tiếp để Next.js inline vào bundle client. */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL)

function firebaseApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
}

export function firebaseDatabase(): Database {
  return getDatabase(firebaseApp())
}

/** Đăng nhập ẩn danh (cần bật provider Anonymous trong Firebase Console) và trả về uid. */
export async function ensureFirebaseUser(): Promise<string> {
  const auth = getAuth(firebaseApp())
  await auth.authStateReady()
  if (auth.currentUser) return auth.currentUser.uid
  const credential = await signInAnonymously(auth)
  return credential.user.uid
}
