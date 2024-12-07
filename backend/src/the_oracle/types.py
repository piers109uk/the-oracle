from typing import List, TypedDict


class Consequence:
    consequence: str
    probability: float
    reasoning: str


class SecondConsequences(TypedDict):
    consequence: str
    second_consequences: List[Consequence]
