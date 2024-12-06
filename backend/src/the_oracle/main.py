import asyncio
from typing import Union

from fastapi import FastAPI
from pydantic import BaseModel

from the_oracle.llm import second_consequences_from_event

app = FastAPI()


class Event(BaseModel):
    event: str


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


@app.post("/events")
async def generate_consequences(event: Event):
    res = await second_consequences_from_event(event.event)
    return res
