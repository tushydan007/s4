import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiShieldCheck,
  HiMicrophone,
  HiMapPin,
  HiBell,
  HiUserGroup,
  HiSignal,
  HiIdentification,
  HiArrowRight,
  HiCheckCircle,
  HiPhone,
  HiChatBubbleLeftRight,
  HiExclamationTriangle,
  HiFire,
  HiTruck,
} from "react-icons/hi2";

const stats = [
  { value: "22", label: "Security Stations", color: "text-emerald-400" },
  { value: "10K+", label: "Verified Citizens", color: "text-cyan-400" },
  { value: "50K+", label: "Reports Submitted", color: "text-violet-400" },
  { value: "<5 min", label: "Avg. Response Time", color: "text-amber-400" },
];

const steps = [
  {
    step: "01",
    title: "Register & Verify",
    description:
      "Create your account and complete NIN verification to become a trusted community reporter.",
    icon: <HiIdentification className="w-7 h-7" />,
  },
  {
    step: "02",
    title: "Record & Report",
    description:
      "Capture a voice note, pin the exact location on the satellite map and categorise the incident.",
    icon: <HiMicrophone className="w-7 h-7" />,
  },
  {
    step: "03",
    title: "Agencies Respond",
    description:
      "Your report is instantly relayed to the nearest security station for rapid response.",
    icon: <HiSignal className="w-7 h-7" />,
  },
];

const features = [
  {
    icon: <HiMicrophone className="w-6 h-6" />,
    title: "Voice Reports",
    description:
      "Record and upload voice notes to report security incidents in your area instantly.",
    color: "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20",
  },
  {
    icon: <HiMapPin className="w-6 h-6" />,
    title: "Location Mapping",
    description:
      "Pin incidents on an interactive satellite map to provide precise location data.",
    color: "bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20",
  },
  {
    icon: <HiBell className="w-6 h-6" />,
    title: "Real-Time Alerts",
    description:
      "Receive instant notifications when incidents are reported near your location.",
    color: "bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20",
  },
  {
    icon: <HiUserGroup className="w-6 h-6" />,
    title: "Community Safety",
    description:
      "Connect with security agencies and your community for rapid response.",
    color: "bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20",
  },
  {
    icon: <HiShieldCheck className="w-6 h-6" />,
    title: "Verified Users",
    description:
      "NIN-verified users ensure accountability and trust in every report.",
    color: "bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20",
  },
  {
    icon: <HiSignal className="w-6 h-6" />,
    title: "Agency Integration",
    description:
      "Direct integration with police stations, army barracks, and emergency services.",
    color: "bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20",
  },
  {
    icon: <HiChatBubbleLeftRight className="w-6 h-6" />,
    title: "WebSocket Updates",
    description:
      "Live bi-directional updates keep all active users informed as events unfold.",
    color: "bg-lime-500/10 text-lime-400 group-hover:bg-lime-500/20",
  },
  {
    icon: <HiPhone className="w-6 h-6" />,
    title: "Emergency Contacts",
    description:
      "Direct hotlines to police, fire service, and medical emergency at your fingertips.",
    color: "bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20",
  },
];

const categories = [
  {
    label: "Robbery",
    icon: <HiExclamationTriangle className="w-4 h-4" />,
    color:
      "border-red-500/30 hover:border-red-500/60 bg-red-500/5 text-red-400",
  },
  {
    label: "Assault",
    icon: <HiExclamationTriangle className="w-4 h-4" />,
    color:
      "border-orange-500/30 hover:border-orange-500/60 bg-orange-500/5 text-orange-400",
  },
  {
    label: "Fire Outbreak",
    icon: <HiFire className="w-4 h-4" />,
    color:
      "border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5 text-amber-400",
  },
  {
    label: "Road Accident",
    icon: <HiTruck className="w-4 h-4" />,
    color:
      "border-yellow-500/30 hover:border-yellow-500/60 bg-yellow-500/5 text-yellow-400",
  },
  {
    label: "Kidnapping",
    icon: <HiExclamationTriangle className="w-4 h-4" />,
    color:
      "border-red-600/30 hover:border-red-600/60 bg-red-600/5 text-red-500",
  },
  {
    label: "Terrorism",
    icon: <HiExclamationTriangle className="w-4 h-4" />,
    color:
      "border-rose-700/30 hover:border-rose-700/60 bg-rose-700/5 text-rose-500",
  },
  {
    label: "Flooding",
    icon: <HiSignal className="w-4 h-4" />,
    color:
      "border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5 text-blue-400",
  },
  {
    label: "Suspicious Activity",
    icon: <HiShieldCheck className="w-4 h-4" />,
    color:
      "border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5 text-purple-400",
  },
  {
    label: "Gunshots",
    icon: <HiExclamationTriangle className="w-4 h-4" />,
    color:
      "border-red-800/30 hover:border-red-800/60 bg-red-800/5 text-red-600",
  },
  {
    label: "Vandalism",
    icon: <HiExclamationTriangle className="w-4 h-4" />,
    color:
      "border-gray-500/30 hover:border-gray-500/60 bg-gray-500/5 text-gray-400",
  },
  {
    label: "Medical Emergency",
    icon: <HiPhone className="w-4 h-4" />,
    color:
      "border-green-500/30 hover:border-green-500/60 bg-green-500/5 text-green-400",
  },
  {
    label: "Other",
    icon: <HiShieldCheck className="w-4 h-4" />,
    color:
      "border-slate-500/30 hover:border-slate-500/60 bg-slate-500/5 text-slate-400",
  },
];

const benefits = [
  "Free to use for all verified citizens",
  "NIN-backed identity for accountability",
  "Works offline, syncs when connected",
  "End-to-end encrypted voice reports",
  "Multi-agency routing in under 30 seconds",
  "Available on all devices - mobile and desktop",
];

export default function HomePage() {
  return (
    <div className="min-h-full bg-navy-950 text-white">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-32 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative w-full max-w-6xl mx-auto px-6 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-sm text-emerald-300 mb-10"
            >
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Nigeria's #1 Citizen Security Platform
            </motion.div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-tight tracking-tight mb-8">
              Report Incidents.
              <br />
              <span className="bg-linear-to-r from-emerald-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                Save Lives.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-navy-300 max-w-2xl mx-auto mb-12 leading-relaxed">
              S4 Security empowers verified Nigerian citizens to report security
              threats in real-time using{" "}
              <strong className="text-white">voice notes</strong> and{" "}
              <strong className="text-white">satellite map pinning</strong>,
              directly routing alerts to the nearest station.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/register">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-colors text-lg"
                >
                  Get Started Free
                  <HiArrowRight className="w-5 h-5" />
                </motion.div>
              </Link>
              <Link to="/login">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all text-lg"
                >
                  Sign In to Dashboard
                </motion.div>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-navy-400">
              {[
                "Free for all citizens",
                "NIN verified identity",
                "End-to-end encrypted",
                "24/7 active monitoring",
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <HiCheckCircle className="w-4 h-4 text-emerald-500" />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            className="w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0,60 C360,0 1080,0 1440,60 L1440,60 L0,60 Z"
              fill="#0e163f"
            />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-navy-900/60 border-y border-navy-800/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <p className={`text-4xl font-black mb-1 ${s.color}`}>
                  {s.value}
                </p>
                <p className="text-navy-400 text-sm font-medium">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-emerald-400 font-semibold text-sm uppercase tracking-widest mb-3">
              Simple Process
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              How S4 Security Works
            </h2>
            <p className="text-navy-400 max-w-xl mx-auto">
              Three simple steps stand between a security incident and a
              coordinated agency response.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center p-6"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-navy-800 border border-navy-700 flex items-center justify-center text-emerald-400 shadow-lg">
                    {s.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                <p className="text-navy-400 text-sm leading-relaxed">
                  {s.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Incident Categories */}
      <section className="py-20 bg-navy-900/40 border-y border-navy-800/30">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-violet-400 font-semibold text-sm uppercase tracking-widest mb-3">
              Report Types
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              What Can You Report?
            </h2>
            <p className="text-navy-400 max-w-xl mx-auto">
              S4 covers all major security and emergency incident categories.
              Every report reaches the right agency instantly.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-default ${cat.color}`}
              >
                <span className="shrink-0">{cat.icon}</span>
                <span className="text-sm font-medium text-navy-200">
                  {cat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-cyan-400 font-semibold text-sm uppercase tracking-widest mb-3">
              Platform Features
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-navy-400 max-w-xl mx-auto">
              A comprehensive security platform built for the speed and scale
              that modern citizen-agency collaboration demands.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
                viewport={{ once: true }}
                className="group p-5 rounded-2xl border border-navy-800/60 hover:border-navy-700 bg-navy-900/30 hover:bg-navy-900/60 transition-all duration-300"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors mb-4 ${feature.color}`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-navy-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why S4 */}
      <section className="py-20 bg-navy-900/50 border-y border-navy-800/30">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-amber-400 font-semibold text-sm uppercase tracking-widest mb-3">
                Why S4?
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                Built for Nigeria.
                <br />
                <span className="text-amber-400">Trusted by Communities.</span>
              </h2>
              <p className="text-navy-400 mb-8 leading-relaxed">
                S4 is purpose-built for the Nigerian security landscape. We work
                directly with the Nigeria Police Force, Civil Defence Corps, and
                Emergency Medical Services to ensure every report triggers the
                right response.
              </p>
              <ul className="space-y-3">
                {benefits.map((b) => (
                  <li
                    key={b}
                    className="flex items-center gap-3 text-navy-300 text-sm"
                  >
                    <HiCheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-2xl bg-navy-900 border border-navy-700/50 p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-navy-800">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <HiShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      New Report Submitted
                    </p>
                    <p className="text-xs text-navy-400">
                      Just now - Lagos Island
                    </p>
                  </div>
                  <span className="ml-auto text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 font-semibold border border-red-500/20">
                    Critical
                  </span>
                </div>
                <div className="space-y-3 mb-5">
                  {[
                    {
                      label: "Category",
                      value: "Robbery",
                      color: "text-red-400",
                    },
                    {
                      label: "Location",
                      value: "3rd Mainland Bridge",
                      color: "text-cyan-400",
                    },
                    {
                      label: "Assigned to",
                      value: "Lagos State Police",
                      color: "text-emerald-400",
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-navy-500">{row.label}</span>
                      <span className={`font-semibold ${row.color}`}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="h-2 rounded-full bg-navy-800 overflow-hidden">
                  <motion.div
                    className="h-full bg-linear-to-r from-emerald-500 to-cyan-400 rounded-full"
                    initial={{ width: "0%" }}
                    whileInView={{ width: "72%" }}
                    transition={{ duration: 1.2, delay: 0.3 }}
                    viewport={{ once: true }}
                  />
                </div>
                <p className="text-xs text-navy-400 mt-2">
                  Response in progress - 72%
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-navy-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  3 units dispatched - ETA 4 minutes
                </div>
              </div>
              <div className="absolute -top-4 -right-4 px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg shadow-emerald-500/30">
                LIVE
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-8">
              <HiShieldCheck className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-5">
              Ready to Protect Your Community?
            </h2>
            <p className="text-navy-400 mb-10 max-w-lg mx-auto leading-relaxed">
              Join thousands of verified citizens who are making Nigeria safer
              every day. Registration is free, fast, and fully secure.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-colors text-base"
                >
                  Create Free Account
                  <HiArrowRight className="w-5 h-5" />
                </motion.div>
              </Link>
              <Link to="/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-8 py-4 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl border border-navy-700 transition-all text-base"
                >
                  I Already Have an Account
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-800/50 bg-navy-950/80">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-navy-800 rounded-lg">
                  <HiShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="font-black text-white">S4 Security</span>
              </div>
              <p className="text-navy-400 text-sm leading-relaxed">
                Secure - Swift - Smart - Safe. Bridging the gap between citizens
                and security agencies across Nigeria.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">
                Platform
              </h4>
              <ul className="space-y-2 text-sm text-navy-400">
                {[
                  { label: "Register", to: "/register" },
                  { label: "Sign In", to: "/login" },
                  { label: "Dashboard", to: "/dashboard" },
                  { label: "Profile", to: "/profile" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">
                Emergency Contacts
              </h4>
              <ul className="space-y-2 text-sm text-navy-400">
                {[
                  { label: "Nigeria Police Force", number: "112" },
                  { label: "Federal Fire Service", number: "199" },
                  { label: "NEMA Emergency", number: "0800-2345-0000" },
                  { label: "Ambulance / FRSC", number: "122" },
                ].map((e) => (
                  <li key={e.label} className="flex justify-between">
                    <span>{e.label}</span>
                    <span className="text-emerald-400 font-semibold">
                      {e.number}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-navy-800/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-navy-500">
            <p>
              &copy; {new Date().getFullYear()} S4 Security Platform. All rights
              reserved.
            </p>
            <p>Protecting Lives and Properties across Nigeria.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
