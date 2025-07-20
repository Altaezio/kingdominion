module.exports = {
    loadedMap: {},

    LoadMap() {
        const map = require('../data/currentMap.json');
        this.loadedMap = map;
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: Map loaded`);
        }
    },

    SaveMap() {
        const data = JSON.stringify(this.loadedMap, null, 4);
        fs.writeFileSync('../data/currentMap.json', data);
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: Map saved`);
        }
    },

    GetState() {
        return this.loadedMap.state;
    },

    SetState(newState) {
        const oldState = this.loadedMap.state;
        this.loadedMap.state = newState;
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: map state from ${oldState} to ${this.loadedMap.state}`);
        }
    },

    GetSpawnPositions(nToSpawn) {
        // TODO
    },

    GetObjectsAtPosition(position) {
        const positionStr = `${position.x};${position.y}`;
        if (positionStr in this.loadedMap.map) {
            return this.loadedMap.map[positionStr];
        }
        else {
            return [];
        }
    },

    GetObjectsAtPosition(x, y) {
        return this.GetObjectsAtPosition({ 'x': x, 'y': y });
    },

    MoveObject(objectId, newPosition) {
        const oldPosition = this.GetObjectPosition(objectId);
        console.assert(oldPosition != undefined, `Object ${objectId} not found`);
        if (oldPosition === undefined)
            return;

        const oldPositionStr = `${oldPosition.x};${oldPosition.y}`;
        const newPositionStr = `${newPosition.x};${newPosition.y}`;

        const oldInd = this.loadedMap.map[oldPositionStr].indexOf(objectId);
        this.loadedMap.map[oldPositionStr].splice(oldInd, 1);
        this.loadedMap.map[newPositionStr] = this.loadedMap.map[newPositionStr].concat(objectId);
    },

    // 'objectIds' can be one id or an array of ids
    AddObjectsToPosition(objectIds, position) {
        const positionStr = `${position.x};${position.y}`;
        this.loadedMap.map[positionStr] = this.loadedMap.map[positionStr].concat(objectIds);
    },

    AddObjectsToPosition(objectIds, x, y) {
        this.AddObjectsToPosition({ 'x': x, 'y': y }, objectIds);
    },

    GetObjectPosition(objectId) {
        for (let key in this.loadedMap.map) {
            if (this.loadedMap.map[key].includes(objectId)) {
                return key;
            }
        }
        return undefined;
    },
};