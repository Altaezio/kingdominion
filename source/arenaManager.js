const fs = require('node:fs');
const { emptyTile } = require('../settings.json')

module.exports = {
    loadedArena: undefined,

    ArenaIsValid(arena) {
        if (!arena ||
            !arena.hasOwnProperty('state') ||
            !arena.hasOwnProperty('width') ||
            !arena.hasOwnProperty('height') ||
            !arena.hasOwnProperty('state') ||
            !arena.hasOwnProperty('paused') ||
            !arena.hasOwnProperty('width') ||
            !arena.hasOwnProperty('height') ||
            !arena.hasOwnProperty('map') ||
            !arena.hasOwnProperty('fighterData') ||
            !arena.hasOwnProperty('log') ||
            !arena.hasOwnProperty('turn') ||
            !arena.turn.hasOwnProperty('number') ||
            !arena.turn.hasOwnProperty('turnOrder') ||
            !arena.turn.hasOwnProperty('currentTurnTakerInd')) {

            return false;
        }
        return true;
    },

    LoadArena(arenaName) {
        try {
            this.loadedArena = JSON.parse(fs.readFileSync(`./data/${arenaName}.json`, 'utf8'));
        }
        catch (error) {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: Error loading ${arenaName}: \n${error}`);
        }
        if (!this.ArenaIsValid(this.loadedArena)) {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: Invalid properties. Reseting arena`);
            this.ResetArena();
        }
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: Arena loaded`);
        }
    },

    GetArena(arenaName = "currentArena") {
        if (this.loadedArena === undefined)
            this.LoadArena(arenaName);
        return this.loadedArena;
    },

    SaveArena(arenaName) {
        if (this.loadedArena === undefined)
            return;
        const currentTime = new Date();
        this.loadedArena['date'] = currentTime.toLocaleString('fr-FR');
        const data = JSON.stringify(this.loadedArena, null, 4);
        fs.writeFileSync(`./data/${arenaName}.json`, data);
        console.log('[' + currentTime.toLocaleString('fr-FR') + `]: Arena \'${arenaName}\' saved`);
    },

    ResetArena() {
        this.loadedArena = {
            "state": "initialisation",
            "turn": {
                "number": 0,
                "turnOrder": [],
                "currentTurnTakerInd": 0
            },
            "paused": false,
            "width": 5,
            "height": 5,
            "map": {},
            "fighterData": {},
            "log": []
        };
        this.SaveArena('currentArena');
    },

    GetState() {
        return this.GetArena().state;
    },

    SetState(newState) {
        const arena = this.GetArena();
        const oldState = arena.state;
        console.assert(newState === 'initialisation' ||
            newState === 'battling' ||
            newState === 'finished',
            `'${newState}' is not a proper state`);
        arena.state = newState;
        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: arena state from ${oldState} to ${arena.state}`);
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
        const arena = this.GetArena();
        const positionStr = `${position.x};${position.y}`;
        if (positionStr in arena.map) {
            return arena.map[positionStr];
        }
        else {
            return [];
        }
    },

    GetObjectsAtPosition(x, y) {
        return this.GetObjectsAtPosition({ 'x': x, 'y': y });
    },

    MoveObject(objectId, newPosition) { // TODO find where to check if can move !!!
        const arena = this.GetArena();
        const oldPosition = this.GetObjectPosition(objectId);
        console.assert(oldPosition != undefined, `Object ${objectId} not found`);
        if (oldPosition === undefined)
            return;

        const oldPositionStr = `${oldPosition.x};${oldPosition.y}`;
        const newPositionStr = `${newPosition.x};${newPosition.y}`;

        const oldInd = arena.map[oldPositionStr].indexOf(objectId);
        arena.map[oldPositionStr].splice(oldInd, 1);
        if (!arena.map.hasOwnProperty(newPositionStr))
            arena.map[newPositionStr] = [];
        arena.map[newPositionStr] = arena.map[newPositionStr].concat(objectId);

        if (arena.map[oldPositionStr].length == 0)
            delete arena.map[oldPositionStr];
    },

    MoveObjectXY(objectId, x, y) {
        this.MoveObject(objectId, { 'x': x, 'y': y });
    },

    // 'objectIds' can be one id or an array of ids
    AddObjectsToPosition(objectIds, position) {
        const arena = this.GetArena();
        const positionStr = `${position.x};${position.y}`;
        if (!arena.map.hasOwnProperty(positionStr))
            arena.map[positionStr] = [];
        arena.map[positionStr] = arena.map[positionStr].concat(objectIds);
    },

    // 'objectIds' can be one id or an array of ids
    AddObjectsToPositionXY(objectIds, x, y) {
        this.AddObjectsToPosition(objectIds, { 'x': x, 'y': y });
    },

    GetObjectPosition(objectId) {
        const arena = this.GetArena();
        for (let key in arena.map) {
            for (let subKey in arena.map[key]) {
                if (arena.map[key][subKey] == objectId) {
                    let posArray = key.split(';');
                    return { 'x': Number(posArray[0]), 'y': Number(posArray[1]) };
                }
            }
        }

        {
            const currentTime = new Date();
            console.log('[' + currentTime.toLocaleString('fr-FR') + `]: object with id ${objectId} not found in map:\n${this.GetMapVisualisation()}`);
        }
        return undefined;
    },

    RemoveObject(objectId) {
        const arena = this.GetArena();
        for (let key in arena.map) {
            let index = arena.map[key].indexOf(objectId);
            if (index >= 0) {
                arena.map[key].splice(index, 1);
            }
        }
    },

    SortToLast(objectId) {
        const arena = this.GetArena();
        for (let key in arena.map) {
            let index = arena.map[key].indexOf(objectId);
            if (index >= 0) {
                let temp = arena.map[key][index];
                arena.map[key].splice(index, 1);
                arena.map[key].push(temp);
            }
        }
    },

    GetRandomPos() {
        const arena = this.GetArena();
        let position = {};
        position.x = Math.floor(Math.random() * arena.width);
        position.y = Math.floor(Math.random() * arena.height);
        return position;
    },

    GetMapVisualisation() {
        const barrack = require('./barracks.js');
        const arena = this.GetArena();
        let visu = "";
        for (let y = 0; y < arena.height + 1; y++) {
            for (let x = 0; x < arena.width + 1; x++) {
                const positionStr = `${x};${y}`;
                if (arena.map.hasOwnProperty(positionStr)) {
                    const fighterId = arena.map[positionStr][0];
                    if (arena.fighterData[fighterId].isOutOfCombat) {
                        visu = visu.concat('☠️');
                    }
                    else {
                        const fighter = barrack.GetFighterById(fighterId);
                        visu = visu.concat(fighter.icon);
                    }
                }
                else {
                    visu = visu.concat(emptyTile);
                }
            }
            visu = visu.concat('\n');
        }
        return visu;
    },

    AddFighter(fighter, position) {
        const arena = this.GetArena();
        this.AddObjectsToPosition(fighter.id, position);
        arena.fighterData[fighter.id] = {
            "isOutOfCombat": false,
            "modifierIds": fighter.baseModifierIds.toSpliced(),
            "modifierData": structuredClone(fighter.baseModifierData)
        }
    },

    async Log(msg, useConsole, channel, flags) {
        const arena = this.GetArena();
        const currentTime = new Date();
        const timedText = `[${currentTime.toLocaleString('fr-FR')}]: ` + msg
        arena.log = arena.log.concat(timedText);
        if (useConsole)
            console.log(timedText);
        if (channel)
            await channel.send({ content: msg, flags: flags });
    }
};