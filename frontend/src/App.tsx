import React, { useState } from "react"
import ReactFlow, { Background, Edge, Node } from "react-flow-renderer"
import { useEdgesState, useNodesState } from "reactflow"
import { Consequence, generateEventConsequences } from "./events"
import NodeLabel from "./NodeLabel"

type NodeType = "root" | "firstLevel" | "secondLevel"

const GRID_CONFIG = {
  itemsPerRow: 3,
  nodeWidth: 130,
  nodeHeight: 130,
  horizontalSpacing: 30,
  verticalSpacing: 30,
  firstLevelSpacing: 500,
  firstLevelStartX: 100,
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

const calculateGridPosition = (parentX: number, index: number) => {
  const { itemsPerRow, nodeWidth, nodeHeight, horizontalSpacing, verticalSpacing } = GRID_CONFIG
  const row = Math.floor(index / itemsPerRow)
  const col = index % itemsPerRow
  const xOffset = col * (nodeWidth + horizontalSpacing) - ((nodeWidth + horizontalSpacing) * (itemsPerRow - 1)) / 2

  return {
    x: parentX + xOffset,
    y: 300 + row * (nodeHeight + verticalSpacing),
  }
}

const getEventNodePosition = () => ({ x: 250, y: 0 })
const getFirstLevelPosition = (index: number) => {
  const { firstLevelStartX, firstLevelSpacing } = GRID_CONFIG
  return { x: firstLevelStartX + index * firstLevelSpacing, y: 150 }
}

const getSecondLevelPosition = (parentIndex: number, sIndex: number) => {
  const { firstLevelStartX, firstLevelSpacing } = GRID_CONFIG
  const parentX = firstLevelStartX + parentIndex * firstLevelSpacing
  return calculateGridPosition(parentX, sIndex)
}

const NODE_IDS = {
  event: () => "event",
  firstLevel: (index: number) => `first-${index}`,
  secondLevel: (parentIndex: number, sIndex: number) => `second-${parentIndex}-${sIndex}`,
} as const

const createEventNode = (eventText: string): Node => ({
  id: NODE_IDS.event(),
  data: { label: eventText },
  position: getEventNodePosition(),
  draggable: true,
  style: NODE_STYLES.root,
})

const createFirstLevelNode = (consequence: Consequence, index: number): Node => {
  const id = NODE_IDS.firstLevel(index)
  const position = getFirstLevelPosition(index)
  return { id, data: { label: NodeLabel({ id, consequence }) }, position, draggable: true, style: NODE_STYLES.firstLevel }
}

const createSecondLevelNode = (parentIndex: number, consequence: Consequence, sIndex: number): Node => {
  const id = NODE_IDS.secondLevel(parentIndex, sIndex)
  const position = getSecondLevelPosition(parentIndex, sIndex)
  return { id, data: { label: NodeLabel({ id, consequence }) }, position, draggable: true, style: NODE_STYLES.secondLevel }
}

const createEdge = (source: string, target: string): Edge => ({
  id: `e-${source}-${target}`,
  source,
  target,
  animated: true,
})

const resetNodePositions = (nodes: Node[]): Node[] => {
  return nodes.map((node) => {
    // Preserve all node data, only update position
    if (node.id === "event") {
      return { ...node, position: getEventNodePosition() }
    }

    if (node.id.startsWith("first-")) {
      const index = parseInt(node.id.split("-")[1])
      return { ...node, position: getFirstLevelPosition(index) }
    }

    if (node.id.startsWith("second-")) {
      const [_, parentIndex, sIndex] = node.id.split("-").map(Number)
      return { ...node, position: getSecondLevelPosition(parentIndex, sIndex) }
    }

    return node
  })
}

const App: React.FC = () => {
  const [event, setEvent] = useState("")
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges] = useEdgesState([])

  const generateConsequences = async () => {
    try {
      const consequenceGroups = await generateEventConsequences(event)
      const newNodes: Node[] = [createEventNode(event)]
      const newEdges: Edge[] = []

      consequenceGroups.forEach((consequenceGroup, index) => {
        const firstId = `first-${index}`
        const firstLevelNode = createFirstLevelNode(consequenceGroup.consequence, index)
        newNodes.push(firstLevelNode)
        newEdges.push(createEdge("event", firstId))

        consequenceGroup.second_consequences.forEach((secondConsequence, sIndex) => {
          const secondId = `second-${index}-${sIndex}`
          newNodes.push(createSecondLevelNode(index, secondConsequence, sIndex))
          newEdges.push(createEdge(firstId, secondId))
        })
      })

      setNodes(newNodes)
      setEdges(newEdges)
    } catch (error) {
      console.error("Failed to generate consequences:", error)
    }
  }

  const handleReset = () => {
    setNodes(resetNodePositions(nodes))
  }

  return (
    <div className="p-6 mx-auto h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-gray-800">The Oracle</h1>
        <input
          type="text"
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          placeholder="Enter an event"
          className="border border-gray-300 p-3 w-full mb-6 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
        />
        <div className="space-x-4 mb-8">
          <button
            onClick={generateConsequences}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md transition duration-200 ease-in-out"
          >
            Generate Consequences
          </button>
          <button
            onClick={handleReset}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg shadow-md transition duration-200 ease-in-out"
          >
            Reset Nodes
          </button>
        </div>
      </div>
      <div className="h-3/4 w-full mt-6 border border-gray-200 rounded-xl shadow-lg overflow-hidden">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} fitView>
          <Background />
        </ReactFlow>
      </div>
    </div>
  )
}

export default App
