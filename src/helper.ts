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
        const normalizedCoordinates = coordinates.map(coord => ({
            ...coord,
            longitude: Number(coord.longitude),
            latitude: Number(coord.latitude)
        }))
        const onlyCoordinates = this.formatMyCoordinatesToArray(normalizedCoordinates)
        const multiPoints = turf.multiPoint(onlyCoordinates)
        let sanitizedCoords = turf.cleanCoords(multiPoints)
        
        const coordinatesWithProperties = normalizedCoordinates.reduce((acc: any, coord, i) => ({...acc, [i.toString()]: coord}), {})
        sanitizedCoords.properties = coordinatesWithProperties
        
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