import { Command, OptionValues } from 'commander'
import { EOO, AOO } from './index'
import * as fsExtra from 'fs-extra'
import * as fs from 'fs'
import csv from 'csvtojson/v2'
import * as htmlMinify from 'html-minifier'
import { v4 as uuidv4 } from 'uuid'

//@ts-ignore
import { convert } from 'geojson2shp'

const program = new Command()

interface IOutputDirInput {
    inputFile: string
    outputDir: string
    binomial: string | null | undefined
    type: string
    flatDir: boolean
}

interface IWriteOutputFilesInput {
    outputResultDir: string
    fileContent: string
    filename: string
    verbose: boolean
}

init()

async function init() {

    program
        .name('EOO and AOO calculator tool')
        .description('Calculadora de Extensão de ocorrência (EOO) e Área de ocupação (AOO).')


    program
        .command('eoo')
        .requiredOption('-i, --input-file <inputFile>', 'Arquivo de ocorrência da espécie.')
        .option('-o, --output-dir <outputDir>', 'Diretório onde serão armazenados os arquivos de saída', './')
        .option('-f, --flat-dir <flatDir>', 'Diretório onde serão armazenados os arquivos de saída (cria apenas uma pasta EOO)', 'false')
        .option('-v, --verbose <verbose>', 'Saída de dados no terminal com detalhes.', 'true')
        .action(calculateEoo)

    program
        .command('aoo')
        .requiredOption('-i, --input-file <inputFile>', 'Arquivo de ocorrência da espécie.')
        .option('-o, --output-dir <outputDir>', 'Diretório onde serão armazenados os arquivos de saída', './')
        .option('-f, --flat-dir <flatDir>', 'Diretório onde serão armazenados os arquivos de saída (cria apenas uma pasta AOO)', 'false')
        .option('-w, --cell-width-in-km <cellWidthInKm>', 'Largura da quadrícula em Km', '2')
        .option('-v, --verbose <verbose>', 'Saída de dados no terminal com detalhes.', 'true')
        .action(calculateAoo)


    await program.parseAsync(process.argv);
}

async function calculateEoo(argument: string, command: OptionValues) {
    let { inputFile, outputDir, verbose, flatDir } = command.opts()
    verbose = verbose === 'true'
    flatDir = flatDir === 'true'
    const inputFileJson: any = await _getInputFileContent(inputFile)
    const eoo = new EOO({ coordinates: inputFileJson })
    const {
        areaInSquareKm,
        totalPoints,
        totalRedundantPoints,
        executionTimeInSeconds,
        binomial,
        usedPointCollection,
        convexHullPolygon
    } = eoo.calculate()
    const outputResultDir = _createOutputDir({ inputFile, outputDir, binomial, type: 'EOO', flatDir })
    const usedPointCollectionString = JSON.stringify(usedPointCollection)
    const convexHullPolygonString = JSON.stringify(convexHullPolygon)
    const output = JSON.stringify({
        areaInSquareKm,
        totalPoints,
        totalRedundantPoints,
        executionTimeInSeconds,
        binomial,
        usedPointCollection: 'content available in used-point-collection.json',
        convexHullPolygon: 'content available in convex-hull-polygon.json',
        outputResultDir,
        timestamp: new Date().getTime()

    })
    await _writeOutputFiles({ outputResultDir, fileContent: usedPointCollectionString, filename: 'used-point-collection.json', verbose })
    await _writeOutputFiles({ outputResultDir, fileContent: convexHullPolygonString, filename: 'convex-hull-polygon.json', verbose })
    await _writeOutputFiles({ outputResultDir, fileContent: output, filename: 'summary.json', verbose })
    await _writeOutputFiles({ outputResultDir, fileContent: _buildSummaryCSV(output), filename: 'summary.csv', verbose })
    await _geojson2shp({ outputResultDir, fileContent: usedPointCollection, filename: 'used-point-collection', verbose })
    await _geojson2shp({ outputResultDir, fileContent: convexHullPolygon, filename: 'convex-hull-polygon', verbose })

    _buildViewer({
        content: {
            binomial,
            usedPointCollection: usedPointCollectionString,
            convexHullPolygon: convexHullPolygonString
        }, type: 'eoo', outputResultDir, verbose
    })
    if (verbose) {
        console.log(`EOO calculated successfully and files were saved in "${outputResultDir}"`)
    } else {
        console.log(outputResultDir)
    }
}

async function calculateAoo(argument: string, command: OptionValues) {
    let { inputFile, outputDir, cellWidthInKm, verbose, flatDir } = command.opts()
    verbose = verbose === 'true'
    flatDir = flatDir === 'true'
    cellWidthInKm = Number(cellWidthInKm)
    let inputFileJson: any = await _getInputFileContent(inputFile)
    const aoo = new AOO({ coordinates: inputFileJson })
    const {
        areaInSquareKm,
        occupiedGrids,
        totalOccupiedGrids,
        gridAreaInSquareKm,
        gridWidthInKm,
        totalPoints,
        totalRedundantPoints,
        usedPointCollection,
        executionTimeInSeconds,
        binomial
    } = aoo.calculate({ gridWidthInKm: cellWidthInKm })
    const outputResultDir = _createOutputDir({ inputFile, outputDir, binomial, type: 'AOO', flatDir })
    const usedPointCollectionString = JSON.stringify(usedPointCollection)
    const occupiedGridsString = JSON.stringify(occupiedGrids)
    const output = JSON.stringify({
        areaInSquareKm,
        occupiedGrids: 'content available in occupied-grids.json',
        totalOccupiedGrids,
        gridAreaInSquareKm,
        gridWidthInKm,
        totalPoints,
        totalRedundantPoints,
        usedPointCollection: 'content available in used-point-collection.json',
        executionTimeInSeconds,
        binomial,
        outputResultDir,
        timestamp: new Date().getTime()
    })
    await _writeOutputFiles({ outputResultDir, fileContent: usedPointCollectionString, filename: 'used-point-collection.json', verbose })
    await _writeOutputFiles({ outputResultDir, fileContent: occupiedGridsString, filename: 'occupied-grids.json', verbose })
    await _writeOutputFiles({ outputResultDir, fileContent: output, filename: 'summary.json', verbose })
    await _writeOutputFiles({ outputResultDir, fileContent: _buildSummaryCSV(output), filename: 'summary.csv', verbose })
    await _geojson2shp({ outputResultDir, fileContent: usedPointCollection, filename: 'used-point-collection', verbose })
    await _geojson2shp({ outputResultDir, fileContent: occupiedGridsString, filename: 'occupied-grids', verbose })
    _buildViewer({
        content: {
            binomial,
            usedPointCollection: usedPointCollectionString,
            occupiedGrids: occupiedGridsString,
        }, type: 'aoo', outputResultDir, verbose
    })
    if (verbose) {
        console.log(`AOO calculated successfully and files were saved in "${outputResultDir}"`)
    } else {
        console.log(outputResultDir)
    }
}

function _createOutputDir({ inputFile, outputDir, binomial, type, flatDir }: IOutputDirInput) {
    const uuidDir = uuidv4()
    let outputCreatedDir = outputDir + type + '-' + (binomial === null ? inputFile + '-' + uuidDir : binomial?.split(' ').join('_') + '-' + uuidDir) + '/'
    if(flatDir) outputCreatedDir = `${outputDir}${type}/`
    fsExtra.ensureDirSync(outputCreatedDir)
    return outputCreatedDir
}

function _writeOutputFiles({ outputResultDir, fileContent, filename, verbose }: IWriteOutputFilesInput) {
    return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(outputResultDir + filename, { flags: 'w' })
        fileContent.split(':').forEach((string, i, array) => {
            let content = string
            if (i < array.length - 1) {
                content = content + ':'
            }
            writeStream.write(content, 'utf-8')
        })
        writeStream.on('finish', () => {
            if (verbose) console.log(`File ${filename} created successfully.`)
            resolve(true)
        })
        writeStream.end()
    })
}

function _getInputFileContent(inputFile: string) {
    return new Promise(async (resolve, reject) => {
        let output: any = ''
        const inputFileExtention = inputFile.split('.').pop()
        if (inputFileExtention === 'csv') {
            output = await csv().fromFile(inputFile)
            resolve(output)
        } else {
            output = fs.readFileSync(inputFile)
            resolve(JSON.parse(output))
        }
    })
}


function _buildViewer({ content, type, outputResultDir, verbose }: any) {
    const html = `
    <!DOCTYPE html>
    <html>

    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Viewer ${type.toLocaleUpperCase()} | ${content.binomial}</title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.2/dist/leaflet.css"
            integrity="sha256-sA+zWATbFveLLNqWO2gtiw3HL/lh1giY/Inf1BJ0z14=" crossorigin="" />
        <style>
            /* http://meyerweb.com/eric/tools/css/reset/ 
                v2.0 | 20110126
                License: none (public domain)
            */

            html,
            body,
            div,
            span,
            applet,
            object,
            iframe,
            h1,
            h2,
            h3,
            h4,
            h5,
            h6,
            p,
            blockquote,
            pre,
            a,
            abbr,
            acronym,
            address,
            big,
            cite,
            code,
            del,
            dfn,
            em,
            img,
            ins,
            kbd,
            q,
            s,
            samp,
            small,
            strike,
            strong,
            sub,
            sup,
            tt,
            var,
            b,
            u,
            i,
            center,
            dl,
            dt,
            dd,
            ol,
            ul,
            li,
            fieldset,
            form,
            label,
            legend,
            table,
            caption,
            tbody,
            tfoot,
            thead,
            tr,
            th,
            td,
            article,
            aside,
            canvas,
            details,
            embed,
            figure,
            figcaption,
            footer,
            header,
            hgroup,
            menu,
            nav,
            output,
            ruby,
            section,
            summary,
            time,
            mark,
            audio,
            video {
                margin: 0;
                padding: 0;
                border: 0;
                font-size: 100%;
                font: inherit;
                vertical-align: baseline;
            }

            /* HTML5 display-role reset for older browsers */
            article,
            aside,
            details,
            figcaption,
            figure,
            footer,
            header,
            hgroup,
            menu,
            nav,
            section {
                display: block;
            }

            body {
                line-height: 1;
            }

            ol,
            ul {
                list-style: none;
            }

            blockquote,
            q {
                quotes: none;
            }

            blockquote:before,
            blockquote:after,
            q:before,
            q:after {
                content: '';
                content: none;
            }

            table {
                border-collapse: collapse;
                border-spacing: 0;
            }

            /* Mapa */
            #map {
                background-color: #f2f2f2;
                width: 100vw;
                height: 100vh;
                overflow: hidden;
            }
        </style>
    </head>

    <body>
        <!--[if lt IE 7]>
                <p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="#">upgrade your browser</a> to improve your experience.</p>
            <![endif]-->
        <div id="map"></div>
        <script src='https://unpkg.com/@turf/turf@6/turf.min.js'></script>
        <script src="https://code.jquery.com/jquery-3.6.1.min.js"
            integrity="sha256-o88AwQnZB+VDvE9tvIXrMQaPlFFSUTR+nldQm1LuPXQ=" crossorigin="anonymous"></script>
        <script src="https://unpkg.com/leaflet@1.9.2/dist/leaflet.js"
            integrity="sha256-o9N1jGDZrf5tS+Ft4gbIK7mYMipq9lqpVJ91xHSyKhg=" crossorigin=""></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/0.3.2/leaflet.draw.css"/>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/0.3.2/leaflet.draw.js"></script>
        <link rel="stylesheet" href="http://makinacorpus.github.io/Leaflet.MeasureControl/leaflet.measurecontrol.css" />
        <script src="http://makinacorpus.github.io/Leaflet.MeasureControl/leaflet.measurecontrol.js"></script>
        <script>
            init()
            function init() {
                const map = L.map('map').setView([51.505, -0.09], 13)
                const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }).addTo(map)

                const gm = L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
                }).addTo(map)

                map.setView(new L.LatLng(-15.83, -47.86), 8)

                const baseLayers = {
                    "OpenStreetMap": osm,
                    "Google Maps": gm
                }

                const overlays = {}
                const control = L.control.layers(baseLayers, overlays).addTo(map)

                L.Control.measureControl().addTo(map)

                ${type === 'eoo' ? `eooLayers(map, control)` : `aooLayers(map, control)`
        }
            }

            function createPopupTable(feature, layer){
                const tableRows = Object.keys(feature.properties).map(th =>'<tr><th style="padding:5px;"><strong>'+ th +'</strong><th><td style="padding:5px;">'+ feature.properties[th] +'</td></tr>')
                const tableHtml = '<table>'+ tableRows.join('') +'</table>'
                layer.bindPopup(tableHtml)

            }

            function eooLayers(map, control) {
                ${content.convexHullPolygon === 'null' ?
            `alert('Valor de EOO é 0 Km2. Não é possível projetar um polígono.')` :
            `
                    const convexHullLayer = L.geoJSON(${content.convexHullPolygon}, {
                        style: function (feature) {
                            return { color: '#ffb703' }
                        },
                        onEachFeature: createPopupTable
                    }).addTo(map)
                    control.addOverlay(convexHullLayer, 'EOO Polygon')
                    `
        }
                const eooPointsLayer = L.geoJSON(${content.usedPointCollection}, {
                    pointToLayer: function (geoJsonPoint, latlong) {
                        return L.circleMarker(latlong, { radius: 6 })
                    },
                    style: function (feature) {
                        return { color: '#ffb703' }
                    },
                    onEachFeature: createPopupTable
                    }).addTo(map)
                control.addOverlay(eooPointsLayer, 'EOO Points')
                const centroid = (turf.centroid(${content.usedPointCollection})).geometry.coordinates
                // Precisa inverter pois o centroid vem com Long-Lat e o Leaflet usa Lat-Long
                map.setView(new L.LatLng(centroid[1], centroid[0]), 8)
                


            }

            function aooLayers(map, control) {
                const occupiedGridsLayer = L.geoJSON(${content.occupiedGrids}, {
                    style: function (feature) {
                        return { color: '#cc0000' }
                    },
                    onEachFeature: createPopupTable
                }).addTo(map)
                control.addOverlay(occupiedGridsLayer, 'AOO Grids')
            
                const aooPointsLayer = L.geoJSON(${content.usedPointCollection}, {
                    pointToLayer: function (geoJsonPoint, latlong) {
                        return L.circleMarker(latlong, { radius: 6 })
                    },
                    style: function (feature) {
                        return { color: '#cc0000' }
                    },
                    onEachFeature: createPopupTable
                }).addTo(map)
                control.addOverlay(aooPointsLayer, 'AOO Points')
                const centroid = (turf.centroid(${content.usedPointCollection})).geometry.coordinates
                // Precisa inverter pois o centroid vem com Long-Lat e o Leaflet usa Lat-Long
                map.setView(new L.LatLng(centroid[1], centroid[0]), 8)
            }
        </script>

    </body>

    </html>
    `
    const minify = htmlMinify.minify
    const minifyOptions = {
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true
    }
    fs.writeFileSync(outputResultDir + 'viewer.html', minify(html, minifyOptions))
    if (verbose) console.log('Map Viewer created successfully.')
}

function _geojson2shp({ outputResultDir, fileContent, filename, verbose }: any) {
    return new Promise(async (resolve, reject) => {
        const options = {
            layer: filename,
            targetCrs: 4326 //wgs84
        }
        const filenameShp = `${filename}-shp.zip`
        const readStream = fs.createReadStream(outputResultDir + filename + '.json')
        const writeStream = fs.createWriteStream(outputResultDir + filenameShp, { flags: 'w' })
        await convert(readStream, writeStream, options)
        resolve(true)
        if (verbose) {
            console.log(`Shape file ${filenameShp} created successfully.`)
        }
    })
}

function _buildSummaryCSV(fileContent: any) {
    fileContent = JSON.parse(fileContent)
    const columns = Object.keys(fileContent)
    const values = Object.values(fileContent)
    const content = [columns, values]
    return content.map(row => row.join(',')).join('\n')
}
