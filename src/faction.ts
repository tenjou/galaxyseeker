export type FactionId = "terran" | "xenon" | "argon"

export type Factions = Partial<Record<FactionId, Faction>>

export interface Faction {
    id: FactionId
    name: string
    credits: number
    texture: HTMLCanvasElement
}
