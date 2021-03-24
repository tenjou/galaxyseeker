import type { App } from "./app"
import type { Asteroid, Miner } from "./entity"
import { handleAsteroidEvent } from "./miner"

export const mineAsteroid = (app: App, asteroid: Asteroid, miner: Miner) => {
    const minerCargoLeft = miner.cargoCapacityMax - miner.cargoCapacity
    const miningStrength = Math.min(minerCargoLeft, 25)
    const minedAmount = Math.min(asteroid.oreAmount, miningStrength)
    asteroid.oreAmount -= minedAmount
    miner.cargoCapacity += minedAmount

    if (asteroid.oreAmount <= 0) {
        destroyAsteroid(app, asteroid)
    }
}

const destroyAsteroid = (app: App, asteroid: Asteroid) => {
    const index = app.asteroids.indexOf(asteroid)
    if (index === -1) {
        return
    }

    app.asteroids[index] = app.asteroids[app.asteroids.length - 1]
    app.asteroids.pop()

    for (const miner of asteroid.miners) {
        handleAsteroidEvent(asteroid, miner, "destroyed")
    }
}
