const sppData = require('./data/test/3.json')
const turf = require('@turf/turf')
const _ = require("underscore")


const eoo = EOOCalculator({ data: sppData, localeFormat: 'en-US' })
const aoo = AOOCalculator({ data: sppData, radiusInKm: 2, localeFormat: 'en-US' })

//Results
console.log('Calculated spatial info for -> ' + sppData[0].binomial)
console.log('EOO -> ' + eoo.formatedValue + ' Km2')
console.log('EOO Category -> ' + eoo.category)
console.log('AOO -> ' + aoo.formatedValue + ' Km2')
console.log('AOO Category -> ' + aoo.category)
console.log('Points found in AOO grid -> ' + aoo.totalUsedPoints)
console.log('Total occurrence points -> ' + aoo.totalPoints)


function EOOCalculator({ data, localeFormat }) {
    const pointsCoords = turf.featureCollection(
        data.map(({ latitude, longitude }) =>  turf.point([longitude, latitude]))
    )
    const convexHull = turf.convex(pointsCoords)
    let areaInSquareMeters = 0000;
    if (convexHull !== null) {
        areaInSquareMeters = turf.area(convexHull)
    }
    const areaInSquareKm = turf.convertArea(areaInSquareMeters, 'meters', 'kilometers')
    let category = 'CR'
    if(areaInSquareKm >= 20000){
        category = 'LC'
    }else if(areaInSquareKm <= 19999 && areaInSquareKm >= 5000 ){
        category = 'VU'
    }else if(areaInSquareKm <= 4999 && areaInSquareKm >= 100){
        category = 'EN'
    }
    return {
        value: areaInSquareKm,
        formatedValue: areaInSquareKm.toLocaleString(localeFormat),
        totalPoints: pointsCoords.length,
        category
    }

}

function AOOCalculator({ data, radiusInKm, localeFormat }) {
    const bufferRadius = Number(radiusInKm)
    const pointsOnlyCoords = data.map(({ latitude, longitude }) => [Number(longitude), Number(latitude)])
    const pointsCoords = pointsOnlyCoords.map(coords =>turf.point(coords))
    const gridPerPoint = pointsCoords.map(coord => {
        const bufferPolygon = turf.buffer(coord, bufferRadius * 1000, { units: 'meters' })
        const bbox = turf.bbox(bufferPolygon)
        const bboxPolygon = turf.bboxPolygon(bbox)
        return bboxPolygon
    })
    let pointsFounded = []
    const pointsToSearch = []
    pointsOnlyCoords.forEach(coords => pointsToSearch.push(coords))
    const searchForThisPoints = turf.points(pointsToSearch)
    gridPerPoint.forEach((grid) => {
        const pointsInsideGridFounded = turf.pointsWithinPolygon(searchForThisPoints, grid)
        if (pointsInsideGridFounded.features.length > 0) {
            const stringfyFoundPoints = pointsInsideGridFounded.features.map(item => item.geometry.coordinates.join('_')).join('*');
            pointsInsideGridFounded.features.forEach(coordFounded => {
                pointsFounded.push(stringfyFoundPoints)
            })
        }
    })
    pointsFounded = _.uniq(pointsFounded).length
    const calculatedArea = pointsFounded * (bufferRadius * bufferRadius)
    let category = 'CR'
    if(calculatedArea >= 2000){
        category = 'LC'
    }else if(calculatedArea <= 1999 && calculatedArea >= 500 ){
        category = 'VU'
    }else if(calculatedArea <= 499 && calculatedArea >= 10){
        category = 'EN'
    }
    return {
        value: calculatedArea,
        formatedValue: calculatedArea.toLocaleString(localeFormat),
        totalPoints: pointsOnlyCoords.length,
        totalUsedPoints: pointsFounded,
        category
    }
}






