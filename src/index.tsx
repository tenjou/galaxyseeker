import { Vector2 } from "./math/Vector2"

interface App {
    canvas: HTMLElement
    ctx: CanvasRenderingContext2D
    textures: Record<string, HTMLCanvasElement>
    width: number
    height: number
    miners: Miner[]
    asteroids: Asteroid[]
    stations: Station[]
    tEnd: number
    tDelta: number
}

interface Entity {
    position: Vector2
}

type MinerAIState = "idle" | "search-asteroid" | "fly-to-target"

interface Miner extends Entity {
    angle: number
    speed: number
    target: Vector2
    cargoCapacity: number
    cargoCapacityMax: number
    ai: {
        state: MinerAIState
    }
}

interface Asteroid extends Entity {}

interface Station extends Entity {}

const tmp = new Vector2(0, 0)

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
        tEnd: Date.now(),
        tDelta: 0,
    }
}

const load = (app: App) => {
    app.miners.push({
        position: new Vector2(100, 100),
        angle: 0,
        speed: 60,
        target: new Vector2(0, 0),
        cargoCapacity: 0,
        cargoCapacityMax: 100,
        ai: {
            state: "idle",
        },
    })
    app.miners.push({
        position: new Vector2(250, 750),
        angle: 0,
        speed: 60,
        target: new Vector2(0, 0),
        cargoCapacity: 0,
        cargoCapacityMax: 100,
        ai: {
            state: "idle",
        },
    })

    app.asteroids.push({
        position: new Vector2(200, 250),
    })
    app.asteroids.push({
        position: new Vector2(300, 550),
    })

    app.stations.push({
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
    const tNow = Date.now()
    app.tDelta = (tNow - app.tEnd) / 1000
    app.tEnd = tNow

    app.ctx.fillStyle = "#d6d6d6"
    app.ctx.fillRect(0, 0, app.width, app.height)

    renderEntities(app, app.asteroids, app.textures.asteroid)
    renderEntities(app, app.stations, app.textures.station)

    updateMiners(app)
    renderMiners(app)
}

const updateMiners = (app: App) => {
    for (const miner of app.miners) {
        updateMinerAI(app, miner)
    }
}

const updateMinerAI = (app: App, miner: Miner) => {
    switch (miner.ai.state) {
        case "idle":
            miner.ai.state = "search-asteroid"
            break

        case "search-asteroid": {
            const asteroid = searchClosestAsteroid(app, miner)
            if (!asteroid) {
                miner.ai.state = "idle"
                return
            }

            tmp.set(
                asteroid.position.x - miner.position.x,
                asteroid.position.y - miner.position.y
            )
            const length = tmp.length() - 30
            tmp.normalize()

            miner.ai.state = "fly-to-target"
            miner.target.set(
                miner.position.x + tmp.x * length,
                miner.position.y + tmp.y * length
            )
            break
        }

        case "fly-to-target": {
            updateMinerFlyToTarget(app, miner)
            break
        }
    }
}

const updateMinerFlyToTarget = (app: App, miner: Miner) => {
    tmp.set(
        miner.target.x - miner.position.x,
        miner.target.y - miner.position.y
    )
    const length = tmp.length()
    const speed = miner.speed * app.tDelta

    if (length <= speed) {
        miner.position.set(miner.target.x, miner.target.y)
        return false
    }

    tmp.normalize()
    miner.position.add(tmp.x * speed, tmp.y * speed)
    miner.angle = Math.atan2(tmp.x, -tmp.y)
    return true
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
