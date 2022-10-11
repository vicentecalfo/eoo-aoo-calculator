import * as turf from '@turf/turf'
import { Helper, ICoordinatesInput } from './helper';

export class EOO {
    private helper = new Helper()
    constructor(private input: ICoordinatesInput) { }

    public calculate() {
        const startTime = Date.now()
        const totalPoints = this.input.coordinates.length
        const cleanedCoordinates = this.helper.cleanCoordinates(this.input)
        const occurrence = this._createPoints(cleanedCoordinates.object)
        const convexHull = turf.convex(occurrence.pointCollection)
        let areaInSquareMeters = 0
        let convexHullPolygon: any = null
        if (convexHull !== null) {
            areaInSquareMeters = turf.area(convexHull)
            convexHullPolygon = convexHull
        }
        const areaInSquareKm = turf.convertArea(areaInSquareMeters, 'meters', 'kilometers')
        const executionTimeInSeconds = (Date.now() - startTime) / 1000
        if (convexHullPolygon !== null) {
            convexHullPolygon.properties.EOO = areaInSquareKm.toLocaleString('en-US') + ' Km2'
        }
        return {
            areaInSquareKm,
            totalPoints,
            totalRedundantPoints: totalPoints - cleanedCoordinates.array.length,
            usedPointCollection: occurrence.pointCollection,
            convexHullPolygon: turf.featureCollection([convexHullPolygon]),
            executionTimeInSeconds,
            binomial: this.helper.getBinomial(this.input.coordinates[0])
        }
    }

    private _createPoints(coordinates: any) {
        const points: turf.helpers.Feature<turf.helpers.Point>[] = []
        coordinates.geometry.coordinates.forEach((coord: any, index: number) => {
            const point = turf.point(coord, coordinates.properties[index.toString()])
            points.push(point)
        })
        const pointCollection = turf.featureCollection(points)
        return { points, pointCollection }
    }
}