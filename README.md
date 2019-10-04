# Pathfinder-society

This contains all the Pathfinder Society Scenarios metadata, as extracted from
the [PathfinderWiki][1]. The module is automatically updated every week.

The initial goal was to build a [searchable list of Pathfinder Society Scenarios][2],
but the data has been packaged in a easy-to-use format to allow anyone to build
from it.

## Installation

```shell
yarn add pathfinder-society
```

## Usage

```js
import pathfinderSociety from 'pathfinder-society';
console.info(pathfinderSociety.stayOfExecution);
// {
//   "authors": [
//     "Alison McKenzie"
//   ],
//   "backcover": "When a petty thief named Hadge gets a lucky break and makes off with a powerful divination focus of the Pathfinder Society's masked leadership, you and your fellow Pathfinders set out to the sparsely populated Taldor frontier to find him and recover the focus. When the local governor tosses Hadge into the brutal Porthmos Prison for a minor crime, your mission suddenly becomes a jail break. Will you free Hadge and uncover the location of the focus before the gangs of Porthmos tear him apart?",
//   "coverUrl": "//cdn.paizo.com/image/product/catalog/PZOP/PZOPSS012E_500.jpeg",
//   "levels": [
//     1,
//     2,
//     3,
//     4,
//     5,
//     6,
//     7
//   ],
//   "locations": [
//     "Taldor",
//     "Sardis Township",
//     "Porthmos Prison"
//   ],
//   "npcs": [
//     "Drandle Dreng",
//     "The Inward Facing Circle"
//   ],
//   "paizoUrl": "https://paizo.com/products/btpy86nh",
//   "price": 3.99,
//   "pubcode": "PZOPSS0012E",
//   "rating": 2.3,
//   "scenarioIndex": 12,
//   "seasonIndex": 0,
//   "title": "Stay of Execution",
//   "url": "https://pathfinderwiki.com/wiki/Stay_of_Execution"
// }
```

## Sources

Data is extracted from the [Pathfinder Wiki][1] API. Additional information is
extracted from the official [Paizo website][3] (like cover art and rating).

## Development

Run `yarn run regenerate` to update the data with the latest information
extracted from the Wiki and Paizo website. This might take some time as it's
making a bunch of HTTP requests.

## Automation

This repository is configured with a GitHub Action to recrawl the PatfinderWiki
every week and submit a Pull Request with the new changes. When this Pull
Request is merged, another GitHub Action will release a new `patch` version of
the module.

If the PR is not merged in one week, it will be updated with data from the most
recent crawl until it is accepted.

[1]: https://pathfinderwiki.com/wiki/Pathfinder_Wiki
[2]: https://gamemaster.pixelastic.com/society/
[3]: https://paizo.com
