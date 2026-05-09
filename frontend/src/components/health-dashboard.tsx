"use client";

import React, { useState, useEffect } from "react";
import { 
  Heart, 
  Activity, 
  Calendar, 
  Pill, 
  ChevronRight, 
  Plus, 
  AlertCircle,
  FileText,
  Search,
  Bell,
  PenLine,
  Pencil,
  Trash2,
  Fingerprint,
  Building2,
  Stethoscope,
  History,
  Users,
  Shield,
  Loader2,
  UserPlus
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { InviteMemberDialog } from "./invite-member-dialog";

/* --- Types & Mock Data -------------------------------------- */

interface HealthLog {
  id: string;
  measured_at: string;
  weight: number;
  pulse: number;
  bp_1_sys: number;
  bp_1_dia: number;
  bp_2_sys: number;
  bp_2_dia: number;
  symptoms: string | null;
  next_appointment: string | null;
}

interface Medication {
  id: string;
  medicine_name: string;
  dosage: string;
  instruction_thai: string;
  indication: string;
  warning: string | null;
  current_quantity: number;
  unit: string;
  is_active: boolean;
}

interface ActivityItem {
  id: string;
  type: 'upload' | 'refill' | 'appointment' | 'alert';
  title: string;
  timestamp: string;
  source?: string;
}

const MOCK_MEDICATIONS: Medication[] = [
  { id: "1", medicine_name: "เมทฟอร์มิน - 500mg", dosage: "500mg", instruction_thai: "1 เม็ด หลังอาหารเช้า", indication: "ลดน้ำตาลในเลือด", warning: null, current_quantity: 28, unit: "เม็ด", is_active: true },
  { id: "2", medicine_name: "ลิสิโนพริล - 10mg", dosage: "10mg", instruction_thai: "1 เม็ด ก่อนนอน", indication: "ลดความดันโลหิต", warning: null, current_quantity: 30, unit: "เม็ด", is_active: true },
  { id: "3", medicine_name: "แอสไพริน - 81mg", dosage: "81mg", instruction_thai: "1 เม็ด ต่อวัน", indication: "ป้องกันลิ่มเลือด", warning: "ระคายเคืองกระเพาะอาหาร", current_quantity: 30, unit: "เม็ด", is_active: true },
];

const MOCK_ACTIVITIES: ActivityItem[] = [
  { id: "1", type: "upload", title: "อัปโหลดรูปภาพสมุดบันทึกความดันโลหิตแล้ว", timestamp: "เมื่อวานนี้, 16:30 น.", source: "LINE" },
  { id: "2", type: "refill", title: "เติมยาแล้ว: เมทฟอร์มิน", timestamp: "15 ต.ค. 2566" },
  { id: "3", type: "appointment", title: "นัดตรวจสุขภาพครั้งต่อไป", timestamp: "15 ต.ค. 2566" },
];

/* --- Components -------------------------------------------- */

function VitalsCard({
  icon: Icon,
  label,
  value,
  unit,
  status,
  subtext,
  delay,
}: {
  icon: any;
  label: string;
  value: string | number;
  unit: string;
  status?: string;
  subtext?: string;
  delay: number;
}) {
  return (
    <div className="animate-fade-in-up h-full" style={{ animationDelay: `${delay}ms` }}>
      <Card className="border-0.5 rounded-lg p-4 md:p-6 h-full transition-all">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-3 md:mb-6">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Icon className="w-4 h-4 md:w-5 md:h-5 stroke-[2]" />
            </div>
            {status && (
              <Badge variant="secondary" className="status-success text-[10px] md:text-xs">
                ● {status}
              </Badge>
            )}
          </div>
          <p className="text-[10px] md:text-sm font-semibold text-muted-foreground mb-1 line-clamp-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg md:text-2xl font-black text-foreground">{value}</span>
            <span className="text-[10px] md:text-sm font-bold text-muted-foreground">{unit}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function HealthDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    total_patients: 0,
    total_members: 0,
    total_logs: 0,
    active_alerts: 0,
    latest_log: null
  });
  const [patient, setPatient] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const loadMembers = async (patientId: string) => {
    setLoadingMembers(true);
    try {
      const data = await api.getMembers(patientId);
      setMembers(data);
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleOpenDetails = () => {
    if (patient) {
      setIsDetailsOpen(true);
      loadMembers(patient.id);
    }
  };

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [profileData, statsData, patientsList] = await Promise.all([
          api.getProfile(),
          api.getStats(),
          api.getPatients()
        ]);
        
        const primaryId = profileData.primary_patient_id;
        
        // Find the actual patient object for the primary ID
        let selectedPatient = null;
        if (primaryId) {
          selectedPatient = patientsList.find((p: any) => p.id === primaryId);
        }
        
        // Fallback to first patient if no primary set but list is not empty
        if (!selectedPatient && patientsList.length > 0) {
          selectedPatient = patientsList[0];
        }

        setPatient(selectedPatient);
        
        // Filter stats or re-fetch if we had a specific patient ID
        // For now we'll use the stats as-is, but prioritized for the selected patient in the next step
        setStats(statsData);
        
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const calculateAge = (dobString: string | null, birthYearOnly: boolean = false) => {
    if (!dobString) return "?";
    const birthDate = new Date(dobString);
    const today = new Date();
    
    if (birthYearOnly) {
      const years = today.getFullYear() - birthDate.getFullYear();
      return `${years} ปี`;
    }

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--;
      months += 12;
    }
    
    if (today.getDate() < birthDate.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months += 11;
      }
    }

    if (years > 0) {
      return `${years} ปี ${months > 0 ? `${months} เดือน` : ""}`;
    }
    return `${months} เดือน`;
  };

  const latestLog = stats.latest_log;
  const bpString = latestLog 
    ? `${latestLog.bp_1_sys}/${latestLog.bp_1_dia}${latestLog.bp_2_sys ? ` | ${latestLog.bp_2_sys}/${latestLog.bp_2_dia}` : ''}`
    : "ไม่มีข้อมูล";

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-muted-foreground">กำลังโหลดข้อมูลสุขภาพ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-6 mx-auto">
      {/* Page Header */}
      <div className="hidden md:flex flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
            หน้าหลัก
          </h1>
          <p className="text-base font-bold text-muted-foreground">
            ภาพรวมข้อมูลสุขภาพและกิจกรรมของครอบครัว
          </p>
        </div>
        <div className="flex items-center">
          <Button variant="outline" size="icon" className="w-10 h-10">
            <Bell />
          </Button>
        </div>
      </div>

      {/* Patient Profile Banner */}
      <div className="animate-fade-in-up">
        <Card className="bg-primary border-none rounded-lg overflow-hidden shadow-lg shadow-primary/15 p-3 md:p-6 text-white relative">
          <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
            {/* Avatar and Name/Badges Row */}
            <div className="flex items-center gap-5 flex-1">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 md:border-6 border-foreground/20 bg-white/10 shrink-0 flex items-center justify-center font-black text-xl md:text-2xl">
                {patient?.name?.slice(0, 2) || "FC"}
              </div>
              <div className="flex-1 space-y-2 md:space-y-3">
                <h2 className="text-2xl md:text-3xl font-black leading-tight">
                  {patient?.name || "ไม่พบชื่อผู้ป่วย"}{patient?.date_of_birth ? ` อายุ ${calculateAge(patient.date_of_birth, patient.birth_year_only)}` : ""}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {patient?.underlying_diseases?.length > 0 ? (
                    patient.underlying_diseases.map((disease: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-[10px] md:text-xs">
                        {disease}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="secondary" className="text-[10px] md:text-xs">ไม่มีโรคประจำตัวที่ระบุ</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* View Profile Button */}
            <Button 
              variant="secondary" 
              className="w-full md:w-auto h-12 md:h-auto p-6 text-base md:text-lg font-black shrink-0" 
              onClick={handleOpenDetails}
            >
              <PenLine className="w-5 h-5 mr-2 stroke-[2]" />
              ดูโปรไฟล์
            </Button>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 translate-x-1/2 pointer-events-none" />
        </Card>
      </div>

      {/* Vitals Section */}
      <div className="space-y-3 md:space-y-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-xl font-black text-foreground">ภาพรวมสัญญาณชีพ</h3>
          <p className="text-xs font-bold text-muted-foreground">บันทึกเมื่อ: {latestLog ? new Date(latestLog.measured_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          <VitalsCard
            icon={Heart}
            label="ความดันโลหิต"
            value={bpString}
            unit="mmHg"
            status={latestLog ? (latestLog.bp_1_sys > 140 ? "ค่อนข้างสูง" : "ปกติ") : undefined}
            delay={100}
          />
          <VitalsCard
            icon={Activity}
            label="ชีพจร"
            value={latestLog?.pulse || "-"}
            unit="BPM"
            delay={200}
          />
          <div className="col-span-2 md:col-span-1">
            <VitalsCard
              icon={Calendar}
              label="นัดหมายครั้งถัดไป"
              value={latestLog?.next_appointment ? new Date(latestLog.next_appointment).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : "ยังไม่มีนัด"}
              unit=""
              delay={300}
            />
          </div>
        </div>
      </div>

      {/* Lower Grid: Medications + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        {/* Medications List */}
        <div className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <Card className="bg-card overflow-hidden h-fit flex flex-col">
            <CardHeader className="p-3 md:p-6 bg-muted-foreground/10 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-xl font-black text-foreground">
                ยาที่กำลังรับประทาน
              </CardTitle>
              <Button variant="ghost" size="icon" className="text-secondary-foreground">
                <Plus className="w-5 h-5 stroke-[2]" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="divide-y divide-muted">
                {MOCK_MEDICATIONS.map((med) => (
                  <div key={med.id} className="p-3 md:p-6 hover:bg-muted transition-colors flex items-center gap-3 md:gap-6 group">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${med.warning ? 'bg-destructive/10 text-destructive' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
                      <Pill className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-black text-foreground truncate">
                          {med.medicine_name}
                        </h4>
                        {med.warning && (
                          <Badge variant="secondary" className="status-pill status-error border-none px-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {med.warning}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-bold text-muted-foreground">
                        {med.instruction_thai}
                      </p>
                    </div>
                    <ChevronRight className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors w-5 h-5 stroke-[2]" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <div className="animate-fade-in-up" style={{ animationDelay: "500ms" }}>
          <Card className="bg-card overflow-hidden h-fit flex flex-col">
            <CardHeader className="p-3 md:p-6 bg-muted-foreground/10 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-xl font-black text-foreground">
                กิจกรรมล่าสุด
              </CardTitle>
              <Button variant="link">
                ดูทั้งหมด
              </Button>
            </CardHeader>
            <CardContent className="p-3 md:p-6 flex-1">
              <div className="space-y-3 md:space-y-6 relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
                {MOCK_ACTIVITIES.map((activity, i) => (
                  <div key={activity.id} className="flex gap-3 md:gap-6 relative">
                    <div className={`w-4 h-4 rounded-full border-4 border-card z-10 shadow-sm ${i === 0 ? 'bg-primary' : 'bg-border'}`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-black text-muted-foreground tracking-wider">
                        {activity.timestamp}
                      </p>
                      <p className="text-sm font-black text-foreground">
                        {activity.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Patient Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
          {patient && (
            <div className="animate-in fade-in duration-300">
              {/* Profile Header */}
              <div className="relative bg-primary p-8 text-white overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-24 h-24 rounded-full border-4 border-white/30 bg-white/20 flex items-center justify-center font-black text-3xl shrink-0">
                    {patient.name?.slice(0, 2) || "FC"}
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                      <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-white">
                          {patient.name}
                        </DialogTitle>
                        <DialogDescription className="text-primary-foreground/70 font-bold">
                          ข้อมูลโปรไฟล์และสมาชิกที่ร่วมดูแล
                        </DialogDescription>
                      </DialogHeader>
                    </div>
                    <p className="text-primary-foreground font-bold opacity-90">
                      อายุ: {calculateAge(patient.date_of_birth, patient.birth_year_only)}
                    </p>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-12 translate-x-8" />
              </div>

              {/* Detailed Info */}
              <div className="p-8 space-y-8 bg-background">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Fingerprint className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-wider">เลขประจำตัวผู้ป่วย (HN)</span>
                    </div>
                    <p className="text-lg font-black text-foreground">{patient.hn_number || "ไม่ระบุ"}</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-wider">สถานพยาบาลที่ดูแล</span>
                    </div>
                    <p className="text-lg font-black text-foreground">{patient.hospital_name || "ไม่ระบุ"}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Stethoscope className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-wider">โรคประจำตัวและภาวะสุขภาพ</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {patient.underlying_diseases?.length > 0 ? (
                      patient.underlying_diseases.map((d: string) => (
                        <Badge key={d} variant="secondary" className="px-4 py-1.5 text-sm font-bold">
                          {d}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm font-bold text-muted-foreground italic">ไม่มีโรคประจำตัวระบุไว้</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Family Members Section */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-wider">สมาชิกครอบครัวที่ร่วมดูแล</span>
                    </div>
                    <Badge variant="outline" className="font-black text-[10px]">
                      {members.length} คน
                    </Badge>
                  </div>

                  {loadingMembers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {members.map((m) => {
                        const isCreator = m.relationship === "Creator";
                        return (
                          <div 
                            key={m.id} 
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all relative overflow-hidden group ${
                              isCreator 
                                ? "bg-primary/10 border-primary/20 ring-1 ring-primary/10 shadow-sm" 
                                : "bg-card/50 border-border hover:bg-card"
                            }`}
                          >
                            {isCreator && (
                              <div className="absolute top-0 right-0 bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg shadow-sm flex items-center gap-1">
                                <Shield className="w-2.5 h-2.5" />
                                ผู้สร้างโปรไฟล์
                              </div>
                            )}
                            <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 ${
                              isCreator ? "border-primary shadow-sm" : "border-border bg-muted"
                            }`}>
                              {m.picture_url ? (
                                <img src={m.picture_url} alt={m.display_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-black text-xs">
                                  {m.display_name?.slice(0, 2)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-black truncate ${isCreator ? "text-primary" : "text-foreground"}`}>
                                {m.display_name}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Shield className={`w-3 h-3 ${m.role === 'ผู้สร้าง' || m.role === 'admin' ? 'text-primary' : 'text-slate-400'}`} />
                                <span className="text-[10px] font-bold text-muted-foreground capitalize">
                                  {m.role === 'ผู้สร้าง' ? 'ผู้สร้าง' : (m.role === 'admin' ? 'ผู้ดูแล (Admin)' : 'ผู้เข้าชม (Viewer)')}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add Member Card */}
                      <button 
                        onClick={() => setIsInviteOpen(true)}
                        className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all group text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Plus className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-primary">เชิญสมาชิกเพิ่ม</p>
                          <p className="text-[10px] font-bold text-primary/60">เพิ่มคนในครอบครัว</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 bg-muted/20 border-t flex justify-end gap-3">
                <Button variant="outline" className="font-bold" onClick={() => setIsDetailsOpen(false)}>
                  ปิดหน้าต่าง
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Shared Invite Dialog */}
      <InviteMemberDialog 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        patientId={patient?.id}
      />
    </div>
  );
}
