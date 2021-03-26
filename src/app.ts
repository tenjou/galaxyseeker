import type { Asteroid, Miner, Station } from "./entity"

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
    credits: number
}

export const subscribe = <T>(subscribers: T[], from: T) => {
    subscribers.push(from)
}

export const unsubscribe = <T>(subscribers: T[], from: T) => {
    const index = subscribers.indexOf(from)
    if (index === -1) {
        return
    }

    subscribers[index] = subscribers[subscribers.length - 1]
    subscribers.pop()
}
