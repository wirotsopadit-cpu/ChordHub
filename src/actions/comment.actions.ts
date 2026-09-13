'use server';

import { adminDb } from '@/lib/firebase.admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import type { Comment, AddCommentInput } from '@/types/comment';

/**
 * ดึงคอมเมนต์ทั้งหมดของเพลง และจัดกลุ่มคอมเมนต์ตอบกลับ (Threaded Replies)
 */
export async function getSongComments(songId: string): Promise<Comment[]> {
  if (!songId || !adminDb) return [];

  try {
    const snapshot = await adminDb
      .collection('comments')
      .where('songId', '==', songId)
      .get();

    if (snapshot.empty) return [];

    const allComments: Comment[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      allComments.push({
        id: doc.id,
        songId: data.songId,
        parentId: data.parentId || null,
        userId: data.userId || 'anonymous',
        userName: data.userName || 'สมาชิก ChordHub',
        userEmail: data.userEmail || '',
        userAvatar: data.userAvatar || '',
        content: data.content || '',
        likesCount: data.likesCount || 0,
        likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
        createdAt: typeof data.createdAt === 'number'
          ? data.createdAt
          : data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
      });
    });

    // แยกคอมเมนต์หลัก และการตอบกลับ
    const rootComments: Comment[] = [];
    const replyMap = new Map<string, Comment[]>();

    for (const c of allComments) {
      if (c.parentId) {
        const list = replyMap.get(c.parentId) || [];
        list.push(c);
        replyMap.set(c.parentId, list);
      } else {
        rootComments.push(c);
      }
    }

    // จัดเรียง
    // คอมเมนต์หลักเรียงจากใหม่สุดไปเก่าสุด
    rootComments.sort((a, b) => b.createdAt - a.createdAt);

    // คอมเมนต์ตอบกลับเรียงจากเก่าไปใหม่ (ตามลำดับการสนทนา)
    for (const root of rootComments) {
      const replies = replyMap.get(root.id) || [];
      replies.sort((a, b) => a.createdAt - b.createdAt);
      root.replies = replies;
    }

    return rootComments;
  } catch (err) {
    console.error('[getSongComments] Error:', err);
    return [];
  }
}

/**
 * เพิ่มความคิดเห็นใหม่ หรือตอบกลับความคิดเห็น (ต้องระบุ userId และ userName)
 */
export async function addCommentAction(
  input: AddCommentInput
): Promise<{ ok: boolean; comment?: Comment; error?: string }> {
  if (!input.userId || input.userId === 'anonymous') {
    return { ok: false, error: 'กรุณาเข้าสู่ระบบด้วยบัญชี Google ก่อนแสดงความคิดเห็น' };
  }

  if (!input.songId || !input.content?.trim()) {
    return { ok: false, error: 'กรุณากรอกข้อความแสดงความคิดเห็น' };
  }

  if (input.content.length > 1000) {
    return { ok: false, error: 'ข้อความยาวเกินไป (จำกัดไม่เกิน 1,000 ตัวอักษร)' };
  }

  if (!adminDb) {
    return { ok: false, error: 'ไม่พบการเชื่อมต่อฐานข้อมูล' };
  }

  try {
    const docRef = adminDb.collection('comments').doc();
    const now = Date.now();

    const newCommentData = {
      songId: input.songId,
      parentId: input.parentId || null,
      userId: input.userId,
      userName: input.userName.trim() || 'สมาชิก Google',
      userEmail: input.userEmail || '',
      userAvatar: input.userAvatar || '',
      content: input.content.trim(),
      likesCount: 0,
      likedBy: [],
      createdAt: now,
    };

    await docRef.set(newCommentData);

    const createdComment: Comment = {
      id: docRef.id,
      ...newCommentData,
      replies: [],
    };

    return { ok: true, comment: createdComment };
  } catch (err: any) {
    console.error('[addCommentAction] Error:', err);
    return { ok: false, error: err.message || 'เกิดข้อผิดพลาดในการบันทึกความคิดเห็น' };
  }
}

/**
 * กดถูกใจ (Like) หรือยกเลิกถูกใจคอมเมนต์
 */
export async function toggleLikeCommentAction(
  commentId: string,
  userId: string
): Promise<{ ok: boolean; liked?: boolean; likesCount?: number; error?: string }> {
  if (!userId || userId === 'anonymous') {
    return { ok: false, error: 'กรุณาเข้าสู่ระบบด้วย Google ก่อนกดถูกใจ' };
  }

  if (!commentId || !adminDb) {
    return { ok: false, error: 'ข้อมูลไม่ครบถ้วน' };
  }

  const commentRef = adminDb.collection('comments').doc(commentId);

  try {
    const result = await adminDb.runTransaction(async t => {
      const doc = await t.get(commentRef);
      if (!doc.exists) {
        throw new Error('ไม่พบความคิดเห็นนี้');
      }

      const data = doc.data()!;
      const likedBy: string[] = Array.isArray(data.likedBy) ? data.likedBy : [];
      const currentLikes: number = typeof data.likesCount === 'number' ? data.likesCount : 0;

      const hasLiked = likedBy.includes(userId);

      let newLikedBy: string[];
      let newLikesCount: number;

      if (hasLiked) {
        // ยกเลิกถูกใจ
        newLikedBy = likedBy.filter(id => id !== userId);
        newLikesCount = Math.max(0, currentLikes - 1);
      } else {
        // กดถูกใจ
        newLikedBy = [...likedBy, userId];
        newLikesCount = currentLikes + 1;
      }

      t.update(commentRef, {
        likedBy: newLikedBy,
        likesCount: newLikesCount,
      });

      return {
        liked: !hasLiked,
        likesCount: newLikesCount,
      };
    });

    return { ok: true, ...result };
  } catch (err: any) {
    console.error('[toggleLikeCommentAction] Error:', err);
    return { ok: false, error: err.message || 'ไม่สามารถทำรายการได้' };
  }
}
