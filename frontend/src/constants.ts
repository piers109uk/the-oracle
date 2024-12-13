export type NodeType = "root" | "firstLevel" | "secondLevel"

export const GRID_CONFIG = {
  rootCoordinates: { x: 250, y: 0 },
  itemsPerRow: 3,
  nodeWidth: 130,
  nodeHeight: 130,
  horizontalSpacing: 30,
  verticalSpacing: 30,
  firstLevelSpacing: 500,
  firstLevelStartX: 100,
  firstLevelY: 150,
  secondLevelStartY: 300,
}

export interface NodeStyles {
  background: string
  color: string
}

export const NODE_STYLES: Record<NodeType, NodeStyles> = {
  root: { background: "#ffffff", color: "#000000" },
  firstLevel: { background: "#1e40af", color: "white" },
  secondLevel: { background: "#93c5fd", color: "#1e1e1e" },
}
