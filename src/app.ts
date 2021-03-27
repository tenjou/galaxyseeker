import type { Asteroid, Entity, Miner, Station } from "./entity"
import type { Factions } from "./faction"

export interface App {
    canvas: HTMLElement
    ctx: CanvasRenderingContext2D
    textures: Record<string, HTMLCanvasElement>
    width: number
    height: number
    miners: Miner[]
    asteroids: Asteroid[]
    stations: Station[]
    tCurrent: number
    tEnd: number
    tDelta: number
    factions: Factions
}

interface SelectEvent {
    type: "select"
    entity: Entity
}

interface UnselectEvent {
    type: "unselect"
}

export type GlobalEvent = SelectEvent | UnselectEvent

type SubscribeFunc = (event: GlobalEvent) => void

const subscribers: SubscribeFunc[] = []

export const subscribeGlobal = (func: SubscribeFunc) => {
    subscribers.push(func)
}

export const emitGlobal = (event: GlobalEvent) => {
    for (const subscriber of subscribers) {
        subscriber(event)
    }
}
