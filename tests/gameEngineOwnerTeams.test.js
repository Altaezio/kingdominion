const assert = require('node:assert/strict');
const test = require('node:test');

test('new combat assigns each selected fighter to their owner team', async () => {
    const modulePaths = [
        require.resolve('../source/guildData.js'),
        require.resolve('../source/barracks.js'),
        require.resolve('../source/arenaManager.js'),
        require.resolve('../source/modifierManager.js'),
    ];
    const originalModules = new Map(modulePaths.map(modulePath => [modulePath, require.cache[modulePath]]));
    const fighters = {
        1: { id: 1, userLocalId: 21, currentTeamId: 0 },
        2: { id: 2, userLocalId: 34, currentTeamId: 0 },
    };
    const fighterHolder = { allFighters: fighters };
    const arena = {
        state: 'initialisation',
        paused: false,
        turn: { number: 0, turnOrder: [], currentTurnTakerInd: 0 },
    };
    const teamsAtSpawn = {};

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
        ResetArena() {},
        SetSeed: () => 'test-seed',
        GetSpawnPoints: () => [{ x: 0, y: 0 }, { x: 1, y: 0 }],
        AddFighter(fighter) {
            teamsAtSpawn[fighter.id] = fighter.currentTeamId;
            arena.fighterData ??= {};
            arena.fighterData[fighter.id] = { isOutOfCombat: false };
        },
        GetMapVisualisation: () => 'map',
        SetState(state) {
            arena.state = state;
        },
        GetObjectPosition: fighterId => ({ x: Number(fighterId), y: 0 }),
        SaveArena() {},
    });
    mockModule(modulePaths[3], { LoadModifiers() {} });

    const gameEnginePath = require.resolve('../source/gameEngine.js');
    const originalGameEngine = require.cache[gameEnginePath];
    delete require.cache[gameEnginePath];

    try {
        const gameEngine = require('../source/gameEngine.js');
        gameEngine.NewTurn = async () => {
            arena.state = 'finished';
        };

        await gameEngine.RunCombat({
            async log() {},
            async sendError(error) {
                throw new Error(error);
            },
        }, undefined, { turnDelaySeconds: 0 });

        assert.deepEqual(teamsAtSpawn, { 1: 21, 2: 34 });
    }
    finally {
        if (originalGameEngine)
            require.cache[gameEnginePath] = originalGameEngine;
        else
            delete require.cache[gameEnginePath];
        for (const [modulePath, originalModule] of originalModules) {
            if (originalModule)
                require.cache[modulePath] = originalModule;
            else
                delete require.cache[modulePath];
        }
    }
});
