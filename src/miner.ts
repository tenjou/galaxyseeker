import type { Asteroid, AsteroidEvent, Miner } from "./entity"

export const handleAsteroidEvent = (
    asteroid: Asteroid,
    miner: Miner,
    asteroidEvent: AsteroidEvent
) => {
    switch (asteroidEvent) {
        case "destroyed":
            break
    }
}
