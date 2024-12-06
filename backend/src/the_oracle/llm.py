import asyncio
import time
from typing import Any, TypedDict, cast

from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from the_oracle.langfuse_setup import langfuse_handler
from the_oracle.logger import logger
from the_oracle.prompts import PromptManager, Prompts

# Load environment variables from .env file
load_dotenv()

llm = ChatOpenAI(model="gpt-4o", temperature=0)


# Define a Pydantic model for consequence output
class Consequence(BaseModel):
    consequence: str = Field(description="Specific consequence")
    probability: float = Field(description="Probability between 0 and 1")
    reasoning: str = Field(description="A brief outline of the reasoning behind the consequence and its probability")


class Consequences(BaseModel):
    consequences: list[Consequence] = Field(description="List of consequences and their probabilities")


class SecondConsequences(TypedDict):
    consequence: str
    second_consequences: list[Consequence]


consequences_template = PromptManager.get_prompt_template(Prompts.consequences)

second_consequences_template = PromptManager.get_prompt_template(Prompts.second_consequences)


async def consequences_from_event(event: str) -> list[Consequence]:
    prompt = consequences_template.invoke({"event": event})
    structured_llm = llm.with_structured_output(Consequences)
    response = await structured_llm.ainvoke(prompt, config={"callbacks": [langfuse_handler]})
    # print(response)
    consequences_res = cast(Consequences, response)
    return consequences_res.consequences


async def second_consequence_from_first_order(
    event: str, first_order_consequence: str, first_consequences: list[Consequence]
) -> SecondConsequences:
    other_consequences = ", ".join(
        [c.consequence for c in first_consequences if c.consequence != first_order_consequence]
    )
    prompt = second_consequences_template.invoke(
        {"event": event, "consequence": first_order_consequence, "known_consequences": other_consequences}
    )
    structured_llm = llm.with_structured_output(Consequences)
    response = await structured_llm.ainvoke(prompt, config={"callbacks": [langfuse_handler]})
    consequences_res = cast(Consequences, response)
    logger.info(f"Generated second-order consequences for {first_order_consequence}")
    return {
        "consequence": first_order_consequence,
        "second_consequences": consequences_res.consequences,
    }


async def second_consequences_from_event(event: str) -> list[SecondConsequences]:
    first_consequences = await consequences_from_event(event)

    tasks = [
        second_consequence_from_first_order(event, consequence.consequence, first_consequences)
        for consequence in first_consequences
    ]
    second_consequences = await asyncio.gather(*tasks)

    return second_consequences


if __name__ == "__main__":
    start_time = time.time()
    event = "LLM technology makes professionals in many industries far more productive."
    second_order = asyncio.run(second_consequences_from_event(event))
    end_time = time.time()
    print(f"Time taken: {end_time - start_time} seconds")
    print(second_order)
