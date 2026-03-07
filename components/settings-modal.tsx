"use client"

import { useState, useEffect } from "react"
import { X, Plus, CreditCard, Globe, Ban, CheckCircle2 } from "lucide-react"
import { 
  getSettings, 
  addBlockedCardBin, 
  removeBlockedCardBin, 
  addAllowedCountry, 
  removeAllowedCountry,
  type Settings 
} from "@/lib/firebase/settings"
import { toast } from "sonner"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

// List of countries with flags
const COUNTRIES = [
  { code: "SAU", name: "السعودية", flag: "🇸🇦" },
  { code: "ARE", name: "الإمارات", flag: "🇦🇪" },
  { code: "KWT", name: "الكويت", flag: "🇰🇼" },
  { code: "BHR", name: "البحرين", flag: "🇧🇭" },
  { code: "OMN", name: "عمان", flag: "🇴🇲" },
  { code: "QAT", name: "قطر", flag: "🇶🇦" },
  { code: "JOR", name: "الأردن", flag: "🇯🇴" },
  { code: "EGY", name: "مصر", flag: "🇪🇬" },
  { code: "LBN", name: "لبنان", flag: "🇱🇧" },
  { code: "IRQ", name: "العراق", flag: "🇮🇶" },
  { code: "SYR", name: "سوريا", flag: "🇸🇾" },
  { code: "YEM", name: "اليمن", flag: "🇾🇪" },
  { code: "PSE", name: "فلسطين", flag: "🇵🇸" },
  { code: "MAR", name: "المغرب", flag: "🇲🇦" },
  { code: "DZA", name: "الجزائر", flag: "🇩🇿" },
  { code: "TUN", name: "تونس", flag: "🇹🇳" },
  { code: "LBY", name: "ليبيا", flag: "🇱🇾" },
  { code: "SDN", name: "السودان", flag: "🇸🇩" },
]

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>({
    blockedCardBins: [],
    allowedCountries: []
  })
  const [newBinsInput, setNewBinsInput] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"cards" | "countries">("cards")

  // Load settings when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  const loadSettings = async () => {
    try {
      const data = await getSettings()
      setSettings(data)
    } catch (error) {
      console.error("Error loading settings:", error)
      toast.error("فشل تحميل الإعدادات")
    }
  }

  const handleAddBins = async () => {
    // Split by comma, space, or newline
    const bins = newBinsInput
      .split(/[\s,\n]+/)
      .map(bin => bin.trim())
      .filter(bin => bin.length === 4 && /^\d+$/.test(bin))

    if (bins.length === 0) {
      toast.error("يجب إدخال أرقام صحيحة (4 أرقام لكل بطاقة)")
      return
    }

    setLoading(true)
    try {
      for (const bin of bins) {
        await addBlockedCardBin(bin)
      }
      await loadSettings()
      setNewBinsInput("")
      toast.success(`تم إضافة ${bins.length} بطاقة محظورة`)
    } catch (error) {
      console.error("Error adding blocked BINs:", error)
      toast.error("فشل إضافة البطاقات")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveBin = async (bin: string) => {
    setLoading(true)
    try {
      await removeBlockedCardBin(bin)
      await loadSettings()
      toast.success("تم إزالة البطاقة المحظورة")
    } catch (error) {
      console.error("Error removing blocked BIN:", error)
      toast.error("فشل إزالة البطاقة")
    } finally {
      setLoading(false)
    }
  }

  const handleAddCountry = async () => {
    if (!selectedCountry) {
      toast.error("يرجى اختيار دولة")
      return
    }

    setLoading(true)
    try {
      await addAllowedCountry(selectedCountry)
      await loadSettings()
      setSelectedCountry("")
      toast.success("تم إضافة الدولة المسموحة")
    } catch (error) {
      console.error("Error adding allowed country:", error)
      toast.error("فشل إضافة الدولة")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveCountry = async (country: string) => {
    setLoading(true)
    try {
      await removeAllowedCountry(country)
      await loadSettings()
      toast.success("تم إزالة الدولة المسموحة")
    } catch (error) {
      console.error("Error removing allowed country:", error)
      toast.error("فشل إزالة الدولة")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const availableCountries = COUNTRIES.filter(
    (country) => !settings.allowedCountries.includes(country.code)
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-800 p-5 text-white md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold">إعدادات النظام</h2>
              <p className="mt-1 text-sm text-slate-200">
                إدارة حجب البطاقات وتقييد الوصول حسب الدولة
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white/15 px-3 py-1">
                  بطاقات محظورة: {settings.blockedCardBins.length}
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1">
                  دول مسموحة: {settings.allowedCountries.length}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2.5 text-slate-100 transition hover:bg-white/20"
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveTab("cards")}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                activeTab === "cards"
                  ? "bg-sky-100 text-sky-800"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>حجب بطاقات الدفع</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600">
                {settings.blockedCardBins.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("countries")}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                activeTab === "countries"
                  ? "bg-purple-100 text-purple-800"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Globe className="h-4 w-4" />
              <span>تقييد الوصول حسب الدولة</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600">
                {settings.allowedCountries.length}
              </span>
            </button>
          </div>
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-5 md:p-6">
          {activeTab === "cards" ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="mb-1 text-lg font-bold text-slate-800">
                  قائمة حجب بطاقات الدفع
                </h3>
                <p className="text-sm text-slate-600">
                  أدخل BIN مكوّن من 4 أرقام. يمكنك إضافة مجموعة أرقام مفصولة
                  بمسافة أو فاصلة أو سطر جديد.
                </p>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
                <textarea
                  value={newBinsInput}
                  onChange={(e) => setNewBinsInput(e.target.value)}
                  placeholder={"مثال: 4890, 4458, 4909\nأو كل رقم في سطر منفصل"}
                  rows={4}
                  dir="ltr"
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-mono text-slate-800 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={handleAddBins}
                    disabled={loading || !newBinsInput.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    <Plus className="h-4 w-4" />
                    حفظ البطاقات
                  </button>
                  <button
                    onClick={() => setNewBinsInput("")}
                    disabled={loading || !newBinsInput.trim()}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    مسح الحقل
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                {settings.blockedCardBins.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-slate-500">
                    <Ban className="mx-auto mb-2 h-10 w-10 opacity-45" />
                    <p className="font-medium">لا توجد بطاقات محظورة</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {settings.blockedCardBins.map((bin) => (
                      <div
                        key={bin}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 py-2"
                      >
                        <span className="font-mono text-sm font-semibold text-slate-700">
                          {bin}
                        </span>
                        <button
                          onClick={() => handleRemoveBin(bin)}
                          disabled={loading}
                          className="rounded-full p-1 text-slate-500 transition hover:bg-rose-100 hover:text-rose-600"
                          aria-label={`حذف ${bin}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="mb-1 text-lg font-bold text-slate-800">
                  تقييد الوصول حسب الدولة
                </h3>
                <p className="text-sm text-slate-600">
                  لا يُسمح بالدخول إلا للدول الموجودة في القائمة التالية.
                </p>
              </div>

              <div className="rounded-2xl border border-purple-200 bg-purple-50/65 p-4">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  اختر دولة لإضافتها
                </label>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="min-w-[220px] flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    dir="rtl"
                  >
                    <option value="">اختر دولة...</option>
                    {availableCountries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddCountry}
                    disabled={loading || !selectedCountry}
                    className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    إضافة
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  يمكنك إضافة أكثر من دولة غير موجودة في القائمة.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                {settings.allowedCountries.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-slate-500">
                    <Globe className="mx-auto mb-2 h-10 w-10 opacity-45" />
                    <p className="font-medium">جميع الدول مسموحة حالياً</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {settings.allowedCountries.map((countryCode) => {
                      const country = COUNTRIES.find(
                        (countryItem) => countryItem.code === countryCode
                      )
                      return (
                        <div
                          key={countryCode}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2"
                        >
                          <span className="text-lg">{country?.flag || "🌍"}</span>
                          <span className="text-sm font-semibold text-slate-700">
                            {country?.name || countryCode}
                          </span>
                          <button
                            onClick={() => handleRemoveCountry(countryCode)}
                            disabled={loading}
                            className="rounded-full p-1 text-slate-500 transition hover:bg-rose-100 hover:text-rose-600"
                            aria-label={`حذف ${countryCode}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <div className="hidden items-center gap-2 text-xs text-slate-500 md:flex">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            يتم حفظ جميع التغييرات مباشرة.
          </div>
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 md:w-auto md:px-8"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}
