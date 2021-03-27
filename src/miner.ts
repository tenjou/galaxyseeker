import type { App } from "./app"
import { unsubscribe } from "./app"
import { mineAsteroid } from "./asteroid"
import {
    Asteroid,
    AsteroidEvent,
    Entity,
    EntityType,
    Miner,
    MinerAIState,
    Station,
} from "./entity"
import { Vector2 } from "./math/Vector2"
import StationService from "./station"

const tmp = new Vector2(0, 0)

export const updateMiners = (app: App) => {
    for (const miner of app.miners) {
        updateMinerAI(app, miner)
    }
}

const transitionState = (
    miner: Miner,
    targetState: MinerAIState,
    target?: Entity | null
) => {
    if (miner.ai.state === targetState) {
        console.error(`Miner is already at this state: ${targetState}`)
        return
    }

    miner.ai.state = targetState
    miner.ai.state

    if (target) {
        const targetPos = getTargetPos(miner, target)
        miner.ai.target = target
        miner.ai.targetPosition.copy(targetPos)
    }
}

const updateMinerAI = (app: App, miner: Miner) => {
    switch (miner.ai.state) {
        case "idle": {
            if (
                miner.cargoCapacity === miner.cargoCapacityMax ||
                app.asteroids.length === 0
            ) {
                transitionState(miner, "search-station")
            } else {
                transitionState(miner, "search-asteroid")
            }
            break
        }

        case "search-asteroid": {
            const asteroid = searchClosestAsteroid(app, miner)
            if (!asteroid) {
                transitionState(miner, "idle")
                return
            }

            transitionState(miner, "fly-to-target", asteroid)
            asteroid.miners.push(miner)
            break
        }

        case "search-station": {
            const station = searchClosestStation(app, miner)
            if (!station) {
                transitionState(miner, "idle")
                return
            }

            transitionState(miner, "fly-to-target", station)
            break
        }

        case "fly-to-target": {
            if (!miner.ai.target) {
                transitionState(miner, "idle")
                console.log("Miner is missing the target")
                return
            }

            if (!updateMinerFlyToTarget(app, miner)) {
                return
            }

            switch (miner.ai.target.type) {
                case EntityType.Asteroid:
                    transitionState(miner, "mining")
                    break

                case EntityType.Station:
                    transitionState(miner, "sell")
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

                        if (
                            miner.ai.target &&
                            miner.cargoCapacity >= miner.cargoCapacityMax
                        ) {
                            unsubscribe(miner.ai.target.miners, miner)
                            transitionState(miner, "idle")
                            miner.ai.target = null
                        }
                    }
                }
                return
            }

            miner.tMiningLaserCooldown = app.tCurrent + 2000
            miner.tMiningFinishing = app.tCurrent + 1000
            break
        }

        case "sell": {
            miner.faction.credits += miner.cargoCapacity
            miner.cargoCapacity = 0
            transitionState(miner, "idle")
            StationService.updateListeners(app)
            break
        }
    }
}

const getTargetPos = (miner: Miner, entityTo: Entity) => {
    tmp.set(
        entityTo.position.x - miner.position.x,
        entityTo.position.y - miner.position.y
    )
    const length = tmp.length() - entityTo.size - 4
    tmp.normalize()

    const targetX = miner.position.x + tmp.x * length
    const targetY = miner.position.y + tmp.y * length
    tmp.set(targetX, targetY)

    return tmp
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
    let numMiners = Number.MAX_SAFE_INTEGER

    for (const asteroid of app.asteroids) {
        const distance = miner.position.distance(
            asteroid.position.x,
            asteroid.position.y
        )
        if (distance < closestDistance && asteroid.miners.length <= numMiners) {
            closestDistance = distance
            closestAsteroid = asteroid
            numMiners = asteroid.miners.length
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
            miner.ai.state = "idle"
            miner.ai.target = null
            miner.tMiningFinishing = 0
            break
    }
}
