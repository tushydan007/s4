import { motion } from "framer-motion";
import {
  HiMicrophone,
  HiClock,
  HiMapPin,
  HiUser,
  HiPlay,
  HiPause,
  HiPhoto,
  HiVideoCamera,
} from "react-icons/hi2";
import { useRef, useState } from "react";

import { useAppDispatch, useAppSelector } from "@/store";
import { closeReportDetail } from "@/store/slices/uiSlice";
import Modal from "@/components/ui/Modal";
import { SEVERITY_LEVELS, REPORT_CATEGORIES } from "@/types";

export default function ReportDetailModal() {
  const dispatch = useAppDispatch();
  const { selectedReport } = useAppSelector((state) => state.ui);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);

  if (!selectedReport) return null;

  const severity = SEVERITY_LEVELS.find(
    (s) => s.value === selectedReport.severity,
  );
  const category = REPORT_CATEGORIES.find(
    (c) => c.value === selectedReport.category,
  );
  const images = selectedReport.media.filter((m) => m.media_type === "image");
  const videos = selectedReport.media.filter((m) => m.media_type === "video");

  const togglePlayback = () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (!selectedReport.voice_note) return;

    const audio = new Audio(selectedReport.voice_note);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCoordinate = (value: unknown) => {
    const numeric = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numeric) ? numeric.toFixed(6) : "N/A";
  };

  return (
    <Modal
      isOpen
      onClose={() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        dispatch(closeReportDetail());
      }}
      title="Report Details"
      size="lg"
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-navy-900">
              {selectedReport.title}
            </h3>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                style={{ background: severity?.color ?? "#6b7280" }}
              >
                {selectedReport.severity_display}
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 bg-navy-100 text-navy-700 rounded-full text-xs font-semibold">
                {category?.icon} {selectedReport.category_display}
              </span>
            </div>
          </div>
        </div>

        {/* Voice Note Player */}
        {selectedReport.voice_note && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-4 bg-navy-50 rounded-xl"
          >
            <button
              type="button"
              onClick={togglePlayback}
              className="p-3 bg-navy-800 text-white rounded-full hover:bg-navy-700 transition-colors"
            >
              {isPlaying ? (
                <HiPause className="w-5 h-5" />
              ) : (
                <HiPlay className="w-5 h-5" />
              )}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <HiMicrophone className="w-4 h-4 text-navy-500" />
                <span className="text-sm font-medium text-navy-700">
                  Voice Note
                </span>
              </div>
              <div className="w-full h-1.5 bg-navy-200 rounded-full mt-2 overflow-hidden">
                <motion.div
                  className="h-full bg-navy-600 rounded-full"
                  animate={{ width: isPlaying ? "100%" : "0%" }}
                  transition={{ duration: 30, ease: "linear" }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Description */}
        {selectedReport.description && (
          <div>
            <h4 className="text-sm font-semibold text-navy-700 mb-1.5">
              Description
            </h4>
            <p className="text-sm text-navy-600 leading-relaxed">
              {selectedReport.description}
            </p>
          </div>
        )}

        {/* Media Gallery */}
        {(images.length > 0 || videos.length > 0) && (
          <div>
            <h4 className="text-sm font-semibold text-navy-700 mb-2 flex items-center gap-1.5">
              <HiPhoto className="w-4 h-4" />
              Media ({images.length + videos.length})
            </h4>

            {/* Main preview */}
            {images.length > 0 && (
              <div className="rounded-xl overflow-hidden mb-2">
                <img
                  src={images[activeMediaIdx]?.file ?? images[0]?.file}
                  alt="Report media"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Thumbnails */}
            <div className="flex gap-2 flex-wrap">
              {images.map((m, idx) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMediaIdx(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                    idx === activeMediaIdx
                      ? "border-navy-600"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={m.file}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              {videos.map((m) => (
                <a
                  key={m.id}
                  href={m.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-lg bg-navy-100 flex items-center justify-center border-2 border-transparent hover:border-navy-400"
                >
                  <HiVideoCamera className="w-5 h-5 text-navy-500" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 p-3 bg-navy-50 rounded-lg">
            <HiUser className="w-4 h-4 text-navy-400" />
            <div>
              <p className="text-navy-500 text-xs">Reported by</p>
              <p className="font-medium text-navy-700">
                {selectedReport.user_name || selectedReport.user_email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-navy-50 rounded-lg">
            <HiClock className="w-4 h-4 text-navy-400" />
            <div>
              <p className="text-navy-500 text-xs">Date</p>
              <p className="font-medium text-navy-700">
                {formatDate(selectedReport.created_at)}
              </p>
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-2 p-3 bg-navy-50 rounded-lg">
            <HiMapPin className="w-4 h-4 text-navy-400" />
            <div>
              <p className="text-navy-500 text-xs">Location</p>
              <p className="font-medium text-navy-700">
                {formatCoordinate(selectedReport.latitude)},{" "}
                {formatCoordinate(selectedReport.longitude)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
