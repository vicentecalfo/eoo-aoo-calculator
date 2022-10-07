import * as turf from '@turf/turf'
import { Helper, ICoordinatesInput } from './helper';

export class EOO {
    private helper = new Helper()
    constructor(private input: ICoordinatesInput) {}

    public calculate(){
        const startTime = Date.now()
        const totalPoints = this.input.coordinates.length
        const cleanedCoordinates = this.helper.cleanCoordinates(this.input)
        const occurrence = this._createPoints(cleanedCoordinates.array)
        const convexHull = turf.convex(occurrence.pointCollection)
        let areaInSquareMeters = 0
        let convexHullPolygon = null
        if(convexHull !== null){
            areaInSquareMeters = turf.area(convexHull)
            convexHullPolygon = convexHull
        }
        const areaInSquareKm = turf.convertArea(areaInSquareMeters, 'meters', 'kilometers')
        const executionTimeInSeconds = (Date.now() - startTime)/1000
        return {
            areaInSquareKm,
            totalPoints,
            totalRedundantPoints: totalPoints - cleanedCoordinates.array.length,
            usedPointCollection: occurrence.pointCollection,
            convexHullPolygon,
            executionTimeInSeconds,
        }
    }

    private _createPoints(coordinates:number[][]){
        const points: turf.helpers.Feature<turf.helpers.Point>[] = []
        coordinates.forEach(coord =>{
            const point = turf.point(coord)
            points.push(point)
        })
        const pointCollection = turf.featureCollection(points)
        return {points,pointCollection}
    }
}