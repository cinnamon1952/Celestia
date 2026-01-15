"use client";

import { useState, useMemo } from "react";
import {
  getUpcomingAstronomyEvents,
  AstronomicalEvent,
} from "@/lib/astronomy/calculations"; // Import interface
import { GeoLocation } from "@/lib/astronomy/types";

interface EventCalendarProps {
  currentDate: Date;
  location: GeoLocation; // Added location dependency
  onTimeTravel: (date: Date) => void;
}

export function EventCalendar({
  currentDate,
  location,
  onTimeTravel,
}: EventCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const events = useMemo(
    () => getUpcomingAstronomyEvents(location, currentDate, 90), // 90 days look-ahead
    [currentDate, location]
  );

  const formatDate = (date: Date) => {
    const diff = Math.ceil(
      (date.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff < 7) return `In ${diff} days`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getEventIcon = (type: AstronomicalEvent["type"]) => {
    switch (type) {
      case "moon":
        return "🌙";
      case "meteor":
        return "🌠";
      case "conjunction":
        return "☌";
      case "eclipse":
        return "🌑";
      case "planet":
        return "🪐";
      default:
        return "📅";
    }
  };

  return (
    <>
      {/* Toggle Button - Hidden on mobile, shown on tablets/desktop */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden sm:flex fixed top-4 right-16 z-50 px-3 py-2 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg text-white/80 hover:bg-white/10 transition-all text-sm items-center gap-2"
      >
        <span>📅</span>
        <span className="hidden sm:inline">Events</span>
      </button>

      {/* Calendar Panel */}
      {isOpen && (
        <div className="fixed top-20 right-4 z-[100] w-[calc(100vw-2rem)] sm:w-80 max-h-[70vh] overflow-y-auto bg-black/80 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-black/90 px-4 py-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Upcoming Events
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/50 hover:text-white text-lg"
              >
                ×
              </button>
            </div>
          </div>

          {/* Events List */}
          <div className="p-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-3 mb-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getEventIcon(event.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium text-white truncate">
                        {event.name}
                      </h4>
                      <span className="text-xs text-cyan-400 whitespace-nowrap">
                        {formatDate(event.date)}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                    <button
                      onClick={() => {
                        onTimeTravel(event.date);
                        setIsOpen(false);
                      }}
                      className="mt-2 px-2 py-1 text-xs bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ⏱ Time Travel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
