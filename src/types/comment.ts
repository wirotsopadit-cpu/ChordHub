export interface Comment {
  id: string;
  songId: string;
  parentId?: string | null;     // ID ของคอมเมนต์แม่ ถ้าเป็นการตอบกลับ
  userId: string;               // ID ของผู้ใช้งาน (Firebase Auth UID)
  userName: string;             // ชื่อผู้แสดงความคิดเห็น
  userEmail?: string;           // อีเมล Gmail ของผู้ใช้
  userAvatar?: string;          // รูปโปรไฟล์ Google
  content: string;              // ข้อความคอมเมนต์
  likesCount: number;           // จำนวนคนที่กดถูกใจ
  likedBy: string[];            // รายชื่อ userId ที่กดถูกใจแล้ว
  createdAt: number;            // timestamp มิลลิวินาที
  replies?: Comment[];          // รายการตอบกลับ (ถ้ามี)
}

export interface AddCommentInput {
  songId: string;
  parentId?: string | null;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  content: string;
}
