module.exports = {
    GetState(){
        const map = require('../data/currentMap.json');
        return map.state;
    },

    SetState(newState){

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
        return this.GetObjectsAtPosition({'x': x, 'y': y});
    },

    // 'objects' can be one object or an array of multiple
    AddObjectsToPosition(position, objects) {
        const map = require('../data/currentMap.json');
        const positionStr = `${position.x};${position.y}`;
        map.map[positionStr].concat(objects);
        
        const data = JSON.stringify(map, null, 4);
        fs.writeFileSync('../data/currentMap.json', data);
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: objects added to the map at position (${positionStr})`);
        }
    },

    AddObjectsToPosition(x, y, objects) {
        this.AddObjectsToPosition({'x': x, 'y': y}, objects);
    }
};