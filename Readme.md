# @vicentecalfo/eoo-aoo-calc

## EOO/AOO Calculator
Calculadora de Extensão de ocorrência (EOO) e Área de ocupação (AOO).

### Instalação

`npm install @vicentecalfo/eoo-aoo-calc --save`

### Utilização

```javascript

// Importação dos dados de ocorrência
import data from './dataset-sample.json'

import { AOO, EOO } from '@vicentecalfo/eoo-aoo-calc'

const coordinates = data.map(({ longitude, latitude }) => ({ longitude, latitude }))

const aoo = new AOO({ coordinates })
const aooValue = aoo.calculate({ gridWidthInKm: 2 })
//console.log(aooValue)
/** output
 * {
 *      areaInSquareKm -> valor de AOO em Km2
        occupiedGrids -> GeoJson das quadrículas ocupadas
        totalOccupiedGrids -> total de quadrícolas ocupadas
        gridAreaInSquareKm -> área da quadrícola gerada em Km2
        gridWidthInKm -> largura da quadrícola gerada em Km
        totalPoints -> total de ocorrências usadas
        totalRedundantPoints -> total de ocorrências com coordenadas reduntantes redundantes
        usedPointCollection -> GeoJson dos pontos (ocorrências) usados
        executionTimeInSeconds -> tempo de execução dos cálculos em segundos
 * }
*/

const eoo = new EOO({ coordinates })
const eooValue = eoo.calculate()
//console.log(eooValue)
/** output
 * {
 *      areaInSquareKm -> valor de EOO em Km2
        totalPoints -> total de ocorrências usadas
        totalRedundantPoints -> total de ocorrências com coordenadas reduntantes redundantes
        usedPointCollection -> GeoJson dos pontos (ocorrências) usados
        convexHullPolygon -> GeoJon da área de EOO
        executionTimeInSeconds -> tempo de execução dos cálculos em segundos
 * }
 * 
*/

```

## Informações Adicionais
* No diretório `sample-data` existem arquivos no formato `json` com exemplos da estrutura dos dados de entrada;
* Ainda no diretório `sample-data` existem os mesmos arquivos `json` em formato `CSV`, que podem ser usados na ferramenta online [GeoCat](http://geocat.kew.org/) para validação dos resultados;
* [Link para o manual de avaliação de risco](https://nc.iucnredlist.org/redlist/content/attachment_files/Red_List_Guidelines_PT_corrected_20220725.pdf) de extinção da IUCN em português.

## To-Do
- [ ] Traduzir para inglês o arquivo de documentação (`readme.md`) 