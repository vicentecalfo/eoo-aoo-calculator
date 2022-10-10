import * as turf from '@turf/turf'
import { Helper, ICoordinatesInput } from './helper'

export interface IAoo {
    gridWidthInKm: number
}

export interface IAooPointsInput {
    coordinates: any
    bufferRadius: number
    bufferRadiusUnit: turf.Units
    counterKey: string
}
export interface IAooPointsOutput {
    points: turf.helpers.Feature<turf.helpers.Point, any>[]
    pointCollection: turf.helpers.FeatureCollection<turf.helpers.Point, any>
    bufferedPoints: turf.helpers.Feature<turf.helpers.Polygon, turf.helpers.Properties>[]
    bufferedPointCollection: turf.helpers.FeatureCollection<turf.helpers.Polygon, any>
    counterKey: string
}

export interface IAooOccupiedGridInput {
    bbox: turf.helpers.BBox
    pointCollection: turf.helpers.FeatureCollection<turf.helpers.Point, any>
    gridWidthInKm: number
    counterKey: string
}

export class AOO {
    private helper = new Helper()
    constructor(private input: ICoordinatesInput) { }

    public calculate({ gridWidthInKm }: IAoo) {
        const startTime = Date.now()
        const totalPoints = this.input.coordinates.length
        const cleanedCoordinates = this.helper.cleanCoordinates(this.input)
        const coordinatesPoints = this._createPoints({
            coordinates: cleanedCoordinates.object,
            bufferRadius: gridWidthInKm,
            bufferRadiusUnit: 'kilometers',
            counterKey: 'presence'
        })
        const bbox = this._createBbox(coordinatesPoints.bufferedPointCollection)
        const countOccupiedGrids = this._getOccupiedGrids({
            bbox,
            pointCollection: coordinatesPoints.pointCollection,
            gridWidthInKm: gridWidthInKm,
            counterKey: coordinatesPoints.counterKey
        })
        const totalOccupiedGrids = countOccupiedGrids.totalFoundGrids
        const areaInSquareKm = totalOccupiedGrids * (gridWidthInKm * gridWidthInKm)
        const executionTimeInSeconds = (Date.now() - startTime) / 1000
        return {
            areaInSquareKm,
            occupiedGrids: countOccupiedGrids.foundGrids,
            totalOccupiedGrids,
            gridAreaInSquareKm: countOccupiedGrids.gridAreaInSquareKm,
            gridWidthInKm: countOccupiedGrids.gridWidthInKm,
            totalPoints,
            totalRedundantPoints: totalPoints - cleanedCoordinates.array.length,
            usedPointCollection: coordinatesPoints.pointCollection,
            executionTimeInSeconds,
            binomial: this.helper.getBinomial(this.input.coordinates[0])
        }
    }

    private _createPoints({ coordinates, bufferRadius, bufferRadiusUnit, counterKey }: IAooPointsInput): IAooPointsOutput {
        const points: turf.helpers.Feature<turf.helpers.Point, any>[] = []
        const bufferedPoints: turf.helpers.Feature<turf.helpers.Polygon, turf.helpers.Properties>[] = []
        coordinates.geometry.coordinates.forEach((coord: any, index: number) => {
            const properties: { [name: string]: number } = { ...coordinates.properties[index.toString()] }
            properties[counterKey] = 1
            const point = turf.point(coord, properties)
            const bufferdPoint = turf.buffer(point, bufferRadius, { units: bufferRadiusUnit })
            points.push(point)
            bufferedPoints.push(bufferdPoint)
        })
        const pointCollection = turf.featureCollection(points)
        const bufferedPointCollection = turf.featureCollection(bufferedPoints)
        return { points, pointCollection, bufferedPoints, bufferedPointCollection, counterKey }
    }

    private _createBbox(pointCollection:
        turf.helpers.FeatureCollection<turf.helpers.Point, any> |
        turf.helpers.FeatureCollection<turf.helpers.Polygon, any>
    ) {
        const convexHull = turf.convex(pointCollection)
        const bbox = turf.bbox(convexHull)
        return bbox
    }

    private _getOccupiedGrids({ bbox, pointCollection, gridWidthInKm, counterKey }: IAooOccupiedGridInput) {
        const squareGrid = turf.squareGrid(bbox, gridWidthInKm)
        const gridAreaInSquareMeters = turf.area(squareGrid.features[0])
        const gridAreaInSquareKm = Number(turf.convertArea(gridAreaInSquareMeters, 'meters', 'kilometers').toFixed())
        const collected = turf.collect(
            squareGrid,
            pointCollection,
            counterKey,
            'value'
        )
        let foundGrids = collected.features.filter(grid => grid?.properties?.value.length > 0)
        foundGrids = foundGrids.map((grid: any) => {
            delete grid.properties.value
            grid.properties['Cell width'] = gridWidthInKm + ' Km'
            grid.properties['Cell area'] = gridAreaInSquareKm.toLocaleString('en-US') + ' Km<sup>2</sup>'
            return grid
        })
        return {
            foundGrids,
            totalFoundGrids: foundGrids.length,
            gridAreaInSquareKm,
            gridWidthInKm
        }
    }
}