import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  wifiDotVariants,
  wifiWave1Variants,
  wifiWave2Variants,
  wifiWave3Variants,
  wifiSlashVariants,
} from "../../libs/motionVariants";

// Custom Animated Wifi Icon Component
const AnimatedWifiIcon: React.FC<{ isOnline: boolean }> = ({ isOnline }) => {
  if (isOnline) {
    return (
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--success)]"
      >
        {/* Dot */}
        <motion.circle
          cx="12"
          cy="18"
          r="1.5"
          fill="currentColor"
          variants={wifiDotVariants}
          animate="animate"
        />
        {/* Wave 1 */}
        <motion.path
          d="M10.17 15.17a3 3 0 0 1 3.66 0"
          variants={wifiWave1Variants}
          animate="animate"
        />
        {/* Wave 2 */}
        <motion.path
          d="M8.29 13.29a6 6 0 0 1 7.42 0"
          variants={wifiWave2Variants}
          animate="animate"
        />
        {/* Wave 3 */}
        <motion.path
          d="M6.36 11.36a9 9 0 0 1 11.28 0"
          variants={wifiWave3Variants}
          animate="animate"
        />
      </svg>
    );
  } else {
    return (
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--error)]"
      >
        {/* Muted WiFi waves underneath */}
        <motion.circle cx="12" cy="18" r="1.5" fill="currentColor" className="opacity-30" />
        <path d="M10.17 15.17a3 3 0 0 1 3.66 0" className="opacity-30" />
        <path d="M8.29 13.29a6 6 0 0 1 7.42 0" className="opacity-30" />
        <path d="M6.36 11.36a9 9 0 0 1 11.28 0" className="opacity-30" />
        
        {/* Animated slash across */}
        <motion.line
          x1="4"
          y1="4"
          x2="20"
          y2="20"
          variants={wifiSlashVariants}
          initial="initial"
          animate="animate"
        />
      </svg>
    );
  }
};

const NetworkStatusOverlay: React.FC = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [justCameOnline, setJustCameOnline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustCameOnline(true);

      // Hide the "Back Online" message after 3 seconds
      setTimeout(() => {
        setJustCameOnline(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustCameOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const shouldShow = !isOnline || justCameOnline;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{
            background: "color-mix(in srgb, var(--bg) 65%, transparent)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)"
          }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="flex flex-col items-center justify-center p-8 rounded-squircle shadow-2xl max-w-sm w-full border text-center"
            style={{
              background: "color-mix(in srgb, var(--surface) 94%, transparent)",
              borderColor: isOnline ? "color-mix(in srgb, var(--success) 30%, var(--border))" : "color-mix(in srgb, var(--error) 30%, var(--border))",
              boxShadow: "var(--shadow)"
            }}
          >
            {/* Animated SVG Container */}
            <div
              className="p-4 rounded-full mb-5 flex items-center justify-center"
              style={{
                background: isOnline ? "var(--success-bg)" : "var(--danger-bg)"
              }}
            >
              <AnimatedWifiIcon isOnline={isOnline} />
            </div>

            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-h)" }}>
              {isOnline ? t("networkStatus.onlineTitle") : t("networkStatus.offlineTitle")}
            </h2>

            <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text)" }}>
              {isOnline ? t("networkStatus.onlineText") : t("networkStatus.offlineText")}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatusOverlay;
