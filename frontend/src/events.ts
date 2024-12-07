import mockRes from "./mock-res.json"
interface Consequence {
  consequence: string
  probability: number
  reasoning: string
}

interface SecondConsequence {
  consequence: Consequence
  second_consequences: Consequence[]
}

type EventResponse = SecondConsequence[]

export const generateEventConsequences = async (event: string): Promise<EventResponse> => {
  const api = "http://127.0.0.1:8000/events-graph"
  const response = await fetch(api, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ event }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}
