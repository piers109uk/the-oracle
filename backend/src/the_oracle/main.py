import asyncio
from typing import Union

from fastapi import FastAPI
from pydantic import BaseModel

from the_oracle.llm import second_consequences_from_event
from the_oracle.graph_predictor import generate_second_consequences_from_event
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


class Event(BaseModel):
    event: str


@app.post("/events")
@limiter.limit("3/day")
def generate_consequences(request: Request, event: Event):
    return generate_second_consequences_from_event(event.event)
