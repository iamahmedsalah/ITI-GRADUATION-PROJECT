function randomIndex(max: number) {
  if (globalThis.crypto?.getRandomValues) {
    const array = new Uint32Array(1)
    globalThis.crypto.getRandomValues(array)
    return array[0] % max
  }

  return Math.floor(Math.random() * max)
}

export function generateStrongPassword(length = 14) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()-_=+[]{};:,.?'
  const all = upper + lower + numbers + symbols
  const pick = (source: string) => source[randomIndex(source.length)]
  const seeded = [pick(upper), pick(lower), pick(numbers), pick(symbols)]

  while (seeded.length < Math.max(length, 8)) {
    seeded.push(pick(all))
  }

  for (let index = seeded.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1)
    ;[seeded[index], seeded[swapIndex]] = [seeded[swapIndex], seeded[index]]
  }

  return seeded.join('')
}
