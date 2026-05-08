"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  MessageSquare,
  MoreVertical,
  Mail,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Trash2,
  ExternalLink,
  Search,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/* ── Types & Mock Data ────────────────────────────────────── */

interface Member {
  id: string;
  name: string;
  role: string;
  image: string;
  status: "joined" | "pending";
  isOwner?: boolean;
}

const MOCK_MEMBERS: Member[] = [
  {
    id: "1",
    name: "Nathan (คุณ)",
    role: "ผู้ดูแลหลัก (Owner)",
    image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop",
    status: "joined",
    isOwner: true,
  },
  {
    id: "2",
    name: "Sarah Connor",
    role: "ผู้ดูแลร่วม",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    status: "joined",
  },
  {
    id: "3",
    name: "James Wilson",
    role: "สมาชิกในครอบครัว",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    status: "pending",
  },
];

/* ── Components ──────────────────────────────────────────── */

function MemberCard({
  member,
  delay
}: {
  member: Member;
  delay: number;
}) {
  return (
    <div>
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-100 shrink-0">
                <img
                  src={member.image}
                  alt={member.name}
                  className={`w-full h-full object-cover ${member.status === 'pending' ? 'grayscale opacity-50' : ''}`}
                />
              </div>
              {member.status === 'joined' ? (
                <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white p-0.5 rounded-full border-2 border-white">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
              ) : (
                <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 text-white p-1 rounded-full border-2 border-white">
                  <Clock className="w-3 h-3" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-foreground truncate">
                    {member.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {member.role}
                    </Badge>
                    {member.status === 'pending' && (
                      <Badge className="text-[10px] status-warning">
                        รอการตอบรับ
                      </Badge>
                    )}
                  </div>
                </div>
                {!member.isOwner && (
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-5 opacity-50" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              {member.status === 'joined' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>สิทธิ์การเข้าถึง: ทั้งหมด</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  <span>ส่งคำเชิญเมื่อ 1 วันก่อน</span>
                </>
              )}
            </div>
            <Button variant="ghost" size="sm" className="text-primary font-bold">
              จัดการสิทธิ์
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MembersManager() {
  const [members] = useState<Member[]>(MOCK_MEMBERS);

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleInviteLine = () => {
    // Mock LINE share logic
    const shareUrl = "https://line.me/R/msg/text/?ลองใช้ FamiCare เพื่อดูแลสุขภาพคนในครอบครัวร่วมกัน: https://famicare.app/invite/abc123";
    window.open(shareUrl, '_blank');
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-foreground tracking-tight">
            จัดการสมาชิก
          </h1>
          <p className="text-base font-bold text-muted-foreground">
            ดูแลสุขภาพคนในครอบครัวร่วมกันผ่านการเชิญสมาชิกและผู้ดูแล
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className={`relative flex items-center transition-all duration-300 ease-in-out ${isSearchExpanded ? 'w-72' : 'w-10'}`}>
            <Button
              variant="outline"
              size="icon"
              className={`absolute left-0 z-10 w-10 h-10 transition-colors ${isSearchExpanded ? 'border-r-0 rounded-r-none' : ''}`}
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
            >
              <Search className="w-5 h-5" />
            </Button>
            <input
              type="text"
              placeholder="ค้นหาสมาชิก..."
              className={`
                w-full h-10 border border-border rounded-full pl-10 text-sm font-medium
                transition-all duration-300 ease-in-out
                ${isSearchExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
              `}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                if (searchQuery === "") setIsSearchExpanded(false);
              }}
            />
          </div>
          <Button variant="outline" size="icon" className="w-10 h-10 shrink-0">
            <UserPlus />
          </Button>
        </div>
      </div>

      {/* Members Grid */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMembers.map((member, index) => (
            <MemberCard
              key={member.id}
              member={member}
              delay={200 + (index * 100)}
            />
          ))}

          {/* Add Slot */}
          <div className="animate-fade-in-up" style={{ animationDelay: `${200 + members.length * 100}ms` }}>
            <button
              onClick={handleInviteLine}
              className="w-full h-full min-h-[160px] rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <UserPlus className="w-6 h-6" />
              </div>
              <p className="text-sm font-black text-foreground">เชิญสมาชิกเพิ่ม</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
