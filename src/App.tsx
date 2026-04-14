/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Button } from "./components/ui/button";
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";
import { Textarea } from "./components/ui/textarea";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "./components/ui/table";
import {
  Search,
  Camera,
  Upload,
  X,
  Lock,
  Loader2,
  CheckCircle2,
  Users,
  GraduationCap,
  Briefcase,
  ChevronRight,
  ArrowRight,
  Building2,
  Building,
  Phone,
  User
} from "lucide-react";

const ENTITY_ID = "64b77babcc3c21610787b060";
const SESSION = "2026-27";

// Wisdom World School Color Palette
const PRIMARY_GREEN = "#0f4a25"; // Deep Forest Green

function LoginScreen({ onLoginSuccess }: { onLoginSuccess: (token: string) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState("");

  const handleAutoLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("https://admission-api.odpay.in/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: "1211111111", password: "testuser" }),
      });
      const data = await response.json();
      if (data.token) onLoginSuccess(data.token);
      else setError(data.message || "Login failed. Please try again.");
    } catch (err) { setError("An error occurred during login. Please try again."); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Modern Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[45vh] bg-gradient-to-b from-[#0f4a25] to-[#146031] -skew-y-2 transform origin-top-left -translate-y-12 shadow-2xl"></div>

      <Card className="w-full max-w-md border-0 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] bg-white/95 backdrop-blur-xl animate-in zoom-in-95 text-center p-8 rounded-[2rem] relative z-10 mt-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-[#dbb13b] rounded-b-full"></div>
        <CardHeader className="space-y-6 pb-10">
          <div className="flex justify-center items-center">
            <div className="p-3 bg-white rounded-2xl shadow-2xl border border-slate-100 ring-8 ring-slate-100/50 -mt-20 flex items-center justify-center">
              <img src="/wws.jpeg" alt="Wisdom Logo" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <div className="space-y-3">
            <CardTitle className="text-4xl font-extrabold tracking-tight text-[#0f4a25]">Front Desk</CardTitle>
            <CardDescription className="text-slate-500 font-medium text-lg leading-snug">Secure Campus & Visitor<br />Management System</CardDescription>
            <p className="text-sm font-medium text-[#0f4a25]">Developed by Okie Dokie</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <Button onClick={handleAutoLogin} className="w-full h-14 text-white text-lg font-bold transition-all shadow-xl hover:shadow-[#0f4a25]/20 hover:scale-[1.02] active:scale-95 rounded-xl bg-[#0f4a25] hover:bg-[#146031]" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <span className="flex items-center gap-2">Access Dashboard <ArrowRight className="w-5 h-5" /></span>}
          </Button>


        </CardContent>
      </Card>

      {/* Decorative Orbs */}
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-[#dbb13b]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 right-20 w-96 h-96 bg-[#0f4a25]/5 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
}

// Helper to extract Google Drive File ID
const extractFileId = (url: string | null | undefined) => {
  if (!url || typeof url !== 'string') return null;
  
  // 1. Google Drive URLs (/d/ID or ?id=ID)
  const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch) return driveMatch[1];
  
  // 2. Identity proxy URLs (extract ID from segment after /image-proxy/)
  if (url.includes('image-proxy/')) {
    return url.split('image-proxy/').pop()?.split(/[?#]/)[0] || null;
  }
  
  // 3. Full URL but no Drive/Proxy markers - could be a direct ID if short and no special chars
  if (url.length > 20 && !url.includes('/') && !url.includes('.')) return url;
  
  return null;
};

// Map Drive ID to high-speed CDN URL (lh3 is significantly faster than the proxy)
const getImageUrl = (fileId: string | null) => {
  if (!fileId) return null;
  // Using Google's direct CDN endpoint with a 400px size limit for instant loading
  return `https://lh3.googleusercontent.com/d/${fileId}=s400`;
};

function VisitorDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [formData, setFormData] = useState({
    name: "", mobile: "", address: "", organizationName: "", toMeet: "", toMeetType: "employee", date: new Date().toISOString(), regarding: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [visitors, setVisitors] = useState<any[]>([]);
  const [isLoadingVisitors, setIsLoadingVisitors] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [visitorPhoto, setVisitorPhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchVisitors = async () => {
    setIsLoadingVisitors(true);
    try {
      const response = await fetch(`https://others-api.odpay.in/api/list/visitor?entity=${ENTITY_ID}`, {
        headers: { "Authorization": token },
      });
      const data = await response.json();
      if (Array.isArray(data)) setVisitors(data.reverse());
    } catch (err) { console.error("Failed to fetch visitors", err); }
    finally { setIsLoadingVisitors(false); }
  };

  const fetchAllStudents = async () => {
    if (allStudents.length > 0) return;
    
    // Check localStorage cache first
    const cached = localStorage.getItem(`students_${ENTITY_ID}`);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 3600000) { // 1 hour cache
          setAllStudents(data);
          return;
        }
      } catch (e) { localStorage.removeItem(`students_${ENTITY_ID}`); }
    }

    setIsFetchingData(true);
    try {
      const response = await fetch("https://others-api.odpay.in/api/list/student", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify({ entity: ENTITY_ID, session: SESSION }),
      });
      const result = await response.json();
      const students = result.data || [];
      setAllStudents(students);
      // Cache the result
      localStorage.setItem(`students_${ENTITY_ID}`, JSON.stringify({ data: students, timestamp: Date.now() }));
    } finally { setIsFetchingData(false); }
  };

  const fetchAllEmployees = async () => {
    if (allEmployees.length > 0) return;

    // Check localStorage cache first
    const cached = localStorage.getItem(`employees_${ENTITY_ID}`);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 3600000) {
          setAllEmployees(data);
          return;
        }
      } catch (e) { localStorage.removeItem(`employees_${ENTITY_ID}`); }
    }

    setIsFetchingData(true);
    try {
      const response = await fetch(`https://others-api.odpay.in/api/list/Employee?entity=${ENTITY_ID}&showInactive=true`, {
        headers: { "Authorization": token },
      });
      const result = await response.json();
      const employees = Array.isArray(result) ? result : [];
      setAllEmployees(employees);
      // Cache the result
      localStorage.setItem(`employees_${ENTITY_ID}`, JSON.stringify({ data: employees, timestamp: Date.now() }));
    } finally { setIsFetchingData(false); }
  };

  useEffect(() => {
    if (searchQuery.length >= 1) {
      setShowDropdown(true);
      const query = searchQuery.toLowerCase();
      if (formData.toMeetType === "student") {
        if (allStudents.length === 0 && !isFetchingData) fetchAllStudents();
        setSearchResults(allStudents.filter((s: any) => s.name?.toLowerCase().includes(query) || s.phone?.includes(query) || s.regNo?.toLowerCase().includes(query)).slice(0, 15));
      } else if (formData.toMeetType === "employee") {
        if (allEmployees.length === 0 && !isFetchingData) fetchAllEmployees();
        setSearchResults(allEmployees.filter((e: any) => e.name?.toLowerCase().includes(query) || e.mobile?.includes(query) || e.employeeId?.toLowerCase().includes(query)).slice(0, 15));
      }
    } else { setShowDropdown(false); }
  }, [searchQuery, allStudents, allEmployees, formData.toMeetType]);

  useEffect(() => {
    fetchVisitors();
    const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const updateWithLiveData = (liveData: any, targetRegNo: string, profile: any) => {
    if (!liveData) return;
    
    setSelectedProfile((prev: any) => {
      // Guard: Only update if the user hasn't switched to a different student in the meantime
      if (prev?.regNo !== targetRegNo) return prev;

      const findPhoto = (keyBase: string, profileKey: string) => {
        return extractFileId(
          liveData[`${keyBase}'s Photograph`] || 
          liveData[`${keyBase}'s Photo`] || 
          liveData[`${keyBase}Photo`] || 
          liveData[`${keyBase}Photograph`] ||
          profile[`${keyBase}'s Photograph`] ||
          profile[`${keyBase}'s Photo`] ||
          profile[`${keyBase}Photo`] ||
          profile[profileKey]
        );
      };

      return {
        ...prev,
        ...liveData,
        photos: {
          apiPhoto: extractFileId(profile.photo),
          student: extractFileId(liveData["Student's Photograph"] || liveData.studentPhoto || liveData.studentPhotograph || profile["Student's Photograph"] || profile.studentPhoto || profile.photo),
          father: findPhoto("Father", "fatherPhoto"),
          mother: findPhoto("Mother", "motherPhoto"),
          guardian: findPhoto("Guardian", "guardianPhoto"),
          grandfather: findPhoto("Grandfather", "grandfatherPhoto"),
          grandmother: findPhoto("Grandmother", "grandmotherPhoto"),
          sibling1: extractFileId(liveData["Sibling-1 Photograph (Real brother/sister)"] || liveData.sibling1Photo || profile["Sibling-1 Photograph (Real brother/sister)"] || profile.sibling1Photo),
          sibling2: extractFileId(liveData["Sibling-2 Photograph (Real brother/sister)"] || liveData.sibling2Photo || profile["Sibling-2 Photograph (Real brother/sister)"] || profile.sibling2Photo),
        }
      };
    });
  };

  const selectProfile = async (profile: any) => {
    // Immediately extract all photos present in the student list data
    const initialPhotos = {
      apiPhoto: extractFileId(profile.photo),
      student: extractFileId(profile["Student's Photograph"] || profile.studentPhoto || profile.studentPhotograph || profile.photo),
      father: extractFileId(profile["Father's Photograph"] || profile.fatherPhoto || profile.fatherPhotograph),
      mother: extractFileId(profile["Mother's Photograph"] || profile.motherPhoto || profile.motherPhotograph),
      guardian: extractFileId(profile["Guardian's Photo"] || profile.guardianPhoto),
      grandfather: extractFileId(profile["Grandfather's Photograph"] || profile.grandfatherPhoto),
      grandmother: extractFileId(profile["Grandmother's Photograph"] || profile.grandmotherPhoto),
      sibling1: extractFileId(profile["Sibling-1 Photograph (Real brother/sister)"] || profile.sibling1Photo),
      sibling2: extractFileId(profile["Sibling-2 Photograph (Real brother/sister)"] || profile.sibling2Photo),
    };
    setSelectedProfile({ ...profile, photos: initialPhotos });

    setFormData(prev => ({ ...prev, toMeet: profile.name }));
    setShowDropdown(false);
    setSearchQuery("");

    if (formData.toMeetType === "student") {
      setIsRefreshingProfile(true);
      const targetRegNo = profile.regNo;
      try {
        const fullScholarId = profile.regNo?.trim();
        const scholarId = fullScholarId?.split('/')[0]; // Send only the part before the slash (e.g., 3947)

        const response = await fetch(`https://student-image-finder.onrender.com/student/${scholarId}`);

        if (response.ok) {
          const liveData = await response.json();
          updateWithLiveData(liveData, targetRegNo, profile);
        }
      } catch (err) {
        console.error("Failed to sync live student data", err);
      } finally {
        setIsRefreshingProfile(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setVisitorPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsCameraOpen(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(videoRef.current, 0, 0);
      setVisitorPhoto(canvas.toDataURL("image/jpeg"));
      stopCamera();
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsCameraOpen(false);
  };

  const handleAddVisitor = async () => {
    setIsSubmitting(true);
    setSubmitStatus("idle");
    const payload = { ...formData, visitorPhoto, role: [], qualifications: [], workExperience: [], entity: ENTITY_ID };
    try {
      const response = await fetch("https://others-api.odpay.in/api/add/visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.status) {
        setSubmitStatus("success");
        setVisitorPhoto(null);
        fetchVisitors();
        setTimeout(() => {
          setFormData({ name: "", mobile: "", address: "", organizationName: "", toMeet: "", toMeetType: "employee", date: new Date().toISOString(), regarding: "" });
          setSelectedProfile(null);
          setSubmitStatus("idle");
        }, 2000);
      } else { setSubmitStatus("error"); }
    } catch (err) { setSubmitStatus("error"); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-[#0f4a25]/20 pb-20">
      {/* Camera Modal Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-slate-900 border-none overflow-hidden shadow-2xl animate-in zoom-in-95 rounded-3xl">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-950">
              <h3 className="text-white font-black uppercase tracking-widest text-[11px] flex items-center gap-2"><Camera className="w-4 h-4 text-[#dbb13b]" /> Capture Photo</h3>
              <Button variant="ghost" size="icon" onClick={stopCamera} className="text-slate-400 hover:text-white rounded-full"><X className="w-5 h-5" /></Button>
            </div>
            <div className="aspect-video bg-black relative">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover mirror" />
              <div className="absolute inset-0 border-[24px] border-black/40 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-80 border-2 border-dashed border-[#dbb13b]/80 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
              </div>
            </div>
            <div className="p-8 flex justify-center bg-slate-950">
              <Button onClick={takePhoto} className="h-16 w-16 rounded-full bg-white hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center group">
                <div className="h-12 w-12 rounded-full border-[5px] border-slate-950 flex items-center justify-center group-active:scale-90 transition-all" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-[#0f4a25] pt-10 pb-36 px-6 lg:px-12 rounded-b-[3rem] shadow-xl relative z-0 overflow-hidden">
        {/* Subtle patterned background for header */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/always-grey.png')] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-2 border-4 border-white/20 bg-white rounded-2xl shadow-2xl backdrop-blur-sm">
              <img src="/wws.jpeg" alt="Wisdom Logo" className="w-16 h-16 object-contain" />
            </div>
            <div className="text-white">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
                Front Desk <span className="text-[#dbb13b] text-2xl">/</span> <span className="font-light text-emerald-100">Visitor</span>
              </h1>
              <p className="text-emerald-200/80 text-sm font-medium tracking-wide mt-1">Wisdom World School - Kurukshetra</p>
              <p className="text-sm font-medium text-white mt-1">Developed by Okie Dokie</p>
            </div>
          </div>

          <Button variant="ghost" onClick={onLogout} className="text-white hover:text-white hover:bg-rose-500/80 font-bold text-xs uppercase tracking-widest transition-all rounded-xl h-10 px-5 bg-black/20 backdrop-blur-xl border border-white/10 shadow-inner">
            <Lock className="w-4 h-4 mr-2 text-[#dbb13b]" /> Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 -mt-24 z-10 relative grid grid-cols-1 gap-8">

        {/* Main Interface */}
        <div className="space-y-8">
          {/* Top Toggle & Search - Made highly visible */}
          <Card className="border-0 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-visible bg-white relative rounded-3xl mx-auto w-full z-50 ring-1 ring-slate-100 p-2">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col xl:flex-row items-center gap-8">

                {/* Meeting Type Toggle - Redesigned to be massive and clear */}
                <div className="w-full xl:w-[400px] shrink-0 space-y-4">
                  <Label className="text-xs font-black uppercase tracking-widest text-[#0f4a25] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#dbb13b]" /> I am here to meet
                  </Label>
                  <RadioGroup
                    value={formData.toMeetType}
                    onValueChange={(val) => { setFormData(prev => ({ ...prev, toMeetType: val })); setSelectedProfile(null); setSearchQuery(""); }}
                    className="flex p-1.5 bg-slate-100/80 rounded-2xl w-full border border-slate-200/60"
                  >
                    {['employee', 'student', 'other'].map((type) => (
                      <div key={type} className="flex-1">
                        <label className={`flex items-center justify-center py-3.5 px-2 rounded-xl cursor-pointer transition-all font-bold text-sm uppercase tracking-wider ${formData.toMeetType === type ? 'bg-white shadow-[0_8px_16px_-6px_rgba(0,0,0,0.1)] text-[#0f4a25] ring-1 ring-slate-200/50 scale-[1.02]' : 'text-slate-500 hover:text-[#0f4a25] hover:bg-slate-200/50'}`}>
                          <RadioGroupItem value={type} className="sr-only" />
                          {type}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Divider */}
                <div className="hidden xl:block w-px h-20 bg-slate-100"></div>

                {/* Live Lookup Search */}
                <div className="flex-1 w-full space-y-4" ref={dropdownRef}>
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#dbb13b]" /> Quick Search Profile
                  </Label>
                  <div className="relative group">
                    <Input
                      placeholder={`Search ${formData.toMeetType} by name, phone or ID...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-16 pl-14 pr-6 border-2 border-slate-100 bg-slate-50/50 rounded-2xl focus-visible:ring-4 focus-visible:ring-[#0f4a25]/10 focus-visible:border-[#0f4a25] focus-visible:bg-white transition-all font-bold text-lg text-slate-700 shadow-sm placeholder:font-medium placeholder:text-slate-400"
                    />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-[#0f4a25] transition-colors" />

                    {showDropdown && (
                      <Card className="absolute top-[calc(100%+0.5rem)] left-0 right-0 z-[100] border-0 shadow-2xl rounded-2xl overflow-hidden max-h-80 bg-white animate-in fade-in slide-in-from-top-2 ring-1 ring-slate-100">
                        <div className="divide-y divide-slate-50">
                          {isFetchingData && searchResults.length === 0 ? (
                            <div className="p-10 flex flex-col items-center gap-3 text-slate-400 font-bold uppercase tracking-widest text-xs">
                              <Loader2 className="w-8 h-8 animate-spin text-[#0f4a25]" /> LOADING DIRECTORY...
                            </div>
                          ) : searchResults.length === 0 ? (
                            <div className="p-10 text-center flex flex-col items-center gap-3 text-slate-400">
                              <Building2 className="w-10 h-10 text-slate-200" />
                              <span className="font-semibold text-sm">No matches found for "{searchQuery}"</span>
                            </div>
                          ) : (
                            searchResults.map((profile) => (
                              <button key={profile._id} onClick={() => selectProfile(profile)} className="w-full px-6 py-4 flex items-center gap-5 text-left hover:bg-[#eaf1ec] transition-colors group">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-black text-lg border border-slate-200 uppercase text-[#0f4a25] group-hover:bg-white group-hover:shadow-sm transition-all overflow-hidden">
                                  {profile.photo ? (
                                    <img src={getImageUrl(extractFileId(profile.photo))!} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    profile.name?.[0]
                                  )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <div className="text-base font-black text-slate-800 truncate group-hover:text-[#0f4a25] transition-colors">{profile.name}</div>
                                  <div className="text-xs text-slate-500 font-bold uppercase tracking-tight truncate mt-0.5">
                                    {formData.toMeetType === 'student' ? `${profile.regNo} • ${profile.course}` : `${profile.employeeId} • ${profile.department}`}
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 group-hover:text-[#0f4a25] transition-all" />
                              </button>
                            ))
                          )}
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Card & Form Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Form Fields */}
            <Card className="lg:col-span-2 border-0 shadow-xl bg-white rounded-3xl ring-1 ring-slate-100 overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-[#0f4a25] via-[#146031] to-[#dbb13b]"></div>
              <CardContent className="p-8 md:p-10">
                <div className="mb-10 flex items-center gap-4">
                  <div className="bg-[#eaf1ec] p-3 rounded-2xl text-[#0f4a25]"><Briefcase className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-2xl font-black text-[#0f4a25]">Visitor Details</h3>
                    <p className="text-slate-500 text-sm font-medium mt-1">Please provide accurate information for the visitor pass.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase text-[#0f4a25] tracking-wider">Visitor Name (Outdoor Person)</Label>
                    <Input id="name" placeholder="E.g. John Doe" value={formData.name} onChange={handleInputChange} className="h-14 border-2 border-slate-200 rounded-xl px-4 bg-slate-50 focus-visible:bg-white focus-visible:border-[#0f4a25] focus-visible:ring-4 focus-visible:ring-[#0f4a25]/10 font-bold text-slate-800 text-base shadow-sm transition-all outline-none" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase text-[#0f4a25] tracking-wider">Mobile Number</Label>
                    <Input id="mobile" placeholder="E.g. +91 9876543210" value={formData.mobile} onChange={handleInputChange} className="h-14 border-2 border-slate-200 rounded-xl px-4 bg-slate-50 focus-visible:bg-white focus-visible:border-[#0f4a25] focus-visible:ring-4 focus-visible:ring-[#0f4a25]/10 font-bold text-slate-800 text-base shadow-sm transition-all outline-none" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase text-[#0f4a25] tracking-wider">Organization / Company</Label>
                    <Input id="organizationName" placeholder="E.g. Acme Corp" value={formData.organizationName} onChange={handleInputChange} className="h-14 border-2 border-slate-200 rounded-xl px-4 bg-slate-50 focus-visible:bg-white focus-visible:border-[#0f4a25] focus-visible:ring-4 focus-visible:ring-[#0f4a25]/10 font-bold text-slate-800 text-base shadow-sm transition-all outline-none" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase text-[#0f4a25] tracking-wider bg-[#eaf1ec] px-2 py-1 rounded inline-block">Person To Meet</Label>
                    <Input id="toMeet" placeholder="Select from search above..." value={formData.toMeet} onChange={handleInputChange} className="h-14 border-2 border-[#0f4a25]/30 rounded-xl px-4 bg-[#eaf1ec]/50 focus-visible:bg-white focus-visible:border-[#0f4a25] focus-visible:ring-4 focus-visible:ring-[#0f4a25]/10 font-black text-[#0f4a25] text-lg shadow-sm transition-all placeholder:font-semibold placeholder:text-[#0f4a25]/40 outline-none" />
                  </div>
                  <div className="space-y-3 md:col-span-2 mt-2">
                    <Label className="text-[11px] font-black uppercase text-[#0f4a25] tracking-wider">Address / Location</Label>
                    <Input id="address" placeholder="Full residential or office address" value={formData.address} onChange={handleInputChange} className="h-14 border-2 border-slate-200 rounded-xl px-4 bg-slate-50 focus-visible:bg-white focus-visible:border-[#0f4a25] focus-visible:ring-4 focus-visible:ring-[#0f4a25]/10 font-bold text-slate-800 text-base shadow-sm transition-all outline-none" />
                  </div>
                  <div className="space-y-3 md:col-span-2 mt-2">
                    <Label className="text-[11px] font-black uppercase text-[#0f4a25] tracking-wider">Purpose of Visit (Regarding)</Label>
                    <Textarea id="regarding" placeholder="Briefly describe the reason for this visit..." value={formData.regarding} onChange={handleInputChange} className="min-h-[100px] border-2 border-slate-200 rounded-xl px-4 py-4 bg-slate-50 focus-visible:bg-white focus-visible:border-[#0f4a25] focus-visible:ring-4 focus-visible:ring-[#0f4a25]/10 font-semibold text-slate-800 text-base shadow-sm resize-none transition-all outline-none" />
                  </div>
                </div>

                <div className="mt-12 flex flex-col xl:flex-row justify-between items-center bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 gap-8">
                  {/* Photo Capture Section */}
                  <div className="flex gap-4 items-center w-full xl:w-auto">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                    {!visitorPhoto ? (
                      <div className="flex gap-3 w-full">
                        <Button variant="outline" onClick={startCamera} className="flex-1 xl:flex-none h-14 px-6 rounded-xl border-slate-200 bg-white hover:bg-[#eaf1ec] hover:border-[#0f4a25]/20 hover:text-[#0f4a25] flex gap-2 font-bold text-xs uppercase tracking-tight text-slate-600 transition-all shadow-sm"><Camera className="w-5 h-5" /> Camera</Button>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 xl:flex-none h-14 px-6 rounded-xl border-slate-200 bg-white hover:bg-[#eaf1ec] hover:border-[#0f4a25]/20 hover:text-[#0f4a25] flex gap-2 font-bold text-xs uppercase tracking-tight text-slate-600 transition-all shadow-sm"><Upload className="w-5 h-5" /> Upload</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-5 animate-in fade-in slide-in-from-left-4 bg-white p-3 pr-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="relative group">
                          <img src={visitorPhoto} alt="Visitor" className="w-20 h-20 rounded-[1rem] object-cover border-2 border-white shadow-md" />
                          <button onClick={() => setVisitorPhoto(null)} className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 hover:bg-rose-600 hover:scale-110 transition-all"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#0f4a25] flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Image Ready</span>
                          <Button variant="link" onClick={() => setVisitorPhoto(null)} className="p-0 h-auto text-xs font-bold text-slate-400 hover:text-rose-500 justify-start">Retake Photo</Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Section */}
                  <div className="flex flex-col items-center xl:items-end gap-3 w-full xl:w-auto">
                    {submitStatus === "success" && <div className="flex items-center gap-2 text-emerald-600 text-[11px] font-black uppercase tracking-wider animate-in fade-in slide-in-from-bottom-2 bg-emerald-50 px-4 py-2 rounded-full"><CheckCircle2 className="w-4 h-4" /> Registration Successful</div>}
                    <Button onClick={handleAddVisitor} className="w-full xl:w-auto text-white px-10 h-16 rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_8px_20px_-6px_rgba(15,74,37,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(15,74,37,0.6)] hover:-translate-y-0.5 active:translate-y-0 text-sm" style={{ backgroundColor: PRIMARY_GREEN }} disabled={isSubmitting || submitStatus === "success" || !formData.toMeet || !formData.name}>
                      {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-8" /> : "Generate Pass"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selection Details Sidebar */}
            <div className="space-y-6 lg:sticky lg:top-8">
              {selectedProfile ? (
                <Card className="border-0 shadow-2xl overflow-hidden animate-in slide-in-from-right-4 duration-500 text-white rounded-3xl relative p-1" style={{ backgroundColor: PRIMARY_GREEN }}>
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#dbb13b]/20 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="bg-[#0f4a25] rounded-[1.5rem] relative z-10 p-8 space-y-8 h-full border border-white/10">
                    <div className="flex justify-between items-start">
                      <div className="bg-white/10 p-3 rounded-2xl relative shadow-inner border border-white/5">
                        {formData.toMeetType === 'student' ? <GraduationCap className="w-7 h-7 text-[#dbb13b]" /> : <Building className="w-7 h-7 text-[#dbb13b]" />}
                        {isRefreshingProfile && <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl backdrop-blur-sm"><Loader2 className="w-4 h-4 animate-spin text-white" /></div>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedProfile(null); setFormData(prev => ({ ...prev, toMeet: "" })); }} className="h-10 w-10 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#dbb13b]">Target Profile</div>
                      <h3 className="text-3xl font-extrabold tracking-tight leading-tight">{selectedProfile.name}</h3>
                    </div>

                    {/* Photo Gallery for Students */}
                    {formData.toMeetType === 'student' && selectedProfile.photos && (
                      <div className="grid grid-cols-2 gap-3 py-2">
                        {(() => {
                          const seen = new Set();
                          const photos = [
                            { id: selectedProfile.photos.apiPhoto, label: 'Profile' },
                            { id: selectedProfile.photos.student, label: 'Student' },
                            { id: selectedProfile.photos.father, label: 'Father' },
                            { id: selectedProfile.photos.mother, label: 'Mother' },
                            { id: selectedProfile.photos.guardian, label: 'Guardian' },
                            { id: selectedProfile.photos.grandfather, label: 'Grandpa' },
                            { id: selectedProfile.photos.grandmother, label: 'Grandma' },
                            { id: selectedProfile.photos.sibling1, label: 'Sibling 1' },
                            { id: selectedProfile.photos.sibling2, label: 'Sibling 2' }
                          ].filter(p => {
                            if (!p.id || seen.has(p.id)) return false;
                            seen.add(p.id);
                            return true;
                          });

                          return photos.map((photo, idx) => (
                            <div key={idx} className="space-y-2 group cursor-pointer">
                              <div className="aspect-[3/4] rounded-xl bg-black/20 overflow-hidden border border-white/10 relative shadow-lg">
                                <img
                                  src={getImageUrl(photo.id)!}
                                  alt={photo.label}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                  <Search className="w-4 h-4 text-white mx-auto mb-1" />
                                </div>
                              </div>
                              <div className="text-[9px] font-bold uppercase text-center text-emerald-100/70 tracking-widest">{photo.label}</div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}

                    <div className="bg-white/5 rounded-2xl p-5 space-y-4 border border-white/10 backdrop-blur-sm">
                      {formData.toMeetType === 'student' ? (
                        <>
                          <div className="flex justify-between items-center"><span className="text-[10px] text-emerald-100/60 uppercase font-black tracking-wider">Admission No</span><span className="text-sm font-bold bg-white/10 px-2 py-0.5 rounded text-white">{selectedProfile.regNo}</span></div>
                          <div className="flex justify-between items-center"><span className="text-[10px] text-emerald-100/60 uppercase font-black tracking-wider">Grade / Sec</span><span className="text-sm font-bold text-white">{selectedProfile.course} <span className="text-[#dbb13b]">•</span> {selectedProfile.section}</span></div>
                          <div className="flex justify-between items-center"><span className="text-[10px] text-emerald-100/60 uppercase font-black tracking-wider">Father Name</span><span className="text-sm font-bold text-white text-right max-w-[120px] truncate">{selectedProfile.fatherName}</span></div>
                          <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-2"><span className="text-[10px] text-[#dbb13b] uppercase font-black tracking-wider flex items-center gap-1.5"><Phone className="w-3 h-3" /> Contact</span><span className="text-sm font-bold text-white">{selectedProfile.phone}</span></div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center"><span className="text-[10px] text-emerald-100/60 uppercase font-black tracking-wider">Employee ID</span><span className="text-sm font-bold bg-white/10 px-2 py-0.5 rounded text-white">{selectedProfile.employeeId}</span></div>
                          <div className="flex justify-between items-center"><span className="text-[10px] text-emerald-100/60 uppercase font-black tracking-wider">Department</span><span className="text-sm font-bold text-white text-right">{selectedProfile.department}</span></div>
                          <div className="flex justify-between items-center"><span className="text-[10px] text-emerald-100/60 uppercase font-black tracking-wider">Designation</span><span className="text-sm font-bold text-white text-right max-w-[140px] truncate">{selectedProfile.designation}</span></div>
                          <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-2"><span className="text-[10px] text-[#dbb13b] uppercase font-black tracking-wider flex items-center gap-1.5"><Phone className="w-3 h-3" /> Contact</span><span className="text-sm font-bold text-white">{selectedProfile.mobile}</span></div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center flex flex-col items-center justify-center gap-6 rounded-3xl h-[400px]">
                  <div className="bg-white p-6 rounded-full shadow-sm ring-1 ring-slate-100"><Users className="text-slate-300 w-12 h-12" /></div>
                  <div className="space-y-2">
                    <h4 className="text-slate-700 font-bold">No Profile Selected</h4>
                    <p className="text-slate-400 font-medium text-xs max-w-[200px] leading-relaxed">Search and select a staff or student profile to view their details here.</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Entry History */}
        <div className="mt-8 space-y-8">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <span className="w-2 h-8 bg-[#dbb13b] rounded-full inline-block"></span>
              Recent Entries Log
            </h2>
            <div className="h-px bg-slate-200 flex-1" />
          </div>
          <Card className="border-0 shadow-xl bg-white rounded-3xl overflow-hidden ring-1 ring-slate-100">
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-100">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 py-5 pl-8">Visitor Name</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Mobile</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Meeting With</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Category</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 pr-8 text-right">Check-in Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingVisitors ? (
                    <TableRow><TableCell colSpan={5} className="py-24 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0f4a25]" /></TableCell></TableRow>
                  ) : (
                    visitors.map((v) => (
                      <TableRow key={v._id} className="hover:bg-slate-50 transition-colors border-slate-50">
                        <TableCell className="font-extrabold text-slate-700 pl-8 text-sm">{v.name}</TableCell>
                        <TableCell className="text-slate-500 font-semibold text-sm">{v.mobile}</TableCell>
                        <TableCell className="font-black text-[#0f4a25] text-sm flex items-center gap-2 mt-1.5"><User className="w-4 h-4 text-slate-400" /> {v.toMeet}</TableCell>
                        <TableCell>
                          <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg tracking-wider border ${v.toMeetType === 'student' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-[#eaf1ec] text-[#0f4a25] border-[#0f4a25]/20'}`}>
                            {v.toMeetType}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-400 font-bold text-xs pr-8 text-right">{new Date(v.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("authToken"));
  const handleLoginSuccess = (newToken: string) => { setToken(newToken); localStorage.setItem("authToken", newToken); };
  const handleLogout = () => { setToken(null); localStorage.removeItem("authToken"); };
  return <>{token ? <VisitorDashboard token={token} onLogout={handleLogout} /> : <LoginScreen onLoginSuccess={handleLoginSuccess} />}</>;
}

export default App;
