const fs = require('node:fs');
const { emptyTile } = require('../settings.json')

module.exports = {
    loadedMap: undefined,

    LoadMap(mapName) {
        this.loadedMap = JSON.parse(fs.readFileSync(`./data/${mapName}.json`, 'utf8'));
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: Map loaded`);
        }
    },

    GetMap(mapName = "currentMap") {
        if (this.loadedMap === undefined)
            this.LoadMap(mapName);
        return this.loadedMap;
    },

    SaveMap(mapName) {
        if (this.loadedMap === undefined)
            return;

        const data = JSON.stringify(this.loadedMap, null, 4);
        fs.writeFileSync(`./data/${mapName}.json`, data);
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: Map \'${mapName}\' saved`);
        }
    },

    GetState() {
        return this.GetMap().state;
    },

    SetState(newState) {
        const map = this.GetMap();
        const oldState = map.state;
        console.assert(newState === 'initialisation' || newState === 'battling',
            `'${newState}' is not a proper state`);
        map.state = newState;
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: map state from ${oldState} to ${map.state}`);
        }
    },

    GetSpawnPositions(nToSpawn) {
        let spawns = [];
        for (let i = 0; i < nToSpawn; i++) {
            let position = this.GetRandomPos();
            while (spawns.indexOf(position) >= 0)
                position = this.GetRandomPos();
            spawns.push(position);
        }
        return spawns;
    },

    GetObjectsAtPosition(position) {
        const map = this.GetMap();
        const positionStr = `${position.x};${position.y}`;
        if (positionStr in map.map) {
            return map.map[positionStr];
        }
        else {
            return [];
        }
    },

    GetObjectsAtPosition(x, y) {
        return this.GetObjectsAtPosition({ 'x': x, 'y': y });
    },

    MoveObject(objectId, newPosition) { // TODO find where to check if can move !!!
        const map = this.GetMap();
        const oldPosition = this.GetObjectPosition(objectId);
        console.assert(oldPosition != undefined, `Object ${objectId} not found`);
        if (oldPosition === undefined)
            return;

        const oldPositionStr = `${oldPosition.x};${oldPosition.y}`;
        const newPositionStr = `${newPosition.x};${newPosition.y}`;

        const oldInd = map.map[oldPositionStr].indexOf(objectId);
        map.map[oldPositionStr].splice(oldInd, 1);
        if (!map.map.hasOwnProperty(newPositionStr))
            map.map[newPositionStr] = [];
        map.map[newPositionStr] = map.map[newPositionStr].concat(objectId);

        if (map.map[oldPositionStr].length == 0)
            delete map.map[oldPositionStr];
    },

    MoveObjectXY(objectId, x, y) {
        this.MoveObject(objectId, { 'x': x, 'y': y });
    },

    // 'objectIds' can be one id or an array of ids
    AddObjectsToPosition(objectIds, position) {
        const map = this.GetMap();
        const positionStr = `${position.x};${position.y}`;
        if (!map.map.hasOwnProperty(positionStr))
            map.map[positionStr] = [];
        map.map[positionStr] = map.map[positionStr].concat(objectIds);
    },

    AddObjectsToPositionXY(objectIds, x, y) {
        this.AddObjectsToPosition(objectIds, { 'x': x, 'y': y });
    },

    GetObjectPosition(objectId) {
        const map = this.GetMap();
        for (let key in map.map) {
            if (map.map[key].includes(objectId)) {
                let posArray = key.split(';');
                return { 'x': Number(posArray[0]), 'y': Number(posArray[1]) };
            }
        }
        return undefined;
    },

    GetRandomPos() {
        const map = this.GetMap();
        let position = {};
        position.x = Math.floor(Math.random() * map.width);
        position.y = Math.floor(Math.random() * map.height);
        return position;
    },

    GetMapVisualisation() {
        const barrack = require('./barracks.js');
        const map = this.GetMap();
        let visu = "";
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const positionStr = `${x};${y}`;
                if (map.map.hasOwnProperty(positionStr)) {
                    const fighter = barrack.GetFighterById(map.map[positionStr][0]);
                    if (fighter.outOfCombat)
                        visu = visu.concat('☠️');
                    else
                        visu = visu.concat(fighter.icon);
                }
                else {
                    visu = visu.concat(emptyTile);
                }
            }
            visu = visu.concat('\n');
        }
        return visu;
    },
};