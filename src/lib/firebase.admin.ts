import 'server-only';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function createAdminApp(): App | null {
  if (getApps().length) return getApp();

  // 1. วิธีที่ 1: ตรวจสอบจาก Base64 string (แนะนำสำหรับ Vercel / Cloud Deployment)
  const rawB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (rawB64) {
    try {
      const sa = JSON.parse(Buffer.from(rawB64, 'base64').toString('utf8'));
      return initializeApp({
        credential: cert({
          projectId: sa.project_id,
          clientEmail: sa.client_email,
          privateKey: sa.private_key,
        }),
      });
    } catch (err) {
      console.warn('[firebase.admin] ล้มเหลวในการอ่าน FIREBASE_SERVICE_ACCOUNT_B64:', err);
    }
  }

  // 2. วิธีที่ 2: ตรวจสอบจาก Environment Variables แยกตัว
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } catch (err) {
      console.warn('[firebase.admin] ล้มเหลวในการเชื่อมต่อผ่าน FIREBASE_PRIVATE_KEY:', err);
    }
  }

  // 3. วิธีที่ 3: ตรวจสอบจากไฟล์ service-account.json ใน Root โฟลเดอร์ (สำหรับ Local Dev)
  const localKeyPath = path.join(process.cwd(), 'service-account.json');
  if (fs.existsSync(localKeyPath)) {
    try {
      const sa = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
      return initializeApp({
        credential: cert({
          projectId: sa.project_id,
          clientEmail: sa.client_email,
          privateKey: sa.private_key,
        }),
      });
    } catch (err) {
      console.warn('[firebase.admin] ล้มเหลวในการอ่าน service-account.json:', err);
    }
  }

  // หากไม่มี Credentials เลย จะเข้าสู่โหมด Offline/Mock Data
  return null;
}

export const adminApp: App | null = createAdminApp();
export const adminDb: Firestore | null = adminApp ? getFirestore(adminApp) : null;

if (adminDb) {
  try {
    adminDb.settings({ ignoreUndefinedProperties: true });
  } catch {
    // ป้องกัน error ใน Next.js dev server เมื่อมีการ re-evaluate โมดูล
  }
}