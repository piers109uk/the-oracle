import React, { useState } from "react"
import ReactFlow, { Node, Edge, Background } from "react-flow-renderer"
import { generateEventConsequences } from "./events"
import { useNodesState, useEdgesState } from "reactflow"
import { Tooltip } from "react-tooltip"

const App: React.FC = () => {
  const [event, setEvent] = useState("")
  // const [nodes, setNodes] = useState<Node[]>([])
  // const [edges, setEdges] = useState<Edge[]>([])

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges] = useEdgesState([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEvent(e.target.value)
  }

  // generateEventConsequences()
  const generateConsequences = async () => {
    try {
      const consequences = await generateEventConsequences(event)

      const nodes: Node[] = [{ id: "event", data: { label: event }, position: { x: 250, y: 0 } }]

      const edges: Edge[] = []

      consequences.forEach((firstConsequence, index) => {
        const firstId = `first-${index}`
        nodes.push({
          id: firstId,
          data: {
            label: (
              <>
                <div data-tooltip-id={firstId} data-tooltip-content={firstConsequence.consequence.reasoning}>
                  <div>{firstConsequence.consequence.consequence}</div>
                  <div className="text-sm opacity-75">{(firstConsequence.consequence.probability * 100).toFixed(0)}%</div>
                </div>
                <Tooltip id={firstId} delayShow={500} />
              </>
            ),
          },
          position: { x: 100 + index * 500, y: 150 },
          draggable: true,
          style: {
            background: "#1e40af", // dark blue
            color: "white", // white text for better contrast
          },
        })
        edges.push({
          id: `e-event-${firstId}`,
          source: "event",
          target: firstId,
          animated: true,
        })

        // Calculate positions for second consequences in a grid layout
        firstConsequence.second_consequences.forEach((secondConsequence, sIndex) => {
          const secondId = `second-${index}-${sIndex}`

          // Number of items per row (assuming 130px width + some spacing)
          const itemsPerRow = 3
          const nodeWidth = 130
          const nodeHeight = 130
          const horizontalSpacing = 30
          const verticalSpacing = 30

          // Calculate row and column for grid layout
          const row = Math.floor(sIndex / itemsPerRow)
          const col = sIndex % itemsPerRow

          // Calculate x position relative to parent
          const parentX = 100 + index * 500
          const xOffset = col * (nodeWidth + horizontalSpacing) - ((nodeWidth + horizontalSpacing) * (itemsPerRow - 1)) / 2
          const x = parentX + xOffset

          // Calculate y position with increasing rows
          const y = 300 + row * (nodeHeight + verticalSpacing)

          nodes.push({
            id: secondId,
            data: {
              label: (
                <>
                  <div data-tooltip-id={secondId} data-tooltip-content={secondConsequence.reasoning}>
                    <div>{secondConsequence.consequence}</div>
                    <div className="text-sm opacity-75">{(secondConsequence.probability * 100).toFixed(0)}%</div>
                  </div>
                  <Tooltip id={secondId} delayShow={500} />
                </>
              ),
            },
            position: { x, y },
            draggable: true,
            style: {
              background: "#93c5fd", // light blue
              color: "#1e1e1e", // dark text for better contrast
            },
          })
          edges.push({
            id: `e-${firstId}-${secondId}`,
            source: firstId,
            target: secondId,
            animated: true,
          })
        })
      })

      setNodes(nodes)
      setEdges(edges)
    } catch (error) {
      console.error("Failed to generate consequences:", error)
    }
  }

  return (
    <div className="p-4 mx-auto h-screen">
      <div className="">
        <h1 className="text-2xl font-bold mb-4">Event Consequences Visualizer</h1>
        <input type="text" value={event} onChange={handleInputChange} placeholder="Enter an event" className="border p-2 w-full mb-4" />
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
