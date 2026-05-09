"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check, Users, Shield, Heart } from "lucide-react";
import { api } from "@/lib/api";

interface InviteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string | null;
}

export function InviteMemberDialog({ isOpen, onClose, patientId }: InviteMemberDialogProps) {
  const [role, setRole] = useState("viewer");
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);

  const generateInvite = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await api.createInvite({
        patient_id: patientId,
        role: role
      });
      setInviteLink(res.line_link);
      return res.line_link;
    } catch (error) {
      console.error("Failed to generate invite:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    let link = inviteLink;
    if (!link) {
      link = await generateInvite() || "";
    }
    
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Reset link when role or patient changes
  useEffect(() => {
    setInviteLink("");
  }, [role, patientId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>เชิญสมาชิกเพิ่ม</DialogTitle>
          <DialogDescription>
            ส่งลิงก์เชิญให้สมาชิกในครอบครัวของคุณเพื่อเข้าร่วมดูแลสุขภาพร่วมกัน
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-6">
          {/* Access Rights Section */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              สิทธิ์การเข้าถึง
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-10 text-xs font-bold">
                <SelectValue placeholder="เลือกสิทธิ์การเข้าถึง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin" className="text-xs font-bold">
                  <div className="flex flex-col gap-0.5">
                    <p>ผู้ดูแล (Admin)</p>
                    <p className="text-[10px] text-muted-foreground font-medium">จัดการข้อมูลและสมาชิกได้ทั้งหมด</p>
                  </div>
                </SelectItem>
                <SelectItem value="viewer" className="text-xs font-bold">
                  <div className="flex flex-col gap-0.5">
                    <p>ผู้เข้าชม (Viewer)</p>
                    <p className="text-[10px] text-muted-foreground font-medium">ดูข้อมูลสุขภาพได้อย่างเดียว</p>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invitation Link Section */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Copy className="w-4 h-4 text-primary" />
              ลิงก์เชิญเข้าสู่ครอบครัว (LINE OA)
            </Label>
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border border-dashed border-muted-foreground/30 overflow-hidden">
              <span className="flex-1 text-[10px] truncate font-mono text-muted-foreground px-2 whitespace-nowrap overflow-hidden block">
                {loading ? "กำลังสร้างลิงก์..." : (inviteLink || "กดปุ่มเพื่อสร้างลิงก์เชิญ")}
              </span>
              <Button
                size="sm"
                onClick={handleCopyLink}
                disabled={loading || !patientId}
                className={`h-8 px-3 text-xs font-black transition-all duration-300 ${
                  copied ? "bg-green-500 hover:bg-green-600" : "bg-primary hover:bg-primary/90"
                }`}
              >
                {copied ? (
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    คัดลอกแล้ว
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5" />
                    {loading ? "กำลังสร้าง..." : "คัดลอกลิงก์"}
                  </div >
                )}
              </Button>
            </div>
            {!patientId && (
              <p className="text-[10px] text-destructive font-bold">
                * กรุณาเลือกโปรไฟล์ผู้ป่วยก่อนสร้างลิงก์เชิญ
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onClose}
          >
            ยกเลิก
          </Button>
          <Button 
            type="button"
            className="px-8 font-black"
            onClick={onClose}
          >
            เสร็จสิ้น
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
