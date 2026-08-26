import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { AgentStateId } from '../types';
import { AGENT_STATE_CATALOG } from '../data/serviceRegistry';
import {
  stepConway,
  computeGridEntropy,
  createInitialGrid,
  injectAgentStatePattern,
} from '../utils/conwayEngine';

interface ConwayAutomatonViewProps {
  currentAgentState: AgentStateId;
  onInjectState: (state: AgentStateId) => void;
}

export const ConwayAutomatonView: React.FC<ConwayAutomatonViewProps> = ({
  currentAgentState,
  onInjectState,
}) => {
  const [grid, setGrid] = useState<boolean[][]>(() => createInitialGrid(24, 36, 0.16));
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [generation, setGeneration] = useState<number>(0);
  const [speedMs, setSpeedMs] = useState<number>(180);

  // Auto evolution loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setGrid((prev) => stepConway(prev));
      setGeneration((g) => g + 1);
    }, speedMs);
    return () => clearInterval(interval);
  }, [isPlaying, speedMs]);

  // Synchronize when Agent changes state
  useEffect(() => {
    setGrid((prev) => injectAgentStatePattern(prev, currentAgentState));
  }, [currentAgentState]);

  const { liveCount, entropy } = computeGridEntropy(grid);

  const toggleCell = (r: number, c: number) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = !next[r][c];
      return next;
    });
  };

  const handleReset = () => {
    setGrid(createInitialGrid(24, 36, 0.16));
    setGeneration(0);
  };

  const handleClear = () => {
    setGrid(Array.from({ length: 24 }, () => Array(36).fill(false)));
    setGeneration(0);
  };

  return (
    <div className="space-y-6">
      {/* Top Architecture Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-100 font-mono">
                Conway Automaton State Engine ($S_0 \to S_{10}$)
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              SHOR synchronizes the AI agent's discrete economic lifecycle with a 2D cellular automaton lattice.
              State transition equation: <span className="text-cyan-300 font-mono font-semibold">S_(t+1) = F(S_t, N_t, P_t)</span>, where <span className="text-slate-300">N_t</span> is service telemetry and <span className="text-slate-300">P_t</span> are governance policy constraints.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono bg-slate-950 p-2.5 px-3 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">GENERATION</span>
              <span className="text-cyan-400 font-bold">{generation}</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[10px]">ACTIVE CELLS</span>
              <span className="text-emerald-400 font-bold">{liveCount}</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[10px]">SHANNON ENTROPY</span>
              <span className="text-indigo-300 font-bold">{entropy} bits</span>
            </div>
          </div>
        </div>
      </div>

      {/* State Machine Transition Graph ($S_0$ to $S_{10}$) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Formal Agent State Pipeline
          </h3>
          <span className="text-[11px] text-slate-400">Click any state to inject its mathematical seed pattern</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
          {AGENT_STATE_CATALOG.map((state) => {
            const isActive = currentAgentState === state.id;
            return (
              <button
                key={state.id}
                onClick={() => {
                  onInjectState(state.id as AgentStateId);
                  setGrid((prev) => injectAgentStatePattern(prev, state.id as AgentStateId));
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isActive
                    ? 'bg-cyan-950/60 border-cyan-400 shadow-md ring-1 ring-cyan-400/30'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-300">{state.code}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                </div>
                <div className="text-xs font-semibold text-slate-200 mt-0.5 truncate">{state.label}</div>
                <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">{state.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Cellular Automaton Canvas & Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors shadow"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Resume'}</span>
            </button>
            <button
              onClick={() => {
                setGrid((prev) => stepConway(prev));
                setGeneration((g) => g + 1);
              }}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              Step (1 Gen)
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Randomize</span>
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded-md bg-slate-800/60 hover:bg-slate-800 text-slate-400 text-xs font-medium transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Speed:</span>
            <input
              type="range"
              min="50"
              max="400"
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
              className="w-24 accent-cyan-400"
            />
            <span className="text-slate-300 w-12">{speedMs}ms</span>
          </div>
        </div>

        {/* 2D Grid Visualizer */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 overflow-x-auto flex justify-center shadow-inner">
          <div className="inline-grid grid-cols-36 gap-[2px] bg-slate-900 p-1.5 rounded-lg">
            {grid.map((row, r) =>
              row.map((cell, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => toggleCell(r, c)}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[2px] transition-colors duration-100 ${
                    cell
                      ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]'
                      : 'bg-slate-950/80 hover:bg-slate-800'
                  }`}
                  title={`Cell (${r}, ${c}): ${cell ? 'Live' : 'Dead'}`}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
