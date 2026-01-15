"use client";

import { useState, useMemo } from "react";

interface EventCalendarProps {
  currentDate: Date;
  onTimeTravel: (date: Date) => void;
}

interface AstronomicalEvent {
  id: string;
  name: string;
  date: Date;
  type: "moon" | "meteor" | "conjunction" | "eclipse";
  description: string;
}

// Generate upcoming events (simplified - in production would use ephemeris calculations)
function generateUpcomingEvents(baseDate: Date): AstronomicalEvent[] {
  const events: AstronomicalEvent[] = [];
  const year = baseDate.getFullYear();

  // Moon phases (approximate - every ~7.4 days)
  const moonPhases = ["New Moon", "First Quarter", "Full Moon", "Last Quarter"];
  for (let i = 0; i < 8; i++) {
    const phaseDate = new Date(baseDate);
    phaseDate.setDate(baseDate.getDate() + i * 7);
    events.push({
      id: `moon-${i}`,
      name: moonPhases[i % 4],
      date: phaseDate,
      type: "moon",
      description: `${moonPhases[i % 4]} - ${
        i % 4 === 2 ? "Best time for stargazing" : "Moon phase event"
      }`,
    });
  }

  // Major meteor showers (fixed dates)
  const meteorShowers = [
    { name: "Quadrantids", month: 0, day: 3 },
    { name: "Lyrids", month: 3, day: 22 },
    { name: "Perseids", month: 7, day: 12 },
    { name: "Orionids", month: 9, day: 21 },
    { name: "Leonids", month: 10, day: 17 },
    { name: "Geminids", month: 11, day: 14 },
  ];

  meteorShowers.forEach((shower, i) => {
    const showerDate = new Date(year, shower.month, shower.day);
    if (showerDate >= baseDate) {
      events.push({
        id: `meteor-${i}`,
        name: `${shower.name} Meteor Shower`,
        date: showerDate,
        type: "meteor",
        description: `Peak of the ${shower.name} meteor shower. Best viewed after midnight.`,
      });
    }
  });

  // Sort by date
  return events
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 10);
}

export function EventCalendar({
  currentDate,
  onTimeTravel,
}: EventCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const events = useMemo(
    () => generateUpcomingEvents(currentDate),
    [currentDate]
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
        return "☄️";
      case "conjunction":
        return "🪐";
      case "eclipse":
        return "🌑";
      default:
        return "✨";
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-16 z-50 px-3 py-2 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg text-white/80 hover:bg-white/10 transition-all text-sm flex items-center gap-2"
      >
        <span>📅</span>
        <span className="hidden sm:inline">Events</span>
      </button>

      {/* Calendar Panel */}
      {isOpen && (
        <div className="fixed top-16 right-4 z-50 w-[calc(100vw-2rem)] sm:w-80 max-h-[70vh] overflow-y-auto bg-black/80 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl">
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
