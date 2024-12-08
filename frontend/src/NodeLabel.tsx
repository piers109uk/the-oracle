import React from "react"
import { Tooltip } from "react-tooltip"
import { Consequence } from "./events"

interface NodeLabelProps {
  id: string
  consequence: Consequence
}

export default function NodeLabel({ id, consequence }: NodeLabelProps) {
  return (
    <>
      <div data-tooltip-id={id} data-tooltip-content={consequence.reasoning}>
        <div>{consequence.consequence}</div>
        <div className="text-sm opacity-75">{(consequence.probability * 100).toFixed(0)}%</div>
      </div>
      <Tooltip id={id} delayShow={500} />
    </>
  )
}
