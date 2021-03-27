export type FactionId = "terran" | "xenon" | "argon"

export type Factions = Faction[]

export interface Faction {
    id: FactionId
    index: number
    name: string
    credits: number
    texture: HTMLCanvasElement
}
