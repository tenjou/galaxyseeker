import type { Faction } from "./faction"
import type { Vector2 } from "./math/Vector2"

export enum EntityType {
    Unknown,
    Miner,
    Asteroid,
    Station,
}

export type MinerAIState =
    | "idle"
    | "search-asteroid"
    | "search-station"
    | "fly-to-target"
    | "mining"
    | "sell"

export type AsteroidEvent = "destroyed"

export type Miner = {
    type: EntityType.Miner
    position: Vector2
    angle: number
    speed: number
    cargoCapacity: number
    cargoCapacityMax: number
    tMiningLaserCooldown: number
    tMiningFinishing: number
    faction: Faction
    ai: {
        state: MinerAIState
        target: Entity | null
        targetPosition: Vector2
    }
}

export type Asteroid = {
    type: EntityType.Asteroid
    position: Vector2
    miners: Miner[]
    oreAmount: number
    oreAmountMax: number
}

export type Station = {
    type: EntityType.Station
    position: Vector2
}

export type Entity = Miner | Asteroid | Station
