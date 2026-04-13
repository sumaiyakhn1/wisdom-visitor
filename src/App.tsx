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
  RefreshCw, 
  Camera, 
  Upload, 
  X, 
  Calendar as CalendarIcon,
  Clock,
  Lock,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Users,
  GraduationCap,
  Briefcase,
  MapPin,
  ChevronRight,
  UserPlus
} from "lucide-react";

const ENTITY_ID = "64b77babcc3c21610787b060";
const SESSION = "2026-27";

const PRIMARY_BLUE = "#1a365d"; // Darker shade of blue

function LoginScreen({ onLoginSuccess }: { onLoginSuccess: (token: string) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="min-h-screen bg-[#fafaf6] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-none shadow-2xl bg-white animate-fade-in text-center p-4">
        <CardHeader className="space-y-4 pb-8">
          <div className={`mx-auto w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200`} style={{ backgroundColor: PRIMARY_BLUE }}>
            <ShieldCheck className="text-white w-10 h-10" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black" style={{ color: PRIMARY_BLUE }}>Front Desk</CardTitle>
            <CardDescription className="text-slate-500 font-medium tracking-tight">Access Secure Dashboard</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={handleAutoLogin} className="w-full h-14 text-white text-lg font-bold transition-all shadow-lg active:scale-95" style={{ backgroundColor: PRIMARY_BLUE }} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Get Started"}
          </Button>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300 font-black">Authorized Personnel Only</div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper to extract Google Drive File ID
const extractFileId = (url: string | null | undefined) => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

// Map Drive ID to Proxy URL (Using the verified render proxy for image streaming)
const getImageUrl = (fileId: string | null) => {
  if (!fileId) return null;
  return `https://student-image-finder.onrender.com/image-proxy/${fileId}`;
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
    setIsFetchingData(true);
    try {
      const response = await fetch("https://others-api.odpay.in/api/list/student", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify({ entity: ENTITY_ID, session: SESSION }),
      });
      const result = await response.json();
      setAllStudents(result.data || []);
    } finally { setIsFetchingData(false); }
  };

  const fetchAllEmployees = async () => {
    if (allEmployees.length > 0) return;
    setIsFetchingData(true);
    try {
      const response = await fetch(`https://others-api.odpay.in/api/list/Employee?entity=${ENTITY_ID}&showInactive=true`, {
        headers: { "Authorization": token },
      });
      const result = await response.json();
      setAllEmployees(Array.isArray(result) ? result : []);
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

  const updateWithLiveData = (liveData: any, profile: any) => {
    if (!liveData) return;
    console.log("Live Student Data Keys:", Object.keys(liveData));
    setSelectedProfile((prev: any) => ({
      ...prev,
      ...liveData,
      photos: {
        apiPhoto: extractFileId(profile.photo),
        student: extractFileId(liveData["Student's Photograph"] || liveData.studentPhoto || liveData.studentPhotograph),
        father: extractFileId(liveData["Father's Photograph"] || liveData.fatherPhoto || liveData.fatherPhotograph),
        mother: extractFileId(liveData["Mother's Photograph"] || liveData.motherPhoto || liveData.motherPhotograph),
      }
    }));
  };

  const selectProfile = async (profile: any) => {
    // Set basic profile and API photo immediately so user sees it instantly
    const initialPhotos = { apiPhoto: extractFileId(profile.photo) };
    setSelectedProfile({ ...profile, photos: initialPhotos });
    
    setFormData(prev => ({ ...prev, toMeet: profile.name }));
    setShowDropdown(false);
    setSearchQuery("");

    // Background sync for parent/archival photos
    if (formData.toMeetType === "student") {
      setIsRefreshingProfile(true);
      try {
        const scholarId = profile.regNo?.trim();
        const response = await fetch(`https://student-image-finder.onrender.com/student/${encodeURIComponent(scholarId)}`);
        
        if (response.status === 404) {
          const fallbackResponse = await fetch(`https://student-image-finder.onrender.com/student/${scholarId}`);
          if (fallbackResponse.ok) {
            const liveData = await fallbackResponse.json();
            updateWithLiveData(liveData, profile);
            return;
          }
        }

        if (response.ok) {
          const liveData = await response.json();
          updateWithLiveData(liveData, profile);
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
    <div className="min-h-screen bg-[#fdfcf8] p-6 lg:p-12 font-sans text-slate-900 selection:bg-slate-200">
      {/* Camera Modal Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="text-white font-black uppercase tracking-widest text-[10px]">Capture Visitor Photo</h3>
              <Button variant="ghost" size="icon" onClick={stopCamera} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></Button>
            </div>
            <div className="aspect-video bg-black relative">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover mirror" />
              <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-80 border-2 border-dashed border-white/50 rounded-2xl" />
              </div>
            </div>
            <div className="p-8 flex justify-center bg-slate-950">
              <Button onClick={takePhoto} className="h-16 w-16 rounded-full bg-white hover:bg-slate-200 shadow-xl flex items-center justify-center group">
                <div className="h-12 w-12 rounded-full border-4 border-slate-950 flex items-center justify-center group-active:scale-90 transition-all" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3" style={{ color: PRIMARY_BLUE }}>
          <div className="p-2 rounded-xl" style={{ backgroundColor: PRIMARY_BLUE }}><UserPlus className="text-white w-6 h-6" /></div>
          Front Desk <span className="text-slate-300 font-light">/ Visitor</span>
        </h1>
        <Button variant="ghost" onClick={onLogout} className="text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-all">
          <Lock className="w-3 h-3 mr-2" /> Logout
        </Button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 gap-8">
        {/* Main Interface */}
        <div className="space-y-8">
          {/* Top Toggle & Search */}
          <Card className="border-none shadow-xl shadow-slate-100 overflow-visible bg-white relative z-50">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Meeting Type Toggle */}
                <div className="w-full md:w-auto shrink-0 space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: PRIMARY_BLUE }}>I am here to meet</Label>
                  <RadioGroup 
                    value={formData.toMeetType} 
                    onValueChange={(val) => { setFormData(prev => ({ ...prev, toMeetType: val })); setSelectedProfile(null); setSearchQuery(""); }} 
                    className="flex p-1 bg-slate-50 rounded-xl"
                  >
                    {[ 'employee', 'student', 'other' ].map((type) => (
                      <div key={type} className="flex-1 min-w-[100px]">
                        <label className={`flex items-center justify-center h-10 rounded-lg cursor-pointer transition-all font-bold text-xs uppercase tracking-tight ${formData.toMeetType === type ? 'bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} style={formData.toMeetType === type ? { color: PRIMARY_BLUE } : {}}>
                          <RadioGroupItem value={type} className="sr-only" />
                          {type}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Live Lookup Search */}
                <div className="flex-1 w-full space-y-3" ref={dropdownRef}>
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Search {formData.toMeetType} (Quick Select)
                  </Label>
                  <div className="relative group">
                    <Input 
                      placeholder={`Search by name or number...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 pl-12 pr-4 border-none bg-slate-50 rounded-xl focus-visible:ring-2 focus-visible:ring-[#1a365d]/20 transition-all font-medium text-slate-700" 
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                    
                    {showDropdown && (
                      <Card className="absolute top-full left-0 right-0 mt-2 z-[100] border border-slate-50 shadow-2xl rounded-2xl overflow-hidden max-h-72 bg-white animate-in fade-in slide-in-from-top-2">
                        <div className="divide-y divide-slate-50">
                          {isFetchingData && searchResults.length === 0 ? (
                            <div className="p-8 flex flex-col items-center gap-2 text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                              <Loader2 className="w-6 h-6 animate-spin" style={{ color: PRIMARY_BLUE }} /> FETCHING...
                            </div>
                          ) : searchResults.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 italic text-sm">No matches found for "{searchQuery}"</div>
                          ) : (
                            searchResults.map((profile) => (
                              <button key={profile._id} onClick={() => selectProfile(profile)} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-slate-50 transition-colors group">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black border border-slate-100 uppercase" style={{ color: PRIMARY_BLUE }}>
                                  {profile.name?.[0]}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <div className="text-sm font-black text-slate-800 truncate group-hover:text-slate-900 transition-colors">{profile.name}</div>
                                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate">
                                    {formData.toMeetType === 'student' ? `${profile.regNo} • ${profile.course}` : `${profile.employeeId} • ${profile.department}`}
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:translate-x-1 transition-all" />
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
            <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-100 bg-white">
              <CardContent className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Visitor Name (Outdoor Person)</Label>
                    <Input id="name" value={formData.name} onChange={handleInputChange} className="border-0 border-b-2 border-slate-100 rounded-none px-0 h-10 bg-transparent focus-visible:ring-0 focus-visible:border-[#1a365d] font-bold text-slate-800 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mobile Number</Label>
                    <Input id="mobile" value={formData.mobile} onChange={handleInputChange} className="border-0 border-b-2 border-slate-100 rounded-none px-0 h-10 bg-transparent focus-visible:ring-0 focus-visible:border-[#1a365d] font-bold text-slate-800 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Organization / Company</Label>
                    <Input id="organizationName" value={formData.organizationName} onChange={handleInputChange} className="border-0 border-b-2 border-slate-100 rounded-none px-0 h-10 bg-transparent focus-visible:ring-0 focus-visible:border-[#1a365d] font-bold text-slate-800 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider" style={{ color: PRIMARY_BLUE }}>Person To Meet</Label>
                    <Input id="toMeet" value={formData.toMeet} onChange={handleInputChange} className="border-0 border-b-2 border-slate-100 rounded-none px-0 h-10 bg-transparent focus-visible:ring-0 focus-visible:border-[#1a365d] font-bold transition-all" style={{ color: PRIMARY_BLUE }} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Address / Location</Label>
                    <Input id="address" value={formData.address} onChange={handleInputChange} className="border-0 border-b-2 border-slate-100 rounded-none px-0 h-10 bg-transparent focus-visible:ring-0 focus-visible:border-[#1a365d] font-bold text-slate-800 transition-all" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Purpose of Visit (Regarding)</Label>
                    <Textarea id="regarding" value={formData.regarding} onChange={handleInputChange} className="min-h-[60px] border-0 border-b-2 border-slate-100 rounded-none px-0 bg-transparent focus-visible:ring-0 focus-visible:border-[#1a365d] font-medium text-slate-500 resize-none transition-all" />
                  </div>
                </div>

                <div className="mt-12 flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex gap-4 items-center">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                    {!visitorPhoto ? (
                      <>
                        <Button variant="outline" onClick={startCamera} className="h-12 px-6 rounded-xl border-slate-200 bg-white hover:bg-slate-50 flex gap-2 font-bold text-xs uppercase tracking-tight text-slate-600 transition-all"><Camera className="w-4 h-4" /> Camera</Button>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="h-12 px-6 rounded-xl border-slate-200 bg-white hover:bg-slate-50 flex gap-2 font-bold text-xs uppercase tracking-tight text-slate-600 transition-all"><Upload className="w-4 h-4" /> Upload</Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2">
                        <div className="relative group">
                          <img src={visitorPhoto} alt="Visitor" className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md" />
                          <button onClick={() => setVisitorPhoto(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Image Attached</span>
                          <Button variant="link" onClick={() => setVisitorPhoto(null)} className="p-0 h-auto text-[10px] font-bold text-slate-400 hover:text-rose-500">Retake Photo</Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    {submitStatus === "success" && <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-wider animate-in fade-in scale-in-95"><CheckCircle2 className="w-3 h-3" /> Registration Successful</div>}
                    <Button onClick={handleAddVisitor} className="text-white px-12 h-14 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl active:scale-95" style={{ backgroundColor: PRIMARY_BLUE }} disabled={isSubmitting || submitStatus === "success"}>
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selection Details Sidebar */}
            <div className="space-y-6">
              {selectedProfile ? (
                 <Card className="border-none shadow-2xl overflow-hidden animate-in slide-in-from-right-4 duration-500 text-white" style={{ backgroundColor: PRIMARY_BLUE }}>
                    <div className="p-8 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="bg-white/10 p-2 rounded-lg relative">
                          {formData.toMeetType === 'student' ? <GraduationCap className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
                          {isRefreshingProfile && <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg"><Loader2 className="w-3 h-3 animate-spin" /></div>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedProfile(null); setFormData(prev => ({ ...prev, toMeet: "" })); }} className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Meeting With</div>
                        <h3 className="text-2xl font-black tracking-tight leading-tight">{selectedProfile.name}</h3>
                      </div>

                      {/* Photo Gallery for Students */}
                      {formData.toMeetType === 'student' && selectedProfile.photos && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 py-4">
                          {[
                            { id: selectedProfile.photos.apiPhoto, label: 'Profile' },
                            { id: selectedProfile.photos.student, label: 'Student' },
                            { id: selectedProfile.photos.father, label: 'Father' },
                            { id: selectedProfile.photos.mother, label: 'Mother' }
                          ].filter(p => p.id).map((photo, idx) => (
                            <div key={idx} className="space-y-1.5 translate-y-0 hover:-translate-y-1 transition-transform">
                              <div className="aspect-[3/4] rounded-lg bg-white/10 overflow-hidden border border-white/5 relative group cursor-pointer shadow-lg">
                                <img 
                                  src={getImageUrl(photo.id)!} 
                                  alt={photo.label} 
                                  className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                />
                              </div>
                              <div className="text-[8px] font-bold uppercase text-center opacity-50 tracking-tighter">{photo.label}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 pt-4 border-t border-white/10">
                        {formData.toMeetType === 'student' ? (
                          <>
                            <div className="flex justify-between items-center"><span className="text-[10px] opacity-60 uppercase font-bold">Admission No</span><span className="text-xs font-black">{selectedProfile.regNo}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[10px] opacity-60 uppercase font-bold">Grade / Sec</span><span className="text-xs font-black">{selectedProfile.course} • {selectedProfile.section}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[10px] opacity-60 uppercase font-bold">Father Name</span><span className="text-xs font-black">{selectedProfile.fatherName}</span></div>
                            <div className="flex justify-between items-center font-bold"><span className="text-[10px] opacity-60 uppercase">Contact</span><span className="text-xs">{selectedProfile.phone}</span></div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between items-center"><span className="text-[10px] opacity-60 uppercase font-bold">Employee ID</span><span className="text-xs font-black">{selectedProfile.employeeId}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[10px] opacity-60 uppercase font-bold">Department</span><span className="text-xs font-black">{selectedProfile.department}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[10px] opacity-60 uppercase font-bold">Designation</span><span className="text-xs font-black truncate max-w-[120px]">{selectedProfile.designation}</span></div>
                            <div className="flex justify-between items-center font-bold"><span className="text-[10px] opacity-60 uppercase">Contact</span><span className="text-xs">{selectedProfile.mobile}</span></div>
                          </>
                        )}
                      </div>
                    </div>
                 </Card>
              ) : (
                <Card className="border-4 border-dashed border-slate-100 bg-transparent p-10 text-center flex flex-col items-center justify-center gap-4">
                  <div className="bg-white p-4 rounded-full shadow-sm"><Users className="text-slate-200 w-10 h-10" /></div>
                  <div className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Select a person to meet to preview profile</div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Entry History */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-4">
             <div className="h-px bg-slate-100 flex-1" />
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Entry History</h2>
             <div className="h-px bg-slate-100 flex-1" />
          </div>
          <Card className="border-none shadow-xl shadow-slate-100 bg-white overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-black text-[10px] uppercase text-slate-400 py-4">Visitor</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-slate-400">Mobile</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-slate-400">To Meet</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-slate-400">Type</TableHead>
                    <TableHead className="font-black text-[10px] uppercase text-slate-400">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingVisitors ? (
                    <TableRow><TableCell colSpan={5} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-100" /></TableCell></TableRow>
                  ) : (
                    visitors.map((v) => (
                      <TableRow key={v._id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-black text-slate-700">{v.name}</TableCell>
                        <TableCell className="text-slate-500 font-medium">{v.mobile}</TableCell>
                        <TableCell className="font-black" style={{ color: PRIMARY_BLUE }}>{v.toMeet}</TableCell>
                        <TableCell>
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${v.toMeetType === 'student' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {v.toMeetType}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-400 font-bold text-[10px]">{new Date(v.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
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
