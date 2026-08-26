import { AgentStateId } from '../types';

export interface ConwayGridState {
  grid: boolean[][];
  rows: number;
  cols: number;
  generation: number;
  liveCellCount: number;
  entropy: number;
  agentState: AgentStateId;
}

export function createInitialGrid(rows: number = 24, cols: number = 32, density: number = 0.18): boolean[][] {
  const grid: boolean[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(Math.random() < density);
    }
    grid.push(row);
  }
  return grid;
}

export function stepConway(grid: boolean[][]): boolean[][] {
  const rows = grid.length;
  const cols = grid[0].length;
  const next: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let neighbors = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = (r + dr + rows) % rows;
          const nc = (c + dc + cols) % cols;
          if (grid[nr][nc]) neighbors++;
        }
      }

      if (grid[r][c]) {
        next[r][c] = neighbors === 2 || neighbors === 3;
      } else {
        next[r][c] = neighbors === 3;
      }
    }
  }

  return next;
}

export function computeGridEntropy(grid: boolean[][]): { liveCount: number; entropy: number } {
  let liveCount = 0;
  const total = grid.length * grid[0].length;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c]) liveCount++;
    }
  }

  const p = liveCount / total;
  if (p === 0 || p === 1) return { liveCount, entropy: 0 };
  // Shannon Entropy: - p log2(p) - (1-p) log2(1-p)
  const entropy = Number((-p * Math.log2(p) - (1 - p) * Math.log2(1 - p)).toFixed(4));
  return { liveCount, entropy };
}

/**
 * Injects a dynamic entropy seed pattern into the cellular automaton lattice
 * based on the active SHOR Agent state transition.
 */
export function injectAgentStatePattern(
  grid: boolean[][],
  state: AgentStateId
): boolean[][] {
  const next = grid.map((row) => [...row]);
  const rows = next.length;
  const cols = next[0].length;
  const cr = Math.floor(rows / 2);
  const cc = Math.floor(cols / 2);

  // Clear a center region
  for (let r = Math.max(0, cr - 4); r < Math.min(rows, cr + 4); r++) {
    for (let c = Math.max(0, cc - 6); c < Math.min(cols, cc + 6); c++) {
      next[r][c] = false;
    }
  }

  // Inject pattern based on state
  switch (state) {
    case 'S1_OBSERVE': // Glider
      next[cr - 1][cc] = true;
      next[cr][cc + 1] = true;
      next[cr + 1][cc - 1] = true;
      next[cr + 1][cc] = true;
      next[cr + 1][cc + 1] = true;
      break;

    case 'S2_PLAN': // Lightweight Spaceship (LWSS)
      next[cr - 1][cc - 1] = true;
      next[cr - 1][cc + 2] = true;
      next[cr][cc - 2] = true;
      next[cr + 1][cc - 2] = true;
      next[cr + 1][cc + 2] = true;
      next[cr + 2][cc - 2] = true;
      next[cr + 2][cc - 1] = true;
      next[cr + 2][cc] = true;
      next[cr + 2][cc + 1] = true;
      break;

    case 'S4_EVALUATE': // Pulsar oscillator core
      for (let offset = -2; offset <= 2; offset += 2) {
        next[cr + offset][cc - 1] = true;
        next[cr + offset][cc] = true;
        next[cr + offset][cc + 1] = true;
      }
      break;

    case 'S6_PAY': // Concentric settlement pulse (Beacon + Toad)
      next[cr - 1][cc - 1] = true;
      next[cr - 1][cc] = true;
      next[cr][cc - 1] = true;
      next[cr + 1][cc + 2] = true;
      next[cr + 2][cc + 1] = true;
      next[cr + 2][cc + 2] = true;
      break;

    case 'S8_VERIFY': // Pentadecathlon (15-period cryptographic oscillator)
      for (let i = -4; i <= 4; i++) {
        if (i !== -2 && i !== 2) {
          next[cr][cc + i] = true;
        }
      }
      break;

    case 'S10_COMPLETE': // Full stable beacon bloom
      next[cr - 1][cc - 1] = true;
      next[cr - 1][cc + 1] = true;
      next[cr + 1][cc - 1] = true;
      next[cr + 1][cc + 1] = true;
      next[cr][cc] = true;
      break;

    default:
      // Random subtle jitter
      for (let i = -2; i <= 2; i++) {
        next[(cr + i + rows) % rows][(cc + i + cols) % cols] = true;
      }
      break;
  }

  return next;
}
