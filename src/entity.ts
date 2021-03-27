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

interface EntityBase {
    type: EntityType
    position: Vector2
    size: number
    children: Entity[] | null
}

export interface Miner extends EntityBase {
    type: EntityType.Miner
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

export interface Asteroid extends EntityBase {
    type: EntityType.Asteroid
    miners: Miner[]
    oreAmount: number
    oreAmountMax: number
}

export interface Station extends EntityBase {
    type: EntityType.Station
}

export type Entity = Miner | Asteroid | Station
