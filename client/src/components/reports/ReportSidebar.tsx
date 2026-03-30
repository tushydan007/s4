import { motion, AnimatePresence } from "framer-motion";
import { HiBars3, HiXMark, HiMicrophone, HiClock } from "react-icons/hi2";

import { useAppDispatch, useAppSelector } from "@/store";
import { toggleSidebar, openReportDetail } from "@/store/slices/uiSlice";
import { useGetReportsQuery } from "@/store/api/reportApi";
import { SEVERITY_LEVELS, REPORT_CATEGORIES } from "@/types";

export default function ReportSidebar() {
  const dispatch = useAppDispatch();
  const { sidebarOpen } = useAppSelector((state) => state.ui);
  const { data: reportsData, isLoading } = useGetReportsQuery();

  const reports = reportsData?.results ?? [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  };

  return (
    <>
      {/* Toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => dispatch(toggleSidebar())}
        className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg text-navy-700 hover:bg-white transition-colors"
      >
        {sidebarOpen ? (
          <HiXMark className="w-5 h-5" />
        ) : (
          <HiBars3 className="w-5 h-5" />
        )}
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 bg-navy-950/40 sm:hidden"
              onClick={() => dispatch(toggleSidebar())}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 z-20 w-full sm:w-80 h-full bg-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-navy-100">
                <h3 className="text-lg font-bold text-navy-900">
                  Recent Reports
                </h3>
                <button
                  onClick={() => dispatch(toggleSidebar())}
                  className="p-1.5 hover:bg-navy-100 rounded-lg transition-colors"
                >
                  <HiXMark className="w-5 h-5 text-navy-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
                  </div>
                )}

                {!isLoading && reports.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                    <HiMicrophone className="w-12 h-12 text-navy-200 mb-3" />
                    <p className="text-navy-500 font-medium">No reports yet</p>
                    <p className="text-navy-400 text-sm mt-1">
                      Right-click on the map to create a report
                    </p>
                  </div>
                )}

                {reports.map((report, idx) => {
                  const severity = SEVERITY_LEVELS.find(
                    (s) => s.value === report.severity,
                  );
                  const category = REPORT_CATEGORIES.find(
                    (c) => c.value === report.category,
                  );

                  return (
                    <motion.button
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => dispatch(openReportDetail(report))}
                      className="w-full text-left p-4 border-b border-navy-50 hover:bg-navy-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: severity?.color ?? "#6b7280" }}
                        >
                          <HiMicrophone className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-navy-800 text-sm truncate">
                            {report.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-navy-500">
                              {category?.icon} {report.category_display}
                            </span>
                            <span className="text-navy-300">·</span>
                            <span
                              className="text-xs font-medium"
                              style={{ color: severity?.color }}
                            >
                              {report.severity_display}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1.5 text-navy-400">
                            <HiClock className="w-3 h-3" />
                            <span className="text-xs">
                              {formatDate(report.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-navy-100 text-center">
                <span className="text-xs text-navy-400">
                  {reportsData?.count ?? 0} total reports
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
