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
    tCurrent: number
    tEnd: number
    tDelta: number
}

enum EntityType {
    Unknown,
    Miner,
    Asteroid,
    Station,
}

type Entity = {
    type: EntityType
    position: Vector2
}

type MinerAIState = "idle" | "search-asteroid" | "fly-to-target" | "mining"

type AsteroidEvent = "destroyed"

type Miner = Entity & {
    type: EntityType.Miner
    angle: number
    speed: number
    cargoCapacity: number
    cargoCapacityMax: number
    miningLaserCooldown: number
    ai: {
        state: MinerAIState
        target: Entity | null
        targetPosition: Vector2
    }
}

type Asteroid = Entity & {
    type: EntityType.Asteroid
    miners: Miner[]
    oreAmount: number
    oreAmountMax: number
}

type Station = Entity & {
    type: EntityType.Station
}

const tmp = new Vector2(0, 0)

const subscribe = (subscribers: Entity[], from: Entity) => {
    subscribers.push(from)
}

const unsubscribe = (subscribers: Entity[], from: Entity) => {
    const index = subscribers.indexOf(from)
    if (index === -1) {
        return
    }

    subscribers[index] = subscribers[subscribers.length - 1]
    subscribers.pop()
}

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
    }
}

const load = (app: App) => {
    app.miners.push({
        type: EntityType.Miner,
        position: new Vector2(100, 100),
        angle: 0,
        speed: 60,
        cargoCapacity: 0,
        cargoCapacityMax: 100,
        miningLaserCooldown: 0,
        ai: {
            state: "idle",
            target: null,
            targetPosition: new Vector2(0, 0),
        },
    })
    app.miners.push({
        type: EntityType.Miner,
        position: new Vector2(250, 750),
        angle: 0,
        speed: 60,
        cargoCapacity: 0,
        cargoCapacityMax: 100,
        miningLaserCooldown: 0,
        ai: {
            state: "idle",
            target: null,
            targetPosition: new Vector2(0, 0),
        },
    })

    app.asteroids.push({
        type: EntityType.Asteroid,
        position: new Vector2(200, 250),
        miners: [],
        oreAmount: 50,
        oreAmountMax: 50,
    })
    app.asteroids.push({
        type: EntityType.Asteroid,
        position: new Vector2(300, 550),
        miners: [],
        oreAmount: 50,
        oreAmountMax: 50,
    })

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
            miner.ai.target = asteroid
            miner.ai.targetPosition.set(
                miner.position.x + tmp.x * length,
                miner.position.y + tmp.y * length
            )
            break
        }

        case "fly-to-target": {
            if (!updateMinerFlyToTarget(app, miner)) {
                return
            }

            miner.ai.state = "mining"
            break
        }

        case "mining": {
            if (app.tCurrent < miner.miningLaserCooldown) {
                return
            }

            miner.miningLaserCooldown = app.tCurrent + 3000
            break
        }
    }
}

const handleAsteroidEvent = (
    asteroid: Asteroid,
    entity: Entity,
    asteroidEvent: AsteroidEvent
) => {
    switch (entity.type) {
        case EntityType.Miner:
            break
    }
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
