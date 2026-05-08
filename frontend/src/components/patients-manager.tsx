"use client";

import React, { useState } from "react";
import {
  UserPlus,
  Search,
  MoreVertical,
  CheckCircle2,
  ChevronRight,
  User,
  Activity,
  Calendar,
  AlertCircle,
  Plus
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/* ── Types & Mock Data ────────────────────────────────────── */

interface Patient {
  id: string;
  name: string;
  age: number;
  image: string;
  conditions: string[];
  lastUpdate: string;
  isActive: boolean;
}

const MOCK_PATIENTS: Patient[] = [
  {
    id: "1",
    name: "Eleanor Vance",
    age: 78,
    image: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop",
    conditions: ["เบาหวานประเภทที่ 2", "ความดันโลหิตสูง"],
    lastUpdate: "10 นาทีที่แล้ว",
    isActive: true,
  },
  {
    id: "2",
    name: "คุณย่า สมศรี",
    age: 82,
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
    conditions: ["โรคหัวใจ"],
    lastUpdate: "2 ชั่วโมงที่แล้ว",
    isActive: false,
  },
  {
    id: "3",
    name: "คุณตา สมบูรณ์",
    age: 85,
    image: "",
    conditions: ["อัลไซเมอร์ระยะแรก"],
    lastUpdate: "เมื่อวานนี้",
    isActive: false,
  },
];

/* ── Components ──────────────────────────────────────────── */

function PatientCard({
  patient,
  onSelect,
  delay
}: {
  patient: Patient;
  onSelect: (id: string) => void;
  delay: number;
}) {
  return (
    <div>
      <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${patient.isActive ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
        {patient.isActive && (
          <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-bl-lg z-10 flex items-center">
            โปรไฟล์หลัก
          </div>
        )}

        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 transition-transform">
              {patient.image ? (
                <img
                  src={patient.image}
                  alt={patient.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-foreground/10 flex items-center justify-center text-foreground">
                  {patient.name?.slice(0, 2)}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">
                  {patient.name}, {patient.age}
                </h3>
                <p className="text-xs font-bold text-muted-foreground mt-0.5">
                  อัปเดตล่าสุด: {patient.lastUpdate}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {patient.conditions.map((condition) => (
                  <Badge key={condition} variant="secondary" className="status-pill text-[10px] py-0 px-2 font-bold">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator className="my-6 opacity-50" />

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={patient.isActive ? "secondary" : "outline"}
              className="py-5"
              onClick={() => onSelect(patient.id)}
              disabled={patient.isActive}
            >
              {patient.isActive ? "เลือกอยู่" : "สลับโปรไฟล์"}
            </Button>
            <Button
              variant="default"
              className="py-5"
            >
              ดูรายละเอียด
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PatientsManager() {
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [searchQuery, setSearchQuery] = useState("");

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const handleSelect = (id: string) => {
    setPatients(prev => prev.map(p => ({
      ...p,
      isActive: p.id === id
    })));
    // In a real app, this would update a global state or database
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-foreground tracking-tight">
            จัดการโปรไฟล์ผู้ป่วย
          </h1>
          <p className="text-base font-bold text-muted-foreground">
            สลับ ค้นหา หรือเพิ่มโปรไฟล์สมาชิกในครอบครัวที่ต้องการดูแล
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
              placeholder="ค้นหาชื่อผู้ป่วย..."
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
              autoFocus={isSearchExpanded}
            />
          </div>
          <Button variant="outline" size="icon" className="w-10 h-10 shrink-0">
            <Plus />
          </Button>
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPatients.map((patient, index) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onSelect={handleSelect}
            delay={200 + (index * 100)}
          />
        ))}

        {/* Empty/Add Slot */}
        <div className="animate-fade-in-up" style={{ animationDelay: `${200 + filteredPatients.length * 100}ms` }}>
          <button className="w-full h-full min-h-[160px] rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 group">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-sm font-black text-foreground">เพิ่มผู้ป่วย</p>
          </button>
        </div>
      </div>
    </div>
  );
}
