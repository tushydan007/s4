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
  HiTrash,
} from "react-icons/hi2";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { useAppDispatch, useAppSelector } from "@/store";
import { closeReportDetail } from "@/store/slices/uiSlice";
import { useDeleteReportMutation } from "@/store/api/reportApi";
import Modal from "@/components/ui/Modal";
import { SEVERITY_LEVELS, REPORT_CATEGORIES } from "@/types";

function resolveMediaUrl(url: string): string {
  if (!url) return "";

  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

    // When the API base URL is relative (e.g. "/api"), the app is behind a
    // proxy (Vite dev server or nginx).  DRF may return absolute media URLs
    // pointing at the backend's internal origin (e.g. http://localhost:8000),
    // which the browser cannot reach directly.  Strip the origin so the
    // request goes through the same proxy.
    if (apiBaseUrl && !/^https?:\/\//i.test(apiBaseUrl)) {
      if (/^https?:\/\//i.test(url)) {
        const { pathname } = new URL(url);
        return new URL(pathname, window.location.origin).toString();
      }
      return new URL(url, window.location.origin).toString();
    }

    // Absolute API base URL — keep absolute media URLs as-is.
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    if (apiBaseUrl) {
      const apiOrigin = new URL(apiBaseUrl).origin;
      return new URL(url, apiOrigin).toString();
    }

    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
}

export default function ReportDetailModal() {
  const dispatch = useAppDispatch();
  const { selectedReport } = useAppSelector((state) => state.ui);
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const [deleteReport, { isLoading: isDeleting }] = useDeleteReportMutation();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const resolvedVoiceNoteUrl = resolveMediaUrl(
    selectedReport?.voice_note ?? "",
  );

  useEffect(() => {
    if (!resolvedVoiceNoteUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const audio = new Audio(resolvedVoiceNoteUrl);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      setIsPlaying(false);
      setAudioProgress(0);
      setPlaybackError(null);
      if (Number.isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      } else {
        setAudioDuration(0);
      }
    };
    const onTimeUpdate = () => {
      if (audio.duration > 0) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setAudioProgress(100);
    };
    const onError = () => {
      const code = audio.error?.code;
      setPlaybackError(
        code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
          ? "Audio format is not supported on this browser."
          : "Unable to load this voice note.",
      );
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [resolvedVoiceNoteUrl]);

  if (!selectedReport) return null;

  const severity = SEVERITY_LEVELS.find(
    (s) => s.value === selectedReport.severity,
  );
  const category = REPORT_CATEGORIES.find(
    (c) => c.value === selectedReport.category,
  );
  const images = selectedReport.media.filter((m) => m.media_type === "image");
  const videos = selectedReport.media.filter((m) => m.media_type === "video");
  const canDelete = Boolean(
    currentUserId && currentUserId === selectedReport.user,
  );

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      if (audio.ended || audio.currentTime >= audio.duration) {
        audio.currentTime = 0;
        setAudioProgress(0);
      }
      await audio.play();
      setIsPlaying(true);
      setPlaybackError(null);
    } catch {
      setIsPlaying(false);
      const code = audio.error?.code;
      const reason =
        code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
          ? "Audio format is not supported on this browser."
          : "Unable to play this voice note.";
      setPlaybackError(reason);
      toast.error(reason);
    }
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

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;

    const confirmed = window.confirm(
      "Delete this voice report? This action cannot be undone.",
    );
    if (!confirmed) return;

    try {
      await deleteReport(selectedReport.id).unwrap();
      toast.success("Report deleted successfully");
      dispatch(closeReportDetail());
    } catch (err) {
      const error = err as { data?: { detail?: string; error?: string } };
      toast.error(
        error?.data?.detail ?? error?.data?.error ?? "Failed to delete report",
      );
    }
  };

  return (
    <Modal
      isOpen
      onClose={() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setIsPlaying(false);
        setAudioProgress(0);
        setAudioDuration(0);
        setPlaybackError(null);
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
          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger-50 text-danger-700 hover:bg-danger-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <HiTrash className="w-4 h-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
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
                <div
                  className="h-full bg-navy-600 rounded-full transition-all"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
              {audioDuration > 0 && (
                <p className="mt-1 text-xs text-navy-500">
                  {Math.round(audioDuration)}s
                </p>
              )}
              {playbackError && (
                <p className="mt-1 text-xs text-danger-600">{playbackError}</p>
              )}
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
                    src={resolveMediaUrl(m.file)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              {videos.map((m) => (
                <a
                  key={m.id}
                  href={resolveMediaUrl(m.file)}
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
