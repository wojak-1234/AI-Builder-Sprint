import React, { useEffect, useState, useRef } from "react";
import { animate } from "animejs";
import { DBNarrative } from "@/services/supabase-service";
import { User, Calendar, Heart, MapPin, Smile } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type GraphNode = {
  id: string;
  label: string;
  type: "root" | "narrative" | "person" | "place" | "emotion" | "event";
  owner: "self" | "guardian" | "shared";
  narrativeId?: string;
  x: number;
  y: number;
  time?: string;
};

type GraphEdge = {
  source: string;
  target: string;
};

type KnowledgeGraphProps = {
  narratives: DBNarrative[];
  selectedId?: string;
  onSelectNarrative: (narrative: DBNarrative) => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve owner from narrative data */
function resolveOwner(narr: DBNarrative): "self" | "guardian" | "shared" {
  const answers = narr.mergedAnswers;
  if (!answers || answers.length === 0) return "self";

  const hasSelf     = answers.some((a) => a.userText?.trim());
  const hasGuardian = answers.some((a) => a.guardianText?.trim());

  if (hasSelf && hasGuardian) return "shared";
  if (hasGuardian)            return "guardian";
  return "self";
}

/** Run force layout algorithm */
function runForceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  w: number,
  h: number
): GraphNode[] {
  const margin = 80;
  const cx = w / 2;
  const cy = h / 2;
  const repulsion  = Math.min(w, h) * 2.5;
  const linkDist   = Math.min(w, h) * 0.28;
  const linkStr    = 0.04;
  const gravity    = 0.001;
  const iterations = 200;
  const minNodeDist = 70;

  const sim: GraphNode[] = nodes.map((n) => ({ ...n }));

  for (let iter = 0; iter < iterations; iter++) {
    // 1. Repulsion & Collision between all pairs
    for (let i = 0; i < sim.length; i++) {
      for (let j = i + 1; j < sim.length; j++) {
        const a = sim[i], b = sim[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy + 0.1;
        const dist   = Math.sqrt(distSq);

        if (dist < 300) {
          const force = repulsion / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (a.type !== "root") { a.x -= fx; a.y -= fy; }
          if (b.type !== "root") { b.x += fx; b.y += fy; }
        }

        if (dist < minNodeDist) {
          const overlap = (minNodeDist - dist) / 2;
          const pushX = (dx / dist) * overlap;
          const pushY = (dy / dist) * overlap;
          if (a.type !== "root") { a.x -= pushX; a.y -= pushY; }
          if (b.type !== "root") { b.x += pushX; b.y += pushY; }
        }
      }
    }

    // 2. Link spring attraction
    for (const { source, target } of edges) {
      const s = sim.find((n) => n.id === source);
      const t = sim.find((n) => n.id === target);
      if (!s || !t) continue;
      const dx   = t.x - s.x;
      const dy   = t.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
      const targetDist = s.type === "root" ? linkDist : linkDist * 0.6;
      const force = (dist - targetDist) * linkStr;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (s.type !== "root") { s.x += fx; s.y += fy; }
      if (t.type !== "root") { t.x -= fx; t.y -= fy; }
    }

    // 3. Minimal center drift
    for (const n of sim) {
      if (n.type !== "root") {
        n.x += (cx - n.x) * gravity;
        n.y += (cy - n.y) * gravity;
      }
    }
  }

  // 4. Anchor root node firmly to center & clamp all other nodes inside margin
  for (const n of sim) {
    if (n.type === "root") {
      n.x = cx;
      n.y = cy;
    } else {
      n.x = Math.max(margin, Math.min(w - margin, n.x));
      n.y = Math.max(margin, Math.min(h - margin, n.y));
    }
  }

  return sim;
}

/** Build raw node + edge lists from narratives with radial initial placement. */
function buildGraph(
  narratives: DBNarrative[],
  cx: number,
  cy: number,
  w: number,
  h: number
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [
    {
      id: "root-garden",
      label: "이음 기억 정원",
      type: "root",
      owner: "shared",
      x: cx,
      y: cy,
    },
  ];
  const edges: GraphEdge[] = [];

  const mainRadius = Math.min(w, h) * 0.32;

  narratives.forEach((narr, nIdx) => {
    const owner = resolveOwner(narr);

    const angle  = (nIdx / Math.max(narratives.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const nx     = cx + Math.cos(angle) * mainRadius;
    const ny     = cy + Math.sin(angle) * mainRadius;
    const nid    = `narrative-${narr.id}`;

    nodes.push({
      id: nid, label: narr.title, type: "narrative", owner,
      narrativeId: narr.id,
      time: narr.event_date.substring(0, 4) + "년",
      x: nx, y: ny,
    });
    edges.push({ source: "root-garden", target: nid });

    const c = narr.content;
    const t = narr.title;

    const childEntities: { id: string; label: string; type: GraphNode["type"]; owner: GraphNode["owner"] }[] = [];

    // Places
    for (const p of ["마당", "기와집", "소풍길", "서울", "집앞"]) {
      if (t.includes(p) || c.includes(p)) {
        childEntities.push({ id: `place-${p}-${narr.id}`, label: p, type: "place", owner });
      }
    }

    // People
    for (const { key, label, o } of [
      { key: "김순자", label: "김순자 어르신",  o: "self"     as const },
      { key: "이지영", label: "이지영 자녀",    o: "guardian" as const },
      { key: "지영이", label: "딸 지영이",       o: "guardian" as const },
      { key: "단짝 친구", label: "단짝 친구",   o: owner              },
      { key: "어머니",    label: "친정 어머니", o: owner              },
    ]) {
      if (c.includes(key)) {
        childEntities.push({ id: `person-${key}-${narr.id}`, label, type: "person", owner: o });
      }
    }

    // Emotions
    for (const { k, l } of [
      { k: "설레",  l: "설렘"   }, { k: "그리움", l: "그리움" },
      { k: "행복",  l: "행복"   }, { k: "즐거",   l: "즐거움" },
      { k: "따스",  l: "따스함" }, { k: "사랑",   l: "사랑"   },
    ]) {
      if (c.includes(k)) {
        childEntities.push({ id: `emotion-${l}-${narr.id}`, label: l, type: "emotion", owner });
      }
    }

    const childCount = childEntities.length;
    const subRadius = Math.min(w, h) * 0.14;
    childEntities.forEach((item, cIdx) => {
      if (nodes.some((n) => n.id === item.id)) return;

      const spreadArc = Math.PI * 0.9;
      const startAngle = angle - spreadArc / 2;
      const childAngle = childCount > 1
        ? startAngle + (cIdx / (childCount - 1)) * spreadArc
        : angle;

      const cxPos = nx + Math.cos(childAngle) * subRadius;
      const cyPos = ny + Math.sin(childAngle) * subRadius;

      nodes.push({
        id: item.id,
        label: item.label,
        type: item.type,
        owner: item.owner,
        x: cxPos,
        y: cyPos,
      });
      edges.push({ source: nid, target: item.id });
    });
  });

  return { nodes, edges };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KnowledgeGraph({
  narratives,
  selectedId,
  onSelectNarrative,
}: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef       = useRef<SVGSVGElement | null>(null);

  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 1200, h: 800 });
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [hoveredNode, setHoveredNode]   = useState<GraphNode | null>(null);
  const [tooltipPos,  setTooltipPos]    = useState({ x: 0, y: 0 });

  const updateDimensions = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const w = rect.width > 50 ? rect.width : (typeof window !== "undefined" ? window.innerWidth : 1200);
      const h = rect.height > 50 ? rect.height : (typeof window !== "undefined" ? window.innerHeight : 800);
      setDims({ w, h });
    } else if (typeof window !== "undefined") {
      setDims({ w: window.innerWidth, h: window.innerHeight });
    }
  };

  useEffect(() => {
    updateDimensions();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      updateDimensions();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (dims.w <= 0 || dims.h <= 0) return;
    const { w, h } = dims;
    const cx = w / 2;
    const cy = h / 2;

    const { nodes: rawNodes, edges: rawEdges } = buildGraph(narratives, cx, cy, w, h);
    const settled = runForceLayout(rawNodes, rawEdges, w, h);

    setNodes(settled);
    setEdges(rawEdges);

    // Subtle entrance animation with safe fallback
    requestAnimationFrame(() => {
      if (!svgRef.current) return;
      try {
        animate(svgRef.current.querySelectorAll(".graph-link"), {
          strokeDashoffset: [300, 0],
          opacity: [0.1, 0.45],
          duration: 800,
          easing: "easeOutCubic",
        });
        animate(svgRef.current.querySelectorAll(".graph-node-inner"), {
          scale: [0.5, 1],
          opacity: [0.4, 1],
          delay: (el, i) => (i || 0) * 12,
          duration: 500,
          easing: "easeOutCubic",
        });
      } catch (err) {
        // Fallback silently if anime fails
      }
    });
  }, [narratives, dims.w, dims.h]);

  const getNodeFill = (node: GraphNode): string => {
    if (node.type === "root") return "#D8B48F";
    const selected = selectedId && node.narrativeId === selectedId;
    switch (node.owner) {
      case "self":
        return selected ? "#1E3A5F" : "#4E6F96";
      case "guardian":
        return selected ? "#3A5230" : "#7C9A74";
      case "shared":
        return selected ? "url(#shared-blend-selected)" : "url(#shared-blend)";
      default:
        return "#888";
    }
  };

  const getNodeRadius = (node: GraphNode): number => {
    const base =
      node.type === "root"      ? 24 :
      node.type === "narrative" ? 15 : 9;
    if (node.type === "root") return base;
    const degree = edges.filter(
      (e) => e.source === node.id || e.target === node.id
    ).length;
    return base + Math.min(Math.max(degree - 1, 0), 4) * 1.5;
  };

  const handleMouseMove = (e: React.MouseEvent, node: GraphNode) => {
    setTooltipPos({ x: e.clientX + 14, y: e.clientY - 14 });
    setHoveredNode(node);
  };

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full block"
      >
        <defs>
          <linearGradient id="shared-blend" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#4E6F96" />
            <stop offset="100%" stopColor="#7C9A74" />
          </linearGradient>
          <linearGradient id="shared-blend-selected" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#1E3A5F" />
            <stop offset="100%" stopColor="#3A5230" />
          </linearGradient>
          <radialGradient id="bg-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="currentColor" stopOpacity="0.04" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0"    />
          </radialGradient>
        </defs>

        <rect width={dims.w} height={dims.h} fill="url(#bg-glow)" />

        {/* ── Edges (Connecting Lines) ── */}
        <g>
          {edges.map((edge, idx) => {
            const s = nodes.find((n) => n.id === edge.source);
            const t = nodes.find((n) => n.id === edge.target);
            if (!s || !t) return null;
            return (
              <line
                key={`e-${idx}`}
                x1={s.x} y1={s.y}
                x2={t.x} y2={t.y}
                className="stroke-primary graph-link"
                strokeWidth="1.5"
                strokeDasharray={s.type === "root" ? "" : "3 3"}
                opacity="0.4"
              />
            );
          })}
        </g>

        {/* ── Nodes ── */}
        <g>
          {nodes.map((node) => {
            const radius     = getNodeRadius(node);
            const fill       = getNodeFill(node);
            const isSelected = !!(selectedId && node.narrativeId === selectedId);

            return (
              /* Outer <g> ONLY holds SVG translate positioning */
              <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                {/* Inner <g> receives cursor, hover events and anime animation */}
                <g
                  className="graph-node-inner cursor-pointer"
                  style={{ opacity: 1 }}
                  onMouseMove={(e) => handleMouseMove(e, node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => {
                    if (node.narrativeId) {
                      const match = narratives.find((n) => n.id === node.narrativeId);
                      if (match) onSelectNarrative(match);
                    }
                  }}
                >
                  {/* Selection ring */}
                  {isSelected && (
                    <circle
                      r={radius + 7}
                      fill="none"
                      stroke={node.owner === "shared" ? "#5A8880" : getNodeFill(node)}
                      strokeWidth="2"
                      opacity="0.85"
                    />
                  )}

                  {/* Main circle */}
                  <circle r={radius} fill={fill} />

                  {/* Node Label Text */}
                  <text
                    y={node.type === "root" ? 4 : -radius - 6}
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize={node.type === "root" ? 11 : node.type === "narrative" ? 10 : 8.5}
                    fontWeight={node.type === "root" || node.type === "narrative" ? "bold" : "normal"}
                    fontFamily="var(--font-noto-serif-kr), serif"
                    className="select-none pointer-events-none opacity-90"
                  >
                    {node.label.length > 12
                      ? node.label.slice(0, 12) + "…"
                      : node.label}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* ── Hover Tooltip ── */}
      {hoveredNode && (
        <div
          className="fixed z-50 pointer-events-none bg-neutral-900/95 dark:bg-neutral-800/95 text-white text-[10px] px-3 py-2 rounded-xl border border-white/10 shadow-xl flex flex-col gap-1 max-w-[200px]"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="flex items-center gap-1 font-bold text-[11px]">
            {hoveredNode.type === "root"      && <Heart    size={10} className="text-amber-400 shrink-0" />}
            {hoveredNode.type === "narrative" && <Calendar size={10} className="text-blue-300  shrink-0" />}
            {hoveredNode.type === "person"    && <User     size={10} className="text-blue-300  shrink-0" />}
            {hoveredNode.type === "place"     && <MapPin   size={10} className="text-yellow-400 shrink-0" />}
            {hoveredNode.type === "emotion"   && <Smile    size={10} className="text-pink-300  shrink-0" />}
            <span className="font-serif">{hoveredNode.label}</span>
          </div>

          {hoveredNode.type !== "root" && (
            <span className="text-neutral-400 font-serif">
              기록자:{" "}
              <strong className="text-neutral-200">
                {hoveredNode.owner === "self"     && "어르신"}
                {hoveredNode.owner === "guardian" && "보호자"}
                {hoveredNode.owner === "shared"   && "가족 공동"}
              </strong>
            </span>
          )}

          {hoveredNode.time && (
            <span className="text-neutral-500 font-serif text-[9px]">
              연대 시점: {hoveredNode.time}
            </span>
          )}

          {hoveredNode.type === "narrative" && (
            <span className="text-neutral-400 font-serif text-[9px] mt-0.5">
              클릭하여 내용 보기 →
            </span>
          )}
        </div>
      )}
    </div>
  );
}
