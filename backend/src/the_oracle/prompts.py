from enum import Enum
from langchain_core.prompts import PromptTemplate
from langfuse import Langfuse

# Initialize Langfuse client
langfuse = Langfuse()


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


class Prompts(Enum):
    consequences = "consequences"
    second_consequences = "second_consequences"


class PromptManager:
    @staticmethod
    def get_prompt_template(name: Prompts) -> PromptTemplate:
        if name == Prompts.consequences:
            return consequences_template
        elif name == Prompts.second_consequences:
            return second_consequences_template
        else:
            raise ValueError(f"Invalid prompt name: {name}")
        # langfuse_prompt = langfuse.get_prompt(name.value, label="latest")
        # return PromptTemplate.from_template(langfuse_prompt.get_langchain_prompt())
