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
  PenLine
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ── Types & Mock Data ────────────────────────────────────── */

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

const MOCK_HEALTH_LOGS: HealthLog[] = [
  { id: "1", measured_at: "2025-01-06T09:00:00", weight: 65.5, pulse: 72, bp_1_sys: 120, bp_1_dia: 80, bp_2_sys: 118, bp_2_dia: 78, symptoms: null, next_appointment: "2025-02-06" },
  { id: "2", measured_at: "2025-02-06T09:00:00", weight: 66.0, pulse: 75, bp_1_sys: 135, bp_1_dia: 85, bp_2_sys: 130, bp_2_dia: 82, symptoms: "เวียนหัวเล็กน้อย", next_appointment: "2025-03-06" },
  { id: "3", measured_at: "2025-03-06T09:00:00", weight: 64.8, pulse: 70, bp_1_sys: 115, bp_1_dia: 75, bp_2_sys: 112, bp_2_dia: 72, symptoms: null, next_appointment: "2025-05-06" },
  { id: "4", measured_at: "2025-04-06T09:00:00", weight: 65.2, pulse: 68, bp_1_sys: 125, bp_1_dia: 82, bp_2_sys: 122, bp_2_dia: 80, symptoms: null, next_appointment: "2025-05-06" },
  { id: "5", measured_at: "2025-05-06T09:00:00", weight: 65.5, pulse: 72, bp_1_sys: 138, bp_1_dia: 88, bp_2_sys: 132, bp_2_dia: 84, symptoms: null, next_appointment: "2025-08-06" },
];

const MOCK_MEDICATIONS: Medication[] = [
  { id: "1", medicine_name: "เมทฟอร์มิน - 500mg", dosage: "500mg", instruction_thai: "1 เม็ด หลังอาหารเช้า", indication: "ลดน้ำตาลในเลือด", warning: null, current_quantity: 28, unit: "เม็ด", is_active: true },
  { id: "2", medicine_name: "ลิสิโนพริล - 10mg", dosage: "10mg", instruction_thai: "1 เม็ด ก่อนนอน", indication: "ลดความดันโลหิต", warning: null, current_quantity: 30, unit: "เม็ด", is_active: true },
  { id: "3", medicine_name: "แอสไพริน - 81mg", dosage: "81mg", instruction_thai: "1 เม็ด ต่อวัน", indication: "ป้องกันลิ่มเลือด", warning: "ระคายเคืองกระเพาะอาหาร", current_quantity: 30, unit: "เม็ด", is_active: true },
  { id: "4", medicine_name: "เมทฟอร์มิน - 500mg", dosage: "500mg", instruction_thai: "1 เม็ด หลังอาหารเช้า", indication: "ลดน้ำตาลในเลือด", warning: null, current_quantity: 28, unit: "เม็ด", is_active: false },
  { id: "5", medicine_name: "ลิสิโนพริล - 10mg", dosage: "10mg", instruction_thai: "1 เม็ด ก่อนนอน", indication: "ลดความดันโลหิต", warning: null, current_quantity: 30, unit: "เม็ด", is_active: false },
  { id: "6", medicine_name: "แอสไพริน - 81mg", dosage: "81mg", instruction_thai: "1 เม็ด ต่อวัน", indication: "ป้องกันลิ่มเลือด", warning: "ระคายเคืองกระเพาะอาหาร", current_quantity: 30, unit: "เม็ด", is_active: true },
];

const MOCK_ACTIVITIES: ActivityItem[] = [
  { id: "1", type: "upload", title: "อัปโหลดรูปภาพสมุดบันทึกความดันโลหิตแล้ว", timestamp: "เมื่อวานนี้, 16:30 น.", source: "LINE" },
  { id: "2", type: "refill", title: "เติมยาแล้ว: เมทฟอร์มิน", timestamp: "15 ต.ค. 2566" },
  { id: "3", type: "appointment", title: "นัดตรวจสุขภาพครั้งต่อไป", timestamp: "15 ต.ค. 2566" },
  { id: "4", type: "alert", title: "แจ้งเตือน: ระดับความดันโลหิตสูงกว่าปกติ", timestamp: "15 ต.ค. 2566" },
  { id: "5", type: "upload", title: "อัปโหลดรูปภาพสมุดบันทึกความดันโลหิตแล้ว", timestamp: "เมื่อวานนี้, 16:30 น.", source: "LINE" },
  { id: "6", type: "upload", title: "อัปโหลดรูปภาพสมุดบันทึกความดันโลหิตแล้ว", timestamp: "เมื่อวานนี้, 16:30 น.", source: "LINE" },
  { id: "7", type: "refill", title: "เติมยาแล้ว: เมทฟอร์มิน", timestamp: "15 ต.ค. 2566" },
  { id: "8", type: "appointment", title: "นัดตรวจสุขภาพครั้งต่อไป", timestamp: "15 ต.ค. 2566" },
  { id: "9", type: "alert", title: "แจ้งเตือน: ระดับความดันโลหิตสูงกว่าปกติ", timestamp: "15 ต.ค. 2566" },
  { id: "10", type: "upload", title: "อัปโหลดรูปภาพสมุดบันทึกความดันโลหิตแล้ว", timestamp: "เมื่อวานนี้, 16:30 น.", source: "LINE" },
];

/* ── Components ──────────────────────────────────────────── */

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
      <Card className="border-0.5 rounded-lg p-6 h-full transition-all">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Icon className="w-5 h-5 stroke-[2]" />
            </div>
            {status && (
              <Badge variant="secondary" className="status-success text-xs">
                ● {status}
              </Badge>
            )}
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-foreground">{value}</span>
            <span className="text-sm font-bold text-muted-foreground">{unit}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function HealthDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div className="p-6 text-muted-foreground font-bold">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6 mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
            หน้าหลัก
          </h1>
          <p className="text-base font-bold text-muted-foreground">
            ภาพรวมข้อมูลสุขภาพและกิจกรรมของครอบครัว
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="w-10 h-10">
            <Search />
          </Button>
          <Button variant="outline" size="icon" className="w-10 h-10">
            <Bell />
          </Button>
        </div>
      </div>

      {/* Patient Profile Banner */}
      <div className="animate-fade-in-up">
        <Card className="bg-primary border-none rounded-lg overflow-hidden shadow-lg shadow-primary/15 p-6 text-white relative">
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="w-24 h-24 rounded-full overflow-hidden border-6 border-foreground/20 bg-white/10 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop"
                alt="Patient"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center md:text-left space-y-3">
              <h2 className="text-3xl font-black">Eleanor Vance, 78</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <Badge variant="secondary">
                  เบาหวานประเภทที่ 2
                </Badge>
                <Badge variant="secondary">
                  ความดันโลหิตสูง
                </Badge>
              </div>
            </div>
            <Button variant="secondary" className="p-6 text-lg">
              <PenLine className="w-5 h-5 mr-2 stroke-[2]" />
              ดูโปรไฟล์
            </Button>
          </div>
          {/* Abstract BG element */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 translate-x-1/2 pointer-events-none" />
        </Card>
      </div>

      {/* Vitals Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-black text-foreground">ภาพรวมสัญญาณชีพ</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <VitalsCard
            icon={Heart}
            label="ความดันโลหิต"
            value="120/80"
            unit="mmHg"
            status="ปกติ"
            delay={100}
          />
          <VitalsCard
            icon={Activity}
            label="อัตราการเต้นของหัวใจ"
            value="72"
            unit="BPM"
            delay={200}
          />
          <VitalsCard
            icon={Calendar}
            label="นัดหมายครั้งถัดไป"
            value="24 ต.ค. 2566"
            unit=""
            delay={300}
          />
        </div>
      </div>

      {/* Lower Grid: Medications + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medications List */}
        <div className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <Card className="bg-card overflow-hidden h-fit flex flex-col">
            <CardHeader className="p-6 bg-muted-foreground/10 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-xl font-black text-foreground">
                ยาที่กำลังรับประทาน
              </CardTitle>
              <Button variant="ghost" size="icon" className="text-secondary-foreground">
                <Plus className="w-5 h-5 stroke-[2]" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="divide-y divide-muted">
                {MOCK_MEDICATIONS.filter(med => med.is_active).map((med) => (
                  <div key={med.id} className="p-6 hover:bg-muted transition-colors flex items-center gap-6 group">
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
            <CardHeader className="p-6 bg-muted-foreground/10 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-xl font-black text-foreground">
                กิจกรรมล่าสุด
              </CardTitle>
              <Button variant="link">
                ดูทั้งหมด
              </Button>
            </CardHeader>
            <CardContent className="p-6 flex-1">
              <div className="space-y-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
                
                {MOCK_ACTIVITIES.slice(0, 5).map((activity, i) => (
                  <div key={activity.id} className="flex gap-6 relative">
                    <div className={`w-4 h-4 rounded-full border-4 border-card z-10 shadow-sm ${i === 0 ? 'bg-primary' : 'bg-border'}`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-black text-muted-foreground tracking-wider">
                        {activity.timestamp}
                      </p>
                      {activity.type === 'upload' ? (
                        <div className="bg-muted border border-border/50 rounded-md p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-md bg-card flex items-center justify-center text-muted-foreground shadow-sm">
                            <FileText className="w-5 h-5 stroke-[2]" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-foreground leading-tight">
                              {activity.title}
                            </p>
                            <p className="text-xs font-bold text-muted-foreground mt-1">
                              แหล่งที่มา: {activity.source}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm font-black text-foreground">
                          {activity.title}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
