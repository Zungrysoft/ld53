export function lerp (a, b, t) {
  return (1 - t) * a + t * b
}

export function clamp (n, min, max) {
  if (min < max) {
    return Math.min(Math.max(n, min), max)
  }

  return Math.min(Math.max(n, max), min)
}

export function map (n, start1, stop1, start2, stop2, withinBounds = false) {
  const newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2

  if (!withinBounds) {
    return newval
  }

  return clamp(newval, start2, stop2)
}

export function squareMap (n, start1, stop1, start2, stop2, withinBounds = false) {
  return map(map(n, start1, stop1, 0, 1, withinBounds) ** 2, 0, 1, start2, stop2, withinBounds)
}

export function inverseSquareMap (n, start1, stop1, start2, stop2, withinBounds = false) {
  return map(map(n, start1, stop1, 1, 0, withinBounds) ** 2, 0, 1, start2, stop2, withinBounds)
}

// based on args does either 2d or 3d distance
export function distance (...args) {
  if (args.length === 2) {
    if (args[0].length === 2) {
      return distance2d(...args[0], ...args[1])
    } else {
      return distance3d(...args[0], ...args[1])
    }
  }

  if (args.length === 4) {
    return distance2d(...args)
  }

  if (args.length === 6) {
    return distance3d(...args)
  }

  throw new Error(`Arity not four or six! Given ${JSON.stringify(args)}`)
}

export function distance2d (x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}

export function distance3d (x1, y1, z1, x2, y2, z2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2)
}

// returns 1, 0, or -1
export function sign (x) {
  return x && (x > 0 ? 1 : -1)
}

export function angleTowards (x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1)
}

export function range (start, end, iter = 1) {
  return new Array(end - start).fill(0).map((_, i) => (
    start + i * iter
  ))
}

export function randomizer (startIndex = 0) {
  let total = 0
  const primes = [
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61,
    67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137,
    139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199,
    211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277,
    281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359,
    367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439,
    443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521,
    523, 541
  ]
  const pseudoRandom = []
  for (let i = 0; i < 2048; i++) {
    total += primes[(i * 721) % primes.length]
    pseudoRandom.push((total % 100) / 100)
  }

  let randomIndex = startIndex
  return (low = 0, high = 1) => {
    randomIndex += 1
    randomIndex %= pseudoRandom.length
    return pseudoRandom[randomIndex] * (high - low) + low
  }
}

export const random = randomizer()

export function choose (...things) {
  const index = Math.floor(random(0, things.length - 0.001))
  const result = things[index]
  return result
}

export function rgbToHsv (r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const v = max
  const d = max - min
  let h
  let s

  if (max === min) {
    h = 0 // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }

    h /= 6
  }

  return [h, s, v]
}

export function hsvToRgb (h, s, v) {
  let r, g, b

  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
  }

  return [r, g, b]
}

export function colorToString (r, g, b, a = 1) {
  if (Array.isArray(r)) {
    [r, g, b, a] = r
  }
  r = Math.floor(r * 255)
  g = Math.floor(g * 255)
  b = Math.floor(b * 255)
  return `rgba(${r}, ${g}, ${b}, ${a || 1})`
}

export function stringToColor (hex, mod = []) {
  mod[0] = parseInt(hex.slice(1, 3), 16) / 255
  mod[1] = parseInt(hex.slice(3, 5), 16) / 255
  mod[2] = parseInt(hex.slice(5, 7), 16) / 255
  mod[3] = hex.length > 7 ? parseInt(hex.slice(7, 9), 16) / 255 : 1
  return mod
}

export function noise (x, y = 0, z = 0) {
  const random = (x, y) => {
    const angle = (
      Math.sin(x * 1074 + y * 210) +
      Math.sin(y * 2321 + z * 302) +
      Math.sin(z * 543 + x * 3043) +
      Math.sin(z * 1003)
    )
    return Math.sin(angle * 512)
  }

  const fx = Math.floor(x)
  const fy = Math.floor(y)
  const fz = Math.floor(z)

  const v1 = lerp(random(fx, fy, fz), random(fx + 1, fy, fz), x % 1)
  const v2 = lerp(random(fx, fy + 1, fz), random(fx + 1, fy + 1, fz), x % 1)
  const v3 = lerp(v1, v2, y % 1)

  if (z % 1 !== 0) {
    // interpolate between different z levels, if a z is specified
    const v4 = lerp(random(fx, fy, fz + 1), random(fx + 1, fy, fz + 1), x % 1)
    const v5 = lerp(random(fx, fy + 1, fz + 1), random(fx + 1, fy + 1, fz + 1), x % 1)
    const v6 = lerp(v4, v5, y % 1)
    return lerp(v3, v6, z % 1)
  }

  // otherwise just return 2D noise
  return v3
}

export function octaveNoise (x, y = 0, z = 0, octaves = 4) {
  let value = 0
  let total = 0

  for (let o = 1; o <= octaves; o += 1) {
    const f = Math.pow(0.5, o)
    value /= 2
    total /= 2
    value += noise(x * f, y * f, z * f)
    total += 1
  }

  return value / total
}

// give time in seconds
export function toTimeString (time, precision = 1) {
  const seconds = time % 60
  const minutes = time / 60 | 0
  return minutes + (seconds < 10 ? ':0' : ':') + seconds.toFixed(precision)
}

// in-place array shuffle
export function shuffle (array, rand = random) {
  let currentIndex = array.length

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    const randomIndex = Math.floor(rand() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    ;[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
  }

  return array
}

// assuming row-major with perfectly square chunks
export function chunkGridToSpatialGrid (chunkGrid) {
  const result = {}
  for (const [chunkCoordString, chunk] of Object.entries(chunkGrid)) {
    const chunkCoord = chunkCoordString.split(',').map(Number)
    const chunkSize = Math.sqrt(chunk.length)
    for (let i = 0; i < chunk.length; i += 1) {
      if (!chunk[i]) { continue }
      const coord = [
        i % chunkSize + chunkCoord[0],
        Math.floor(i / chunkSize) + chunkCoord[1]
      ]
      result[coord] = chunk[i]
    }
  }
  return result
}

// turns a spatial grid into a chunk grid of square chunks
export function spatialGridToChunkGrid (spatialGrid, chunkSize = 64) {
  const chunkGrid = {}
  for (const tileCoordString of Object.keys(spatialGrid)) {
    const tileCoord = tileCoordString.split(',').map(Number)
    const chunkCoord = tileCoord.map(x => Math.floor(x / chunkSize))
    if (!chunkGrid[chunkCoord]) {
      chunkGrid[chunkCoord] = Array(chunkSize ** 2).fill(0)
    }
    const chunk = chunkGrid[chunkCoord]
    chunk[tileCoord[0] + tileCoord[1] * chunkSize] = spatialGrid[tileCoordString]
  }
  return chunkGrid
}

export function checkAabbIntersection (aabb1, aabb2, x1 = 0, y1 = 0, x2 = 0, y2 = 0) {
  return (
    aabb1[0] + x1 <= aabb2[2] + x2 &&
    aabb1[1] + y1 <= aabb2[3] + y2 &&
    aabb1[2] + x1 >= aabb2[0] + x2 &&
    aabb1[3] + y1 >= aabb2[1] + y2
  )
}
