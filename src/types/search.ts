import type { Difficulty } from './song';

/** รายการเพลงแบบย่อ — ต้องเล็กที่สุดเท่าที่จะเล็กได้ */
export interface SearchItem {
    i: string;          // id
    s: string;          // slug
    t: string;          // title
    a: string;          // artist
    ai: string;         // artistId
    k: string;          // originalKey
    c: number;          // defaultCapo
    d: Difficulty;
    ch: string[];       // chordsUsed
    tg: string[];       // tags
    v: number;          // viewCount
    ts: number;         // createdAt (epoch ms)
    // ฟิลด์ normalize สำหรับค้นหา (สร้างตอน build index)
    nt: string;         // normalized title
    na: string;         // normalized artist
    al?: string;        // alias / ชื่อเรียกอื่น เช่น ชื่ออังกฤษ
}

export interface SearchIndexPayload {
    version: number;    // epoch ms ตอนสร้าง
    count: number;
    items: SearchItem[];
}