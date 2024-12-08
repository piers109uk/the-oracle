import React, { useState } from "react"
import ReactFlow, { Background, Edge, Node } from "react-flow-renderer"
import { useEdgesState, useNodesState } from "reactflow"
import { Consequence, EventResponse, generateEventConsequences } from "./events"
import NodeLabel from "./NodeLabel"

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

export const NODE_STYLES = {
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
    <div className="p-4 mx-auto h-screen">
      <div className="">
        <h1 className="text-2xl font-bold mb-4">The Oracle</h1>
        <input type="text" value={event} onChange={(e) => setEvent(e.target.value)} placeholder="Enter an event" className="border p-2 w-full mb-4" />
        <button onClick={generateConsequences} className="bg-blue-500 text-white p-2 rounded">
          Generate Consequences
        </button>
        <button onClick={handleReset} className="bg-gray-500 text-white p-2 rounded">
          Reset Nodes
        </button>
      </div>
      <div className="h-3/4 w-full mt-4 border">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} fitView>
          <Background />
        </ReactFlow>
      </div>
    </div>
  )
}

export default App
