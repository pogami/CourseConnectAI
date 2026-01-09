import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db: admin.firestore.Firestore;

const privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
const formattedKey = privateKey.includes('\\n') ? privateKey.replace(/\\n/g, '\n') : privateKey;

const config = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: formattedKey,
  }),
};

if (getApps().length === 0) {
  const app = initializeApp(config);
  db = getFirestore(app);
} else {
  db = getFirestore();
}

export { db };


