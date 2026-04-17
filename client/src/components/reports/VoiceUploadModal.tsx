import { useState, useRef, useCallback, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiMicrophone,
  HiStop,
  HiTrash,
  HiPhoto,
  HiVideoCamera,
  HiXMark,
  HiPlay,
  HiPause,
  HiMapPin,
} from "react-icons/hi2";
import toast from "react-hot-toast";

import { useAppDispatch, useAppSelector } from "@/store";
import { closeUploadModal } from "@/store/slices/uiSlice";
import { useCreateReportMutation } from "@/store/api/reportApi";
import { reportSchema, type ReportFormData } from "@/schemas/reportSchemas";
import { REPORT_CATEGORIES, SEVERITY_LEVELS } from "@/types";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

function extractApiErrorMessage(err: unknown): string {
  const fallback = "Failed to submit report";

  if (!err || typeof err !== "object") return fallback;

  const errorObj = err as {
    data?: Record<string, unknown>;
  };

  const payload = errorObj.data;
  if (!payload || typeof payload !== "object") return fallback;

  if (typeof payload.error === "string") return payload.error;
  if (typeof payload.detail === "string") return payload.detail;

  const entries = Object.entries(payload);
  const first = entries.find(([, value]) => {
    if (typeof value === "string") return true;
    return Array.isArray(value) && value.length > 0;
  });

  if (!first) return fallback;

  const [field, value] = first;
  if (typeof value === "string") return `${field}: ${value}`;

  if (Array.isArray(value)) {
    const firstItem = value[0];
    if (typeof firstItem === "string") return `${field}: ${firstItem}`;
  }

  return fallback;
}

export default function VoiceUploadModal() {
  const dispatch = useAppDispatch();
  const { selectedLocation } = useAppSelector((state) => state.ui);
  const [createReport, { isLoading }] = useCreateReportMutation();

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioObjectUrlRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // File state
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      latitude: selectedLocation?.lat,
      longitude: selectedLocation?.lng,
      title: "",
      description: "",
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioObjectUrlRef.current) {
        URL.revokeObjectURL(audioObjectUrlRef.current);
        audioObjectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedLocation) return;
    setValue("latitude", selectedLocation.lat, { shouldValidate: true });
    setValue("longitude", selectedLocation.lng, { shouldValidate: true });
  }, [selectedLocation, setValue]);

  useEffect(() => {
    if (!audioBlob) return;

    const objectUrl = URL.createObjectURL(audioBlob);
    audioObjectUrlRef.current = objectUrl;
    const audio = new Audio(objectUrl);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setPlaybackDuration(audio.duration);
      }
    };
    const onTimeUpdate = () => {
      if (audio.duration > 0) {
        setPlaybackProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setPlaybackProgress(100);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      if (audioObjectUrlRef.current === objectUrl) {
        URL.revokeObjectURL(objectUrl);
        audioObjectUrlRef.current = null;
      }
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
      setIsPlaying(false);
      setPlaybackProgress(0);
      setPlaybackDuration(0);
    };
  }, [audioBlob]);

  // ─── Voice Recording ───
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setAudioDuration(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setAudioDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error(
        "Microphone access denied. Please allow microphone permissions.",
      );
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioDuration(0);
    setIsPlaying(false);
    setPlaybackProgress(0);
    setPlaybackDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioObjectUrlRef.current) {
      URL.revokeObjectURL(audioObjectUrlRef.current);
      audioObjectUrlRef.current = null;
    }
  };

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
        setPlaybackProgress(0);
      }
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      toast.error("Unable to play this recording.");
    }
  };

  // ─── File Handling ───
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const valid = Array.from(files).filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });
    setImages((prev) => [...prev, ...valid].slice(0, 5));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const valid = Array.from(files).filter((f) => {
      if (f.size > 100 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 100MB limit`);
        return false;
      }
      return true;
    });
    setVideos((prev) => [...prev, ...valid].slice(0, 3));
  };

  const removeImage = (idx: number) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));
  const removeVideo = (idx: number) =>
    setVideos((prev) => prev.filter((_, i) => i !== idx));

  // ─── Submit ───
  const onSubmit = async (data: ReportFormData) => {
    if (!audioBlob) {
      toast.error("Please record a voice note");
      return;
    }

    const latitude = selectedLocation?.lat ?? data.latitude;
    const longitude = selectedLocation?.lng ?? data.longitude;
    const deviceLatitude = selectedLocation?.deviceLat;
    const deviceLongitude = selectedLocation?.deviceLng;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      toast.error("Please select a valid location on the map");
      return;
    }

    if (
      typeof deviceLatitude !== "number" ||
      typeof deviceLongitude !== "number"
    ) {
      toast.error("Device location must be enabled to submit a report.");
      return;
    }

    // Match backend DecimalField precision: max_digits=10, decimal_places=7
    const reportLat = Number(latitude.toFixed(7));
    const reportLng = Number(longitude.toFixed(7));
    const deviceLat = Number(deviceLatitude.toFixed(7));
    const deviceLng = Number(deviceLongitude.toFixed(7));

    const formData = new FormData();
    formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    formData.append("category", data.category);
    formData.append("severity", data.severity);
    formData.append("latitude", reportLat.toFixed(7));
    formData.append("longitude", reportLng.toFixed(7));
    formData.append("device_latitude", deviceLat.toFixed(7));
    formData.append("device_longitude", deviceLng.toFixed(7));
    formData.append("voice_note", audioBlob, "voice_note.webm");

    images.forEach((img) => formData.append("images", img));
    videos.forEach((vid) => formData.append("videos", vid));

    try {
      await createReport(formData).unwrap();
      toast.success("Report submitted successfully!");
      dispatch(closeUploadModal());
    } catch (err: unknown) {
      toast.error(extractApiErrorMessage(err));
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Modal
      isOpen
      onClose={() => dispatch(closeUploadModal())}
      title="Report an Incident"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Voice Recording Section */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-navy-700">
            Voice Note <span className="text-danger-500">*</span>
          </label>

          <AnimatePresence mode="wait">
            {!audioBlob && !isRecording && (
              <motion.button
                key="record-btn"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                type="button"
                onClick={startRecording}
                className="w-full flex items-center justify-center gap-3 py-6 border-2 border-dashed border-navy-200 rounded-xl hover:border-danger-400 hover:bg-danger-50 transition-colors group"
              >
                <HiMicrophone className="w-8 h-8 text-navy-400 group-hover:text-danger-500 transition-colors" />
                <span className="text-navy-500 group-hover:text-danger-600 font-medium">
                  Tap to start recording
                </span>
              </motion.button>
            )}

            {isRecording && (
              <motion.div
                key="recording"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="flex items-center justify-between p-4 bg-danger-50 border border-danger-200 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-danger-500 rounded-full animate-pulse" />
                  <span className="text-danger-700 font-medium">
                    Recording...
                  </span>
                  <span className="text-danger-600 font-mono text-sm">
                    {formatTime(audioDuration)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="p-2 bg-danger-500 text-white rounded-lg hover:bg-danger-600 transition-colors"
                >
                  <HiStop className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {audioBlob && !isRecording && (
              <motion.div
                key="preview"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlayback}
                    className="p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors"
                  >
                    {isPlaying ? (
                      <HiPause className="w-4 h-4" />
                    ) : (
                      <HiPlay className="w-4 h-4" />
                    )}
                  </button>
                  <span className="text-emerald-700 font-medium">
                    Recording ({formatTime(audioDuration)})
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startRecording}
                    className="p-2 text-navy-500 hover:text-danger-500 transition-colors"
                    title="Re-record"
                  >
                    <HiMicrophone className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={deleteRecording}
                    className="p-2 text-navy-500 hover:text-danger-500 transition-colors"
                    title="Delete"
                  >
                    <HiTrash className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-3 w-full h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{ width: `${playbackProgress}%` }}
                  />
                </div>
                {playbackDuration > 0 && (
                  <p className="mt-2 text-xs text-emerald-700">
                    Playback {formatTime(Math.floor(playbackDuration))}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Title */}
        <Input
          label="Title"
          required
          placeholder="Brief description of the incident"
          error={errors.title?.message}
          {...register("title")}
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1.5">
            Description
          </label>
          <textarea
            className="w-full px-3.5 py-2.5 bg-navy-50 border border-navy-200 rounded-xl text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all resize-none"
            rows={3}
            placeholder="Additional details about the incident..."
            {...register("description")}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-danger-500">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Category & Severity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                label="Category"
                required
                error={errors.category?.message}
                {...field}
              >
                <option value="">Select category</option>
                {REPORT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </Select>
            )}
          />
          <Controller
            name="severity"
            control={control}
            render={({ field }) => (
              <Select
                label="Severity"
                required
                error={errors.severity?.message}
                {...field}
              >
                <option value="">Select severity</option>
                {SEVERITY_LEVELS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          />
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 p-3 bg-navy-50 rounded-xl">
          <HiMapPin className="w-5 h-5 text-navy-500" />
          <span className="text-sm text-navy-600">
            Location: {selectedLocation?.lat.toFixed(6)},{" "}
            {selectedLocation?.lng.toFixed(6)}
          </span>
        </div>
        <p className="text-xs text-navy-500 -mt-3">
          Posting is allowed only when your device location is enabled and the
          report point is near your current location.
        </p>

        {/* Images */}
        <div>
          <label className="block text-sm font-semibold text-navy-700 mb-2">
            Photos (max 5)
          </label>
          <div className="flex flex-wrap gap-2">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative w-16 h-16 rounded-lg overflow-hidden border border-navy-200"
              >
                <img
                  src={URL.createObjectURL(img)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-0 right-0 bg-danger-500 text-white p-0.5 rounded-bl-lg"
                >
                  <HiXMark className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="w-16 h-16 flex items-center justify-center border-2 border-dashed border-navy-200 rounded-lg cursor-pointer hover:border-navy-400 transition-colors">
                <HiPhoto className="w-5 h-5 text-navy-400" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  multiple
                />
              </label>
            )}
          </div>
        </div>

        {/* Videos */}
        <div>
          <label className="block text-sm font-semibold text-navy-700 mb-2">
            Videos (max 3)
          </label>
          <div className="flex flex-wrap gap-2">
            {videos.map((vid, idx) => (
              <div
                key={idx}
                className="relative flex items-center gap-2 px-3 py-2 bg-navy-50 rounded-lg border border-navy-200"
              >
                <HiVideoCamera className="w-4 h-4 text-navy-500" />
                <span className="text-xs text-navy-600 max-w-25 truncate">
                  {vid.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeVideo(idx)}
                  className="text-danger-500 hover:text-danger-700"
                >
                  <HiXMark className="w-4 h-4" />
                </button>
              </div>
            ))}
            {videos.length < 3 && (
              <label className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-navy-200 rounded-lg cursor-pointer hover:border-navy-400 transition-colors">
                <HiVideoCamera className="w-4 h-4 text-navy-400" />
                <span className="text-xs text-navy-400">Add video</span>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoChange}
                  multiple
                />
              </label>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => dispatch(closeUploadModal())}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            isLoading={isLoading}
            disabled={!audioBlob}
          >
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
