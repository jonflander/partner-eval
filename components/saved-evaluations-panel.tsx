"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SavedEvaluation {
  id: string;
  partner_name: string;
  decision: string;
  total_weighted_score: number;
  normalized_score: number;
  created_at: string;
  updated_at: string;
}

const DECISION_CONFIG: Record<string, { bg: string; text: string; color: string }> = {
  Greenlight: { bg: "bg-[var(--green)]/10", text: "text-[var(--green)]", color: "var(--green)" },
  Conditional: { bg: "bg-[var(--yellow)]/10", text: "text-[var(--yellow)]", color: "var(--yellow)" },
  Pass: { bg: "bg-[var(--red)]/10", text: "text-[var(--red)]", color: "var(--red)" },
};

interface Props {
  onLoad: (id: string) => Promise<void>;
  onNew: () => void;
  isLoading: boolean;
}

export function SavedEvaluationsPanel({ onLoad, onNew, isLoading }: Props) {
  const [evaluations, setEvaluations] = useState<SavedEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  async function fetchEvaluations() {
    try {
      const res = await fetch("/api/evaluations");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEvaluations(data);
    } catch (err) {
      console.error("[v0] Failed to load saved evaluations:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoad(id: string) {
    setLoadingId(id);
    try {
      await onLoad(id);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete evaluation for "${name}"?`)) return;
    try {
      const res = await fetch(`/api/evaluations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setEvaluations((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("[v0] Failed to delete:", err);
      alert("Failed to delete evaluation");
    }
  }

  async function handleExportCSV() {
    try {
      const res = await fetch("/api/evaluations/export/csv");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sevn-evaluations-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[v0] Failed to export CSV:", err);
      alert("Failed to export evaluations");
    }
  }

  const cfg = (decision: string) => DECISION_CONFIG[decision] || DECISION_CONFIG.Pass;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Button onClick={onNew} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          New Evaluation
        </Button>
        {evaluations.length > 0 && (
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="w-full border-border text-foreground hover:bg-secondary"
          >
            Export All to CSV
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">Loading evaluations...</p>
        </div>
      ) : evaluations.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">No saved evaluations yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Saved Evaluations ({evaluations.length})
          </p>
          <div className="max-h-[60vh] overflow-y-auto space-y-1.5">
            {evaluations.map((evaluation) => {
              const c = cfg(evaluation.decision);
              return (
                <div
                  key={evaluation.id}
                  className="rounded-lg border border-border bg-card p-3 space-y-2 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {evaluation.partner_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(evaluation.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge className={cn("shrink-0 text-xs font-semibold px-2 py-1", c.bg, c.text)}>
                      {evaluation.decision}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {evaluation.total_weighted_score.toFixed(1)} pts ({evaluation.normalized_score.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <Button
                      onClick={() => handleLoad(evaluation.id)}
                      disabled={loadingId === evaluation.id || isLoading}
                      size="sm"
                      className="flex-1 h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {loadingId === evaluation.id ? "Loading..." : "Open"}
                    </Button>
                    <Button
                      onClick={() => handleDelete(evaluation.id, evaluation.partner_name)}
                      disabled={isLoading}
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-xs border-border text-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
