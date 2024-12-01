import React, { useState } from "react"
import ReactFlow, { Node, Edge, Background } from "react-flow-renderer"

const App: React.FC = () => {
  const [event, setEvent] = useState("")
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEvent(e.target.value)
  }

  const generateConsequences = () => {
    const firstOrder1 = `${event} - First Order Consequence 1`
    const firstOrder2 = `${event} - First Order Consequence 2`
    const secondOrder1 = `${firstOrder1} - Second Order Consequence`
    const secondOrder2 = `${firstOrder2} - Second Order Consequence`

    setNodes([
      { id: "1", data: { label: event }, position: { x: 250, y: 0 } },
      { id: "2", data: { label: firstOrder1 }, position: { x: 100, y: 100 } },
      { id: "3", data: { label: firstOrder2 }, position: { x: 400, y: 100 } },
      { id: "4", data: { label: secondOrder1 }, position: { x: 50, y: 200 } },
      { id: "5", data: { label: secondOrder2 }, position: { x: 450, y: 200 } },
    ])

    setEdges([
      { id: "e1-2", source: "1", target: "2", animated: true },
      { id: "e1-3", source: "1", target: "3", animated: true },
      { id: "e2-4", source: "2", target: "4", animated: true },
      { id: "e3-5", source: "3", target: "5", animated: true },
    ])
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
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background />
        </ReactFlow>
      </div>
    </div>
  )
}

export default App
