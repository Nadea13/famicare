"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, HeartPulse, CheckCircle2, AlertCircle } from "lucide-react";

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    async function processJoin() {
      if (!token) {
        setStatus("error");
        setError("ไม่พบข้อมูลการเชิญ (Missing Token)");
        return;
      }

      const authToken = localStorage.getItem("famicare_token");
      
      // 1. If not authenticated, redirect to LINE Login with invite token
      if (!authToken) {
        const loginUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/login?invite=${token}`;
        window.location.href = loginUrl;
        return;
      }

      // 2. If authenticated, try to join
      try {
        await api.joinFamily(token);
        setStatus("success");
        // Redirect to home after 3 seconds
        setTimeout(() => router.push("/home"), 3000);
      } catch (err: any) {
        console.error("Join failed:", err);
        setStatus("error");
        setError(err.message || "ไม่สามารถเข้าร่วมครอบครัวได้ กรุณาลองใหม่อีกครั้ง");
      }
    }

    processJoin();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-none overflow-hidden">
        <div className="bg-primary p-8 text-white flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-xl">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">FamiCare</h1>
        </div>

        <CardContent className="p-10">
          <div className="flex flex-col items-center text-center space-y-6">
            {status === "loading" && (
              <>
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-slate-800">กำลังตรวจสอบข้อมูล...</h2>
                  <p className="text-slate-500 font-medium">กรุณารอสักครู่ ระบบกำลังพาคุณเข้าร่วมครอบครัว</p>
                </div>
              </>
            )}

            {status === "success" && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-slate-800">เข้าร่วมสำเร็จ!</h2>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    คุณได้เข้าร่วมเป็นส่วนหนึ่งของครอบครัวเรียบร้อยแล้ว<br/>
                    กำลังพาคุณไปยังหน้าหลักใน 3 วินาที...
                  </p>
                </div>
                <Button 
                  onClick={() => router.push("/home")}
                  className="w-full font-black py-6 bg-primary"
                >
                  ไปยังหน้าหลักทันที
                </Button>
              </>
            )}

            {status === "error" && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-slate-800">เกิดข้อผิดพลาด</h2>
                  <p className="text-red-500 font-bold">{error}</p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="w-full font-bold py-6"
                >
                  กลับหน้าแรก
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    }>
      <JoinContent />
    </Suspense>
  );
}
