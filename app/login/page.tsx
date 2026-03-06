"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function LoginPage() {
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
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50 px-4"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-2xl backdrop-blur">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 mb-3">
            BCare Dashboard
          </span>
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">لوحة التحكم</h1>
          <p className="text-slate-600">تسجيل الدخول للإدارة</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all outline-none"
              placeholder="admin@example.com"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all outline-none"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>© 2025 لوحة التحكم - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  )
}
