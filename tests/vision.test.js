const assert = require('node:assert/strict');
const test = require('node:test');
const vision = require('../source/modifier/passive/vision.js');

function createContext({ map, fighters, fighterData }) {
    const arena = { map, fighterData };
    const barrack = {
        GetFighterById(fighterId) {
            return fighters[fighterId];
        },
    };
    const arenaManager = {
        GetArena: () => arena,
    };
    return { barrack, arenaManager };
}

test('vision returns active opponents from every map position with their coordinates', () => {
    const { barrack, arenaManager } = createContext({
        map: {
            '1;2': [1, 2, 3],
            '4;0': [4],
        },
        fighters: {
            1: { id: 1, currentTeamId: 1 },
            2: { id: 2, currentTeamId: 2 },
            3: { id: 3, currentTeamId: 1 },
            4: { id: 4, currentTeamId: 2 },
        },
        fighterData: {
            1: { isOutOfCombat: false },
            2: { isOutOfCombat: false },
            3: { isOutOfCombat: false },
            4: { isOutOfCombat: false },
        },
    });
    const info = { visibleEnemies: [] };

    vision.GatherInfo(barrack, 1, arenaManager, info);

    assert.deepEqual(info.visibleEnemies, [
        { id: 2, position: { x: 1, y: 2 } },
        { id: 4, position: { x: 4, y: 0 } },
    ]);
});

test('vision excludes same-team fighters and opponents already out of combat', () => {
    const { barrack, arenaManager } = createContext({
        map: { '0;0': [1, 2, 3, 4] },
        fighters: {
            1: { id: 1, currentTeamId: 1 },
            2: { id: 2, currentTeamId: 1 },
            3: { id: 3, currentTeamId: 2 },
            4: { id: 4, currentTeamId: 2 },
        },
        fighterData: {
            1: { isOutOfCombat: false },
            2: { isOutOfCombat: false },
            3: { isOutOfCombat: false },
            4: { isOutOfCombat: true },
        },
    });
    const info = { visibleEnemies: [] };

    vision.GatherInfo(barrack, 1, arenaManager, info);

    assert.deepEqual(info.visibleEnemies, [
        { id: 3, position: { x: 0, y: 0 } },
    ]);
});

test('vision preserves existing visible enemies and adds opponents on the same tile', () => {
    const { barrack, arenaManager } = createContext({
        map: { '3;5': [1, 2, 3] },
        fighters: {
            1: { id: 1, currentTeamId: 1 },
            2: { id: 2, currentTeamId: 2 },
            3: { id: 3, currentTeamId: 2 },
        },
        fighterData: {
            1: { isOutOfCombat: false },
            2: { isOutOfCombat: false },
            3: { isOutOfCombat: false },
        },
    });
    const existingEnemy = { id: 99, position: { x: 8, y: 8 } };
    const info = { visibleEnemies: [existingEnemy] };

    vision.GatherInfo(barrack, 1, arenaManager, info);

    assert.deepEqual(info.visibleEnemies, [
        existingEnemy,
        { id: 2, position: { x: 3, y: 5 } },
        { id: 3, position: { x: 3, y: 5 } },
    ]);
});

test('vision leaves an empty enemy list when only allies are on the map', () => {
    const { barrack, arenaManager } = createContext({
        map: { '0;0': [1, 2] },
        fighters: {
            1: { id: 1, currentTeamId: 1 },
            2: { id: 2, currentTeamId: 1 },
        },
        fighterData: {
            1: { isOutOfCombat: false },
            2: { isOutOfCombat: false },
        },
    });
    const info = { visibleEnemies: [] };

    vision.GatherInfo(barrack, 1, arenaManager, info);

    assert.deepEqual(info.visibleEnemies, []);
});

test('vision does nothing when visible enemies were not requested', () => {
    const info = { currentHealth: 5 };
    const barrack = {
        GetFighterById() {
            assert.fail('Should not fetch fighters when vision was not requested');
        },
    };
    const arenaManager = {
        GetArena() {
            assert.fail('Should not read the arena when vision was not requested');
        },
    };

    vision.GatherInfo(barrack, 1, arenaManager, info);

    assert.deepEqual(info, { currentHealth: 5 });
});

test('vision handles an empty map without adding enemies', () => {
    const { barrack, arenaManager } = createContext({
        map: {},
        fighters: {
            1: { id: 1, currentTeamId: 1 },
        },
        fighterData: {
            1: { isOutOfCombat: false },
        },
    });
    const info = { visibleEnemies: [] };

    vision.GatherInfo(barrack, 1, arenaManager, info);

    assert.deepEqual(info.visibleEnemies, []);
});
