const assert = require('node:assert/strict');
const test = require('node:test');

test('combat only fetches fighters already recorded in the arena', async () => {
    const modulePaths = [
        require.resolve('../source/guildData.js'),
        require.resolve('../source/barracks.js'),
        require.resolve('../source/arenaManager.js'),
        require.resolve('../source/modifierManager.js'),
    ];
    const originalModules = new Map(modulePaths.map(modulePath => [modulePath, require.cache[modulePath]]));
    const arena = {
        state: 'battling',
        paused: false,
        turn: { number: 1, turnOrder: [], currentTurnTakerInd: 0 },
        fighterData: { 1: {}, 2: {} },
    };
    const fighterHolder = {
        allFighters: {
            1: { id: 1, userLocalId: 1 },
            2: { id: 2, userLocalId: 2 },
            3: { id: 3, userLocalId: 3 },
        },
    };

    function mockModule(modulePath, exports) {
        require.cache[modulePath] = {
            id: modulePath,
            filename: modulePath,
            loaded: true,
            exports,
        };
    }

    mockModule(modulePaths[0], { getSettings: () => ({ maxFightersPerUser: 2 }) });
    mockModule(modulePaths[1], {
        LoadAllFighters() {},
        GetFighterHolder: () => fighterHolder,
        SaveFighters() {},
    });
    mockModule(modulePaths[2], {
        LoadArena() {},
        GetArena: () => arena,
        GetState: () => arena.state,
        GetObjectPosition(fighterId) {
            assert.ok(Object.prototype.hasOwnProperty.call(arena.fighterData, fighterId));
            return { x: fighterId, y: 0 };
        },
        SaveArena() {},
    });
    mockModule(modulePaths[3], { LoadModifiers() {} });

    const gameEnginePath = require.resolve('../source/gameEngine.js');
    delete require.cache[gameEnginePath];

    try {
        const gameEngine = require('../source/gameEngine.js');
        let combatFighterIds;
        gameEngine.NewTurn = async turn => {
            combatFighterIds = turn.fightersOnMapIds;
            arena.state = 'finished';
        };

        await gameEngine.RunCombat({
            async log() {},
            async sendError(error) {
                throw new Error(error);
            },
        }, undefined, { turnDelaySeconds: 0 });

        assert.deepEqual(combatFighterIds, ['1', '2']);
    }
    finally {
        delete require.cache[gameEnginePath];
        for (const [modulePath, originalModule] of originalModules) {
            if (originalModule)
                require.cache[modulePath] = originalModule;
            else
                delete require.cache[modulePath];
        }
    }
});
