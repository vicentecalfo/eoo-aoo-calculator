import { Command, OptionValues } from 'commander'
import { EOO, AOO } from './index'
import * as fs from 'fs'
import csv from 'csvtojson/v2'
import { v4 as uuidv4 } from 'uuid'
const program = new Command()

interface IOutputDirInput {
    inputFile: string
    outputDir: string
    binomial: string | null | undefined
    type: string
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
        .option('-v, --verbose <verbose>', 'Saída de dados no terminal com detalhes.', 'true')
        .action(calculateEoo)

    program
        .command('aoo')
        .requiredOption('-i, --input-file <inputFile>', 'Arquivo de ocorrência da espécie.')
        .option('-o, --output-dir <outputDir>', 'Diretório onde serão armazenados os arquivos de saída', './')
        .option('-w, --cell-width-in-km <cellWidthInKm>', 'Largura da quadrícula em Km', '2')
        .option('-v, --verbose <verbose>', 'Saída de dados no terminal com detalhes.', 'true')
        .action(calculateAoo)


    await program.parseAsync(process.argv);
}

async function calculateEoo(argument: string, command: OptionValues) {
    let { inputFile, outputDir, verbose } = command.opts()
    verbose = verbose === 'true'
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
    const outputResultDir = _createOutputDir({ inputFile, outputDir, binomial, type: 'EOO' })
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
    if (verbose) {
        console.log(`EOO calculated successfully and files were saved in "${outputResultDir}"`)
    } else {
        console.log(outputResultDir)
    }
}

async function calculateAoo(argument: string, command: OptionValues) {
    let { inputFile, outputDir, cellWidthInKm, verbose } = command.opts()
    verbose = verbose === 'true'
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
    const outputResultDir = _createOutputDir({ inputFile, outputDir, binomial, type: 'AOO' })
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
    if (verbose) {
        console.log(`AOO calculated successfully and files were saved in "${outputResultDir}"`)
    } else {
        console.log(outputResultDir)
    }
}

function _createOutputDir({ inputFile, outputDir, binomial, type }: IOutputDirInput) {
    const uuidDir = uuidv4()
    const outputCreatedDir = outputDir + type + '-' + (binomial === null ? inputFile + '-' + uuidDir : binomial + '-' + uuidDir) + '/'
    fs.mkdirSync(outputCreatedDir)
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
