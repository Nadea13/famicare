"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Stethoscope,
  Calendar,
  Building2,
  Fingerprint,
  User,
  Activity,
  History,
  Pencil,
  Trash2,
  Check,
  ChevronDown,
  Users,
  Shield,
  Loader2,
  UserPlus
} from "lucide-react";
import { InviteMemberDialog } from "./invite-member-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* --- Types -------------------------------------------------- */

interface Patient {
  id: string;
  name: string;
  date_of_birth?: string;
  birth_year_only: boolean;
  image?: string;
  underlying_diseases: string[];
  lastUpdate?: string;
  isActive: boolean;
  hospital_name?: string;
  hn_number?: string;
  creator_name?: string;
}

/* --- Constants --------------------------------------------- */

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const COMMON_DISEASES = [
  "เบาหวาน",
  "ความดันโลหิตสูง",
  "ไขมันในเลือดสูง",
  "โรคหัวใจ",
  "โรคไต",
  "หอบหืด",
  "ภูมิแพ้",
  "ไทรอยด์",
  "อัมพฤกษ์/อัมพาต"
];

const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const CURRENT_YEAR_BE = new Date().getFullYear() + 543;
const YEARS_BE = Array.from({ length: 120 }, (_, i) => (CURRENT_YEAR_BE - i).toString());

/* --- Helper Functions -------------------------------------- */

const calculateAge = (dobString: string | null | undefined, birthYearOnly: boolean = false) => {
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

/* --- Components -------------------------------------------- */

function PatientCard({
  patient,
  onSelect,
  onViewDetails,
  delay
}: {
  patient: Patient;
  onSelect: (id: string) => void;
  onViewDetails: (patient: Patient) => void;
  delay: number;
}) {
  return (
    <div>
      <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${patient.isActive ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
        {patient.isActive && (
          <div className="absolute top-0 right-0 bg-primary text-white px-3 py-0.5 md:py-1 text-[10px] font-black uppercase tracking-wider rounded-bl-lg z-10 flex items-center">
            โปรไฟล์หลัก
          </div>
        )}

        <CardContent className="p-3 md:p-6">
          <div className="flex items-start gap-3 md:gap-6">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 transition-transform bg-foreground/10 flex items-center justify-center text-foreground font-black">
              {patient.image ? (
                <img
                  src={patient.image}
                  alt={patient.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                patient.name?.slice(0, 2)
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors truncate">
                  {patient.name}{patient.date_of_birth ? `, ${calculateAge(patient.date_of_birth, patient.birth_year_only)}` : ""}
                </h3>
                <p className="text-xs font-bold text-muted-foreground mt-0.5 truncate">
                  {patient.hospital_name || "ไม่ระบุโรงพยาบาล"}
                </p>
                {patient.creator_name && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-2.5 h-2.5 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      ผู้สร้าง: {patient.creator_name}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {patient.underlying_diseases?.length > 0 ? (
                  patient.underlying_diseases.map((condition) => (
                    <Badge key={condition} variant="secondary" className="status-pill text-[10px] py-0 px-2 font-bold">
                      {condition}
                    </Badge>
                  ))
                ) : (
                  <span className="text-[10px] text-muted-foreground font-bold">ไม่มีโรคประจำตัว</span>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-3 md:my-6 opacity-50" />

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={patient.isActive ? "secondary" : "outline"}
              onClick={() => onSelect(patient.id)}
              disabled={patient.isActive}
            >
              {patient.isActive ? "เลือกอยู่" : "สลับโปรไฟล์"}
            </Button>
            <Button
              variant="default"
              className="font-bold"
              onClick={() => onViewDetails(patient)}
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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedPatientForView, setSelectedPatientForView] = useState<Patient | null>(null);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    birth_day: "",
    birth_month: "",
    birth_year_be: "",
    birth_year_only: false,
    underlying_diseases: [] as string[],
    hospital_name: "",
    hn_number: ""
  });

  const [selectedPatientMembers, setSelectedPatientMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  useEffect(() => {
    async function loadMembers() {
      if (!selectedPatientForView) {
        setSelectedPatientMembers([]);
        return;
      }
      setLoadingMembers(true);
      try {
        const membersData = await api.getMembers(selectedPatientForView.id);
        // Sort so "Creator" is first
        const sorted = [...membersData].sort((a, b) => {
          if (a.relationship === "Creator") return -1;
          if (b.relationship === "Creator") return 1;
          return 0;
        });
        setSelectedPatientMembers(sorted);
      } catch (error) {
        console.error("Failed to fetch patient members:", error);
      } finally {
        setLoadingMembers(false);
      }
    }
    loadMembers();
  }, [selectedPatientForView]);

  const loadPatients = async () => {
    try {
      const [patientsData, profileData] = await Promise.all([
        api.getPatients(),
        api.getProfile()
      ]);

      const primaryId = profileData.primary_patient_id;
      
      setPatients(patientsData.map((p: any) => ({
        ...p,
        isActive: p.id === primaryId || (primaryId === null && patientsData[0]?.id === p.id)
      })));
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleSelect = async (patientId: string) => {
    try {
      await api.setPrimaryPatient(patientId);
      loadPatients();
    } catch (error) {
      console.error("Error setting primary patient:", error);
    }
  };

  const handleDelete = async (patientId: string) => {
    if (!window.confirm("คุณต้องการลบโปรไฟล์ผู้ป่วยนี้ใช่หรือไม่? ข้อมูลจะถูกเก็บไว้แต่จะไม่แสดงในหน้านี้อีก")) {
      return;
    }
    try {
      await api.deletePatient(patientId);
      loadPatients();
    } catch (error) {
      console.error("Error deleting patient:", error);
      alert("ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const openAddDialog = () => {
    setPatientToEdit(null);
    setFormData({
      name: "",
      birth_day: "",
      birth_month: "",
      birth_year_be: "",
      birth_year_only: false,
      underlying_diseases: [],
      hospital_name: "",
      hn_number: ""
    });
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (patient: Patient) => {
    setPatientToEdit(patient);
    
    let day = "";
    let month = "";
    let yearBe = "";

    if (patient.date_of_birth) {
      const parts = patient.date_of_birth.split("-");
      if (parts.length === 3) {
        day = parseInt(parts[2]).toString();
        month = parseInt(parts[1]).toString();
        yearBe = (parseInt(parts[0]) + 543).toString();
      }
    }

    setFormData({
      name: patient.name,
      birth_day: day,
      birth_month: month,
      birth_year_be: yearBe,
      birth_year_only: patient.birth_year_only || false,
      underlying_diseases: patient.underlying_diseases || [],
      hospital_name: patient.hospital_name || "",
      hn_number: patient.hn_number || ""
    });
    setSelectedPatientForView(null);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let dob = null;
      
      if (formData.birth_year_be) {
        const yearCe = parseInt(formData.birth_year_be) - 543;
        if (formData.birth_year_only) {
          dob = `${yearCe}-01-01`;
        } else if (formData.birth_day && formData.birth_month) {
          const m = formData.birth_month.padStart(2, '0');
          const d = formData.birth_day.padStart(2, '0');
          dob = `${yearCe}-${m}-${d}`;
        }
      }

      const payload = {
        name: formData.name,
        date_of_birth: dob,
        birth_year_only: formData.birth_year_only,
        underlying_diseases: formData.underlying_diseases,
        hospital_name: formData.hospital_name,
        hn_number: formData.hn_number
      };
      
      if (patientToEdit) {
        await api.updatePatient(patientToEdit.id, payload);
      } else {
        await api.createPatient(payload);
      }
      
      setIsFormDialogOpen(false);
      await loadPatients();
    } catch (error) {
      console.error("Failed to save patient:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header Section */}
      <div className="flex flex-row md:items-start justify-between gap-6">
        <div className="hidden md:block space-y-2">
          <h1 className="text-4xl font-black text-foreground tracking-tight">
            จัดการโปรไฟล์ผู้ป่วย
          </h1>
          <p className="text-base font-bold text-muted-foreground">
            สลับ ค้นหา หรือเพิ่มโปรไฟล์สมาชิกในครอบครัวที่ต้องการดูแล
          </p>
        </div>

        <div className="flex-1 md:flex-none flex items-center gap-3">
          {/* Search Input - Always visible on mobile, expandable or static on desktop */}
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้ป่วย..."
              className="w-full h-10 border border-border rounded-full pl-10 pr-4 text-sm font-medium bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button 
            onClick={openAddDialog}
            className="h-10 w-10 bg-background text-secondary-foreground border border-border rounded-full shadow-none hover:bg-muted shrink-0"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
        {filteredPatients.map((patient, index) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onSelect={handleSelect}
            onViewDetails={setSelectedPatientForView}
            delay={200 + (index * 100)}
          />
        ))}

        {/* Empty/Add Slot */}
        <div className="animate-fade-in-up" style={{ animationDelay: `${200 + filteredPatients.length * 100}ms` }}>
          <button 
            onClick={openAddDialog}
            className="w-full h-full min-h-[220px] rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 group"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-sm font-black text-foreground">เพิ่มผู้ป่วยใหม่</p>
          </button>
        </div>
      </div>

      {/* Add/Edit Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>{patientToEdit ? "แก้ไขข้อมูลผู้ป่วย" : "เพิ่มโปรไฟล์ผู้ป่วยใหม่"}</DialogTitle>
              <DialogDescription>
                {patientToEdit ? "ปรับปรุงข้อมูลพื้นฐานของผู้ป่วยให้เป็นปัจจุบัน" : "กรอกข้อมูลเบื้องต้นเพื่อเริ่มการติดตามสุขภาพ"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-3 md:gap-6 py-3 md:py-6">
              <div className="grid gap-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  ชื่อ-นามสกุล
                </Label>
                <Input
                  id="name"
                  placeholder="เช่น คุณสมชาย รักสุขภาพ"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="year_only" 
                    checked={formData.birth_year_only}
                    onCheckedChange={(checked) => setFormData({...formData, birth_year_only: !!checked})}
                  />
                  <label
                    htmlFor="year_only"
                    className="text-xs font-bold text-muted-foreground cursor-pointer"
                  >
                    รู้แค่ปีเกิด (พ.ศ.)
                  </label>
                </div>

                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    วันเกิด (พ.ศ.)
                  </Label>
                  <div className="grid grid-cols-12 gap-2">
                    {!formData.birth_year_only && (
                      <>
                        <div className="col-span-3">
                          <Select
                            value={formData.birth_day}
                            onValueChange={(val) => setFormData({...formData, birth_day: val})}
                          >
                            <SelectTrigger className="h-10 text-xs font-bold">
                              <SelectValue placeholder="วัน" />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS.map(d => (
                                <SelectItem key={d} value={d} className="text-xs font-bold">{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-5">
                          <Select
                            value={formData.birth_month}
                            onValueChange={(val) => setFormData({...formData, birth_month: val})}
                          >
                            <SelectTrigger className="h-10 text-xs font-bold">
                              <SelectValue placeholder="เดือน" />
                            </SelectTrigger>
                            <SelectContent>
                              {THAI_MONTHS.map((m, i) => (
                                <SelectItem key={m} value={(i + 1).toString()} className="text-xs font-bold">{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    <div className={formData.birth_year_only ? "col-span-12" : "col-span-4"}>
                      <Select
                        value={formData.birth_year_be}
                        onValueChange={(val) => setFormData({...formData, birth_year_be: val})}
                      >
                        <SelectTrigger className="h-10 text-xs font-black bg-primary/5 border-primary/20">
                          <SelectValue placeholder="ปี พ.ศ." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {YEARS_BE.map(y => (
                            <SelectItem key={y} value={y} className="text-xs font-black">{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="hn" className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-primary" />
                  เลขประจำตัวผู้ป่วย (HN)
                </Label>
                <Input
                  id="hn"
                  placeholder="เช่น 123456"
                  value={formData.hn_number}
                  onChange={e => setFormData({...formData, hn_number: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="hospital" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  โรงพยาบาลที่รักษาประจำ
                </Label>
                <Input
                  id="hospital"
                  placeholder="เช่น รพ.สต. ใกล้บ้าน"
                  value={formData.hospital_name}
                  onChange={e => setFormData({...formData, hospital_name: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="diseases" className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-primary" />
                  โรคประจำตัว
                </Label>
                <div className="space-y-3">
                  <Select
                    onValueChange={(val) => {
                      if (val && !formData.underlying_diseases.includes(val)) {
                        setFormData({
                          ...formData, 
                          underlying_diseases: [...formData.underlying_diseases, val]
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="h-10 text-xs font-bold">
                      <SelectValue placeholder="เลือกโรคประจำตัว..." />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_DISEASES.map(d => (
                        <SelectItem key={d} value={d} className="text-xs font-bold">{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex flex-wrap gap-2 p-3 min-h-[50px] bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20">
                    {formData.underlying_diseases.length > 0 ? (
                      formData.underlying_diseases.map(d => (
                        <Badge key={d} variant="secondary" className="pl-3 pr-1 py-1 flex items-center gap-1 font-bold group animate-in fade-in zoom-in duration-200">
                          {d}
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              underlying_diseases: formData.underlying_diseases.filter(item => item !== d)
                            })}
                            className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"
                          >
                            <Plus className="w-3 h-3 rotate-45" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-[10px] text-muted-foreground font-bold italic py-1">ยังไม่มีการระบุโรคประจำตัว</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsFormDialogOpen(false)}
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting} className="px-8 font-black">
                {isSubmitting ? "กำลังบันทึก..." : (patientToEdit ? "บันทึกการแก้ไข" : "ยืนยันการเพิ่ม")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Patient Details Dialog */}
      <Dialog open={!!selectedPatientForView} onOpenChange={(open) => !open && setSelectedPatientForView(null)}>
        <DialogContent className="sm:max-w-[600px] p-0 md:p-0 overflow-hidden border-none shadow-2xl">
          {selectedPatientForView && (
            <div className="flex flex-col">
              {/* Header with Background */}
              <div className="bg-primary p-3 md:p-6 text-white relative">
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center text-3xl font-black">
                    {selectedPatientForView.name.slice(0, 2)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <DialogHeader className="p-0 space-y-0 text-left">
                        <DialogTitle className="text-3xl font-black text-white">
                          {selectedPatientForView.name}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                          รายละเอียดข้อมูลสุขภาพของ {selectedPatientForView.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="rounded-full w-10 h-10 bg-white/20 hover:bg-white/30 border-none text-white"
                          onClick={() => openEditDialog(selectedPatientForView)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="rounded-full w-10 h-10 bg-red-500/20 hover:bg-red-500/40 border-none text-red-200"
                          onClick={() => {
                            handleDelete(selectedPatientForView.id);
                            setSelectedPatientForView(null);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-primary-foreground font-bold opacity-90">
                      อายุ: {calculateAge(selectedPatientForView.date_of_birth, selectedPatientForView.birth_year_only)}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {selectedPatientForView.isActive ? (
                        <Badge variant="secondary" className="bg-white text-primary hover:bg-white border-none font-black">
                          โปรไฟล์หลัก
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-white border-white/50 font-black">
                          สมาชิกในครอบครัว
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-12 translate-x-8" />
              </div>

              {/* Detailed Info */}
              <div className="p-3 md:p-6 space-y-3 md:space-y-6 bg-background">
                <div className="grid grid-cols-2 gap-3 md:gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Fingerprint className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-wider">เลขประจำตัวผู้ป่วย (HN)</span>
                    </div>
                    <p className="text-lg font-black text-foreground">{selectedPatientForView.hn_number || "ไม่ระบุ"}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-wider">สถานพยาบาลที่ดูแล</span>
                    </div>
                    <p className="text-lg font-black text-foreground">{selectedPatientForView.hospital_name || "ไม่ระบุ"}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Stethoscope className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-wider">โรคประจำตัวและภาวะสุขภาพ</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatientForView.underlying_diseases?.length > 0 ? (
                      selectedPatientForView.underlying_diseases.map(d => (
                        <Badge key={d} variant="secondary" className="px-4 py-1.5 text-sm font-bold">
                          {d}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm font-bold text-muted-foreground italic">ไม่มีโรคประจำตัวระบุไว้</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-6">
                  <Card className="border-none bg-muted/30 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase">สัญญาณชีพ</p>
                      <p className="text-sm font-black">ตรวจสอบล่าสุด</p>
                    </div>
                  </Card>
                  <Card className="border-none bg-muted/30 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary-foreground">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase">ประวัติการรักษา</p>
                      <p className="text-sm font-black">ดูประวัติย้อนหลัง</p>
                    </div>
                  </Card>
                </div>

                <Separator />

                {/* Family Members Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-wider">สมาชิกครอบครัวที่ร่วมดูแล</span>
                    </div>
                    <Badge variant="outline" className="font-black text-[10px]">
                      {selectedPatientMembers.length} คน
                    </Badge>
                  </div>

                  {loadingMembers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedPatientMembers.map((m) => {
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

                      {selectedPatientMembers.length === 0 && !loadingMembers && (
                        <p className="col-span-full text-center py-4 text-sm font-bold text-muted-foreground italic">
                          ยังไม่มีสมาชิกคนอื่นเข้าร่วมดูแล
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-3 md:p-6 bg-muted/20 border-t flex justify-end gap-3">
                <Button variant="outline" className="font-bold" onClick={() => setSelectedPatientForView(null)}>
                  ปิดหน้าต่าง
                </Button>
                {!selectedPatientForView.isActive && (
                  <Button 
                    className="font-black px-8"
                    onClick={() => {
                      handleSelect(selectedPatientForView.id);
                      setSelectedPatientForView(null);
                    }}
                  >
                    สลับเป็นโปรไฟล์หลัก
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invite Dialog Triggered from Patient Card */}
      <InviteMemberDialog 
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        patientId={selectedPatientForView?.id}
      />
    </div>
  );
}
