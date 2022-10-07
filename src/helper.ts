import * as turf from '@turf/turf'

export interface ILongLat {
    longitude: number
    latitude: number
}

export interface ICoordinatesInput {
    coordinates: ILongLat[]
}

export interface ICoordinatesOutput {
    array: number[][]
    object: ILongLat[]
}


export class Helper {
    constructor() { }

    public formatMyCoordinatesToObject(coordinates: number[][]): ILongLat[] {
        return coordinates.map((coords: number[]) => ({
            longitude: coords[0],
            latitude: coords[1]
        }))
    }

    public formatMyCoordinatesToArray(coordinates: ILongLat[]): number[][] {
        return coordinates.map(({ longitude, latitude }) => ([longitude, latitude]))
    }

    public cleanCoordinates({ coordinates }: ICoordinatesInput): ICoordinatesOutput {
        const onlyCoordinates = this.formatMyCoordinatesToArray(coordinates)
        const multiPoints = turf.multiPoint(onlyCoordinates)
        let sanitizedCoords = turf.cleanCoords(multiPoints).geometry.coordinates
        return {
            array: sanitizedCoords,
            object: this.formatMyCoordinatesToObject(sanitizedCoords)
        }
    }
}