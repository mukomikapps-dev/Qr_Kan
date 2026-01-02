"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShare, faCheck } from "@fortawesome/free-solid-svg-icons";

interface ShareButtonProps {
  url: string;
  title: string;
  theme: {
    primary: string;
    text: string;
  };
}

export default function ShareButton({ url, title, theme }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState(url);

  useEffect(() => {
    // Always use qrkan.com domain for share URL
    if (typeof window !== "undefined") {
      // If URL is relative (starts with /), convert to full URL with qrkan.com
      if (url.startsWith("/")) {
        setShareUrl(`https://qrkan.com${url}`);
      } else if (url.includes("qrkan.com")) {
        // Already contains qrkan.com, use as is
        setShareUrl(url);
      } else {
        // If it's a full URL but not qrkan.com, extract path and use qrkan.com
        try {
          const urlObj = new URL(url);
          setShareUrl(`https://qrkan.com${urlObj.pathname}${urlObj.search}${urlObj.hash}`);
        } catch {
          // If URL parsing fails, assume it's a relative path
          setShareUrl(`https://qrkan.com${url.startsWith("/") ? url : `/${url}`}`);
        }
      }
    }
  }, [url]);

  const handleShare = async () => {
    try {
      // Try Web Share API first (mobile)
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: `Check out ${title}`,
          url: shareUrl,
        });
        return;
      }
    } catch (error) {
      // User cancelled or error occurred, fall through to clipboard
      if ((error as Error).name === "AbortError") {
        return; // User cancelled, don't copy
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback: create temporary input element
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="ml-auto flex items-center justify-center h-10 w-10 rounded-full transition-opacity hover:opacity-80 active:opacity-60"
      style={{
        backgroundColor: `${theme.primary}15`,
        color: theme.primary,
      }}
      title="Bagikan link"
      aria-label="Bagikan link"
    >
      {copied ? (
        <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
      ) : (
        <FontAwesomeIcon icon={faShare} className="h-4 w-4" />
      )}
    </button>
  );
}

