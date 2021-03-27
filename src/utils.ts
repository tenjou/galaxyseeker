export type Brand<T, FlavorT> = T & {
    _type?: FlavorT
}

export const randomNumber = (min: number, max: number) => {
    return (Math.random() * (max - min + 1) + min) << 0
}
