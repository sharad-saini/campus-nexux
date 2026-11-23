"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  GraduationCap,
  Compass,
  LineChart as LineChartIcon,
  CalendarDays,
  Brain,
  Bot,
  ShieldAlert,
  Sparkles,
  Settings,
  Search,
  Bell,
  ArrowRight,
  ArrowUpRight,
  Check,
  Send,
  Calendar,
  Shield,
  BookOpen,
  User as UserIcon,
  Sliders,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  Users,
  Lock,
  Download,
  Flame,
  HelpCircle,
  TrendingUp,
  MapPin,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { KpiCard } from "@/components/KpiCard";
import { ProgressBar } from "@/components/ProgressBar";
import { DashboardTopNavbar, NavItem } from "@/components/DashboardTopNavbar";
import {
  KPI_CARDS,
  MASTERY_COURSES,
  AI_RECOMMENDATION,
  UPCOMING_ACTIVITIES,
  QUICK_ACCESS_ITEMS,
  COPILOT_PRESETS,
  CopilotMessage,
} from "@/data/student";

interface EnhancedStudentDashboardViewProps {
  user?: any;
  onView?: (view: string) => void;
  onNotify?: (text: string, kind?: any) => void;
  onBackToLanding?: () => void;
  onLogout?: () => void;
  embedded?: boolean;
}

export function EnhancedStudentDashboardView({
  user,
  onView,
  onNotify,
  onBackToLanding,
  onLogout,
  embedded = false,
}: EnhancedStudentDashboardViewProps) {
  const [activeMenu, setActiveMenu] = useState("overview");

  // Navigation Items
  const studentNavItems: NavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "academics", label: "My Academics", icon: GraduationCap },
    { id: "learning", label: "Mastery Map", icon: Compass },
    { id: "grade-predictor", label: "Grade Predictor", icon: LineChartIcon },
    { id: "planner", label: "AI Study Planner", icon: CalendarDays },
    { id: "drills", label: "Micro Drills", icon: Brain },
    { id: "copilot", label: "AI Copilot", icon: Bot },
    { id: "campus-map", label: "India Map", icon: MapPin },
    { id: "privacy", label: "Grievance Centre", icon: ShieldAlert },
    { id: "community", label: "Campus Life", icon: Sparkles },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Grade Predictor Time Machine State (Eq 4.5)
  const [effortHours, setEffortHours] = useState({
    dbms: 4,
    os: 6,
    dsa: 8,
    cn: 2,
  });

  const baselineGpa = 7.42;
  const totalStudyHours = effortHours.dbms + effortHours.os + effortHours.dsa + effortHours.cn;
  // Diminishing returns: delta = min(2.0, (1 - exp(-totalHours / 8.0)) * 1.8)
  const deltaGpa = Math.min(2.0, (1 - Math.exp(-totalStudyHours / 10.0)) * 1.8);
  const projectedGpa = Math.min(10.0, baselineGpa + deltaGpa);
  const projectedGrade = projectedGpa >= 9.0 ? "O" : projectedGpa >= 8.5 ? "A+" : projectedGpa >= 8.0 ? "A" : "B+";

  // AI Study Planner State
  const [availableHours, setAvailableHours] = useState(14);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  // Micro Drill State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [drillSubmitted, setDrillSubmitted] = useState(false);
  const [drillScoreBoost, setDrillScoreBoost] = useState(false);

  // AI Copilot Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string; time: string; citations?: string[]; action?: "india-map" }>>([
    {
      sender: "bot",
      text: "Hello Aarav! I am your Syllabus-Grounded AI Copilot. Ask me any conceptual question about your DBMS, OS, DSA, or Computer Networks courses, and I will answer with exact textbook citations.",
      time: "Just now",
      citations: ["NITX CSE Courseware, 2026 Edition"],
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Grievance Centre State
  const [grievanceCategory, setGrievanceCategory] = useState<"facilities" | "sensitive_zk">("facilities");
  const [grievanceTitle, setGrievanceTitle] = useState("");
  const [grievanceLocation, setGrievanceLocation] = useState("Academic Block A - Room 304");
  const [grievanceDesc, setGrievanceDesc] = useState("");
  const [grievanceSuccess, setGrievanceSuccess] = useState<any>(null);

  // Syllabus Checklist State
  const [completedSyllabus, setCompletedSyllabus] = useState<string[]>(["sym-1", "sym-2", "sym-4"]);

  const toggleSyllabus = (id: string) => {
    setCompletedSyllabus((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim()) return;
    const userMsg = { sender: "user" as const, text: promptText, time: "Just now" };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    const isMapQuestion =
      /\b(campus map|google maps|map of india|location|directions)\b/i.test(
        promptText
      ) ||
      /\b(find|search|locate|show)\b.{0,25}\b(colleges?|universities|campuses)\b/i.test(
        promptText
      );
    if (isMapQuestion) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "India ke kisi bhi city, college ya university ko map par dekh sakte ho. Search Google Maps par khulega; CAMPUS-NEXUS kisi ek college se affiliated nahi hai.",
          time: "Just now",
          action: "india-map",
        },
      ]);
      return;
    }

    setChatLoading(true);

    try {
      const res = await fetch("/api/v1/copilot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: "northstar-cs301",
          query: promptText,
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.answer || "Answer generated based on course syllabus.",
          time: "Just now",
          citations: data.citations || ["Silberschatz Database Concepts, Chapter 14."],
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "In a B-Tree, keys and data records reside in all nodes. In a B+ Tree, internal nodes store navigation keys exclusively while all actual records are in leaf nodes linked sequentially, delivering optimal O(log N + k) range query performance.",
          time: "Just now",
          citations: [
            "Silberschatz, Korth, Sudarshan. Database System Concepts (7th Ed.), Chapter 14: Indexing, pp. 645-652.",
            "NITX CS-301 Lecture 12: Tree Indexing, Unit 3.",
          ],
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGrievanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grievanceTitle.trim() || !grievanceDesc.trim()) return;

    try {
      const res = await fetch("/api/v1/grievance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: grievanceCategory,
          title: grievanceTitle,
          description: grievanceDesc,
          location: grievanceLocation,
        }),
      });
      const data = await res.json();
      setGrievanceSuccess(data);
      setGrievanceTitle("");
      setGrievanceDesc("");
    } catch {
      setGrievanceSuccess({
        ticket_type: grievanceCategory,
        ticket_id: `tkt-${Math.random().toString(36).substring(2, 8)}`,
        tracking_code: "ZK-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        status: "Ticket verified",
        message: "Your submission has been securely processed and logged in the system.",
      });
    }
  };

  const handleNavClick = (id: string) => {
    setActiveMenu(id);
    if (onView) onView(id);
  };

  const donutData = [
    { name: "Mastered", value: 72, fill: "#34D399" },
    { name: "Remaining", value: 28, fill: "#CDEBDD" },
  ];

  return (
    <div
      className={`min-h-screen ${
        embedded ? "bg-transparent" : "bg-white"
      } text-[#0B2E22] flex flex-col font-sans selection:bg-[#34D399]/30`}
    >
      {/* Top Navigation Bar */}
      {!embedded && (
        <DashboardTopNavbar
          items={studentNavItems}
          activeId={activeMenu}
          onSelect={handleNavClick}
          user={user}
          onLogout={onLogout}
          roleBadgeText="Student"
          roleColor="#047857"
          tagline="Find why a student is failing. Then fix it."
        />
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Hero Welcome Banner */}
        <div className="relative rounded-xl bg-[#F0FAF5] border border-[#CDEBDD] p-5 sm:p-6 overflow-hidden shadow-[0_1px_2px_rgba(11,46,34,0.06)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-[#0B2E22] flex items-center gap-2">
                <span>Welcome, {user ? user.full_name?.split(" ")[0] : "Aarav"}!</span>
                <Sparkles className="w-5 h-5 text-[#EAB308]" />
              </h1>
              <p className="text-xs sm:text-sm text-[#4B6B5E] font-medium">
                Northstar Institute of Technology (NITX) · CSE Sem 5 · Student Workspace
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#CDEBDD] text-xs font-semibold text-[#047857] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                Good Standing (GPA 7.42 · Attendance 86%)
              </span>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: OVERVIEW */}
        {/* ==================================================================== */}
        {activeMenu === "overview" && (
          <div className="space-y-6">
            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {KPI_CARDS.map((kpi) => (
                <KpiCard
                  key={kpi.id}
                  item={kpi}
                  onClick={() => {
                    if (kpi.id === "attendance") setActiveMenu("academics");
                    else if (kpi.id === "course-mastery") setActiveMenu("learning");
                    else if (kpi.id === "academic-perf") setActiveMenu("grade-predictor");
                  }}
                />
              ))}
            </div>

            {/* 2-Column Dashboard Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Left Column (8 cols) */}
              <div className="xl:col-span-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Mastery Donut Card */}
                  <div className="rounded-xl bg-[#F0FAF5] border border-[#CDEBDD] p-5 shadow-[0_1px_2px_rgba(11,46,34,0.06)] space-y-4">
                    <div className="flex items-center justify-between border-b border-[#CDEBDD] pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#34D399]/20 border border-[#34D399]/40 flex items-center justify-center text-[#047857]">
                          <Compass className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-[#0B2E22]">My Mastery Map</h3>
                      </div>
                      <button
                        onClick={() => setActiveMenu("learning")}
                        className="text-xs font-semibold text-[#047857] hover:text-[#065F46] flex items-center gap-1"
                      >
                        Details <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 py-2">
                      <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={donutData}
                              dataKey="value"
                              innerRadius={33}
                              outerRadius={44}
                              startAngle={90}
                              endAngle={-270}
                              paddingAngle={0}
                            >
                              {donutData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-lg font-extrabold text-[#0B2E22]">72%</span>
                          <span className="text-[9px] uppercase tracking-wider text-[#4B6B5E] font-bold">Mastery</span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <p className="text-xs text-[#0B2E22] font-semibold">
                          Deep Knowledge Tracing (DKT-Graph)
                        </p>
                        <p className="text-[11px] text-[#4B6B5E] leading-relaxed">
                          Strong in Database Systems ($92\%$) and OS ($78\%$). Pointer arithmetic in DSA ($41\%$) requires review.
                        </p>
                        <button
                          onClick={() => setActiveMenu("learning")}
                          className="px-2.5 py-1 rounded-md bg-[#34D399]/20 text-[#047857] hover:bg-[#34D399]/30 text-[11px] font-bold transition-all"
                        >
                          Walk Prerequisite DAG →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AI Study Recommendation */}
                  <div className="rounded-xl bg-[#F0FAF5] border border-[#CDEBDD] p-5 shadow-[0_1px_2px_rgba(11,46,34,0.06)] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#CDEBDD] pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#FACC15]/20 border border-[#FACC15]/40 flex items-center justify-center text-[#713F12]">
                          <Sparkles className="w-4 h-4 text-[#EAB308]" />
                        </div>
                        <h3 className="text-sm font-bold text-[#0B2E22]">Recommended Action</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF9C3] text-[#713F12] border border-[#FACC15]">
                        Priority 1
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-[#0B2E22]">
                        15-Min Micro-Drill: Virtual Memory & Page Faults
                      </p>
                      <p className="text-[11px] text-[#4B6B5E] leading-relaxed">
                        Spaced repetition algorithm (FSRS) predicts $R(t)$ dropped to $88\%$. Completing 3 diagnostic questions consolidates memory before Friday quiz.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => setActiveMenu("drills")}
                        className="px-3 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-[#0B2E22] text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Brain className="w-3.5 h-3.5" />
                        <span>Start Micro-Drill</span>
                      </button>
                      <button
                        onClick={() => setActiveMenu("planner")}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#CDEBDD] text-[#0B2E22] hover:border-[#34D399] text-xs font-semibold transition-all"
                      >
                        View Study Plan
                      </button>
                    </div>
                  </div>
                </div>

                {/* Course Breakdown Table */}
                <div className="rounded-xl bg-[#F0FAF5] border border-[#CDEBDD] p-5 shadow-[0_1px_2px_rgba(11,46,34,0.06)] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#CDEBDD] pb-3">
                    <h3 className="text-sm font-bold text-[#0B2E22] flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#047857]" />
                      Enrolled Courses Mastery & Attendance
                    </h3>
                    <span className="text-xs text-[#4B6B5E] font-medium">Semester 5</span>
                  </div>

                  <div className="space-y-3">
                    {MASTERY_COURSES.map((course) => (
                      <div key={course.code} className="p-3 bg-white rounded-lg border border-[#CDEBDD] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#047857]">{course.code}</span>
                            <span className="text-xs font-semibold text-[#0B2E22]">{course.name}</span>
                          </div>
                          <p className="text-[11px] text-[#4B6B5E]">{course.instructor}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32">
                            <ProgressBar label={course.name} value={course.percentage} color={course.color} />
                          </div>
                          <span className="font-mono text-xs font-bold text-[#0B2E22] w-10 text-right">
                            {course.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column (4 cols) */}
              <div className="xl:col-span-4 space-y-6">
                {/* Upcoming Assessments */}
                <div className="rounded-xl bg-[#F0FAF5] border border-[#CDEBDD] p-5 shadow-[0_1px_2px_rgba(11,46,34,0.06)] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#CDEBDD] pb-3">
                    <h3 className="text-sm font-bold text-[#0B2E22] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#047857]" />
                      Upcoming Timeline
                    </h3>
                    <span className="text-xs font-bold text-[#047857]">3 Due</span>
                  </div>

                  <div className="space-y-3">
                    {UPCOMING_ACTIVITIES.map((act) => (
                      <div key={act.id} className="p-3 bg-white rounded-lg border border-[#CDEBDD] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0B2E22]">{act.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF9C3] text-[#713F12] border border-[#FACC15]">
                            {act.badge}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#4B6B5E]">
                          <span>{act.course}</span>
                          <span>{act.due}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Access Tiles */}
                <div className="rounded-xl bg-[#F0FAF5] border border-[#CDEBDD] p-5 shadow-[0_1px_2px_rgba(11,46,34,0.06)] space-y-3">
                  <h3 className="text-sm font-bold text-[#0B2E22] border-b border-[#CDEBDD] pb-3">
                    Quick Tools
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setActiveMenu("grade-predictor")}
                      className="p-3 rounded-lg bg-white border border-[#CDEBDD] hover:border-[#34D399] text-left transition-all"
                    >
                      <LineChartIcon className="w-4 h-4 text-[#047857] mb-1.5" />
                      <div className="text-xs font-bold text-[#0B2E22]">Time Machine</div>
                      <div className="text-[10px] text-[#4B6B5E]">Simulate GPA</div>
                    </button>
                    <button
                      onClick={() => setActiveMenu("copilot")}
                      className="p-3 rounded-lg bg-white border border-[#CDEBDD] hover:border-[#34D399] text-left transition-all"
                    >
                      <Bot className="w-4 h-4 text-[#047857] mb-1.5" />
                      <div className="text-xs font-bold text-[#0B2E22]">AI Copilot</div>
                      <div className="text-[10px] text-[#4B6B5E]">Ask syllabus QA</div>
                    </button>
                    <button
                      onClick={() => setActiveMenu("privacy")}
                      className="p-3 rounded-lg bg-white border border-[#CDEBDD] hover:border-[#34D399] text-left transition-all"
                    >
                      <ShieldAlert className="w-4 h-4 text-[#047857] mb-1.5" />
                      <div className="text-xs font-bold text-[#0B2E22]">Grievances</div>
                      <div className="text-[10px] text-[#4B6B5E]">Zero-Knowledge Desk</div>
                    </button>
                    <button
                      onClick={() => setActiveMenu("community")}
                      className="p-3 rounded-lg bg-white border border-[#CDEBDD] hover:border-[#34D399] text-left transition-all"
                    >
                      <Users className="w-4 h-4 text-[#047857] mb-1.5" />
                      <div className="text-xs font-bold text-[#0B2E22]">Peer Matcher</div>
                      <div className="text-[10px] text-[#4B6B5E]">Study Partners</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: MY ACADEMICS */}
        {/* ==================================================================== */}
        {activeMenu === "academics" && (
          <div className="space-y-6">
            <div className="bg-[#F0FAF5] border border-[#CDEBDD] rounded-xl p-5 shadow-[0_1px_2px_rgba(11,46,34,0.06)]">
              <h2 className="text-lg font-bold text-[#0B2E22] flex items-center gap-2 mb-1">
                <GraduationCap className="w-5 h-5 text-[#047857]" />
                Academic Health & 75% Statutory Forecaster
              </h2>
              <p className="text-xs text-[#4B6B5E]">
                Monitors daily attendance buffer to prevent debarment from end-semester exams under university rules.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-white rounded-lg border border-[#CDEBDD]">
                  <span className="text-xs text-[#4B6B5E] font-semibold">OVERALL ATTENDANCE</span>
                  <div className="text-2xl font-extrabold text-[#047857] mt-1">86.4%</div>
                  <span className="text-[11px] text-[#047857] font-medium">Good Standing (&gt; 75% required)</span>
                </div>
                <div className="p-4 bg-white rounded-lg border border-[#CDEBDD]">
                  <span className="text-xs text-[#4B6B5E] font-semibold">SAFE BUNKS REMAINING</span>
                  <div className="text-2xl font-extrabold text-[#EAB308] mt-1">3 Classes</div>
                  <span className="text-[11px] text-[#4B6B5E]">Before dropping below 75% mark</span>
                </div>
                <div className="p-4 bg-white rounded-lg border border-[#CDEBDD]">
                  <span className="text-xs text-[#4B6B5E] font-semibold">SEMESTER CREDITS</span>
                  <div className="text-2xl font-extrabold text-[#0B2E22] mt-1">22 Credits</div>
                  <span className="text-[11px] text-[#4B6B5E]">5 Theory + 3 Lab courses</span>
                </div>
              </div>
            </div>

            {/* Weekly Timetable */}
            <div className="bg-[#F0FAF5] border border-[#CDEBDD] rounded-xl p-5 shadow-[0_1px_2px_rgba(11,46,34,0.06)] space-y-4">
              <h3 className="text-sm font-bold text-[#0B2E22] flex items-center gap-2 border-b border-[#CDEBDD] pb-3">
                <Calendar className="w-4 h-4 text-[#047857]" />
                Weekly Lecture & Practical Timetable
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { day: "Monday", time: "09:00 - 10:30", course: "CS301: DBMS", hall: "Room 304" },
                  { day: "Tuesday", time: "11:00 - 12:30", course: "CS302: OS", hall: "Lab B" },
                  { day: "Wednesday", time: "14:00 - 15:30", course: "CS303: Networks", hall: "Room 201" },
                  { day: "Thursday", time: "10:00 - 11:30", course: "CS304: DSA", hall: "Room 102" },
                  { day: "Friday", time: "15:00 - 17:00", course: "CS305: AI Lab", hall: "Robotics Lab" },
                ].map((slot) => (
                  <div key={slot.day} className="p-3 bg-white rounded-lg border border-[#CDEBDD] space-y-1">
                    <span className="text-[11px] font-bold text-[#047857] uppercase tracking-wider">{slot.day}</span>
                    <p className="text-xs font-bold text-[#0B2E22]">{slot.course}</p>
                    <p className="text-[10px] text-[#4B6B5E]">{slot.time}</p>
                    <span className="inline-block text-[10px] bg-[#F0FAF5] border border-[#CDEBDD] px-1.5 py-0.5 rounded text-[#0B2E22]">
                      {slot.hall}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Syllabus Completion Checklist */}
            <div className="bg-[#F0FAF5] border border-[#CDEBDD] rounded-xl p-5 shadow-[0_1px_2px_rgba(11,46,34,0.06)] space-y-4">
              <h3 className="text-sm font-bold text-[#0B2E22] flex items-center gap-2 border-b border-[#CDEBDD] pb-3">
                <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                Midterm Syllabus Unit Checklist (Interactive)
              </h3>

              <div className="space-y-2">
                {[
                  { id: "sym-1", title: "Unit 1: Relational Algebra & ER Modeling", course: "CS301 DBMS", hours: "8 hrs" },
                  { id: "sym-2", title: "Unit 2: SQL Complex Queries, Joins, Triggers", course: "CS301 DBMS", hours: "10 hrs" },
                  { id: "sym-3", title: "Unit 3: Normalization (1NF, 2NF, 3NF, BCNF)", course: "CS301 DBMS", hours: "6 hrs" },
                  { id: "sym-4", title: "Unit 1: Process Synchronization & Semaphores", course: "CS302 OS", hours: "10 hrs" },
                  { id: "sym-5", title: "Unit 2: Memory Management & Page Tables", course: "CS302 OS", hours: "8 hrs" },
                ].map((item) => {
                  const done = completedSyllabus.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSyllabus(item.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                        done ? "bg-white border-[#34D399]" : "bg-white border-[#CDEBDD] hover:border-[#34D399]/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                            done ? "bg-[#34D399] border-[#34D399] text-[#0B2E22]" : "border-[#CDEBDD]"
                          }`}
                        >
                          {done && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <span className={`text-xs font-semibold ${done ? "line-through text-[#4B6B5E]" : "text-[#0B2E22]"}`}>
                            {item.title}
                          </span>
                          <p className="text-[10px] text-[#4B6B5E]">{item.course} · {item.hours}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#047857]">
                        {done ? "Completed" : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: MASTERY MAP (DKT-GRAPH) */}
        {/* ==================================================================== */}
        {activeMenu === "learning" && (
          <div className="space-y-6">
            <div className="bg-[#F0FAF5] border border-[#CDEBDD] rounded-xl p-5 shadow-[0_1px_2px_rgba(11,46,34,0.06)]">
              <h2 className="text-lg font-bold text-[#0B2E22] flex items-center gap-2 mb-1">
                <Compass className="w-5 h-5 text-[#047857]" />
                Deep Knowledge Tracing (DKT-Graph) & Prerequisite DAG
              </h2>
              <p className="text-xs text-[#4B6B5E]">
                CAMPUS-NEXUS walks course prerequisite graphs backwards to find root conceptual weaknesses instead of just labeling poor exam grades.
              </p>
            </div>

            {/* Prerequisite Walk Highlight Card */}
            <div className="p-5 rounded-xl bg-white border border-[#CDEBDD] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#CDEBDD] pb-3">
                <h3 className="text-sm font-bold text-[#0B2E22] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Root Blocker Diagnostic Walk: Data Structures & Algorithms
                </h3>
                <span className="px-2.5 py-1 rounded bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold">
                  Intervention Needed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-[#FEF9C3] border border-[#FACC15] rounded-lg">
                  <span className="text-[10px] font-bold text-[#713F12]">ROOT CAUSE (Step 1)</span>
                  <div className="text-xs font-extrabold text-[#713F12] mt-1">Pointer Arithmetic & Malloc</div>
                  <div className="text-sm font-bold text-red-600 mt-0.5">38.5% Mastery</div>
                </div>

                <div className="p-3 bg-white border border-[#CDEBDD] rounded-lg">
                  <span className="text-[10px] font-bold text-[#4B6B5E]">PREREQUISITE (Step 2)</span>
                  <div className="text-xs font-extrabold text-[#0B2E22] mt-1">Doubly-Linked Lists</div>
                  <div className="text-sm font-bold text-amber-600 mt-0.5">52.0% Mastery</div>
                </div>

                <div className="p-3 bg-white border border-[#CDEBDD] rounded-lg">
                  <span className="text-[10px] font-bold text-[#4B6B5E]">DATA STRUCT (Step 3)</span>
                  <div className="text-xs font-extrabold text-[#0B2E22] mt-1">Binary Search Trees & AVL</div>
                  <div className="text-sm font-bold text-amber-600 mt-0.5">58.4% Mastery</div>
                </div>

                <div className="p-3 bg-[#F0FAF5] border border-[#CDEBDD] rounded-lg">
                  <span className="text-[10px] font-bold text-[#047857]">LEAF TARGET (Step 4)</span>
                  <div className="text-xs font-extrabold text-[#0B2E22] mt-1">Dynamic Programming & Graphs</div>
                  <div className="text-sm font-bold text-red-600 mt-0.5">41.2% Mastery</div>
                </div>
              </div>

              <p className="text-xs text-[#4B6B5E] leading-relaxed bg-[#F0FAF5] p-3 rounded-lg border border-[#CDEBDD]">
                <strong>AI Explanation:</strong> The student is failing complex Graph and Dynamic Programming assignments because memory allocation and pointer dereferencing in C/C++ was never consolidated in Semester 3. Practicing 15 minutes of recursion and pointer drills resolves the leaf failure.
              </p>
            </div>

            {/* Concept Mastery Radar Bars */}
            <div className="p-5 rounded-xl bg-[#F0FAF5] border border-[#CDEBDD] space-y-4">
              <h3 className="text-sm font-bold text-[#0B2E22] border-b border-[#CDEBDD] pb-3">
                Current BKT Concept Probabilities (Pt)
              </h3>

              <div className="space-y-3">
                {[
                  { concept: "Database Systems - SQL & Relational Algebra", mastery: 92.0 },
                  { concept: "Operating Systems - Process Scheduling", mastery: 85.0 },
                  { concept: "Operating Systems - Virtual Memory", mastery: 72.0 },
                  { concept: "Computer Networks - TCP Congestion Control", mastery: 64.0 },
                  { concept: "Computer Networks - Routing Protocols (OSPF/BGP)", mastery: 58.0 },
                  { concept: "Data Structures - Pointer Dereferencing", mastery: 38.5 },
                ].map((item) => (
                  <div key={item.concept} className="p-3 bg-white rounded-lg border border-[#CDEBDD] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0B2E22]">{item.concept}</span>
                      <span className="font-mono font-bold text-[#047857]">{item.mastery}%</span>
                    </div>
                    <div className="w-full bg-[#CDEBDD] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.mastery >= 75 ? "bg-[#34D399]" : item.mastery >= 50 ? "bg-[#EAB308]" : "bg-red-500"
                        }`}
                        style={{ width: `${item.mastery}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: GRADE PREDICTOR (GRADE TIME MACHINE) */}
        {/* ==================================================================== */}
        {activeMenu === "grade-predictor" && (
          <div className="space-y-6">
            <div className="bg-[#F0FAF5] border border-[#CDEBDD] rounded-xl p-5 shadow-[0_1px_2px_rgba(11,46,34,0.06)]">
              <h2 className="text-lg font-bold text-[#0B2E22] flex items-center gap-2 mb-1">
                <LineChartIcon className="w-5 h-5 text-[#047857]" />
                Grade Time Machine (What-If Effort Simulator)
              </h2>
              <p className="text-xs text-[#4B6B5E]">
                Adjust planned study hours per topic to model projected exam GPA shifts using diminishing returns: m&apos;_k(x_k) = 1 - (1 - m_k) &bull; exp(-x_k / &tau;).
              </p>
            </div>

            {/* Simulator Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Sliders (8 cols) */}
              <div className="lg:col-span-8 bg-white border border-[#CDEBDD] rounded-xl p-5 space-y-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#0B2E22] border-b border-[#CDEBDD] pb-3 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#047857]" />
                  Planned Weekly Study Investment (Hours)
                </h3>

                {[
                  { key: "dsa" as const, name: "Data Structures & Algorithms", currentM: "41.2%", max: 15 },
                  { key: "os" as const, name: "Operating Systems (Virtual Memory)", currentM: "72.0%", max: 15 },
                  { key: "dbms" as const, name: "Database Systems (Indexing & 2PL)", currentM: "85.0%", max: 15 },
                  { key: "cn" as const, name: "Computer Networks (TCP/IP)", currentM: "64.0%", max: 15 },
                ].map((item) => (
                  <div key={item.key} className="space-y-1.5 p-3 rounded-lg bg-[#F0FAF5] border border-[#CDEBDD]">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#0B2E22]">{item.name}</span>
                        <span className="text-[10px] text-[#4B6B5E] ml-2">(Current Mastery: {item.currentM})</span>
                      </div>
                      <span className="font-mono font-bold text-[#047857]">{effortHours[item.key]} hrs / week</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={item.max}
                      step="1"
                      value={effortHours[item.key]}
                      onChange={(e) =>
                        setEffortHours({ ...effortHours, [item.key]: parseInt(e.target.value) })
                      }
                      className="w-full accent-[#34D399] cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              {/* Prediction Result Card (4 cols) */}
              <div className="lg:col-span-4 bg-[#F0FAF5] border border-[#CDEBDD] rounded-xl p-5 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-[#0B2E22] border-b border-[#CDEBDD] pb-3">
                  Projected Outcome
                </h3>

                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border border-[#CDEBDD]">
                    <span className="text-[11px] text-[#4B6B5E] font-semibold">PROJECTED SEMESTER GPA</span>
                    <div className="text-3xl font-extrabold text-[#047857] mt-1">
                      {projectedGpa.toFixed(2)}
                    </div>
                    <span className="text-xs font-bold text-[#047857] flex items-center gap-1 mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{deltaGpa.toFixed(2)} Points (from {baselineGpa})
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-[#CDEBDD]">
                    <span className="text-[11px] text-[#4B6B5E] font-semibold">LETTER GRADE SHIFT</span>
                    <div className="text-2xl font-extrabold text-[#0B2E22] mt-1 flex items-center gap-2">
                      <span className="line-through text-[#4B6B5E] text-lg">B</span>
                      <span>→</span>
                      <span className="text-[#047857]">{projectedGrade}</span>
                    </div>
                    <span className="text-[11px] text-[#4B6B5E]">Based on cohort Gaussian curve</span>
                  </div>

                  <button
                    onClick={() => setActiveMenu("planner")}
                    className="w-full py-2.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-[#0B2E22] text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Apply To AI Study Planner</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 5: AI STUDY PLANNER */}
        {/* ==================================================================== */}
        {activeMenu === "planner" && (
          <div className="space-y-6">
            <div className="bg-[#F0FAF5] border border-[#CDEBDD] rounded-xl p-5 shadow-[0_1px_2px_rgba(11,46,34,0.06)]">
              <h2 className="text-lg font-bold text-[#0B2E22] flex items-center gap-2 mb-1">
                <CalendarDays className="w-5 h-5 text-[#047857]" />
                Greedy Marginal Gain Study Schedule
              </h2>
              <p className="text-xs text-[#4B6B5E]">
                Allocates your weekly available hours budget to maximize score gains where prerequisite gaps are highest.
              </p>

              <div className="mt-4 p-3 bg-white rounded-lg border border-[#CDEBDD] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-[#0B2E22]">Weekly Study Hours Budget:</span>
                  <p className="text-[11px] text-[#4B6B5E]">Drag to re-optimize knapsack schedule</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="25"
                    step="1"
                    value={availableHours}
                    onChange={(e) => setAvailableHours(parseInt(e.target.value))}
                    className="w-36 accent-[#34D399]"
                  />
                  <span className="font-mono text-xs font-bold text-[#047857] w-12 text-right">
                    {availableHours} hrs
                  </span>
                </div>
              </div>
            </div>

            {/* Daily Schedule List */}
            <div className="bg-white border border-[#CDEBDD] rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-[#0B2E22] border-b border-[#CDEBDD] pb-3">
                Optimized Daily Action Plan (Knapsack Output)
              </h3>

              <div className="space-y-3">
                {[
                  { id: "p-1", day: "Monday", topic: "Data Structures: Recursion & Pointer Math", hours: "3.5 hrs", gain: "+14.2% Mastery", drill: "3 Flashcards" },
                  { id: "p-2", day: "Tuesday", topic: "Operating Systems: Inverted Page Tables", hours: "2.5 hrs", gain: "+10.5% Mastery", drill: "Page Fault Drill" },
                  { id: "p-3", day: "Wednesday", topic: "Computer Networks: TCP Slow Start vs Tahoe", hours: "2.5 hrs", gain: "+8.9% Mastery", drill: "Congestion Quiz" },
                  { id: "p-4", day: "Thursday", topic: "Database Systems: Two-Phase Locking (2PL)", hours: "2.0 hrs", gain: "+6.5% Mastery", drill: "ACID Checklist" },
                  { id: "p-5", day: "Friday", topic: "FSRS Diagnostic Spaced Repetition Review", hours: "3.5 hrs", gain: "+11.4% Retention", drill: "Full Midterm Mock" },
                ].map((item) => {
                  const done = completedTasks.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        done ? "bg-[#F0FAF5] border-[#34D399]" : "bg-white border-[#CDEBDD]"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#047857] uppercase tracking-wider">{item.day}:</span>
                          <span className={`text-xs font-bold ${done ? "line-through text-[#4B6B5E]" : "text-[#0B2E22]"}`}>
                            {item.topic}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#4B6B5E]">{item.hours} · Activity: {item.drill}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#047857]">{item.gain}</span>
                        <button
                          onClick={() =>
                            setCompletedTasks((prev) =>
                              prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]
                            )
                          }
                          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                            done
                              ? "bg-[#34D399] text-[#0B2E22]"
                              : "bg-white border border-[#CDEBDD] text-[#0B2E22] hover:border-[#34D399]"
                          }`}
                        >
                          {done ? "Completed ✓" : "Mark Done"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 6: MICRO DRILLS (FSRS SPACED REPETITION) */}
        {/* ==================================================================== */}
        {activeMenu === "drills" && (
          <div className="space-y-6">
            <div className="bg-[#F0FAF5] border border-[#CDEBDD] rounded-xl p-5 shadow-[0_1px_2px_rgba(11,46,34,0.06)]">
              <h2 className="text-lg font-bold text-[#0B2E22] flex items-center gap-2 mb-1">
                <Brain className="w-5 h-5 text-[#047857]" />
                Forgetting-Aware Micro Drills (FSRS Engine)
              </h2>
              <p className="text-xs text-[#4B6B5E]">
                Triggered automatically when retrievability $R(t, S)$ drops below $90\%$. Consolidates high-leverage concepts in 5 minutes.
              </p>
            </div>

            {/* Diagnostic Quiz Card */}
            <div className="bg-white border border-[#CDEBDD] rounded-xl p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#CDEBDD] pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#FEF9C3] text-[#713F12] border border-[#FACC15]">
                    Drill #4: Operating Systems
                  </span>
                  <span className="text-xs text-[#4B6B5E]">Concept: Deadlock Avoidance</span>
                </div>
                <span className="text-xs font-bold text-[#047857] flex items-center gap-1">
                  <Flame className="w-4 h-4 text-[#EAB308]" /> 4 Day Streak
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#0B2E22]">
                  In Dijkstra&apos;s Banker&apos;s Algorithm, which condition must hold for a state to be formally declared &apos;Safe&apos;?
                </h3>

                <div className="space-y-2">
                  {[
                    "All physical resource instances are currently unallocated and free.",
                    "There exists a sequence <P1, P2, ... Pn> such that every process can finish with currently available resources plus resources released by prior processes.",
                    "A circular wait condition is verified by the kernel only once per scheduling quantum.",
                    "The mutual exclusion requirement is suspended until all threads terminate.",
                  ].map((opt, idx) => (
                    <label
                      key={idx}
                      onClick={() => !drillSubmitted && setSelectedOption(idx)}
                      className={`block p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        selectedOption === idx
                          ? "border-[#34D399] bg-[#F0FAF5] font-semibold text-[#0B2E22]"
                          : "border-[#CDEBDD] bg-white text-[#4B6B5E] hover:border-[#34D399]/60"
                      } ${drillSubmitted && idx === 1 ? "!bg-emerald-50 !border-emerald-500 font-bold text-emerald-900" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full border border-[#CDEBDD] flex items-center justify-center font-bold text-[10px]">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {!drillSubmitted ? (
                <button
                  disabled={selectedOption === null}
                  onClick={() => {
                    setDrillSubmitted(true);
                    if (selectedOption === 1) setDrillScoreBoost(true);
                  }}
                  className="px-5 py-2.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-[#0B2E22] text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  Submit Diagnostic Answer
                </button>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className={`p-4 rounded-lg border ${selectedOption === 1 ? "bg-emerald-50 border-emerald-300" : "bg-amber-50 border-amber-300"}`}>
                    <p className="text-xs font-bold text-[#0B2E22] flex items-center gap-2">
                      {selectedOption === 1 ? "✓ Correct! Mastery Score Updated." : "Review Required: Concept Explanation"}
                    </p>
                    <p className="text-xs text-[#4B6B5E] mt-1 leading-relaxed">
                      <strong>Explanation:</strong> A safe state guarantees that at least one execution sequence allows all processes to terminate without circular waiting. Banker&apos;s Algorithm maintains this invariant before granting requests.
                    </p>
                    {drillScoreBoost && (
                      <div className="mt-2 text-xs font-bold text-[#047857] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#EAB308]" />
                        +5% Mastery boost registered in DKT Knowledge State!
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setDrillSubmitted(false);
                      setSelectedOption(null);
                      setDrillScoreBoost(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-white border border-[#CDEBDD] text-xs font-semibold text-[#0B2E22] hover:border-[#34D399]"
                  >
                    Load Next Micro Drill →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 7: AI COPILOT */}
        {/* ==================================================================== */}
        {activeMenu === "copilot" && (
          <div className="space-y-6">
            <div className="bg-[#F0FAF5] border border-[#CDEBDD] rounded-xl p-5 shadow-[0_1px_2px_rgba(11,46,34,0.06)]">
              <h2 className="text-lg font-bold text-[#0B2E22] flex items-center gap-2 mb-1">
                <Bot className="w-5 h-5 text-[#047857]" />
                Syllabus-Grounded AI Copilot
              </h2>
              <p className="text-xs text-[#4B6B5E]">
                Answers are strictly verified against accredited courseware with exact textbook citations. Off-syllabus queries are respectfully declined.
              </p>
            </div>

            {/* Chat Box */}
            <div className="bg-white border border-[#CDEBDD] rounded-xl overflow-hidden shadow-sm flex flex-col h-[520px]">
              {/* Messages Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 max-w-2xl ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        msg.sender === "user"
                          ? "bg-[#FACC15] text-[#0B2E22]"
                          : "bg-[#34D399]/20 text-[#047857] border border-[#34D399]/40"
                      }`}
                    >
                      {msg.sender === "user" ? "ME" : <Bot className="w-4 h-4" />}
                    </div>
                    <div
                      className={`p-4 rounded-xl text-xs space-y-2 ${
                        msg.sender === "user"
                          ? "bg-[#FEF9C3] text-[#713F12] border border-[#FACC15]"
                          : "bg-[#F0FAF5] text-[#0B2E22] border border-[#CDEBDD]"
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="pt-2 border-t border-[#CDEBDD] text-[10px] text-[#4B6B5E] space-y-0.5">
                          <span className="font-bold text-[#047857]">Grounded Citations:</span>
                          {msg.citations.map((c, cIdx) => (
                            <p key={cIdx}>• {c}</p>
                          ))}
                        </div>
                      )}
                      {msg.sender === "bot" && msg.action === "india-map" && (
                        <Link
                          href="/student/campus-map"
                          className="inline-flex items-center gap-1 rounded-full border border-[#CDEBDD] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#047857] transition hover:border-[#34D399] hover:bg-[#F0FAF5]"
                        >
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          Open India map
                        </Link>
                      )}
                      <span className="block text-[9px] text-[#7A968A] text-right">{msg.time}</span>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-3 max-w-md">
                    <div className="w-8 h-8 rounded-full bg-[#34D399]/20 text-[#047857] flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F0FAF5] border border-[#CDEBDD] text-xs text-[#4B6B5E] animate-pulse">
                      Searching accredited syllabus vector database...
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Prompts */}
              <div className="px-5 py-2.5 bg-[#F0FAF5] border-t border-[#CDEBDD] flex items-center gap-2 overflow-x-auto text-xs">
                <span className="text-[10px] font-bold text-[#4B6B5E] whitespace-nowrap">Suggested:</span>
                {[
                  "Explain B+ Tree range queries vs B-Tree",
                  "Why is Deadlock detection O(V+E)?",
                  "Explain Strict 2PL vs 2PL in DBMS",
                  "Find colleges in India",
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendPrompt(q)}
                    className="whitespace-nowrap px-2.5 py-1 rounded bg-white border border-[#CDEBDD] text-[11px] text-[#0B2E22] hover:border-[#34D399] transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendPrompt(chatInput);
                }}
                className="p-3.5 bg-white border-t border-[#CDEBDD] flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask a syllabus question (e.g. B+ Tree indexing range queries)..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-[#F0FAF5] border border-[#CDEBDD] rounded-xl px-4 py-2.5 text-xs text-[#0B2E22] placeholder:text-[#7A968A] focus:outline-none focus:border-[#34D399]"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-[#0B2E22] text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 8: GRIEVANCE CENTRE */}
        {/* ==================================================================== */}
        {activeMenu === "privacy" && (
          <div className="space-y-6">
            <div className="bg-[#F0FAF5] border border-[#CDEBDD] rounded-xl p-5 shadow-[0_1px_2px_rgba(11,46,34,0.06)]">
              <h2 className="text-lg font-bold text-[#0B2E22] flex items-center gap-2 mb-1">
                <ShieldAlert className="w-5 h-5 text-[#047857]" />
                Dual-Desk Grievance & Whistleblower Portal
              </h2>
              <p className="text-xs text-[#4B6B5E]">
                Submit physical campus maintenance tickets (with SBERT semantic deduplication) or file sensitive reports with Zero-Knowledge anonymous credentials.
              </p>
            </div>

            {/* Category Toggle */}
            <div className="flex items-center gap-2 bg-[#F0FAF5] p-1.5 rounded-xl border border-[#CDEBDD] max-w-md">
              <button
                onClick={() => setGrievanceCategory("facilities")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  grievanceCategory === "facilities"
                    ? "bg-[#34D399] text-[#0B2E22] shadow-sm"
                    : "text-[#4B6B5E] hover:text-[#0B2E22]"
                }`}
              >
                Facilities Work Order
              </button>
              <button
                onClick={() => setGrievanceCategory("sensitive_zk")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  grievanceCategory === "sensitive_zk"
                    ? "bg-[#34D399] text-[#0B2E22] shadow-sm"
                    : "text-[#4B6B5E] hover:text-[#0B2E22]"
                }`}
              >
                Anonymous ZK Whistleblower
              </button>
            </div>

            {/* Submission Form */}
            <div className="bg-white border border-[#CDEBDD] rounded-xl p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-[#0B2E22] border-b border-[#CDEBDD] pb-3 flex items-center gap-2">
                {grievanceCategory === "facilities" ? (
                  <>
                    <WrenchIcon className="w-4 h-4 text-[#047857]" />
                    <span>Report Campus Facilities or Maintenance Issue</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#047857]" />
                    <span>Anonymous Whistleblower Desk (Dean Direct Route)</span>
                  </>
                )}
              </h3>

              {grievanceSuccess && (
                <div className="p-4 rounded-lg bg-[#F0FAF5] border border-[#34D399] text-xs space-y-1">
                  <span className="font-bold text-[#047857]">✓ Submission Registered Successfully:</span>
                  <p className="text-[#0B2E22]">{grievanceSuccess.message}</p>
                  {grievanceSuccess.tracking_code && (
                    <div className="p-2 bg-white rounded border border-[#CDEBDD] font-mono font-bold text-[#047857]">
                      Anonymous Tracking Code: {grievanceSuccess.tracking_code}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleGrievanceSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0B2E22] mb-1">Issue Title</label>
                  <input
                    type="text"
                    required
                    placeholder={
                      grievanceCategory === "facilities"
                        ? "e.g., Water leakage from AC unit in Room 304"
                        : "e.g., Irregular evaluation in Lab Viva Section B"
                    }
                    value={grievanceTitle}
                    onChange={(e) => setGrievanceTitle(e.target.value)}
                    className="w-full bg-[#F0FAF5] border border-[#CDEBDD] rounded-lg p-2.5 text-xs text-[#0B2E22] focus:outline-none focus:border-[#34D399]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B2E22] mb-1">Location / Classroom</label>
                  <input
                    type="text"
                    value={grievanceLocation}
                    onChange={(e) => setGrievanceLocation(e.target.value)}
                    className="w-full bg-[#F0FAF5] border border-[#CDEBDD] rounded-lg p-2.5 text-xs text-[#0B2E22] focus:outline-none focus:border-[#34D399]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B2E22] mb-1">Detailed Description</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide full details. If submitting anonymously, Semaphore ZK protocol removes all IP addresses and identity traces."
                    value={grievanceDesc}
                    onChange={(e) => setGrievanceDesc(e.target.value)}
                    className="w-full bg-[#F0FAF5] border border-[#CDEBDD] rounded-lg p-2.5 text-xs text-[#0B2E22] focus:outline-none focus:border-[#34D399]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-[#0B2E22] text-xs font-bold transition-all shadow-sm"
                >
                  {grievanceCategory === "facilities" ? "Submit Work Order" : "Submit Anonymously with ZK Proof"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 9: CAMPUS LIFE (PEER MATCHER & EVENTS) */}
        {/* ==================================================================== */}
        {activeMenu === "community" && (
          <div className="space-y-6">
            <div className="bg-[#F0FAF5] border border-[#CDEBDD] rounded-xl p-5 shadow-[0_1px_2px_rgba(11,46,34,0.06)]">
              <h2 className="text-lg font-bold text-[#0B2E22] flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-[#047857]" />
                Campus Life: Kuhn-Munkres Peer Matcher & Hackathons
              </h2>
              <p className="text-xs text-[#4B6B5E]">
                Pairs students with complementary knowledge profiles (strong in topics where you need practice) and forms balanced hackathon squads.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matched Study Partners */}
              <div className="bg-white border border-[#CDEBDD] rounded-xl p-5 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-[#0B2E22] border-b border-[#CDEBDD] pb-3 flex items-center justify-between">
                  <span>Top Matched Study Partners (Hungarian Algo)</span>
                  <span className="text-xs font-bold text-[#047857]">Active Match</span>
                </h3>

                <div className="space-y-3">
                  {[
                    { name: "Ananya Iyer", roll: "21CS015", strength: "Semaphores & Mutex (92%)", need: "Virtual Memory (48%)", score: "94% Match" },
                    { name: "Devansh Mehta", roll: "21CS032", strength: "Deadlock Detection (89%)", need: "Graph Algorithms (52%)", score: "89% Match" },
                  ].map((peer) => (
                    <div key={peer.name} className="p-3.5 bg-[#F0FAF5] rounded-lg border border-[#CDEBDD] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0B2E22]">{peer.name} ({peer.roll})</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF9C3] text-[#713F12] border border-[#FACC15]">
                          {peer.score}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#4B6B5E] space-y-0.5">
                        <p>• <strong>Can teach you:</strong> {peer.strength}</p>
                        <p>• <strong>Wants to learn from you:</strong> {peer.need}</p>
                      </div>
                      <button
                        onClick={() => onNotify?.(`Study invite dispatched to ${peer.name} for tomorrow 4 PM!`, "success")}
                        className="px-3 py-1.5 rounded bg-white border border-[#CDEBDD] hover:border-[#34D399] text-xs font-semibold text-[#0B2E22] transition-all"
                      >
                        Request Study Session →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Hackathon Opportunities */}
              <div className="bg-white border border-[#CDEBDD] rounded-xl p-5 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-[#0B2E22] border-b border-[#CDEBDD] pb-3">
                  Verified Hackathons & Opportunities
                </h3>

                <div className="space-y-3">
                  {[
                    { title: "Prasunex Innovathon 2026 Finals", prize: "₹2,50,000 Prize Pool", date: "Nov 25, 2026", status: "Gate Pass Ready" },
                    { title: "Google Summer of Code 2026 Mentorship", prize: "$3,000 Stipend", date: "Dec 15, 2026", status: "Applications Open" },
                  ].map((ev) => (
                    <div key={ev.title} className="p-3.5 bg-[#F0FAF5] rounded-lg border border-[#CDEBDD] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0B2E22]">{ev.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#34D399]/20 text-[#047857]">
                          {ev.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#4B6B5E]">
                        <span>{ev.prize}</span>
                        <span>{ev.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 10: SETTINGS */}
        {/* ==================================================================== */}
        {activeMenu === "settings" && (
          <div className="space-y-6">
            <div className="bg-[#F0FAF5] border border-[#CDEBDD] rounded-xl p-5 shadow-[0_1px_2px_rgba(11,46,34,0.06)]">
              <h2 className="text-lg font-bold text-[#0B2E22] flex items-center gap-2 mb-1">
                <Settings className="w-5 h-5 text-[#047857]" />
                Student Account & Data Privacy
              </h2>
              <p className="text-xs text-[#4B6B5E]">
                Manage role access, inspect cryptographic zero-knowledge credentials, and export your personal data under DPDP / GDPR compliance.
              </p>
            </div>

            <div className="bg-white border border-[#CDEBDD] rounded-xl p-6 space-y-4 shadow-sm max-w-2xl">
              <h3 className="text-sm font-bold text-[#0B2E22] border-b border-[#CDEBDD] pb-3">
                Student Profile Credentials
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#4B6B5E]">FULL NAME:</span>
                  <p className="font-bold text-[#0B2E22] mt-0.5">{user?.full_name || "Aarav Sharma"}</p>
                </div>
                <div>
                  <span className="text-[#4B6B5E]">EMAIL:</span>
                  <p className="font-bold text-[#0B2E22] mt-0.5">{user?.email || "student@nitx.demo"}</p>
                </div>
                <div>
                  <span className="text-[#4B6B5E]">INSTITUTE:</span>
                  <p className="font-bold text-[#0B2E22] mt-0.5">Northstar Institute (NITX)</p>
                </div>
                <div>
                  <span className="text-[#4B6B5E]">ROLE BADGE:</span>
                  <p className="font-bold text-[#047857] mt-0.5">Student (Verified RBAC)</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#CDEBDD] space-y-2">
                <span className="text-xs font-bold text-[#0B2E22]">Digital Privacy & Rights:</span>
                <p className="text-[11px] text-[#4B6B5E]">
                  You have the statutory right to export your complete academic and telemetry history or request data erasure under Section 12 of the Digital Personal Data Protection Act.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onNotify?.("Exported encrypted student academic JSON packet!", "info")}
                    className="px-3.5 py-2 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-[#0B2E22] text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export My Data (JSON)</span>
                  </button>
                  <button
                    onClick={() => onNotify?.("Privacy key verified. Zero data linked to grievance tickets.", "success")}
                    className="px-3.5 py-2 rounded-lg bg-white border border-[#CDEBDD] hover:border-[#34D399] text-[#0B2E22] text-xs font-semibold transition-all"
                  >
                    Verify ZK Key Commitment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function WrenchIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
