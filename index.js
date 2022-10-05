const testNumber = 1;
const sppData = require(`./data/test/${testNumber}.json`)
const turf = require('@turf/turf')
const _ = require("underscore")
const fs = require('fs')


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
    return {
        value: areaInSquareKm,
        formatedValue: areaInSquareKm.toLocaleString(localeFormat),
        totalPoints: pointsCoords.length,
        category: categoryClassification({type:'eoo', area:areaInSquareKm})
    }

}

function AOOCalculator({ data, radiusInKm, localeFormat }) {
    const bufferRadius = Number(radiusInKm)
    let bufferedPointsCoords = []
    let pointsOnlyCoords = []
    let pointsCoords = turf.featureCollection(
        data.map(({ latitude, longitude }) =>  {
            const point = turf.point([longitude, latitude],{weight:1})
            const bufferedPoint =  turf.buffer(point, bufferRadius, { units: 'kilometers', steps:3 })
            bufferedPointsCoords.push(bufferedPoint)
            pointsOnlyCoords.push([longitude, latitude])
            return point
        })
    )
    fs.writeFileSync(`./data/test/point-${testNumber}.json`, JSON.stringify(pointsCoords))
    bufferedPointsCoords = turf.featureCollection(bufferedPointsCoords)
    const convexHull = turf.convex(bufferedPointsCoords)
    const bbox = turf.bbox(convexHull)
    const squareGrid = turf.squareGrid(bbox, bufferRadius);
    fs.writeFileSync(`./data/test/grid-${testNumber}.json`, JSON.stringify(squareGrid))
    const collected = turf.collect(squareGrid, pointsCoords, 'weight', 'value');
    const squareGridCounted = collected.features.filter(grid => grid.properties.value.length > 0).length
    const calculatedArea = squareGridCounted * (bufferRadius * bufferRadius)

    return {
        value: calculatedArea,
        formatedValue: calculatedArea.toLocaleString(localeFormat),
        totalPoints: pointsOnlyCoords.length,
        totalUsedPoints: squareGridCounted,
        category: categoryClassification({type:'aoo', area: calculatedArea})
    }
}

function categoryClassification({type, area}){
    const range = {
        eoo:{
            lc: 20000,
            vu: [19999,5000],
            en: [4999,100]
        },
        aoo:{
            lc: 2000,
            vu: [1999,500],
            en: [499,10]
        }
    }
    let category = 'CR'
    if(area >= range[type].lc){
        category = 'LC'
    }else if(area <=  range[type].vu[0] && area >= range[type].vu[1] ){
        category = 'VU'
    }else if(area <= range[type].en[0] && area >= range[type].en[0]){
        category = 'EN'
    }
    return category
}






