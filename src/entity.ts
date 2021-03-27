import { isNumber } from "lodash"
import type { Faction } from "./faction"
import type { Vector2 } from "./math/Vector2"

export enum EntityType {
    Unknown,
    Miner,
    Asteroid,
    Station,
}

export const EntityTypeStr = Object.keys(EntityType).filter((entry) =>
    isNaN(parseInt(entry))
)

export type MinerAIState =
    | "idle"
    | "search-asteroid"
    | "search-station"
    | "fly-to-target"
    | "mining"
    | "sell"

export type EntityEvent = "updated" | "destroyed"

type SubscriberCallback = (from: Entity, to: Entity, event: EntityEvent) => void

interface Subscriber {
    entity: Entity
    callback: SubscriberCallback
}

interface EntityBase {
    type: EntityType
    position: Vector2
    size: number
    subscribers: Subscriber[]
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
    oreAmount: number
    oreAmountMax: number
}

export interface Station extends EntityBase {
    type: EntityType.Station
}

export type Entity = Miner | Asteroid | Station

export const subscribe = (
    target: Entity,
    entity: Entity,
    callback: SubscriberCallback
) => {
    target.subscribers.push({
        entity,
        callback,
    })
}

export const unsubscribe = (target: Entity, entity: Entity) => {
    const index = target.subscribers.findIndex(
        (entry) => entry.entity === entity
    )
    if (index === -1) {
        return
    }

    if (target.subscribers.length === 1) {
        target.subscribers.length = 0
        return
    }

    target.subscribers.splice(index, 1)
}

export const emit = (from: Entity, event: EntityEvent) => {
    for (const subscriber of from.subscribers) {
        subscriber.callback(from, subscriber.entity, event)
    }
}
