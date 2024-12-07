import React, { useState } from "react"
import ReactFlow, { Node, Edge, Background } from "react-flow-renderer"
import { generateEventConsequences } from "./events"
import { useNodesState, useEdgesState } from "reactflow"

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
          data: { label: firstConsequence.consequence.consequence },
          position: { x: 100 + index * 500, y: 150 },
          draggable: true,
        })
        edges.push({
          id: `e-event-${firstId}`,
          source: "event",
          target: firstId,
          animated: true,
        })

        firstConsequence.second_consequences.forEach((secondConsequence, sIndex) => {
          const secondId = `second-${index}-${sIndex}`
          nodes.push({
            id: secondId,
            data: { label: secondConsequence.consequence },
            position: { x: 50 + index * 500 + sIndex * 200, y: 300 },
            draggable: true,
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
