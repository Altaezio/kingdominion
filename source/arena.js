module.exports = {
    GetState() {
        const map = require('../data/currentMap.json');
        return map.state;
    },

    SetState(newState) {

        const map = require('../data/currentMap.json');
        const oldState = map.state;
        map.state = newState;

        const data = JSON.stringify(map, null, 4);
        fs.writeFileSync('../data/currentMap.json', data);
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: map state from ${oldState} to ${map.state}`);
        }
    },

    GetSpawnPositions(nToSpawn) {
        const map = require('../data/currentMap.json');
        // TODO
    },

    GetObjectsAtPosition(position) {
        const map = require('../data/currentMap.json');
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

    MoveObject(objectId, newPosition) {
        const map = require('../data/currentMap.json');
        const oldPosition = this.GetObjectPosition(objectId);
        console.assert(oldPosition != undefined, `Object ${objectId} not found`);
        if (oldPosition === undefined)
            return;

        const oldPositionStr = `${oldPosition.x};${oldPosition.y}`;
        const newPositionStr = `${newPosition.x};${newPosition.y}`;

        const oldInd = map.map[oldPositionStr].indexOf(objectId);
        map.map[oldPositionStr].splice(oldInd, 1);
        map.map[newPositionStr] = map.map[newPositionStr].concat(objectId);

        const data = JSON.stringify(map, null, 4);
        fs.writeFileSync('../data/currentMap.json', data);
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: object '${objectId}' moved from (${oldPositionStr}) to (${newPositionStr})`);
        }
    },

    // 'objectIds' can be one id or an array of ids
    AddObjectsToPosition(objectIds, position) {
        const map = require('../data/currentMap.json');
        const positionStr = `${position.x};${position.y}`;
        map.map[positionStr] = map.map[positionStr].concat(objectIds);

        const data = JSON.stringify(map, null, 4);
        fs.writeFileSync('../data/currentMap.json', data);
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: objects added to the map at position (${positionStr})`);
        }
    },

    AddObjectsToPosition(objectIds, x, y) {
        this.AddObjectsToPosition({ 'x': x, 'y': y }, objectIds);
    },

    GetObjectPosition(objectId) {
        const map = require('../data/currentMap.json');
        for (let key in map.map) {
            if (map.map[key].includes(objectId)) {
                return key;
            }
        }
        return undefined;
    },
};