import operator
from typing import Annotated, cast

from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from langgraph.types import Send
from pydantic import BaseModel, Field
from typing_extensions import TypedDict

from the_oracle.prompts import PromptManager, Prompts
from the_oracle.langfuse_setup import langfuse_handler


class Consequence(BaseModel):
    consequence: str = Field(description="Specific consequence")
    probability: float = Field(description="Probability between 0 and 1")
    reasoning: str = Field(description="A brief outline of the reasoning behind the consequence and its probability")


class Consequences(BaseModel):
    consequences: list[Consequence] = Field(description="List of consequences and their probabilities")


class SecondConsequences(TypedDict):
    # event: str
    consequence: str
    second_consequences: list[Consequence]


model = ChatOpenAI(model="gpt-4o-mini")


class OverallState(TypedDict):
    event: str
    first_consequences: list[Consequence]
    # Notice here we use the operator.add
    # This is because we want combine all the jokes we generate
    # from individual nodes back into one list - this is essentially
    # the "reduce" part
    second_consequences: Annotated[list[SecondConsequences], operator.add]

    aggregated_consequences: list[SecondConsequences]


class SecondConsequenceState(TypedDict):
    event: str
    consequence: Consequence
    known_consequences: list[str]


# This is the function we will use to generate the subjects of the jokes
def generate_consequences(state: OverallState):
    # print(state)
    consequences_prompt = PromptManager.get_prompt_template(Prompts.consequences)
    prompt = consequences_prompt.format(event=state["event"])
    # print(prompt)
    response = model.with_structured_output(Consequences).invoke(prompt)
    consequences = cast(Consequences, response)
    # print(consequences)
    return {"first_consequences": consequences.consequences}


def generate_second_consequences(state: SecondConsequenceState):
    second_consequences_prompt = PromptManager.get_prompt_template(Prompts.second_consequences)
    prompt = second_consequences_prompt.format(
        event=state["event"],
        consequence=state["consequence"].consequence,
        known_consequences=state["known_consequences"],
    )
    response = model.with_structured_output(Consequences).invoke(prompt)
    consequences = cast(Consequences, response)
    second_consequences = {"second_consequences": consequences.consequences, "consequence": state["consequence"]}
    return {"second_consequences": [second_consequences]}


def to_second_consequences(state: OverallState):
    # We will return a list of `Send` objects
    # Each `Send` object consists of the name of a node in the graph
    # as well as the state to send to that node

    first_consequences = state["first_consequences"]

    def other_consequences(consequence: str):
        return ", ".join([c.consequence for c in first_consequences if c.consequence != consequence])

    second_consequence_data: list[SecondConsequenceState] = [
        {"event": state["event"], "consequence": c, "known_consequences": other_consequences(c.consequence)}
        for c in first_consequences
    ]
    return [Send("generate_second_consequences", x) for x in second_consequence_data]


def aggregate_consequences(state: OverallState):
    second_consequences = state["second_consequences"]

    return {"aggregated_consequences": second_consequences}


graph = StateGraph(OverallState)

graph.add_node("generate_consequences", generate_consequences)
graph.add_node("generate_second_consequences", generate_second_consequences)
graph.add_node("aggregate_consequences", aggregate_consequences)

graph.add_edge(START, "generate_consequences")
graph.add_conditional_edges("generate_consequences", to_second_consequences, ["generate_second_consequences"])
graph.add_edge("generate_second_consequences", "aggregate_consequences")
graph.add_edge("aggregate_consequences", END)


app = graph.compile()


def generate_second_consequences_from_event(event: str):
    res = app.invoke({"event": event}, config={"callbacks": [langfuse_handler]})

    return res.get("aggregated_consequences")


if __name__ == "__main__":
    res = generate_second_consequences_from_event(
        "LLM technology makes professionals in many industries far more productive."
    )
    print(res)
