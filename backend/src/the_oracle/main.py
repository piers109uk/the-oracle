import asyncio
from typing import Union

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from the_oracle.graph_predictor import generate_second_consequences_from_event
from the_oracle.llm import second_consequences_from_event

limiter = Limiter(key_func=get_remote_address)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5175",  # Local development
        "https://the-oracle-iota.vercel.app",  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


class Event(BaseModel):
    event: str


@app.post("/events")
# @limiter.limit("3/day")
def generate_consequences(request: Request, event: Event):
    return asyncio.run(second_consequences_from_event(event.event))


@app.post("/events-graph")
# @limiter.limit("3/day")
def generate_consequences_graph(request: Request, event: Event):
    return generate_second_consequences_from_event(event.event)
