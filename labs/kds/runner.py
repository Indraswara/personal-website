"""Headless replay of simulation.py's `simulate()` loop from the upstream
kds repo — same agent logic (agents.py is vendored in unmodified by the
Dockerfile), minus matplotlib/tkinter and the interactive-viewer scaffolding
around it. Returns the full step-by-step history as JSON-safe dicts instead
of feeding a matplotlib FuncAnimation.
"""
import random

from agents import Food, Predator, Prey


def _snapshot(prey_list, predator_list, food_list):
    avg_prey_energy = sum(p.energy for p in prey_list) / len(prey_list) if prey_list else 0
    avg_predator_energy = (
        sum(p.energy for p in predator_list) / len(predator_list) if predator_list else 0
    )
    available_food = sum(1 for f in food_list if f.available)
    return {
        "prey": [{"x": p.x, "y": p.y, "energy": p.energy} for p in prey_list],
        "predators": [{"x": p.x, "y": p.y, "energy": p.energy} for p in predator_list],
        "food": [{"x": f.x, "y": f.y, "available": f.available} for f in food_list],
        "stats": {
            "avgPreyEnergy": avg_prey_energy,
            "avgPredatorEnergy": avg_predator_energy,
            "availableFood": available_food,
        },
    }


def run_headless(
    grid_size,
    initial_prey,
    initial_predators,
    prey_reproduce_interval,
    predator_reproduce_interval,
    predator_initial_energy,
    energy_gain,
    energy_loss,
    max_steps,
    food_density,
):
    prey_list = [
        Prey(random.randrange(grid_size), random.randrange(grid_size)) for _ in range(initial_prey)
    ]
    predator_list = [
        Predator(random.randrange(grid_size), random.randrange(grid_size), predator_initial_energy)
        for _ in range(initial_predators)
    ]
    num_food = int(grid_size * grid_size * food_density)
    food_list = [Food(random.randrange(grid_size), random.randrange(grid_size)) for _ in range(num_food)]

    history = [_snapshot(prey_list, predator_list, food_list)]

    for _ in range(1, max_steps + 1):
        for food in food_list:
            food.step()
        food_positions = {(f.x, f.y) for f in food_list if f.available}

        occupied = {}
        for agent in prey_list + predator_list:
            occupied.setdefault((agent.x, agent.y), []).append(agent)

        new_prey = []
        for prey in prey_list[:]:
            child = prey.step(grid_size, prey_reproduce_interval, occupied, food_positions)
            if child:
                new_prey.append(child)
        prey_list = [p for p in prey_list if p.is_alive()]
        prey_list.extend(new_prey)

        for prey in prey_list:
            for food in food_list:
                if food.x == prey.x and food.y == prey.y and food.available:
                    food.consume()
                    break

        prey_positions = {(p.x, p.y) for p in prey_list}
        occupied_positions = {(a.x, a.y) for a in prey_list + predator_list}

        new_predators = []
        for predator in predator_list:
            child, ate = predator.step(
                grid_size,
                prey_positions,
                energy_gain,
                energy_loss,
                predator_reproduce_interval,
                occupied_positions,
            )
            if ate:
                prey_list = [pr for pr in prey_list if not (pr.x == predator.x and pr.y == predator.y)]
                prey_positions.discard((predator.x, predator.y))
            if child:
                new_predators.append(child)
        predator_list.extend(new_predators)
        predator_list = [pd for pd in predator_list if pd.is_alive()]

        history.append(_snapshot(prey_list, predator_list, food_list))

        if not prey_list or not predator_list:
            break

    return history
