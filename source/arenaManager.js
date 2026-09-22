const fs = require('node:fs');
const { emptyTile, locale } = require('../settings.json');
const { GetLogText } = require('./logTexts.js');

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

    GetArena(arenaName = 'currentArena') {
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
            state: 'initialisation',
            turn: {
                number: 0,
                turnOrder: [],
                currentTurnTakerInd: 0
            },
            paused: false,
            width: 5,
            height: 5,
            map: {},
            fighterData: {},
            log: [],
            eventHistory: []
        };
        this.SaveArena('currentArena');
    },

    RecordEvent(event, turnNumber) {
        const arena = this.GetArena();
        if (!arena.hasOwnProperty('eventHistory'))
            arena.eventHistory = [];
        arena.eventHistory.push({
            sequence: arena.eventHistory.length,
            timestamp: new Date().toISOString(),
            turn: turnNumber,
            event: structuredClone(event),
            stateAfter: {
                map: structuredClone(arena.map),
                fighterData: structuredClone(arena.fighterData)
            }
        });
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

    GetSpawnPoints(nToSpawn) {
        const arena = this.GetArena();
        const positions = [];
        for (let y = 0; y < arena.height; y++) {
            for (let x = 0; x < arena.width; x++) {
                positions.push({ x, y });
            }
        }

        const shuffle = (items) => {
            for (let index = items.length - 1; index > 0; index--) {
                const randomIndex = Math.floor(Math.random() * (index + 1));
                [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
            }
            return items;
        };

        if (nToSpawn <= 0 || nToSpawn > positions.length)
            return [];

        shuffle(positions);

        const distanceSquared = (first, second) => {
            const xDistance = first.x - second.x;
            const yDistance = first.y - second.y;
            return xDistance * xDistance + yDistance * yDistance;
        };
        const nearestDistances = (points) => points.map((point, pointIndex) => {
            let nearest = Infinity;
            points.forEach((other, otherIndex) => {
                if (pointIndex !== otherIndex)
                    nearest = Math.min(nearest, distanceSquared(point, other));
            });
            return nearest;
        });
        const score = (points) => {
            const distances = nearestDistances(points);
            const minimum = Math.min(...distances);
            const maximum = Math.max(...distances);
            return { spread: maximum - minimum, minimum };
        };
        const isBetter = (candidate, best) => candidate.spread < best.spread ||
            (candidate.spread === best.spread && candidate.minimum > best.minimum);

        let bestPoints;
        let bestScore = { spread: Infinity, minimum: -Infinity };
        const combinationLimit = 250000;
        let combinations = 1;
        for (let index = 1; index <= nToSpawn; index++)
            combinations = combinations * (positions.length - nToSpawn + index) / index;

        if (combinations <= combinationLimit) {
            const selected = [];
            const search = (nextIndex) => {
                if (selected.length === nToSpawn) {
                    const candidateScore = score(selected);
                    if (isBetter(candidateScore, bestScore)) {
                        bestPoints = selected.map(point => ({ ...point }));
                        bestScore = candidateScore;
                    }
                    return;
                }

                const remaining = nToSpawn - selected.length;
                for (let index = nextIndex; index <= positions.length - remaining; index++) {
                    selected.push(positions[index]);
                    search(index + 1);
                    selected.pop();
                }
            };
            search(0);
        }
        else {
            bestPoints = [positions[0]];
            while (bestPoints.length < nToSpawn) {
                let farthestPosition;
                let farthestDistance = -1;
                positions.forEach(position => {
                    if (bestPoints.some(point => point.x === position.x && point.y === position.y))
                        return;
                    const nearest = Math.min(...bestPoints.map(point => distanceSquared(position, point)));
                    if (nearest > farthestDistance) {
                        farthestPosition = position;
                        farthestDistance = nearest;
                    }
                });
                bestPoints.push(farthestPosition);
            }
        }

        return shuffle(bestPoints);
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
        let visu = '';
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
            isOutOfCombat: false,
            modifierIds: fighter.baseModifierIds.toSpliced(),
            modifierData: structuredClone(fighter.baseModifierData)
        }
    },

    async Log(message, useConsole, channel, flags, localeName = locale) {
        const arena = this.GetArena();
        const currentTime = new Date();
        let localizedMessage;
        if (typeof message === 'string') {
            localizedMessage = message;
        }
        else if (message?.key) {
            localizedMessage = GetLogText(message.key, message.values)[localeName?.toLowerCase().startsWith('fr') ? 'fr' : 'en'];
        }
        else {
            localizedMessage = message[localeName?.toLowerCase().startsWith('fr') ? 'fr' : 'en'];
        }
        const timedText = `[${currentTime.toLocaleString('fr-FR')}]: ` + localizedMessage;
        arena.log = arena.log.concat(timedText);
        if (useConsole)
            console.log(timedText);
        if (channel)
            await channel.send({ content: localizedMessage, flags: flags });
    }
};