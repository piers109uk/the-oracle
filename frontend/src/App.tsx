import React, { useState } from "react"
import ReactFlow, { Node, Edge, Background } from "react-flow-renderer"
import { Consequence, EventResponse, generateEventConsequences } from "./events"
import { useNodesState, useEdgesState } from "reactflow"
import { Tooltip } from "react-tooltip"

const GRID_CONFIG = {
  itemsPerRow: 3,
  nodeWidth: 130,
  nodeHeight: 130,
  horizontalSpacing: 30,
  verticalSpacing: 30,
}

const createNodeLabel = (id: string, data: Consequence) => (
  <>
    <div data-tooltip-id={id} data-tooltip-content={data.reasoning}>
      <div>{data.consequence}</div>
      <div className="text-sm opacity-75">{(data.probability * 100).toFixed(0)}%</div>
    </div>
    <Tooltip id={id} delayShow={500} />
  </>
)

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

const createFirstLevelNode = (event: string, consequence: Consequence, index: number): Node => {
  const id = `first-${index}`
  return {
    id,
    data: { label: createNodeLabel(id, consequence) },
    position: { x: 100 + index * 500, y: 150 },
    draggable: true,
    style: { background: "#1e40af", color: "white" },
  }
}

const createSecondLevelNode = (parentIndex: number, consequence: Consequence, sIndex: number, parentX: number): Node => {
  const id = `second-${parentIndex}-${sIndex}`
  const position = calculateGridPosition(parentX, sIndex)

  return {
    id,
    data: { label: createNodeLabel(id, consequence) },
    position,
    draggable: true,
    style: { background: "#93c5fd", color: "#1e1e1e" },
  }
}

const createEdge = (source: string, target: string): Edge => ({
  id: `e-${source}-${target}`,
  source,
  target,
  animated: true,
})

const App: React.FC = () => {
  const [event, setEvent] = useState("")
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges] = useEdgesState([])

  const generateConsequences = async () => {
    try {
      const consequenceGroups: EventResponse = await generateEventConsequences(event)
      const newNodes: Node[] = [{ id: "event", data: { label: event }, position: { x: 250, y: 0 } }]
      const newEdges: Edge[] = []

      consequenceGroups.forEach((consequenceGroup, index) => {
        const firstId = `first-${index}`
        const firstLevelNode = createFirstLevelNode(event, consequenceGroup.consequence, index)
        newNodes.push(firstLevelNode)
        newEdges.push(createEdge("event", firstId))

        const parentX = 100 + index * 500
        consequenceGroup.second_consequences.forEach((secondConsequence, sIndex) => {
          const secondId = `second-${index}-${sIndex}`
          newNodes.push(createSecondLevelNode(index, secondConsequence, sIndex, parentX))
          newEdges.push(createEdge(firstId, secondId))
        })
      })

      setNodes(newNodes)
      setEdges(newEdges)
    } catch (error) {
      console.error("Failed to generate consequences:", error)
    }
  }

  return (
    <div className="p-4 mx-auto h-screen">
      <div className="">
        <h1 className="text-2xl font-bold mb-4">The Oracle</h1>
        <input type="text" value={event} onChange={(e) => setEvent(e.target.value)} placeholder="Enter an event" className="border p-2 w-full mb-4" />
        <button onClick={generateConsequences} className="bg-blue-500 text-white p-2 rounded">
          Generate Consequences
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
