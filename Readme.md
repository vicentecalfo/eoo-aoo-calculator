# @vicentecalfo/eoo-aoo-calc

## EOO/AOO Calculator
Calculadora de Extensão de ocorrência (EOO) e Área de ocupação (AOO).

### Instalation

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

## CLI

### Instalação

`npm install -g @vicentecalfo/eoo-aoo-calc`

### Utilização

`$ calc-eoo-aoo <tipo de cálculo (eoo ou aoo))> -i <Caminho do arquivo JSON|CSV que contém os dados de ocorrência da espécie>`

### Exemplos

#### Obtendo Valor de EOO

`$ calc-eoo-aoo eoo - i ./sample-data/points_data_1.csv`

#### Obtendo Valor de AOO

`$ calc-eoo-aoo aoo - i ./sample-data/points_data_1.csv -w 2`

### Parâmetros

#### EOO e AOO
|Opção|Descrição|Valor Padrão|Obrigatório|
|---|---|---|---|
|`-i`|Caminho do arquivo JSON/CSV que contém os dados de ocorrência da espécie (verificar os exemplos no diretório `sample-data`).|-|Sim|
|`-o`|Caminho com o local onde serão armazenados os arquivos de resultado.|Mesmo diretório de onde o comando foi executado|Não|
|`-f`|Cria um diretório simples, apenas com uma pasta EOO/AOO.|False|Não|
|`-v`|Tipo da saída no terminal (com detalhes ou sem detalhes). Na opção sem detalhes o script ao finalizar a execução só mostrará no terminal o diretório onde os arquivos de resultados estão armazenados.|True (saída com detalhes)|Não|
|`-h`|Lista de comandos disponíveis e documentação (help).|-|Não|

#### Específico de AOO
|Opção|Descrição|Valor Padrão|Obrigatório|
|---|---|---|---|
|`-w`|Largura da quadrícula em Km.|2|Não|

### Arquivos de Resultado

Para evitar sobreposição dos arquivos, os resultados são armazenados em um diretório composto por um código único:

## Informando o campo binomial no arquivo de ocorrências
`<tipo de cálculo (eoo ou aoo)>-<binomial>-<código único>`

**Exemplos:**
* `EOO-Tabebuia bahamensis-85bde5e3-da75-484c-8846-f4de41ceb859`
* `AOO-Archidendron muricarpum-eb668422-fcd9-44c9-b31a-134d4cb2e1dd`

## Sem o campo binomial no arquivo de ocorrências

`<tipo de cálculo (eoo ou aoo)>-<código único>`

**Exemplos:**
* `EOO-85bde5e3-da75-484c-8846-f4de41ceb859`
* `AOO-eb668422-fcd9-44c9-b31a-134d4cb2e1dd`

## Usando o parâmetro -f 

O parâmetro `-f` é usado para criar um diretório de resultado simples (EOO/AOO), sem a informação da espécie como indicado anteriormente.


### Arquivos de Entrada (ocorrências)

#### Exemplo CSV
**Importante:** As únicas colunas obrigatórias são `longitude` e `latitude`.

```csv
assessment_id,id_no,binomial,presence,origin,seasonal,compiler,year,citation,legend,subspecies,subpop,dist_comm,island,tax_comm,source,basisofrec,event_year,longitude,latitude
143761594,142719676,Archidendron muricarpum,1,1,1,PNG Forest Research Institute (FRI),2020,PNG FRI,Extant (resident),,,,,,,PreservedSpecimen,1956,150.916667,-10.0
143761594,142719676,Archidendron muricarpum,1,1,1,PNG Forest Research Institute (FRI),2020,PNG 
```

#### Exemplo JSON
**Importante:** Os únicos atributos obrigatórios são `longitude` e `latitude`.

```json
[
  {
    "assessment_id": 143761594,
    "id_no": 142719676,
    "binomial": "Archidendron muricarpum",
    "presence": 1,
    "origin": 1,
    "seasonal": 1,
    "compiler": "PNG Forest Research Institute (FRI)",
    "year": 2020,
    "citation": "PNG FRI",
    "legend": "Extant (resident)",
    "subspecies": "",
    "subpop": "",
    "dist_comm": "",
    "island": "",
    "tax_comm": "",
    "source": "",
    "basisofrec": "PreservedSpecimen",
    "event_year": 1956,
    "longitude": 150.916667,
    "latitude": -10
  },
  /// ...
]
```

## Arquivos de Resultado

Dentro do diretório `sample-data/output` existem 2 diretórios com os exemplos dos arquivos de resultados.

### EOO
|Arquivo|Descrição|
|---|---|
|`summary.json`|Arquivo com o valor do EOO.|
|`summary.csv`|Arquivo com o valor do EOO.|
|`used-point-collection.json`|GeoJson com o pontos usados no cálculo.|
|`used-point-collection.zip`|Shape file com o pontos usados no cálculo.|
|`convex-hull.json`|GeoJson com o polígono gerado.|
|`convex-hull.zip`|Shape file com o polígono gerado.|
|`viewer.html`|Mapa com os dados de `used-point-collection.json` e `convex-hull.json` projetados.|

### AOO
|Arquivo|Descrição|
|---|---|
|`summary.json`|Arquivo com o valor do AOO.|
|`summary.csv`|Arquivo com o valor do AOO.|
|`used-point-collection.json`|GeoJson com o pontos usados no cálculo.|
|`used-point-collection.zip`|Shape file com o pontos usados no cálculo.|
|`occupied-grids.json`|GeoJson com as quadrículas ocupadas.|
|`occupied-grids.zip`|Shape file com as quadrículas ocupadas.|
|`viewer.html`|Mapa com os dados de `used-point-collection.json` e `occupied-grids.json` projetados.|


## Informações Adicionais
* No diretório `sample-data` existem arquivos no formato `json` com exemplos da estrutura dos dados de entrada;
* Ainda no diretório `sample-data` existem os mesmos arquivos `json` em formato `CSV`, que podem ser usados na ferramenta online [GeoCat](http://geocat.kew.org/) para validação dos resultados;
* [Link para o manual de avaliação de risco](https://nc.iucnredlist.org/redlist/content/attachment_files/Red_List_Guidelines_PT_corrected_20220725.pdf) de extinção da IUCN em português.

## To-Do
- [ ] Traduzir para inglês o arquivo de documentação (`readme.md`) 

