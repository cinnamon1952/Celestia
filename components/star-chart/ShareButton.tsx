"use client";

import { useState, useCallback } from "react";

interface ShareButtonProps {
  onShare: () => Promise<{ success: boolean; url: string }>;
}

export function ShareButton({ onShare }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const result = await onShare();
    if (result.success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [onShare]);

  return (
    <button
      onClick={handleShare}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-3 py-2 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg text-white/80 hover:bg-white/10 transition-all text-sm flex items-center gap-2"
    >
      {copied ? (
        <>
          <span className="text-green-400">✓</span>
          <span>Copied!</span>
        </>
      ) : (
        <>
          <span>🔗</span>
          <span className="hidden sm:inline">Share View</span>
        </>
      )}
    </button>
  );
}
