import type { App } from "./app"
import type { Entity } from "./entity"
import type { Vector2 } from "./math/Vector2"

export const isInside = (
    position: Vector2,
    size: number,
    pointerX: number,
    pointerY: number
) => {
    const minX = position.x - size * 0.5
    const minY = position.y - size * 0.5
    const maxX = position.x + size * 0.5
    const maxY = position.y + size * 0.5

    return (
        pointerX >= minX &&
        pointerX <= maxX &&
        pointerY >= minY &&
        pointerY <= maxY
    )
}

export const getRaycastedEntity = (
    app: App,
    x: number,
    y: number
): Entity | null => {
    for (const station of app.stations) {
        if (isInside(station.position, station.size, x, y)) {
            return station
        }
    }

    for (const miner of app.miners) {
        if (isInside(miner.position, miner.size, x, y)) {
            return miner
        }
    }

    for (const asteroid of app.asteroids) {
        if (isInside(asteroid.position, asteroid.size, x, y)) {
            return asteroid
        }
    }

    return null
}
