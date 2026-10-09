export interface TrianglifyOptions {
  width?: number
  height?: number
  cellSize?: number
  variance?: number
  seed?: string | null
  xColors?: string | string[]
  yColors?: string | string[]
  palette?: string[] | Record<string, string[]>
  colorSpace?: string
  fill?: boolean
  strokeWidth?: number
  points?: number[][] | null
}

export interface CanvasOptions {
  scaling?: number | "auto" | false
  applyCssScaling?: boolean
}

export class Pattern {
  points: number[][]
  polys: unknown[]
  opts: TrianglifyOptions
  toCanvas(
    destCanvas?: HTMLCanvasElement,
    canvasOptions?: CanvasOptions,
  ): HTMLCanvasElement
}

export default function trianglify(options?: TrianglifyOptions): Pattern
