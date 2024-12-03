from typing import cast
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from langchain_core.prompts import PromptTemplate
from langfuse_setup import langfuse_handler
from logger import logger


# Load environment variables from .env file
load_dotenv()

llm = ChatOpenAI(model="gpt-4o", temperature=0)


# Define a Pydantic model for consequence output
class Consequence(BaseModel):
    consequence: str = Field(description="Specific consequence")
    probability: float = Field(description="Probability between 0 and 1")


class Consequences(BaseModel):
    consequences: list[Consequence] = Field(description="List of consequences and their probabilities")


consequences_prompt = """
You are a well informed visionary and entrepreneur with experience in business and economics.

Your job is to predict the consequences of: {event}

Express each consequence as JSON with the following keys:
// be specific
consequence: string
// between 0 and 1
probability: number
"""

consequences_template = PromptTemplate.from_template(consequences_prompt)

second_consequences_prompt = """
For the given event and the given first-order consequence, provide a list of second order consequences.

Original Event: {event}
First-order Consequence: {consequence} 

Other known consequences NOT to include:
---
{known_consequences}
---

For second-order consequences, focus specifically on the consequences of the first-order consequence ONLY. Do not generate other first-order consequences of the event itself that are not direct consequences of the first-order consequence.
Do not include known consequences.
"""
second_consequences_template = PromptTemplate.from_template(second_consequences_prompt)


def consequences_from_event(event: str) -> list[Consequence]:
    prompt = consequences_template.invoke({"event": event})
    structured_llm = llm.with_structured_output(Consequences)
    response = structured_llm.invoke(prompt, config={"callbacks": [langfuse_handler]})
    # print(response)
    consequences_res = cast(Consequences, response)
    return consequences_res.consequences


def second_consequences_from_event(event: str) -> list[Consequence]:
    first_consequences = consequences_from_event(event)

    second_consequences = []
    # TODO: make async
    for consequence in first_consequences:
        logger.info(f"Generating second-order consequences for {consequence.consequence}")
        other_consequences = ", ".join(
            [c.consequence for c in first_consequences if c.consequence != consequence.consequence]
        )

        prompt = second_consequences_template.invoke(
            {"event": event, "consequence": consequence.consequence, "known_consequences": other_consequences}
        )
        structured_llm = llm.with_structured_output(Consequences)
        response = structured_llm.invoke(prompt, config={"callbacks": [langfuse_handler]})
        consequences_res = cast(Consequences, response)

        second_consequences.append(
            {"consequence": consequence.consequence, "second_consequences": consequences_res.consequences}
        )
    return second_consequences

    # structured_llm = llm.with_structured_output(Consequences)
    # response = structured_llm.invoke(prompt, config={"callbacks": [langfuse_handler]})
    # print(response)
    # consequences_res = cast(Consequences, response)
    # return consequences_res.consequences


second_order = second_consequences_from_event(
    "LLM technology makes professionals in many industries far more productive."
)

print(second_order)
