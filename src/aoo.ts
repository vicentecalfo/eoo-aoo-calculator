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
    counterKey: string,
    convexHull: turf.helpers.Feature<turf.helpers.Polygon, turf.helpers.Properties> | null
}

export interface IAooSinglePointInput {
    point: turf.helpers.Feature<turf.helpers.Point, any>
    gridWidthInKm: number
}

export class AOO {
    private helper = new Helper()
    constructor(private input: ICoordinatesInput) { }

    public calculate({ gridWidthInKm }: IAoo) {
        const startTime = Date.now()
        const totalPoints = this.input.coordinates.length
        const cleanedCoordinates = this.helper.cleanCoordinates(this.input)
        const uniquePointsCount = cleanedCoordinates.array.length
        
        const coordinatesPoints = this._createPoints({
            coordinates: cleanedCoordinates.object,
            bufferRadius: gridWidthInKm,
            bufferRadiusUnit: 'kilometers',
            counterKey: 'presence'
        })

        let countOccupiedGrids: any
        
        if (uniquePointsCount === 1) {
            countOccupiedGrids = this._getOccupiedGridsForSinglePoint({
                point: coordinatesPoints.points[0],
                gridWidthInKm: gridWidthInKm
            })
        } else {
            const bbox = this._createBbox(coordinatesPoints.bufferedPointCollection)
            countOccupiedGrids = this._getOccupiedGrids({
                bbox: bbox.bbox,
                pointCollection: coordinatesPoints.pointCollection,
                gridWidthInKm: gridWidthInKm,
                counterKey: coordinatesPoints.counterKey,
                convexHull: bbox.convexHull
            })
        }

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
        return ({ bbox, convexHull })
    }

    private _getOccupiedGrids({ bbox, pointCollection, gridWidthInKm, counterKey, convexHull }: IAooOccupiedGridInput) {
        const squareGrid = turf.squareGrid(bbox, gridWidthInKm)
        const gridAreaInSquareMeters = turf.area(squareGrid.features[0])
        const gridAreaInSquareKm = Number(turf.convertArea(gridAreaInSquareMeters, 'meters', 'kilometers').toFixed())
        const collected = turf.collect(
            squareGrid,
            pointCollection,
            counterKey,
            'value'
        )
        let foundGrids = collected.features.filter((grid: any) => grid?.properties?.value.length > 0)
        foundGrids = foundGrids.map((grid: any) => {
            delete grid.properties.value
            grid.properties['Cell width'] = gridWidthInKm + ' Km'
            grid.properties['Cell area'] = gridAreaInSquareKm.toLocaleString('en-US') + ' Km2'
            return grid
        })
        return {
            foundGrids: turf.featureCollection(foundGrids),
            totalFoundGrids: foundGrids.length,
            gridAreaInSquareKm,
            gridWidthInKm
        }
    }

    private _getOccupiedGridsForSinglePoint({ point, gridWidthInKm }: IAooSinglePointInput) {

        const [longitude, latitude] = point.geometry.coordinates
        
        const latDegreesPerKm = 1 / 111.32
        const lonDegreesPerKm = 1 / (111.32 * Math.cos(latitude * Math.PI / 180))
        
        const halfLatWidth = (gridWidthInKm / 2) * latDegreesPerKm
        const halfLonWidth = (gridWidthInKm / 2) * lonDegreesPerKm
        
        const coordinates = [
            [longitude - halfLonWidth, latitude - halfLatWidth],
            [longitude + halfLonWidth, latitude - halfLatWidth],
            [longitude + halfLonWidth, latitude + halfLatWidth],
            [longitude - halfLonWidth, latitude + halfLatWidth],
            [longitude - halfLonWidth, latitude - halfLatWidth]
        ]
        
        const squarePolygon = turf.polygon([coordinates], point.properties)
        
        const gridAreaInSquareMeters = turf.area(squarePolygon)
        const gridAreaInSquareKm = Number(turf.convertArea(gridAreaInSquareMeters, 'meters', 'kilometers').toFixed())
        
        squarePolygon.properties = squarePolygon.properties || {}
        squarePolygon.properties['Cell width'] = gridWidthInKm + ' Km'
        squarePolygon.properties['Cell area'] = gridAreaInSquareKm.toLocaleString('en-US') + ' Km2'
        
        return {
            foundGrids: turf.featureCollection([squarePolygon]),
            totalFoundGrids: 1,
            gridAreaInSquareKm,
            gridWidthInKm
        }
    }
}