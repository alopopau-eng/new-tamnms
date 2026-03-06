"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { SettingsModal } from "@/components/settings-modal";
import {
  Activity,
  ChartNoAxesColumn,
  CreditCard,
  LogOut,
  Settings,
  Smartphone,
  Users,
} from "lucide-react";

interface AnalyticsData {
  activeUsers: number;
  todayVisitors: number;
  totalVisitors: number;
  visitorsWithCard: number;
  visitorsWithPhone: number;
  devices: Array<{ device: string; users: number }>;
  countries: Array<{ country: string; users: number }>;
}

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    activeUsers: 0,
    todayVisitors: 0,
    totalVisitors: 0,
    visitorsWithCard: 0,
    visitorsWithPhone: 0,
    devices: [],
    countries: [],
  });
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/analytics");
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const stats = [
    {
      title: "نشط الآن",
      value: analytics.activeUsers,
      icon: Activity,
      accent: "text-emerald-700",
      surface: "from-emerald-50 to-emerald-100/70 border-emerald-200/80",
      dot: "bg-emerald-500",
    },
    {
      title: "زوار اليوم",
      value: analytics.todayVisitors,
      icon: Users,
      accent: "text-blue-700",
      surface: "from-blue-50 to-blue-100/70 border-blue-200/80",
      dot: "bg-blue-500",
    },
    {
      title: "إجمالي (30 يوم)",
      value: analytics.totalVisitors,
      icon: ChartNoAxesColumn,
      accent: "text-violet-700",
      surface: "from-violet-50 to-violet-100/70 border-violet-200/80",
      dot: "bg-violet-500",
    },
    {
      title: "لديهم بطاقة",
      value: analytics.visitorsWithCard,
      icon: CreditCard,
      accent: "text-amber-700",
      surface: "from-amber-50 to-amber-100/70 border-amber-200/80",
      dot: "bg-amber-500",
    },
    {
      title: "لديهم هاتف",
      value: analytics.visitorsWithPhone,
      icon: Smartphone,
      accent: "text-fuchsia-700",
      surface: "from-fuchsia-50 to-fuchsia-100/70 border-fuchsia-200/80",
      dot: "bg-fuchsia-500",
    },
  ];

  return (
    <div className="border-b border-slate-200/80 bg-white/85 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="border-b border-slate-200/70 px-4 py-3 md:px-6 md:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 md:text-2xl">
              لوحة التحكم
            </h1>
            <p className="text-xs text-slate-600 md:text-sm">إدارة زوار BCare</p>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-left md:block">
              <p className="text-sm font-semibold text-slate-800">{user.email}</p>
              <p className="text-xs text-slate-500">مسؤول النظام</p>
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              title="إعدادات"
            >
              <Settings className="h-4 w-4 md:h-5 md:w-5" />
            </button>

            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 md:text-sm"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 md:px-6">
        <div className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className={`rounded-2xl border bg-gradient-to-br p-3 shadow-sm ${stat.surface}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span
                      className={`h-2 w-2 rounded-full ${stat.dot} ${
                        stat.title === "نشط الآن" ? "animate-pulse" : ""
                      }`}
                    />
                    {stat.title}
                  </div>
                  <Icon className={`h-4 w-4 ${stat.accent}`} />
                </div>
                <p className={`text-xl font-extrabold md:text-2xl ${stat.accent}`}>
                  {loading ? "..." : stat.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
