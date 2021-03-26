import { App } from "./app"
import type { Entity } from "./entity"
import { EntityType } from "./entity"
import { Vector2 } from "./math/Vector2"
import { updateMiners } from "./miner"
import { randomNumber } from "./utils"

const create = (): App => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
        throw new Error("Could not get 2d context")
    }

    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = width
    canvas.height = height
    document.body.appendChild(canvas)

    return {
        canvas,
        ctx,
        textures: {},
        width,
        height,
        miners: [],
        asteroids: [],
        stations: [],
        tCurrent: Date.now(),
        tEnd: Date.now(),
        tDelta: 0,
        credits: 0,
    }
}

const load = (app: App) => {
    app.miners.push({
        type: EntityType.Miner,
        position: new Vector2(100, 100),
        angle: 0,
        speed: 160,
        cargoCapacity: 0,
        cargoCapacityMax: 100,
        tMiningLaserCooldown: 0,
        tMiningFinishing: 0,
        ai: {
            state: "idle",
            target: null,
            targetPosition: new Vector2(0, 0),
        },
    })
    // app.miners.push({
    //     type: EntityType.Miner,
    //     position: new Vector2(250, 750),
    //     angle: 0,
    //     speed: 60,
    //     cargoCapacity: 0,
    //     cargoCapacityMax: 100,
    //     tMiningLaserCooldown: 0,
    //     tMiningFinishing: 0,
    //     ai: {
    //         state: "idle",
    //         target: null,
    //         targetPosition: new Vector2(0, 0),
    //     },
    // })

    for (let n = 0; n < 10; n++) {
        const x = randomNumber(0, 1000)
        const y = randomNumber(0, 900)
        app.asteroids.push({
            type: EntityType.Asteroid,
            position: new Vector2(x, y),
            miners: [],
            oreAmount: 50,
            oreAmountMax: 50,
        })
    }

    app.stations.push({
        type: EntityType.Station,
        position: new Vector2(500, 500),
    })
}

const createMinerTexture = () => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
        throw new Error("Could not get 2d context")
    }

    const width = 20
    const height = 24
    canvas.width = width
    canvas.height = height

    ctx.fillStyle = "#ff0000"
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.moveTo(2, height - 2)
    ctx.lineTo(width - 2, height - 2)
    ctx.lineTo(width * 0.5, 2)
    ctx.closePath()
    ctx.stroke()
    ctx.fill()

    return canvas
}

const createAsteroidTexture = () => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
        throw new Error("Could not get 2d context")
    }

    const radius = 10
    canvas.width = radius * 2
    canvas.height = radius * 2

    ctx.fillStyle = "brown"
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.arc(radius, radius, radius - 2, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.fill()

    return canvas
}

const createStationTexture = () => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
        throw new Error("Could not get 2d context")
    }

    const width = 32
    const height = 32
    canvas.width = width
    canvas.height = height

    ctx.fillStyle = "orange"
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.moveTo(2, 2)
    ctx.lineTo(width - 2, 2)
    ctx.lineTo(width - 2, height - 2)
    ctx.lineTo(2, height - 2)
    ctx.closePath()
    ctx.stroke()
    ctx.fill()

    return canvas
}

const render = (app: App) => {
    app.tCurrent = Date.now()
    app.tDelta = (app.tCurrent - app.tEnd) / 1000

    app.ctx.fillStyle = "#d6d6d6"
    app.ctx.fillRect(0, 0, app.width, app.height)

    renderEntities(app, app.asteroids, app.textures.asteroid)
    renderEntities(app, app.stations, app.textures.station)

    updateMiners(app)
    renderMiners(app)

    app.tEnd = app.tCurrent
}

const renderMiners = (app: App) => {
    const minerTexture = app.textures.miner

    for (const miner of app.miners) {
        app.ctx.translate(miner.position.x, miner.position.y)
        app.ctx.rotate(miner.angle)
        app.ctx.translate(-miner.position.x, -miner.position.y)

        app.ctx.drawImage(
            minerTexture,
            miner.position.x - minerTexture.width * 0.5,
            miner.position.y - minerTexture.height * 0.5
        )
        app.ctx.setTransform(1, 0, 0, 1, 0, 0)

        if (
            miner.ai.target &&
            miner.tMiningFinishing > 0 &&
            miner.tMiningFinishing > app.tCurrent
        ) {
            app.ctx.strokeStyle = "orange"
            app.ctx.lineWidth = 2

            app.ctx.beginPath()
            app.ctx.moveTo(miner.position.x, miner.position.y)
            app.ctx.lineTo(
                miner.ai.target.position.x,
                miner.ai.target.position.y
            )
            app.ctx.stroke()
        }
    }
}

const renderEntities = <T extends Entity>(
    app: App,
    entities: Array<T>,
    texture: HTMLCanvasElement
) => {
    for (const entity of entities) {
        const halfWidth = texture.width * 0.5
        const halfHeight = texture.height * 0.5

        app.ctx.drawImage(
            texture,
            entity.position.x - halfWidth,
            entity.position.y - halfHeight
        )
    }
}

try {
    const app = create()
    load(app)

    app.textures.miner = createMinerTexture()
    app.textures.asteroid = createAsteroidTexture()
    app.textures.station = createStationTexture()

    const renderFunc = () => {
        render(app)
        requestAnimationFrame(renderFunc)
    }
    requestAnimationFrame(renderFunc)
} catch (err) {
    console.error(err)
}
