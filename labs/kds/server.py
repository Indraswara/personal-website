from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from runner import run_headless

app = FastAPI()


class SimParams(BaseModel):
    # Bounds exist because this endpoint is public with no auth — a grid_size
    # x food_density combo with no cap could balloon a single response to
    # millions of JSON entries (max_steps snapshots x grid_size^2 cells).
    grid_size: int = Field(30, ge=5, le=40)
    initial_prey: int = Field(40, ge=0, le=300)
    initial_predators: int = Field(8, ge=0, le=100)
    prey_reproduce_interval: int = Field(5, ge=1, le=50)
    predator_reproduce_interval: int = Field(8, ge=1, le=50)
    predator_initial_energy: int = Field(20, ge=1, le=200)
    energy_gain: int = Field(10, ge=0, le=200)
    energy_loss: int = Field(2, ge=0, le=100)
    max_steps: int = Field(100, ge=1, le=200)
    food_density: float = Field(0.1, ge=0.0, le=0.3)


@app.post("/api/simulate")
def simulate(params: SimParams):
    history = run_headless(**params.model_dump())
    return {"gridSize": params.grid_size, "history": history}


# Mounted last so the routes above stay matched first.
app.mount("/", StaticFiles(directory="static", html=True), name="static")
