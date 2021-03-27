import type { App } from "./app"

type ListenerFunc = (app: App) => void

const listeners: ListenerFunc[] = []

const addListener = (func: ListenerFunc) => {
    listeners.push(func)

    return func
}

const removeListener = (func: ListenerFunc) => {
    const index = listeners.indexOf(func)
    if (index === -1) {
        return
    }

    if (listeners.length === 1) {
        listeners.length = 0
        return
    }

    listeners.splice(index, 1)
}

const updateListeners = (app: App) => {
    for (const listener of listeners) {
        listener(app)
    }
}

export default {
    addListener,
    removeListener,
    updateListeners,
}
