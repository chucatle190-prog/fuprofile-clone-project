// A* Pathfinding for Prince movement
interface Node {
  x: number;
  y: number;
  g: number; // cost from start
  h: number; // heuristic to end
  f: number; // total cost
  parent: Node | null;
}

export function findPath(
  grid: any[][],
  start: [number, number],
  end: [number, number]
): [number, number][] {
  const [startX, startY] = start;
  const [endX, endY] = end;
  const gridSize = grid.length;

  // Helper functions
  const heuristic = (x: number, y: number): number => {
    return Math.abs(x - endX) + Math.abs(y - endY);
  };

  const isValid = (x: number, y: number): boolean => {
    return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
  };

  const isWalkable = (x: number, y: number): boolean => {
    // Can walk through empty cells or cells without obstacles
    return isValid(x, y) && !grid[x][y].obstacle;
  };

  // Initialize
  const openSet: Node[] = [];
  const closedSet: Set<string> = new Set();
  
  const startNode: Node = {
    x: startX,
    y: startY,
    g: 0,
    h: heuristic(startX, startY),
    f: heuristic(startX, startY),
    parent: null,
  };

  openSet.push(startNode);

  while (openSet.length > 0) {
    // Get node with lowest f score
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    // Check if reached end
    if (current.x === endX && current.y === endY) {
      // Reconstruct path
      const path: [number, number][] = [];
      let node: Node | null = current;
      while (node) {
        path.unshift([node.x, node.y]);
        node = node.parent;
      }
      return path;
    }

    closedSet.add(`${current.x},${current.y}`);

    // Check neighbors (4 directions)
    const neighbors = [
      [current.x - 1, current.y],
      [current.x + 1, current.y],
      [current.x, current.y - 1],
      [current.x, current.y + 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (!isValid(nx, ny) || closedSet.has(`${nx},${ny}`)) {
        continue;
      }

      // Allow reaching the end even if there's an obstacle (princess cage)
      if (!(nx === endX && ny === endY) && !isWalkable(nx, ny)) {
        continue;
      }

      const g = current.g + 1;
      const h = heuristic(nx, ny);
      const f = g + h;

      const existingNode = openSet.find(n => n.x === nx && n.y === ny);
      
      if (existingNode) {
        if (g < existingNode.g) {
          existingNode.g = g;
          existingNode.f = f;
          existingNode.parent = current;
        }
      } else {
        openSet.push({
          x: nx,
          y: ny,
          g,
          h,
          f,
          parent: current,
        });
      }
    }
  }

  // No path found, return empty
  return [];
}

export function getNextMoveTowardsPrincess(
  grid: any[][],
  princePos: [number, number],
  princessPos: [number, number],
  steps: number = 1
): [number, number] {
  const path = findPath(grid, princePos, princessPos);
  
  if (path.length <= 1) {
    return princePos; // Already at destination or no path
  }

  // Move forward by 'steps' positions on the path
  const targetIndex = Math.min(steps, path.length - 1);
  return path[targetIndex];
}
