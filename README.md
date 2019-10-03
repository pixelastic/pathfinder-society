# pathfinder-society

This is a JSON dump of all Pathfinder Society scenarios metadata (name, authors,
description, etc). The data is updated weekly.

## Installation

```shell
yarn add pathfinder-society
```

## Usage

```js
import pathfinderSociety from 'pathfinder-society';
console.info(pathfinderSociety.silentTide)
// TODO: Add a sample record
```

## Sources

Data is extracted from the [Pathfinder
Wiki](https://pathfinderwiki.com/wiki/Pathfinder_Wiki) API. Additional
information is extracted from the official [Paizo website](https://paizo.com).

## Development

Run `yarn run regenerate` to update the data with the latest information
extracted from the Wiki and Paizo website. This might take some time as it's
making a bunch of HTTP requests.



