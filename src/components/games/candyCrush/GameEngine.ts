import { GAME_CONFIG } from "@/config/gameConfig";

export type GemType = number; // 0-5 for normal gems
export type SpecialType = 'striped_h' | 'striped_v' | 'wrapped' | 'color_bomb' | null;
export type ObstacleType = 'ice' | 'lock' | 'stone' | null;

export interface Cell {
  gem: GemType | null;
  special: SpecialType;
  obstacle: ObstacleType;
  obstacleHealth: number;
  isEmpty: boolean;
}

export interface Match {
  cells: [number, number][];
  gem: GemType;
  isSpecial: boolean;
}

export interface SwapResult {
  valid: boolean;
  matches: Match[];
}

export class Match3Engine {
  grid: Cell[][];
  size: number;
  princePosition: [number, number];
  princessPosition: [number, number];
  
  constructor(size: number = GAME_CONFIG.GRID_SIZE) {
    this.size = size;
    this.grid = this.initializeGrid();
    // Prince starts at bottom-left, Princess at top-right
    this.princePosition = [size - 1, 0];
    this.princessPosition = [0, size - 1];
  }
  
  initializeGrid(): Cell[][] {
    const grid: Cell[][] = [];
    for (let row = 0; row < this.size; row++) {
      grid[row] = [];
      for (let col = 0; col < this.size; col++) {
        grid[row][col] = {
          gem: Math.floor(Math.random() * GAME_CONFIG.GEM_TYPES),
          special: null,
          obstacle: null,
          obstacleHealth: 0,
          isEmpty: false,
        };
      }
    }
    
    // Remove initial matches
    this.removeInitialMatches(grid);
    return grid;
  }
  
  removeInitialMatches(grid: Cell[][]) {
    let hasMatches = true;
    let iterations = 0;
    const maxIterations = 100;
    
    while (hasMatches && iterations < maxIterations) {
      hasMatches = false;
      iterations++;
      
      for (let row = 0; row < this.size; row++) {
        for (let col = 0; col < this.size; col++) {
          if (this.wouldCreateMatch(grid, row, col, grid[row][col].gem!)) {
            grid[row][col].gem = this.getRandomGemNotMatching(grid, row, col);
            hasMatches = true;
          }
        }
      }
    }
  }
  
  wouldCreateMatch(grid: Cell[][], row: number, col: number, gem: GemType): boolean {
    // Check horizontal
    let count = 1;
    let c = col - 1;
    while (c >= 0 && grid[row][c].gem === gem) {
      count++;
      c--;
    }
    c = col + 1;
    while (c < this.size && grid[row][c].gem === gem) {
      count++;
      c++;
    }
    if (count >= GAME_CONFIG.MATCH_MIN) return true;
    
    // Check vertical
    count = 1;
    let r = row - 1;
    while (r >= 0 && grid[r][col].gem === gem) {
      count++;
      r--;
    }
    r = row + 1;
    while (r < this.size && grid[r][col].gem === gem) {
      count++;
      r++;
    }
    return count >= GAME_CONFIG.MATCH_MIN;
  }
  
  getRandomGemNotMatching(grid: Cell[][], row: number, col: number): GemType {
    const available: GemType[] = [];
    for (let i = 0; i < GAME_CONFIG.GEM_TYPES; i++) {
      if (!this.wouldCreateMatch(grid, row, col, i)) {
        available.push(i);
      }
    }
    return available.length > 0 
      ? available[Math.floor(Math.random() * available.length)]
      : Math.floor(Math.random() * GAME_CONFIG.GEM_TYPES);
  }
  
  canSwap(row1: number, col1: number, row2: number, col2: number): boolean {
    // Check if cells are adjacent
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }
  
  swap(row1: number, col1: number, row2: number, col2: number): SwapResult {
    if (!this.canSwap(row1, col1, row2, col2)) {
      return { valid: false, matches: [] };
    }
    
    // Perform swap
    const temp = this.grid[row1][col1];
    this.grid[row1][col1] = this.grid[row2][col2];
    this.grid[row2][col2] = temp;
    
    // Check for matches
    const matches = this.findMatches();
    
    if (matches.length === 0) {
      // Revert swap
      this.grid[row2][col2] = this.grid[row1][col1];
      this.grid[row1][col1] = temp;
      return { valid: false, matches: [] };
    }
    
    return { valid: true, matches };
  }
  
  findMatches(): Match[] {
    const matches: Match[] = [];
    const matched = new Set<string>();
    
    // Find horizontal matches
    for (let row = 0; row < this.size; row++) {
      let matchStart = 0;
      let currentGem = this.grid[row][0].gem;
      let matchLength = 1;
      
      for (let col = 1; col <= this.size; col++) {
        const gem = col < this.size ? this.grid[row][col].gem : null;
        
        if (gem === currentGem && gem !== null) {
          matchLength++;
        } else {
          if (matchLength >= GAME_CONFIG.MATCH_MIN && currentGem !== null) {
            const cells: [number, number][] = [];
            for (let c = matchStart; c < col; c++) {
              cells.push([row, c]);
              matched.add(`${row},${c}`);
            }
            matches.push({ cells, gem: currentGem, isSpecial: matchLength >= 4 });
          }
          matchStart = col;
          currentGem = gem;
          matchLength = 1;
        }
      }
    }
    
    // Find vertical matches
    for (let col = 0; col < this.size; col++) {
      let matchStart = 0;
      let currentGem = this.grid[0][col].gem;
      let matchLength = 1;
      
      for (let row = 1; row <= this.size; row++) {
        const gem = row < this.size ? this.grid[row][col].gem : null;
        
        if (gem === currentGem && gem !== null) {
          matchLength++;
        } else {
          if (matchLength >= GAME_CONFIG.MATCH_MIN && currentGem !== null) {
            const cells: [number, number][] = [];
            for (let r = matchStart; r < row; r++) {
              if (!matched.has(`${r},${col}`)) {
                cells.push([r, col]);
                matched.add(`${r},${col}`);
              }
            }
            if (cells.length >= GAME_CONFIG.MATCH_MIN) {
              matches.push({ cells, gem: currentGem, isSpecial: matchLength >= 4 });
            }
          }
          matchStart = row;
          currentGem = gem;
          matchLength = 1;
        }
      }
    }
    
    return matches;
  }
  
  clearMatches(matches: Match[]): number {
    let score = 0;
    
    for (const match of matches) {
      for (const [row, col] of match.cells) {
        if (this.grid[row][col].gem !== null) {
          score += 10;
          
          // Create special candy if 4+ match
          if (match.isSpecial && match.cells.length === 4) {
            const isHorizontal = match.cells[0][0] === match.cells[1][0];
            this.grid[row][col].special = isHorizontal ? 'striped_h' : 'striped_v';
          } else if (match.isSpecial && match.cells.length >= 5) {
            this.grid[row][col].special = 'color_bomb';
          }
          
          this.grid[row][col].gem = null;
          this.grid[row][col].isEmpty = true;
        }
        
        // Damage obstacles nearby
        this.damageNearbyObstacles(row, col);
      }
    }
    
    return score;
  }
  
  damageNearbyObstacles(row: number, col: number) {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of directions) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < this.size && c >= 0 && c < this.size) {
        if (this.grid[r][c].obstacle && this.grid[r][c].obstacleHealth > 0) {
          this.grid[r][c].obstacleHealth--;
          if (this.grid[r][c].obstacleHealth === 0) {
            this.grid[r][c].obstacle = null;
          }
        }
      }
    }
  }
  
  applyGravity(): boolean {
    let moved = false;
    
    for (let col = 0; col < this.size; col++) {
      let writeRow = this.size - 1;
      
      for (let row = this.size - 1; row >= 0; row--) {
        if (!this.grid[row][col].isEmpty && this.grid[row][col].gem !== null) {
          if (row !== writeRow) {
            this.grid[writeRow][col] = { ...this.grid[row][col] };
            this.grid[row][col] = {
              gem: null,
              special: null,
              obstacle: null,
              obstacleHealth: 0,
              isEmpty: true,
            };
            moved = true;
          }
          writeRow--;
        }
      }
    }
    
    return moved;
  }
  
  refillGrid() {
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.grid[row][col].isEmpty || this.grid[row][col].gem === null) {
          this.grid[row][col] = {
            gem: Math.floor(Math.random() * GAME_CONFIG.GEM_TYPES),
            special: null,
            obstacle: this.grid[row][col].obstacle,
            obstacleHealth: this.grid[row][col].obstacleHealth,
            isEmpty: false,
          };
        }
      }
    }
  }
  
  addObstacles(obstacles: string[]) {
    const obstacleCount = Math.min(obstacles.length * 3, this.size * this.size / 4);
    
    for (let i = 0; i < obstacleCount; i++) {
      const row = Math.floor(Math.random() * this.size);
      const col = Math.floor(Math.random() * this.size);
      const obsType = obstacles[Math.floor(Math.random() * obstacles.length)] as ObstacleType;
      
      this.grid[row][col].obstacle = obsType;
      this.grid[row][col].obstacleHealth = obsType === 'stone' ? 3 : 1;
    }
  }
}
