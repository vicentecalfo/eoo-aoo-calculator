import * as turf from '@turf/turf'

export interface IOccurrenceRow {
    longitude: number
    latitude: number
    binomial?: string
}

export interface ICoordinatesInput {
    coordinates: IOccurrenceRow[]
}

export interface ICoordinatesOutput {
    array: number[][]
    object: IOccurrenceRow[]
}


export class Helper {
    constructor() { }

    public formatMyCoordinatesToObject(coordinates: number[][]): IOccurrenceRow[] {
        return coordinates.map((coords: number[]) => ({
            longitude: Number(coords[0]),
            latitude: Number(coords[1])
        }))
    }

    public formatMyCoordinatesToArray(coordinates: IOccurrenceRow[]): number[][] {
        return coordinates.map(({ longitude, latitude }) => ([Number(longitude), Number(latitude)]))
    }

    public cleanCoordinates({ coordinates }: ICoordinatesInput): ICoordinatesOutput {
        const pointProperties = {...coordinates}
        const onlyCoordinates = this.formatMyCoordinatesToArray(coordinates)
        const multiPoints = turf.multiPoint(onlyCoordinates,pointProperties)
        let sanitizedCoords = turf.cleanCoords(multiPoints)
        return {
            array: sanitizedCoords.geometry.coordinates,
            object: sanitizedCoords,
        }
    }

    public getBinomial(occurence: IOccurrenceRow) {
        const binomialInformed = occurence.hasOwnProperty('binomial')
        return binomialInformed ? occurence.binomial : null
    }
}