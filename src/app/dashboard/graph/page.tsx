"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Loader2,
} from "lucide-react";

type NodeType = "Mood" | "Signal" | "Habit" | "Routine" | "Quest";
type NodeState = "low" | "medium" | "high";
type EdgeStrength = "weak" | "medium" | "strong";

interface InsightNode {
  id: string;
  label: string;
  type: NodeType;
  color: string;
  state: NodeState;
  score: number;
  occurrences: number;
  summary: string;
  details: string[];
  suggestion: string;
}

interface InsightEdge {
  id: string;
  source: string;
  target: string;
  strength: EdgeStrength;
  score: number;
  reason: string;
}

interface GrowthPath {
  fromNodeId: string;
  toNodeId: string;
  label: string;
}

interface WeeklyEvolution {
  moodDelta: number;
  stressDelta: number;
  focusDelta: number;
}

interface MapUpdate {
  changed: boolean;
  changeType: "initialized" | "new_pattern" | "connection_shift" | "rebalanced" | "stable";
  message: string;
}

interface WeeklyReflection {
  title: string;
  dominantPattern: string;
  improvement: string;
  narrative: string;
}

interface BehaviorMapPayload {
  center: {
    id: string;
    label: string;
    level: number;
  };
  nodes: InsightNode[];
  edges: InsightEdge[];
  highlight: {
    edgeId?: string;
    message: string;
  };
  growthPath: GrowthPath | null;
  weeklyEvolution: WeeklyEvolution;
  mapUpdate: MapUpdate;
  weeklyReflection: WeeklyReflection;
  dataWindow: {
    signals24h: number;
    signals7d: number;
    signals30d: number;
  };
  suggestions: string[];
  generatedAt: string;
}

interface PositionedNode extends InsightNode {
  x: number;
  y: number;
}

// Larger layout for the hero section
const OUTER_NODE_POSITIONS = [
  { x: 300, y: 100 },
  { x: 500, y: 180 },
  { x: 500, y: 380 },
  { x: 300, y: 460 },
  { x: 100, y: 380 },
  { x: 100, y: 180 },
];

const EDGE_STYLE: Record<EdgeStrength, { width: number; opacity: number; dasharray?: string }> = {
  weak: { width: 1.5, opacity: 0.2, dasharray: "4 4" },
  medium: { width: 2.5, opacity: 0.4 },
  strong: { width: 4, opacity: 0.7 },
};

const NODE_RADIUS: Record<NodeState, number> = {
  low: 36,
  medium: 42,
  high: 48,
};

const TYPE_LABEL: Record<NodeType, string> = {
  Mood: "State",
  Signal: "Signal",
  Habit: "Habit",
  Routine: "Routine",
  Quest: "Quest",
};

const STATE_ACCENT: Record<NodeState, string> = {
  low: "#F59E0B",
  medium: "#60A5FA",
  high: "#34D399",
};

export default function MindMapPage() {
  const router = useRouter();

  const [mapData, setMapData] = useState<BehaviorMapPayload | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const positionedNodes = useMemo<PositionedNode[]>(() => {
    if (!mapData) return [];

    return mapData.nodes.slice(0, 6).map((node, index) => {
      const fallback = OUTER_NODE_POSITIONS[0];
      const point = OUTER_NODE_POSITIONS[index] || fallback;
      return {
        ...node,
        x: point.x,
        y: point.y,
      };
    });
  }, [mapData]);

  const positionById = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    map.set("you", { x: 300, y: 280 }); // Center of 600x560 canvas
    for (const node of positionedNodes) {
      map.set(node.id, { x: node.x, y: node.y });
    }
    return map;
  }, [positionedNodes]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return positionedNodes.find((node) => node.id === selectedNodeId) || null;
  }, [positionedNodes, selectedNodeId]);

  const selectedNodeStrength = useMemo(() => {
    if (!selectedNode) return 0;
    return Math.max(0, Math.min(100, Math.round(selectedNode.score)));
  }, [selectedNode]);

  const loadMap = useCallback(async (isRefresh = false) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/?mode=signin");
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get("/api/insight/map", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = response.data as BehaviorMapPayload;
      setMapData(payload);
      setError("");
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        router.replace("/?mode=signin");
        return;
      }
      setError("Unable to generate your behavior intelligence map right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    void loadMap();
    const refreshId = window.setInterval(() => {
      void loadMap(true);
    }, 60000);

    return () => {
      window.clearInterval(refreshId);
    };
  }, [loadMap]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-text-secondary">
          <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
          <p className="text-sm font-medium">Initializing Neural Interface...</p>
        </div>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <div className="rounded-lg border border-status-error/20 bg-status-error/10 p-4 text-center text-status-error">
          {error || "Mind map is currently unavailable."}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={[
          "mx-auto w-full max-w-6xl animate-fade-in pb-10 text-text-primary",
          selectedNode ? "lg:pr-88" : "",
        ].join(" ")}
      >
        <div className="flex w-full flex-col gap-6 lg:flex-row">
          {/* Neural Map Behavior Intelligence Mind Map */}
          <div className="relative flex flex-1 flex-col items-center justify-center">
            {/* Mind Map Canvas */}
            <div
              className="relative h-130 w-full max-w-170 overflow-visible"
              onClick={() => setSelectedNodeId(null)}
            >
              <svg viewBox="0 0 600 560" className="h-full w-full overflow-visible">
                <defs>
                  <filter id="strongGlow" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <radialGradient id="centerAura" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Edges */}
                {mapData.edges.map((edge) => {
                  const source = positionById.get(edge.source);
                  const target = positionById.get(edge.target);
                  if (!source || !target) return null;

                  const style = EDGE_STYLE[edge.strength];
                  return (
                    <line
                      key={edge.id}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={edge.strength === "strong" ? "#8B5CF6" : "#4B5563"}
                      strokeOpacity={style.opacity}
                      strokeWidth={style.width}
                      strokeDasharray={style.dasharray}
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* Center Node */}
                <circle cx="300" cy="280" r="100" fill="url(#centerAura)" />
                <g style={{ animation: "pulse 4s ease-in-out infinite" }}>
                  <circle cx="300" cy="280" r="48" fill="#151823" stroke="#8B5CF6" strokeWidth="2" />
                  <circle cx="300" cy="280" r="56" fill="none" stroke="#8B5CF6" strokeOpacity="0.3" strokeWidth="1" />
                </g>
                <text x="300" y="274" textAnchor="middle" fill="#E5E7EB" fontSize="16" fontWeight="700">
                  {mapData.center.label}
                </text>
                <text x="300" y="296" textAnchor="middle" fill="#9CA3AF" fontSize="12">
                  Lvl {mapData.center.level}
                </text>

                {/* Nodes */}
                {positionedNodes.map((node, index) => {
                  const radius = NODE_RADIUS[node.state];
                  const isSelected = selectedNodeId === node.id;
                  // Map node colors to strict theme colors if possible, else fallback
                  const nodeColor = node.color.includes("emerald") || node.color.includes("green") ? "#34D399" :
                                    node.color.includes("blue") ? "#3B82F6" :
                                    node.color.includes("violet") || node.color.includes("purple") ? "#8B5CF6" :
                                    node.color.includes("amber") || node.color.includes("yellow") ? "#FBBF24" :
                                    "#E5E7EB";

                  return (
                    <g
                      key={node.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                      }}
                      style={{
                        animation: "bounce 6s ease-in-out infinite",
                        animationDelay: `${index * 0.5}s`,
                        cursor: "pointer",
                        transformBox: "fill-box",
                        transformOrigin: "center",
                      }}
                      className="transition-opacity duration-300 hover:opacity-100 opacity-90"
                    >
                      {isSelected && (
                        <circle cx={node.x} cy={node.y} r={radius + 8} fill={nodeColor} fillOpacity="0.1" />
                      )}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius}
                        fill="#151823"
                        stroke={nodeColor}
                        strokeWidth={isSelected ? 3 : 1.5}
                        filter="url(#strongGlow)"
                        className="transition-all duration-300"
                      />
                      <text x={node.x} y={node.y - 8} textAnchor="middle" fill={nodeColor} fontSize="10" fontWeight="700" letterSpacing="0.05em">
                        {TYPE_LABEL[node.type].toUpperCase()}
                      </text>
                      <text x={node.x} y={node.y + 10} textAnchor="middle" fill="#E5E7EB" fontSize="12" fontWeight="600">
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {refreshing && (
              <div className="absolute top-4 right-4 text-text-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
      {selectedNode && (
        <>
          <button
            type="button"
            onClick={() => setSelectedNodeId(null)}
            aria-label="Close node details"
            className="fixed inset-0 z-1090 bg-[#03050B]/50 backdrop-blur-[1px] lg:hidden"
          />
          <aside
            className={[
              "fixed z-1100 flex flex-col overflow-hidden border-bg-panel bg-bg-sidebar/95 text-text-primary shadow-[0_0_45px_rgba(0,0,0,0.45)] backdrop-blur",
              "inset-x-0 bottom-0 h-[74vh] max-h-170 rounded-t-2xl border-t animate-fade-in",
              "lg:inset-y-0 lg:right-0 lg:left-auto lg:h-screen lg:w-88 lg:max-h-none lg:rounded-none lg:border-l lg:border-t-0",
            ].join(" ")}
          >
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-border lg:hidden" />

            <div className="border-b border-border/50 bg-linear-to-b from-bg-panel/80 to-transparent px-5 py-4">
              <button
                onClick={() => setSelectedNodeId(null)}
                className="rounded-md border border-border bg-bg-panel px-2 py-1 text-sm text-text-secondary transition-colors hover:border-accent-primary/50 hover:text-white"
                aria-label="Close panel"
              >
                &gt;
              </button>
              <div className="mt-3 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full animate-pulse"
                    style={{ backgroundColor: STATE_ACCENT[selectedNode.state] }}
                  />
                  <h2 className="truncate text-3xl font-bold leading-tight text-text-primary">{selectedNode.label}</h2>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-muted">
                  <span className="rounded-full border border-border bg-bg-panel px-2 py-0.5">
                    {selectedNode.type}
                  </span>
                  <span className="rounded-full border border-border bg-bg-panel px-2 py-0.5">
                    Strength {selectedNode.score}
                  </span>
                  <span className="rounded-full border border-border bg-bg-panel px-2 py-0.5">
                    {selectedNode.occurrences} signals
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-5 py-5">
              <section className="rounded-xl border border-border/50 bg-bg-panel/50 p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent-primary/5 rounded-full blur-2xl pointer-events-none" />
                <p className="text-sm leading-relaxed text-text-primary relative z-10">{selectedNode.summary}</p>
                <div className="mt-5 relative z-10">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    <span>Signal Strength</span>
                    <span className="text-white">{selectedNodeStrength}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-base border border-border/50">
                    <div
                      className="h-full rounded-full transition-all duration-500 shadow-inner"
                      style={{
                        width: `${selectedNodeStrength}%`,
                        background:
                          "linear-gradient(90deg, rgba(139,92,246,0.9) 0%, rgba(96,165,250,0.95) 60%, rgba(52,211,153,0.9) 100%)",
                      }}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-border/50 bg-bg-panel/30 p-4 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">Recent Signals</h4>
                <ul className="space-y-2.5 text-sm text-text-secondary">
                  {selectedNode.details.slice(0, 4).map((detail, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-primary/70 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                      <span className="leading-snug">{detail}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {selectedNode.suggestion && (
                <section className="rounded-xl border border-border bg-bg-panel/80 p-5 shadow-sm">
                  <span className="mb-2.5 block text-[10px] font-bold uppercase tracking-wider text-accent-primary">
                    Recommended Protocol
                  </span>
                  <p className="text-sm leading-relaxed text-text-primary">
                    {selectedNode.suggestion}
                  </p>
                </section>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
