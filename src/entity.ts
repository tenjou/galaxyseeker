import type { Vector2 } from "./math/Vector2"

export enum EntityType {
    Unknown,
    Miner,
    Asteroid,
    Station,
}

export type Entity = {
    type: EntityType
    position: Vector2
}

export type MinerAIState =
    | "idle"
    | "search-asteroid"
    | "fly-to-target"
    | "mining"

export type AsteroidEvent = "destroyed"

export type Miner = Entity & {
    type: EntityType.Miner
    angle: number
    speed: number
    cargoCapacity: number
    cargoCapacityMax: number
    tMiningLaserCooldown: number
    tMiningFinishing: number
    ai: {
        state: MinerAIState
        target: Entity | null
        targetPosition: Vector2
    }
}

export type Asteroid = Entity & {
    type: EntityType.Asteroid
    miners: Miner[]
    oreAmount: number
    oreAmountMax: number
}

export type Station = Entity & {
    type: EntityType.Station
}
