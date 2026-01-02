"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode, faTimes } from "@fortawesome/free-solid-svg-icons";

interface FloatingQRButtonProps {
  username: string;
  qrColor: string;
  theme: {
    primary: string;
    secondary: string;
    text: string;
  };
}

export default function FloatingQRButton({ username, qrColor, theme }: FloatingQRButtonProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <>
      {/* Floating QR Button */}
      <button
        onClick={() => setShowQR(true)}
        className="fixed bottom-4 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
        style={{
          backgroundColor: theme.primary,
          color: theme.secondary,
        }}
        aria-label="Tampilkan QR Code"
        title="Tampilkan QR Code"
      >
        <FontAwesomeIcon icon={faQrcode} className="h-6 w-6" />
      </button>

      {/* QR Modal Overlay */}
      {showQR && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowQR(false)}
        >
          <div
            className="relative rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "90vw" }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowQR(false)}
              className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-300"
              aria-label="Tutup"
            >
              <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
            </button>

            {/* QR Code */}
            <div className="text-center">
              <h3 className="mb-4 text-lg font-bold text-zinc-900">Scan QR Code</h3>
              <div className="mx-auto inline-block rounded-lg bg-white p-4 shadow-md">
                <img
                  src={`/api/qr/${encodeURIComponent(username)}?color=${encodeURIComponent(qrColor.replace('#', ''))}&format=png`}
                  alt={`QR untuk @${username}`}
                  className="h-64 w-64"
                />
              </div>
              <p className="mt-4 text-sm text-zinc-600">Scan untuk membuka profil</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

