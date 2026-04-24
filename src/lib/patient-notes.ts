/**
 * 跨角色共享的患者备注存储（mock，使用全局 module-level store + 简易订阅）。
 * 所有角色（医生/护士/治疗师）添加的备注都会被其他角色看到。
 */
import { useEffect, useState } from "react";

export interface PatientNote {
  id: string;
  patientId: string;
  role: "护士" | "值班医生" | "主刀医生" | "治疗师";
  author: string;
  text: string;
  category?: "通用" | "出院备注" | "康复重点" | "护理交班";
  createdAt: string;
}

const seed: PatientNote[] = [
  {
    id: "n-seed-1",
    patientId: "p8",
    role: "主刀医生",
    author: "王主任",
    text: "跟腱缝合后 4 周内严禁负重，康复按渐进性方案推进。",
    category: "康复重点",
    createdAt: "2024-04-20 09:12",
  },
  {
    id: "n-seed-2",
    patientId: "p9",
    role: "治疗师",
    author: "朱年鑫",
    text: "PCL 重建早期屈膝控制在 0-60°，避免后向应力。",
    category: "康复重点",
    createdAt: "2024-04-21 15:40",
  },
];

const store: PatientNote[] = [...seed];
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

export function getNotes(patientId: string): PatientNote[] {
  return store.filter((n) => n.patientId === patientId).sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
}

export function addNote(note: Omit<PatientNote, "id" | "createdAt"> & { createdAt?: string }) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const created =
    note.createdAt ??
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  store.unshift({
    ...note,
    createdAt: created,
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  });
  notify();
}

export function usePatientNotes(patientId: string): PatientNote[] {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((x) => x + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [patientId]);
  return getNotes(patientId);
}
