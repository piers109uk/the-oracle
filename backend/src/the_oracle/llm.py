from pydantic import BaseModel, Field


# Define a Pydantic model for consequence output
class ConsequenceModel(BaseModel):
    consequence: str = Field(description="Specific consequence")
    probability: float = Field(description="Probability between 0 and 1")
