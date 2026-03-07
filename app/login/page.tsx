"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useTheme } from "@/lib/theme-context"
import { Moon, Sun } from "lucide-react"

export default function LoginPage() {
  const { theme, toggleTheme } = useTheme()
  const [email, setEmail] = useState("asdar@gki.com")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/")
    } catch (err: any) {
      console.error("Login error:", err)
      if (err.code === "auth/invalid-credential") {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة")
      } else if (err.code === "auth/user-not-found") {
        setError("المستخدم غير موجود")
      } else if (err.code === "auth/wrong-password") {
        setError("كلمة المرور غير صحيحة")
      } else if (err.code === "auth/too-many-requests") {
        setError("تم تجاوز عدد المحاولات. يرجى المحاولة لاحقاً")
      } else {
        setError("حدث خطأ أثناء تسجيل الدخول")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900"
      dir="rtl"
    >
      <button
        onClick={toggleTheme}
        className="absolute left-4 top-4 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
        title={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
        aria-label={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <span className="mb-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            BCare Dashboard
          </span>
          <h1 className="mb-2 text-3xl font-extrabold text-slate-800 dark:text-slate-100">لوحة التحكم</h1>
          <p className="text-slate-600 dark:text-slate-300">تسجيل الدخول للإدارة</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-900/60"
              placeholder="admin@example.com"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-900/60"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>© 2025 لوحة التحكم - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  )
}
