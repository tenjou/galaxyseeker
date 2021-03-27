import type { App } from "./app"
import type { Asteroid, Miner } from "./entity"
import { emit } from "./entity"

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

    emit(asteroid, "destroyed")

    asteroid.subscribers.length = 0
}
