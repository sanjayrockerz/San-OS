"use client";

import { useState } from "react";
import { Sunrise, Sun, Sunset, CheckCircle2, ChevronRight, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";

type ReviewType = "morning" | "midday" | "evening";

export function DailyReviews() {
  const [activeReview, setActiveReview] = useState<ReviewType | null>("morning");
  const [reflection, setReflection] = useState("");
  const [submitted, setSubmitted] = useState<Record<ReviewType, boolean>>({
    morning: false,
    midday: false,
    evening: false,
  });

  const submitReview = async () => {
    if (!activeReview) return;
    
    // In a real implementation, this would call a server action or API
    // e.g., await fetch("/api/reviews", { method: "POST", ... })
    
    setSubmitted((prev) => ({ ...prev, [activeReview]: true }));
    setReflection("");
    
    // Auto-advance
    if (activeReview === "morning") setActiveReview("midday");
    else if (activeReview === "midday") setActiveReview("evening");
    else setActiveReview(null);
  };

  const reviews = [
    {
      id: "morning" as ReviewType,
      title: "Morning Alignment",
      icon: <Sunrise className="w-5 h-5 text-amber-500" />,
      questions: [
        "What is the single most important task today?",
        "Are my planned time blocks realistic?",
        "What potential distractions should I avoid?",
      ]
    },
    {
      id: "midday" as ReviewType,
      title: "Mid-day Calibration",
      icon: <Sun className="w-5 h-5 text-yellow-500" />,
      questions: [
        "Are we on track with the Morning Alignment?",
        "Do I need to drop or reschedule any tasks?",
        "How is my energy level?",
      ]
    },
    {
      id: "evening" as ReviewType,
      title: "Evening Reflection",
      icon: <Sunset className="w-5 h-5 text-indigo-400" />,
      questions: [
        "Did I complete the single most important task?",
        "What caused me to lose focus today?",
        "Plan tomorrow's blocks before shutting down.",
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-2 text-foreground">
        <BrainCircuit className="w-5 h-5" />
        <h2 className="text-xl font-medium tracking-tight">Daily Reviews</h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {reviews.map((rev) => (
          <button
            key={rev.id}
            onClick={() => setActiveReview(rev.id)}
            className={`p-4 text-left border rounded-2xl transition-all duration-200 relative ${
              activeReview === rev.id 
                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20" 
                : submitted[rev.id] 
                  ? "border-border/50 bg-card/50 opacity-70"
                  : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-background border shadow-sm">
                {rev.icon}
              </div>
              {submitted[rev.id] && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            </div>
            <h3 className="font-medium text-sm text-foreground">{rev.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {submitted[rev.id] ? "Completed" : "Pending"}
            </p>
          </button>
        ))}
      </div>

      {activeReview && !submitted[activeReview] && (
        <div className="p-6 border rounded-2xl bg-card animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3 mb-6">
            {reviews.find(r => r.id === activeReview)?.icon}
            <h3 className="text-lg font-medium">
              {reviews.find(r => r.id === activeReview)?.title}
            </h3>
          </div>
          
          <div className="space-y-4 mb-6">
            {reviews.find(r => r.id === activeReview)?.questions.map((q, i) => (
              <div key={i} className="flex gap-3 text-sm text-muted-foreground">
                <span className="text-primary font-medium">{i + 1}.</span>
                <p>{q}</p>
              </div>
            ))}
          </div>

          <textarea
            className="w-full bg-background border rounded-xl p-4 min-h-[120px] text-sm focus:ring-1 focus:outline-none focus:border-primary transition-all resize-none mb-4"
            placeholder="Write your reflection..."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
          />

          <div className="flex justify-end">
            <Button onClick={submitReview} disabled={!reflection.trim()}>
              Submit Review <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {Object.values(submitted).every(Boolean) && (
        <div className="p-8 border rounded-2xl bg-green-500/10 text-center border-green-500/20 text-green-700 dark:text-green-400">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-80" />
          <h3 className="font-medium text-lg">All caught up!</h3>
          <p className="text-sm opacity-80 mt-1">You've completed all reviews for today. Enjoy your time.</p>
        </div>
      )}
    </div>
  );
}
