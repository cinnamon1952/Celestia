"use client";

import { useState, useEffect } from "react";

interface OnboardingStep {
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  position: "center" | "top" | "bottom";
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Welcome to Celestia! 🌟",
    description:
      "Your interactive window to the night sky. Explore stars, planets, and constellations from anywhere on Earth.",
    position: "center",
  },
  {
    title: "Navigate the Sky",
    description:
      "Drag to rotate the view. Scroll to zoom in and out. Click on any star to see its details.",
    position: "center",
  },
  {
    title: "Control Panel",
    description:
      "Use the sidebar (gear icon) to toggle visibility of stars, planets, constellations, and more.",
    position: "center",
  },
  {
    title: "What's Up Tonight?",
    description:
      "Click the ✨ button to take a guided tour of tonight's most interesting objects!",
    position: "bottom",
  },
  {
    title: "Event Calendar",
    description:
      "Click 📅 Events to see upcoming astronomical events and time travel to them.",
    position: "top",
  },
  {
    title: "Search",
    description:
      "Use the search bar to find any star, planet, or deep sky object by name.",
    position: "top",
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Check if user has seen onboarding on mount only
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(
      "celestia-onboarding-complete"
    );
    if (hasSeenOnboarding) {
      // Delay to next tick to avoid sync setState in effect
      queueMicrotask(() => {
        setIsVisible(false);
        onComplete();
      });
    }
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem("celestia-onboarding-complete", "true");
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Content */}
      <div className="relative z-10 w-[90vw] max-w-md">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 rounded-2xl p-6 shadow-2xl">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {ONBOARDING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep
                    ? "bg-cyan-400"
                    : i < currentStep
                    ? "bg-cyan-600"
                    : "bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <h2 className="text-xl font-semibold text-white text-center mb-3">
            {step.title}
          </h2>
          <p className="text-sm text-white/70 text-center mb-6 leading-relaxed">
            {step.description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 text-sm bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg font-medium transition-all shadow-lg"
            >
              {isLastStep ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
