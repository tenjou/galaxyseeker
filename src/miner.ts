import type { App } from "./app"
import { subscribe, unsubscribe } from "./app"
import { mineAsteroid } from "./asteroid"
import {
    Asteroid,
    AsteroidEvent,
    Entity,
    EntityType,
    Miner,
    Station,
} from "./entity"
import { Vector2 } from "./math/Vector2"

const tmp = new Vector2(0, 0)

export const updateMiners = (app: App) => {
    for (const miner of app.miners) {
        updateMinerAI(app, miner)
    }
}

const updateMinerAI = (app: App, miner: Miner) => {
    switch (miner.ai.state) {
        case "idle": {
            if (miner.cargoCapacity === miner.cargoCapacityMax) {
                miner.ai.state = "search-station"
            } else {
                miner.ai.state = "search-asteroid"
            }
            break
        }

        case "search-asteroid": {
            const asteroid = searchClosestAsteroid(app, miner)
            if (!asteroid) {
                miner.ai.state = "idle"
                return
            }
            setTarget(miner, asteroid)
            subscribe(asteroid.miners, miner)
            break
        }

        case "search-station": {
            const station = searchClosestStation(app, miner)
            if (!station) {
                miner.ai.state = "idle"
                return
            }
            setTarget(miner, station)
            break
        }

        case "fly-to-target": {
            if (!miner.ai.target) {
                miner.ai.state = "idle"
                console.log("Miner is missing the target")
                return
            }

            if (!updateMinerFlyToTarget(app, miner)) {
                return
            }

            switch (miner.ai.target.type) {
                case EntityType.Asteroid:
                    miner.ai.state = "mining"
                    break

                case EntityType.Station:
                    miner.ai.state = "sell"
                    break

                default:
                    console.log(
                        `Unhandled miner fly-to-target transition: ${miner.ai.target.type}`
                    )
                    break
            }
            break
        }

        case "mining": {
            if (miner.tMiningLaserCooldown > app.tCurrent) {
                if (
                    miner.tMiningFinishing > 0 &&
                    miner.tMiningFinishing <= app.tCurrent
                ) {
                    miner.tMiningFinishing = 0

                    if (miner.ai.target?.type === EntityType.Asteroid) {
                        mineAsteroid(app, miner.ai.target, miner)
                    }
                }
                return
            }

            miner.tMiningLaserCooldown = app.tCurrent + 4000
            miner.tMiningFinishing = app.tCurrent + 2000
            break
        }

        case "sell": {
            break
        }
    }
}

const setTarget = (miner: Miner, entityTo: Entity) => {
    if (miner.ai.target) {
        console.error("Miner should not have target active")
        return
    }

    tmp.set(
        entityTo.position.x - miner.position.x,
        entityTo.position.y - miner.position.y
    )
    const length = tmp.length() - 30
    tmp.normalize()

    miner.ai.state = "fly-to-target"
    miner.ai.target = entityTo
    miner.ai.targetPosition.set(
        miner.position.x + tmp.x * length,
        miner.position.y + tmp.y * length
    )
}

const updateMinerFlyToTarget = (app: App, miner: Miner) => {
    const targetPosition = miner.ai.targetPosition

    tmp.set(
        targetPosition.x - miner.position.x,
        targetPosition.y - miner.position.y
    )
    const length = tmp.length()
    const speed = miner.speed * app.tDelta

    if (length <= speed) {
        miner.position.set(targetPosition.x, targetPosition.y)
        return true
    }

    tmp.normalize()
    miner.position.add(tmp.x * speed, tmp.y * speed)
    miner.angle = Math.atan2(tmp.x, -tmp.y)
    return false
}

const searchClosestAsteroid = (app: App, miner: Miner): Asteroid | null => {
    let closestDistance: number = Number.MAX_SAFE_INTEGER
    let closestAsteroid: Asteroid | null = null

    for (const asteroid of app.asteroids) {
        const distance = miner.position.distance(
            asteroid.position.x,
            asteroid.position.y
        )
        if (distance < closestDistance) {
            closestDistance = distance
            closestAsteroid = asteroid
        }
    }

    return closestAsteroid
}

const searchClosestStation = (app: App, miner: Miner): Station | null => {
    let closestDistance: number = Number.MAX_SAFE_INTEGER
    let closestStation: Station | null = null

    for (const station of app.stations) {
        const distance = miner.position.distance(
            station.position.x,
            station.position.y
        )
        if (distance < closestDistance) {
            closestDistance = distance
            closestStation = station
        }
    }

    return closestStation
}

export const handleAsteroidEvent = (
    asteroid: Asteroid,
    miner: Miner,
    asteroidEvent: AsteroidEvent
) => {
    switch (asteroidEvent) {
        case "destroyed":
            unsubscribe(asteroid.miners, miner)
            miner.ai.state = "idle"
            miner.ai.target = null
            break
    }
}
