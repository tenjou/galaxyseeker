import { useEffect, useRef, useState } from "react"
import ReactDOM from "react-dom"
import styled from "styled-components"
import { App, emitGlobal, subscribeGlobal } from "./app"
import type { Entity, Station } from "./entity"
import { EntityType, EntityTypeStr, subscribe } from "./entity"
import { Faction, FactionId, Factions } from "./faction"
import { Vector2 } from "./math/Vector2"
import { updateMiners } from "./miner"
import { getRaycastedEntity } from "./physics"
import StationService from "./station"
import { randomNumber } from "./utils"

const asteroidSpawnMax = 50
const asteroidSpawnRate = 1000
let tAsteroidNextSpawn = 0

let selectedEntity: Entity | null = null

const fakeEntity: Station = {
    type: EntityType.Station,
    position: new Vector2(0, 0),
    children: null,
    size: 0,
    subscribers: [],
}

const create = (canvas: HTMLCanvasElement): App => {
    const ctx = canvas.getContext("2d")
    if (!ctx) {
        throw new Error("Could not get 2d context")
    }

    const width = window.innerWidth
    const height = window.innerHeight - (window.innerHeight % 2)
    canvas.width = width
    canvas.height = height
    document.body.appendChild(canvas)

    const app: App = {
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
        factions: [],
    }

    window.addEventListener("mousemove", (event: MouseEvent) => {
        const entity = getRaycastedEntity(app, event.clientX, event.clientY)
        if (entity) {
            app.canvas.style.cursor = "pointer"
        } else {
            app.canvas.style.cursor = "auto"
        }
    })
    window.addEventListener("mousedown", (event: MouseEvent) => {
        selectedEntity = getRaycastedEntity(app, event.clientX, event.clientY)
        if (selectedEntity) {
            emitGlobal({ type: "select", entity: selectedEntity })
        } else {
            emitGlobal({ type: "unselect" })
        }
    })

    return app
}

const loadFaction = (app: App, id: FactionId, name: string) => {
    const index = app.factions.length
    const faction = {
        id,
        index,
        name,
        credits: 0,
        texture: app.textures["miner_" + id],
    }
    app.factions.push(faction)

    return faction
}

const loadMiners = (app: App, faction: Faction) => {
    const numFactionMiners = 2

    for (let n = 0; n < numFactionMiners; n++) {
        const x = randomNumber(0, app.width)
        const y = randomNumber(0, app.height)

        app.miners.push({
            type: EntityType.Miner,
            position: new Vector2(x, y),
            size: Math.max(faction.texture.width, faction.texture.height),
            subscribers: [],
            children: null,
            angle: 0,
            speed: 160,
            cargoCapacity: 0,
            cargoCapacityMax: 100,
            tMiningLaserCooldown: 0,
            tMiningFinishing: 0,
            faction,
            ai: {
                state: "idle",
                target: null,
                targetPosition: new Vector2(0, 0),
            },
        })
    }
}

const load = (app: App) => {
    const terranFaction = loadFaction(app, "terran", "Terran")
    const xenonFaction = loadFaction(app, "xenon", "Xenon")
    const argonFaction = loadFaction(app, "argon", "Argon")

    loadMiners(app, terranFaction)
    loadMiners(app, xenonFaction)
    loadMiners(app, argonFaction)

    for (let n = 0; n < asteroidSpawnMax; n++) {
        spawnAsteroid(app)
    }

    const stationTexture = app.textures.station
    app.stations.push({
        type: EntityType.Station,
        position: new Vector2(app.width * 0.5, app.height * 0.5),
        size: Math.max(stationTexture.width, stationTexture.height),
        subscribers: [],
        children: null,
    })

    StationService.updateListeners(app)
}

const spawnAsteroid = (app: App) => {
    const x = randomNumber(0, app.width)
    const y = randomNumber(0, app.height)
    const texture = app.textures.asteroid

    app.asteroids.push({
        type: EntityType.Asteroid,
        position: new Vector2(x, y),
        size: Math.max(texture.width, texture.height),
        subscribers: [],
        children: null,
        oreAmount: 50,
        oreAmountMax: 50,
    })
}

const createMinerTexture = (colorHex: string) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
        throw new Error("Could not get 2d context")
    }

    const width = 20
    const height = 24
    canvas.width = width
    canvas.height = height

    ctx.fillStyle = colorHex
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 1

    ctx.beginPath()
    ctx.moveTo(2, height - 2)
    ctx.lineTo(width - 2, height - 2)
    ctx.lineTo(width * 0.5, 2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

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
    ctx.lineWidth = 1

    ctx.translate(0.5, 0.5)
    ctx.beginPath()
    ctx.arc(radius, radius, radius - 2, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()

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
    ctx.lineWidth = 1

    ctx.translate(0.5, 0.5)
    ctx.beginPath()
    ctx.moveTo(2, 2)
    ctx.lineTo(width - 2, 2)
    ctx.lineTo(width - 2, height - 2)
    ctx.lineTo(2, height - 2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    return canvas
}

const updateAsteroidRespawner = (app: App) => {
    if (
        tAsteroidNextSpawn <= app.tCurrent &&
        app.asteroids.length < asteroidSpawnMax
    ) {
        tAsteroidNextSpawn = app.tCurrent + asteroidSpawnRate
        spawnAsteroid(app)
    }
}

const render = (app: App) => {
    app.tCurrent = Date.now()
    app.tDelta = (app.tCurrent - app.tEnd) / 1000

    app.ctx.fillStyle = "#d6d6d6"
    app.ctx.fillRect(0, 0, app.width, app.height)

    updateAsteroidRespawner(app)

    renderEntities(app, app.asteroids, app.textures.asteroid)
    renderEntities(app, app.stations, app.textures.station)

    updateMiners(app)
    renderMiners(app)

    renderSelected(app)

    app.tEnd = app.tCurrent
}

const renderMiners = (app: App) => {
    for (const miner of app.miners) {
        const minerTexture = miner.faction.texture

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
            miner.ai.state === "mining" &&
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

const renderSelected = (app: App) => {
    if (!selectedEntity) {
        return
    }

    const minX = selectedEntity.position.x - selectedEntity.size * 0.5 - 2
    const minY = selectedEntity.position.y - selectedEntity.size * 0.5 - 2
    const maxX = selectedEntity.position.x + selectedEntity.size * 0.5 + 2
    const maxY = selectedEntity.position.y + selectedEntity.size * 0.5 + 2

    app.ctx.strokeStyle = "#ffffff"
    app.ctx.beginPath()
    app.ctx.moveTo(minX, minY + 5)
    app.ctx.lineTo(minX, minY)
    app.ctx.lineTo(minX + 5, minY)

    app.ctx.moveTo(minX, maxY - 5)
    app.ctx.lineTo(minX, maxY)
    app.ctx.lineTo(minX + 5, maxY)

    app.ctx.moveTo(maxX, minY + 5)
    app.ctx.lineTo(maxX, minY)
    app.ctx.lineTo(maxX - 5, minY)

    app.ctx.moveTo(maxX, maxY - 5)
    app.ctx.lineTo(maxX, maxY)
    app.ctx.lineTo(maxX - 5, maxY)
    app.ctx.stroke()
}

const start = (canvas: HTMLCanvasElement) => {
    try {
        const app = create(canvas)

        app.textures.miner_terran = createMinerTexture("#2196f3")
        app.textures.miner_xenon = createMinerTexture("#f44336")
        app.textures.miner_argon = createMinerTexture("#8bc34a")
        app.textures.asteroid = createAsteroidTexture()
        app.textures.station = createStationTexture()

        load(app)

        const renderFunc = () => {
            render(app)
            requestAnimationFrame(renderFunc)
        }
        requestAnimationFrame(renderFunc)
    } catch (err) {
        console.error(err)
    }
}

const AppWindow = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!canvasRef.current) {
            return
        }

        start(canvasRef.current)
    }, [canvasRef])

    return (
        <>
            <canvas ref={canvasRef} />
            <Score />
            <Info />
        </>
    )
}

const Score = () => {
    const [factions, setFactions] = useState<Factions>([])

    useEffect(() => {
        const func = StationService.addListener((app: App) =>
            setFactions([...app.factions])
        )

        return () => StationService.removeListener(func)
    }, [])

    return (
        <ScorePanel>
            {factions.map((faction) => (
                <Row key={faction.id}>
                    <Row>{faction.name}</Row>
                    <div>{faction.credits}</div>
                </Row>
            ))}
        </ScorePanel>
    )
}

const Info = () => {
    const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
    const [, setUpdated] = useState(0)

    useEffect(() => {
        subscribeGlobal((event) => {
            switch (event.type) {
                case "select":
                    setSelectedEntity(event.entity)
                    subscribe(event.entity, fakeEntity, (from, to, event) => {
                        switch (event) {
                            case "destroyed":
                                setSelectedEntity(null)
                                break
                            default:
                                setUpdated(Date.now())
                                break
                        }
                    })
                    break
                case "unselect":
                    setSelectedEntity(null)
                    break
            }
        })
    }, [])

    if (!selectedEntity) {
        return null
    }

    if (selectedEntity.type === EntityType.Miner) {
        return (
            <InfoPanel>
                <Row>
                    <Row>Type</Row>
                    {EntityTypeStr[selectedEntity.type]}
                </Row>
                <Row>
                    <Row>Faction</Row>
                    {selectedEntity.faction.name}
                </Row>
                <Row>
                    <Row>Cargo</Row>
                    {selectedEntity.cargoCapacity}/
                    {selectedEntity.cargoCapacityMax}
                </Row>
                <Row>
                    <Row>State</Row>
                    {selectedEntity.ai.state}
                </Row>
            </InfoPanel>
        )
    }

    if (selectedEntity.type === EntityType.Asteroid) {
        return (
            <InfoPanel>
                <Row>
                    <Row>Type</Row>
                    {EntityTypeStr[selectedEntity.type]}
                </Row>
                <Row>
                    <Row>Ore</Row>
                    {selectedEntity.oreAmount}/{selectedEntity.oreAmountMax}
                </Row>
            </InfoPanel>
        )
    }

    return (
        <InfoPanel>
            <Row>
                <Row>Type</Row>
                {EntityTypeStr[selectedEntity.type]}
            </Row>
        </InfoPanel>
    )
}

const ScorePanel = styled.div`
    position: absolute;
    top: 10px;
    right: 10px;
    width: 150px;
    padding: 5px 10px;
    background: black;
    color: white;
    opacity: 0.7;
    font-family: "Open Sans";
    font-size: 12px;
`

const InfoPanel = styled.div`
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 150px;
    padding: 5px 10px;
    background: black;
    color: white;
    opacity: 0.7;
    font-family: "Open Sans";
    font-size: 12px;
`

const Row = styled.div`
    display: flex;
    flex: 1;
`

ReactDOM.render(<AppWindow />, document.getElementById("app"))
