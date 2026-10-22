/* 长乐区乡镇中心点坐标 (GCJ-02) */
export const TOWN_SEED = [
  { code: 'wh', name: '吴航街道', lng: 119.525, lat: 25.962 },
  { code: 'hc', name: '航城街道', lng: 119.498, lat: 25.918 },
  { code: 'sz', name: '首占新区', lng: 119.535, lat: 25.858 },
  { code: 'yq', name: '营前街道', lng: 119.558, lat: 25.902 },
  { code: 'hs', name: '鹤上镇', lng: 119.582, lat: 25.842 },
  { code: 'zg', name: '漳港街道', lng: 119.648, lat: 25.918 },
  { code: 'jt', name: '江田镇', lng: 119.618, lat: 25.802 },
  { code: 'mh', name: '梅花镇', lng: 119.735, lat: 25.955 },
  { code: 'yt', name: '玉田镇', lng: 119.460, lat: 25.830 }
]

/* 项目坐标映射 (BLD-002 ~ BLD-012) */
export const PROJECT_COORDS = {
  'BLD-002': { lng: 119.655, lat: 25.930 },
  'BLD-003': { lng: 119.520, lat: 25.962 },
  'BLD-004': { lng: 119.505, lat: 25.915 },
  'BLD-005': { lng: 119.535, lat: 25.858 },
  'BLD-006': { lng: 119.582, lat: 25.842 },
  'BLD-007': { lng: 119.518, lat: 25.958 },
  'BLD-008': { lng: 119.498, lat: 25.918 },
  'BLD-009': { lng: 119.558, lat: 25.902 },
  'BLD-010': { lng: 119.648, lat: 25.918 },
  'BLD-011': { lng: 119.618, lat: 25.802 },
  'BLD-012': { lng: 119.522, lat: 25.955 }
}

/* 镇 → 项目映射 */
export const TOWN_PROJECT_MAP = {
  wh: ['BLD-003', 'BLD-007', 'BLD-012'],
  hc: ['BLD-004', 'BLD-008'],
  sz: ['BLD-005'],
  yq: ['BLD-009'],
  hs: ['BLD-006'],
  zg: ['BLD-002', 'BLD-010'],
  jt: ['BLD-011'],
  mh: [],
  yt: []
}

/* 根据坐标解析所属乡镇（最近邻算法） */
export function resolveTown(lng, lat) {
  if (!lng || !lat) return { town: '', townCode: '' }
  let nearest = null
  let minDist = Infinity
  for (const t of TOWN_SEED) {
    const d = Math.pow(lng - t.lng, 2) + Math.pow(lat - t.lat, 2)
    if (d < minDist) {
      minDist = d
      nearest = t
    }
  }
  return nearest ? { town: nearest.name, townCode: nearest.code } : { town: '', townCode: '' }
}

/* ==================== Voronoi 乡镇边界解析 ==================== */

function clipPolygonByBisector(polygon, seed, other) {
  const mx = (seed[0] + other[0]) / 2
  const my = (seed[1] + other[1]) / 2
  const dx = seed[0] - other[0]
  const dy = seed[1] - other[1]
  const inside = (p) => (p[0] - mx) * dx + (p[1] - my) * dy >= 0
  if (polygon.length === 0) return polygon
  const out = []
  for (let i = 0; i < polygon.length; i++) {
    const cur = polygon[i]
    const prev = polygon[(i + polygon.length - 1) % polygon.length]
    const curIn = inside(cur)
    const prevIn = inside(prev)
    if (curIn) {
      if (!prevIn) {
        const inter = lineIntersect(prev, cur, mx, my, dx, dy)
        if (inter) out.push(inter)
      }
      out.push(cur)
    } else if (prevIn) {
      const inter = lineIntersect(prev, cur, mx, my, dx, dy)
      if (inter) out.push(inter)
    }
  }
  return out
}

function lineIntersect(a, b, mx, my, dx, dy) {
  const ex = b[0] - a[0], ey = b[1] - a[1]
  const denom = ex * dx + ey * dy
  if (Math.abs(denom) < 1e-12) return null
  const t = ((mx - a[0]) * dx + (my - a[1]) * dy) / denom
  return [a[0] + t * ex, a[1] + t * ey]
}

function pointInPolygon(point, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    const intersect = ((yi > point[1]) !== (yj > point[1])) &&
      (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

let voronoiCellsCache = null
let voronoiLoading = null

export async function getVoronoiCells() {
  if (voronoiCellsCache) return voronoiCellsCache
  if (voronoiLoading) return voronoiLoading

  voronoiLoading = (async () => {
    try {
      const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/350112.json')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const geoJSON = await response.json()
      if (!geoJSON.features || geoJSON.features.length === 0) return null

      const feature = geoJSON.features[0]
      const coords = feature.geometry.coordinates
      let outlineRing = []
      if (feature.geometry.type === 'MultiPolygon') {
        outlineRing = coords[0][0]
      } else if (feature.geometry.type === 'Polygon') {
        outlineRing = coords[0]
      }
      if (outlineRing.length === 0) return null

      const cells = TOWN_SEED.map((town, i) => {
        let cell = outlineRing.map(c => [c[0], c[1]])
        for (let j = 0; j < TOWN_SEED.length; j++) {
          if (j === i) continue
          cell = clipPolygonByBisector(cell, [town.lng, town.lat], [TOWN_SEED[j].lng, TOWN_SEED[j].lat])
          if (cell.length < 3) break
        }
        return { town, cell }
      })

      voronoiCellsCache = cells
      return cells
    } catch (e) {
      console.warn('[locations] Voronoi cells 加载失败:', e)
      return null
    } finally {
      voronoiLoading = null
    }
  })()

  return voronoiLoading
}

/* Voronoi 乡镇解析（与 AssetMap 使用相同边界） */
export async function resolveTownByVoronoi(lng, lat) {
  if (!lng || !lat) return { town: '', townCode: '' }
  const cells = await getVoronoiCells()
  if (!cells) return resolveTown(lng, lat)  // 降级到最近邻

  for (const { town, cell } of cells) {
    if (cell.length >= 3 && pointInPolygon([lng, lat], cell)) {
      return { town: town.name, townCode: town.code }
    }
  }
  return resolveTown(lng, lat)  // 降级到最近邻
}

/* 长乐区边界限制 */
export const CHANGLE_BOUNDS = {
  sw: [119.42, 25.76],
  ne: [119.78, 25.98]
}
