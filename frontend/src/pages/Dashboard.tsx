import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { 
  Users, 
  CalendarCheck, 
  MonitorPlay,
  Bus,
  TrendingUp,
  ArrowRight,
  Clock,
  PieChart,
  Calendar,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { fetchApi } from "../utils/api";

interface ActivityItem {
  id?: string | number;
  type?: string;
  title?: string;
  time?: string;
  status?: string;
  [key: string]: unknown;
}

interface SummaryData {
  totals: {
    auditorium: number;
    classroom: number;
    transport: number;
    overall: number;
    [key: string]: number;
  };
  todayActivities: ActivityItem[];
}

const getGreetingText = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const getDateText = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
};

export default function Dashboard() {
  const [greeting] = useState(getGreetingText);
  const [dateStr] = useState(getDateText);
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totals: { auditorium: 0, classroom: 0, transport: 0, overall: 0 },
    todayActivities: []
  });
  const userRole = localStorage.getItem("userRole") || "user";

  useEffect(() => {
    let isMounted = true;
    fetchApi('/dashboard/stats')
      .then((res) => {
        const data = res as SummaryData;
        if (isMounted && data && data.totals) {
          setSummaryData(data);
        }
      })
      .catch((error) => {
        console.error("Failed to load dashboard stats", error);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = [
    { title: "Classroom Bookings", value: summaryData.totals.classroom.toString(), icon: CalendarCheck, trend: "+12%", trendUp: true, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Transport Requests", value: summaryData.totals.transport.toString(), icon: Bus, trend: "-2%", trendUp: false, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Auditorium Events", value: summaryData.totals.auditorium.toString(), icon: MonitorPlay, trend: "+5%", trendUp: true, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Total Resources", value: summaryData.totals.overall.toString(), icon: TrendingUp, trend: "+8%", trendUp: true, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  const quickLinks = [
    { title: "Auditorium", desc: "Manage large events", icon: MonitorPlay, link: "/auditorium-booking", color: "from-blue-500 to-indigo-600" },
    { title: "Classrooms", desc: "Schedule lectures", icon: Users, link: "/classroom-booking", color: "from-emerald-500 to-teal-600" },
    { title: "Transport", desc: "Book vehicles", icon: Bus, link: "/transport-booking", color: "from-orange-500 to-amber-600" },
  ];

  return (
    <DashboardLayout>
      
      {/* Hero Welcome Section */}
      <div className="mb-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-100/50 to-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {greeting}, <span className="capitalize text-brand-600">{userRole}</span> 👋
          </h1>
          <p className="mt-2 text-slate-500 font-medium">
            {dateStr} • Here's what's happening with your resources today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-md ${
                  stat.trendUp ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                }`}>
                  {stat.trend}
                </div>
              </div>
              <div>
                <h3 className="text-slate-500 text-sm font-medium">{stat.title}</h3>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Permanent Information Boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Today's Schedule Box */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[500px]">
          <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
            <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Today's Works & Schedule</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
            {summaryData.todayActivities.length > 0 ? (
              summaryData.todayActivities.map((act, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-200 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-1.5 h-12 rounded-full ${
                      act.type === 'Maintenance' ? 'bg-amber-400' : 
                      act.type === 'Classroom' ? 'bg-emerald-400' :
                      act.type === 'Transport' ? 'bg-orange-400' : 'bg-blue-400'
                    }`}></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-0.5">{act.type}</p>
                      <h4 className="font-bold text-slate-800 group-hover:text-brand-600 transition-colors truncate max-w-[200px] md:max-w-md">{act.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500 font-bold">{act.time}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest bg-white border border-slate-100 shadow-sm ${
                    act.status === 'Accepted' || act.status === 'Active' ? 'text-emerald-600' : 
                    act.status === 'Pending' ? 'text-amber-600' : 'text-slate-500'
                  }`}>
                    {act.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                <AlertCircle className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-slate-400 font-bold">No tasks or bookings for today</p>
                <p className="text-slate-300 text-xs mt-1">Resources are currently available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Statistics & Overview Box */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col h-[500px]">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <PieChart className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Booking Summary</h2>
          </div>

          <div className="space-y-6 flex-1">
             {[
                { label: "Classrooms", count: summaryData.totals.classroom, color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
                { label: "Transport", count: summaryData.totals.transport, color: "text-orange-600", bg: "bg-orange-50", icon: Bus },
                { label: "Auditorium", count: summaryData.totals.auditorium, color: "text-blue-600", bg: "bg-blue-50", icon: MonitorPlay },
                { label: "Overall Total", count: summaryData.totals.overall, color: "text-slate-700", bg: "bg-slate-100", icon: TrendingUp },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-2xl border border-slate-50 shadow-sm ${item.bg}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <p className={`text-3xl font-black ${item.color}`}>{item.count}</p>
                </div>
              ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-50 text-center">
             <p className="text-xs font-medium text-slate-400">Updates in real-time based on approvals</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-slate-800 mb-4 px-1 flex items-center gap-2">
           Explore Modules
           <ArrowRight className="w-4 h-4 text-slate-300" />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickLinks.map((link, idx) => {
            const Icon = link.icon;
            return (
              <a 
                key={idx} 
                href={link.link}
                className="relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all group"
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${link.color}`}></div>
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${link.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{link.title}</h3>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">{link.desc}</p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>

    </DashboardLayout>
  );
}