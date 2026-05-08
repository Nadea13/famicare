"use client";

import React from "react";
import Image from "next/image";
import { MessageCircle } from "lucide-react";

export default function LoginPage() {
  const lineLoginUrl = process.env.NEXT_PUBLIC_LINE_LOGIN_URL || "http://localhost:8000/auth/login";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* ── Card Container ────────────────────────────────────────── */}
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 overflow-hidden p-8 md:p-12 transition-all hover:shadow-blue-200/50">
        
        {/* ── Logo & Brand ────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-6 rotate-3 hover:rotate-0 transition-transform duration-300">
            <span className="text-4xl font-bold text-white italic">F</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            FamiCare
          </h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            ดูแลสุขภาพคนที่คุณรัก <br />
            ง่ายๆ ผ่าน LINE ของคุณ
          </p>
        </div>

        {/* ── Features List ───────────────────────────────────────── */}
        <div className="space-y-4 mb-10">
          <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-2xl">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
              📸
            </div>
            <span className="text-sm font-semibold">ถ่ายรูปสมุดสุขภาพ AI อ่านให้ทันที</span>
          </div>
          <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-2xl">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
              💊
            </div>
            <span className="text-sm font-semibold">ติดตามรายการยา ไม่ให้ลืมทาน</span>
          </div>
          <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-2xl">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
              📈
            </div>
            <span className="text-sm font-semibold">ดูความดันและน้ำหนักย้อนหลัง</span>
          </div>
        </div>

        {/* ── Login Button ────────────────────────────────────────── */}
        <a
          href={lineLoginUrl}
          className="group relative flex items-center justify-center gap-3 w-full bg-[#06C755] hover:bg-[#05b34c] text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-lg shadow-green-100 transition-all active:scale-[0.98]"
        >
          <div className="bg-white rounded-full p-1 group-hover:scale-110 transition-transform">
             <MessageCircle className="w-5 h-5 text-[#06C755]" fill="currentColor" />
          </div>
          เข้าสู่ระบบด้วย LINE
        </a>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
            Safe • Secure • Clinical Grade
          </p>
        </div>
      </div>

      {/* ── Background Decoration ────────────────────────────────── */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-50 rounded-full blur-[100px]" />
      </div>
    </div>
  );
}
