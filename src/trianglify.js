/*
 * Trianglify.js — minimal browser-only build
 * Based on Trianglify by @qrohlf (https://github.com/qrohlf/trianglify)
 * Licensed under the GPLv3
 */

import Delaunator from 'delaunator'
import chroma from 'chroma-js'

import colorbrewer from './utils/colorbrewer.js'
import Pattern from './pattern.js'
import mulberry32 from './utils/mulberry32.js'
import { getCentroid } from './utils/geom.js'

const defaultOptions = {
  width: 600,
  height: 400,
  cellSize: 75,
  variance: 0.75,
  seed: null,
  xColors: 'random',
  yColors: 'match',
  palette: colorbrewer,
  colorSpace: 'lab',
  fill: true,
  strokeWidth: 0,
  points: null
}

// This function does the "core" render-independent work:
//
// 1. Parse and munge options
// 2. Setup cell geometry
// 3. Generate random points within cell geometry
// 4. Use the Delaunator library to run the triangulation
// 5. Do color interpolation to establish the fundamental coloring of the shapes
export default function trianglify (_opts = {}) {
  Object.keys(_opts).forEach(k => {
    if (defaultOptions[k] === undefined) {
      throw TypeError(`Unrecognized option: ${k}`)
    }
  })
  const opts = { ...defaultOptions, ..._opts }

  if (!(opts.height > 0)) {
    throw TypeError(`invalid height: ${opts.height}`)
  }
  if (!(opts.width > 0)) {
    throw TypeError(`invalid width: ${opts.width}`)
  }

  // standard randomizer, used for point gen and layout
  const rand = mulberry32(opts.seed)

  const randomFromPalette = () => {
    if (opts.palette instanceof Array) {
      return opts.palette[Math.floor(rand() * opts.palette.length)]
    }
    const keys = Object.keys(opts.palette)
    return opts.palette[keys[Math.floor(rand() * keys.length)]]
  }

  // The first step here is to set up our color scales for the X and Y axis.
  // First, munge the shortcut options like 'random' or 'match' into real color
  // arrays. Then, set up a Chroma scale in the appropriate color space.
  const processColorOpts = (colorOpt) => {
    switch (true) {
      case Array.isArray(colorOpt):
        return colorOpt
      case !!opts.palette[colorOpt]:
        return opts.palette[colorOpt]
      case colorOpt === 'random':
        return randomFromPalette()
      default:
        throw TypeError(`Unrecognized color option: ${colorOpt}`)
    }
  }

  const xColors = processColorOpts(opts.xColors)
  const yColors = opts.yColors === 'match'
    ? xColors
    : processColorOpts(opts.yColors)

  const xScale = chroma.scale(xColors).mode(opts.colorSpace)
  const yScale = chroma.scale(yColors).mode(opts.colorSpace)

  // Our next step is to generate a pseudo-random grid of {x, y} points,
  // (or to simply utilize the points that were passed to us)
  const points = opts.points || getPoints(opts, rand)

  // Once we have the points array, run the triangulation
  const geomIndices = Delaunator.from(points).triangles

  // ...and then generate geometry and color data:
  const polys = []

  for (let i = 0; i < geomIndices.length; i += 3) {
    // convert shallow array-packed vertex indices into 3-tuples
    const vertexIndices = [
      geomIndices[i],
      geomIndices[i + 1],
      geomIndices[i + 2]
    ]

    // grab a copy of the actual vertices to use for calculations
    const vertices = vertexIndices.map(i => points[i])

    const { width, height } = opts
    const norm = num => Math.max(0, Math.min(1, num))
    const centroid = getCentroid(vertices)
    const xPercent = norm(centroid.x / width)
    const yPercent = norm(centroid.y / height)

    // default coloring: linear interpolation of the x and y gradients
    const color = chroma.mix(
      xScale(xPercent),
      yScale(yPercent),
      0.5,
      opts.colorSpace
    )

    polys.push({
      vertexIndices,
      centroid,
      color // chroma color object
    })
  }

  return new Pattern(points, polys, opts)
}

const getPoints = (opts, random) => {
  const { width, height, cellSize, variance } = opts

  // pad by 2 cells outside the visible area on each side to ensure we fully
  // cover the 'artboard'
  const colCount = Math.floor(width / cellSize) + 4
  const rowCount = Math.floor(height / cellSize) + 4

  // determine bleed values to ensure that the grid is centered within the
  // artboard
  const bleedX = ((colCount * cellSize) - width) / 2
  const bleedY = ((rowCount * cellSize) - height) / 2

  // apply variance to cellSize to get cellJitter in pixels
  const cellJitter = cellSize * variance
  const getJitter = () => (random() - 0.5) * cellJitter

  const pointCount = colCount * rowCount

  const halfCell = cellSize / 2

  const points = Array(pointCount).fill(null).map((_, i) => {
    const col = i % colCount
    const row = Math.floor(i / colCount)

    return [
      -bleedX + col * cellSize + halfCell + getJitter(),
      -bleedY + row * cellSize + halfCell + getJitter()
    ]
  })

  return points
}