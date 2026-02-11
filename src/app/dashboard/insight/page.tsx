"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Brain,
  ChevronRight,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  X,
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

const NODE_TYPES = ["All", "Core", "Insight", "Project", "Memory"];
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

  const loadMap = async (isRefresh = false) => {
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
  };

  useEffect(() => {
    void loadMap();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[#9CA3AF]">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
          <p className="text-sm font-medium">Initializing Neural Interface...</p>
        </div>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <div className="rounded-lg border border-[#F87171]/20 bg-[#F87171]/10 p-4 text-center text-[#F87171]">
          {error || "Mind map is currently unavailable."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl animate-fade-in space-y-8 pb-10 text-[#E5E7EB]">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center rounded-2xl bg-[#0B0D14] pt-8 shadow-sm border border-[#151823]">
        <div className="absolute inset-0 bg-radial-gradient from-[#1C1F2B] to-[#0B0D14] rounded-2xl -z-10" />

        <div className="relative z-10 mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded bg-[#1C1F2B] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8B5CF6] border border-[#2A2E3F]">
            <Brain className="h-3 w-3" />
            Neural Map
          </div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">Behavior Intelligence</h1>
        </div>

        {/* Mind Map Canvas */}
        <div className="relative h-[500px] w-full max-w-[600px] overflow-visible">
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

        <div className="absolute top-6 right-6">
          <button
            onClick={() => void loadMap(true)}
            className="rounded p-2 text-[#6B7280] transition-colors hover:bg-[#2A2E3F] hover:text-[#E5E7EB]"
            title="Refresh Map"
          >
            {refreshing ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          </button>
        </div>
      </section>

      {/* Insight Highlight Strip */}
      <section className="flex flex-col gap-6 md:flex-row md:items-stretch">
        <div className="card-discord flex-1 bg-[#1C1F2B] p-6 border border-[#2A2E3F]">
          <div className="mb-3 flex items-center gap-2 text-[#8B5CF6]">
            <Sparkles className="h-5 w-5" />
            <h2 className="font-bold uppercase text-xs tracking-wider">Analysis</h2>
          </div>
          <p className="text-lg font-medium leading-relaxed text-[#E5E7EB]">
            {mapData.weeklyReflection.dominantPattern} {mapData.weeklyReflection.improvement}
          </p>
        </div>

        <div className="flex flex-col gap-3 md:w-64">
          <div className="card-discord flex flex-1 items-center justify-between p-4 bg-[#1C1F2B] border border-[#2A2E3F]">
            <span className="font-semibold text-[#9CA3AF] text-sm">Mood Trend</span>
            <span className="flex items-center gap-1 font-bold text-[#FBBF24]">
              <TrendingUp className="h-4 w-4" />
              {mapData.weeklyEvolution.moodDelta > 0 ? "+" : ""}{mapData.weeklyEvolution.moodDelta}
            </span>
          </div>
          <div className="card-discord flex flex-1 items-center justify-between p-4 bg-[#1C1F2B] border border-[#2A2E3F]">
            <span className="font-semibold text-[#9CA3AF] text-sm">Focus Trend</span>
            <span className="flex items-center gap-1 font-bold text-[#34D399]">
              <TrendingUp className="h-4 w-4" />
              {mapData.weeklyEvolution.focusDelta > 0 ? "+" : ""}{mapData.weeklyEvolution.focusDelta}
            </span>
          </div>
        </div>
      </section>

      {/* Two Column Narrative & Actions */}
      <section className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#E5E7EB]">System Log</h3>
          <div className="card-discord p-6 bg-[#151823] border border-[#2A2E3F]">
            <p className="whitespace-pre-wrap text-[0.95rem] leading-loose text-[#D1D5DB]">
              {mapData.weeklyReflection.narrative}
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-[#6B7280]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
              Processing {mapData.dataWindow.signals7d} data points
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#E5E7EB]">Optimizations</h3>
          <div className="space-y-3">
            {mapData.suggestions.length > 0 ? (
              mapData.suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="group flex cursor-pointer items-center justify-between rounded-lg border border-[#2A2E3F] bg-[#1C1F2B] p-4 transition-all hover:bg-[#2A2E3F] hover:border-[#8B5CF6]/30"
                >
                  <span className="font-medium text-[#E5E7EB] text-sm">{suggestion}</span>
                  <ChevronRight className="h-4 w-4 text-[#6B7280] transition-transform group-hover:translate-x-1 group-hover:text-[#8B5CF6]" />
                </div>
              ))
            ) : (
                <p className="text-[#6B7280] text-sm">System calibrating. Continue logging data.</p>
            )}
            <div className="group flex cursor-pointer items-center justify-between rounded-lg border border-[#2A2E3F] bg-[#1C1F2B] p-4 transition-all hover:bg-[#2A2E3F] hover:border-[#8B5CF6]/30">
                <span className="font-medium text-[#E5E7EB] text-sm">Review mood integrity</span>
                 <ChevronRight className="h-4 w-4 text-[#6B7280] transition-transform group-hover:translate-x-1 group-hover:text-[#8B5CF6]" />
            </div>
          </div>
        </div>
      </section>

      {/* Floating Node Detail Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-[5000] overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedNodeId(null)}>
          <div className="flex min-h-full items-start justify-center p-4 pt-24">
            <div 
              className="relative w-full max-w-sm overflow-hidden rounded-xl border border-[#2A2E3F] bg-[#151823] shadow-2xl animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-[#2A2E3F] px-6 py-4 bg-[#1C1F2B]">
                <div className="flex items-center justify-between">
                  <div>
                     <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider opacity-80" style={{ color: "#9CA3AF" }}>
                      {selectedNode.type}
                    </span>
                    <h1 className="text-2xl font-bold text-[#E5E7EB]">Insight: {selectedNode.label}</h1>
                  </div>
                  <button 
                    onClick={() => setSelectedNodeId(null)}
                    className="rounded p-1 text-[#6B7280] hover:bg-[#2A2E3F] hover:text-[#E5E7EB]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4 p-6">
                <p className="text-sm leading-relaxed text-[#D1D5DB]">{selectedNode.summary}</p>
                
                <div className="space-y-2 rounded-lg bg-[#0F111A] p-4 border border-[#2A2E3F]">
                   <div className="flex justify-between text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide">
                      <span>Signal Strength</span>
                      <span>{selectedNode.score}/100</span>
                   </div>
                   <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1C1F2B]">
                      <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${selectedNode.score}%`, backgroundColor: "#8B5CF6" }}
                      />
                   </div>
                </div>

                 <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Recent Signals</h4>
                     <ul className="text-sm text-[#D1D5DB] space-y-2">
                       {selectedNode.details.slice(0, 3).map((detail, i) => (
                         <li key={i} className="flex items-start gap-2">
                           <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#3B82F6]" />
                           {detail}
                         </li>
                       ))}
                     </ul>
                 </div>

                 {selectedNode.suggestion && (
                   <div className="rounded border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 p-3 text-sm text-[#E5E7EB]">
                      <span className="font-bold block mb-1 text-[#A78BFA] text-xs uppercase">Recommended Protocol</span>
                      {selectedNode.suggestion}
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
