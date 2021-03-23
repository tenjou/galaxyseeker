import { Vector2 } from "./math/Vector2"

interface App {
    canvas: HTMLElement
    ctx: CanvasRenderingContext2D
    textures: Record<string, HTMLCanvasElement>
    width: number
    height: number
    miners: Miner[]
    asteroids: Asteroid[]
    tEnd: number
    tDelta: number
}

interface Asteroid {
    position: Vector2
}

interface Miner {
    position: Vector2
    angle: number
    speed: number
    target: Vector2 | null
}

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
        tEnd: Date.now(),
        tDelta: 0,
    }
}

const load = (app: App) => {
    const asteroidPos = new Vector2(200, 250)

    app.miners.push({
        position: new Vector2(100, 100),
        angle: 0,
        speed: 100,
        target: asteroidPos,
    })
    app.miners.push({
        position: new Vector2(250, 750),
        angle: 0,
        speed: 100,
        target: asteroidPos,
    })

    app.asteroids.push({
        position: asteroidPos,
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

const render = (app: App) => {
    const tNow = Date.now()
    app.tDelta = (tNow - app.tEnd) / 1000
    app.tEnd = tNow

    app.ctx.fillStyle = "#d6d6d6"
    app.ctx.fillRect(0, 0, app.width, app.height)

    renderAsteroids(app)

    updateMiners(app)
    renderMiners(app)
}

const updateMiners = (app: App) => {
    for (const miner of app.miners) {
        if (!miner.target) {
            continue
        }

        tmp.set(
            miner.target.x - miner.position.x,
            miner.target.y - miner.position.y
        )
        const length = tmp.length()
        const speed = miner.speed * app.tDelta

        if (length <= speed) {
            miner.position.set(miner.target.x, miner.target.y)

            console.log(miner.position)
            miner.target = null
            continue
        }

        tmp.normalize()
        miner.position.add(tmp.x * speed, tmp.y * speed)
        miner.angle = Math.atan2(tmp.x, -tmp.y)
    }
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

const renderAsteroids = (app: App) => {
    const asteroidTexture = app.textures.asteroid

    for (const asteroid of app.asteroids) {
        const halfWidth = asteroidTexture.width * 0.5
        const halfHeight = asteroidTexture.height * 0.5

        app.ctx.drawImage(
            asteroidTexture,
            asteroid.position.x - halfWidth,
            asteroid.position.y - halfHeight
        )
    }
}

try {
    const app = create()
    load(app)

    app.textures.miner = createMinerTexture()
    app.textures.asteroid = createAsteroidTexture()

    const renderFunc = () => {
        render(app)
        requestAnimationFrame(renderFunc)
    }
    requestAnimationFrame(renderFunc)
} catch (err) {
    console.error(err)
}
