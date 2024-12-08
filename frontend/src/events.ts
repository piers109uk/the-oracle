import mockRes from "./mock-res.json"
export interface Consequence {
  consequence: string
  probability: number
  reasoning: string
}

export interface ConsequenceGroup {
  consequence: Consequence
  second_consequences: Consequence[]
}

export type EventResponse = ConsequenceGroup[]

export const generateEventConsequences = async (event: string): Promise<EventResponse> => {
  // return mockRes
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
