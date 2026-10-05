const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const barracks = require('../source/barracks.js');
const guildData = require('../source/guildData.js');
const modifierPool = require('../source/modifierPool.js');
const modifierManager = require('../source/modifierManager.js');

test('survey choices are removed from the pool and used for new fighters', t => {
    const guildId = `903${Date.now()}${Math.floor(Math.random() * 1000000)}`;
    const guildDirectory = path.join(__dirname, '..', 'data', 'guilds', guildId);
    const modifierIds = [
        'health',
        'vision',
        'simpleAttack',
        'simpleCrossMove',
        'modA',
        'modB',
        'modC',
        'modD',
        'modE',
    ];
    t.after(() => fs.rmSync(guildDirectory, { recursive: true, force: true }));

    guildData.run(guildId, () => {
        assert.deepEqual(
            modifierPool.GetSurveyableModifierIds(modifierIds),
            ['modA', 'modB', 'modC', 'modD', 'modE']
        );

        const firstSurveyModifiers = modifierPool.SelectModifiersForSurvey(modifierIds, 3, () => 0);
        assert.deepEqual(firstSurveyModifiers, ['modA', 'modB', 'modC']);
        assert.deepEqual(modifierPool.GetSurveyableModifierIds(modifierIds), ['modD', 'modE']);

        modifierPool.RecordCompletedSurvey('survey-1', firstSurveyModifiers);
        const secondSurveyModifiers = modifierPool.SelectModifiersForSurvey(modifierIds, 2, () => 0);
        assert.deepEqual(secondSurveyModifiers, ['modD', 'modE']);
        modifierPool.RecordCompletedSurvey('survey-2', secondSurveyModifiers);

        const ledger = JSON.parse(fs.readFileSync(
            path.join(guildDirectory, 'modifierSurveyHistory.json'),
            'utf8'
        ));
        assert.deepEqual(ledger.surveys.map(survey => survey.id), ['survey-1', 'survey-2']);
        assert.deepEqual(ledger.consumedModifierIds, ['modA', 'modB', 'modC', 'modD', 'modE']);

        const fighterModifiers = modifierPool.GetNewFighterModifierIds(modifierIds, { random: () => 0 });
        assert.deepEqual(fighterModifiers, [
            'health',
            'vision',
            'simpleAttack',
            'simpleCrossMove',
            'modA',
            'modD',
        ]);
        assert.deepEqual(modifierPool.GetSurveyableModifierIds(modifierIds), []);

        assert.deepEqual(
            modifierPool.GetNewFighterModifierIds(modifierIds, { mode: 'none' }),
            ['health', 'vision', 'simpleAttack', 'simpleCrossMove']
        );
        assert.deepEqual(
            modifierPool.GetNewFighterModifierIds(modifierIds, {
                mode: 'choose',
                choices: ['modB', 'modE'],
            }),
            ['health', 'vision', 'simpleAttack', 'simpleCrossMove', 'modB', 'modE']
        );
        assert.throws(
            () => modifierPool.GetNewFighterModifierIds(modifierIds, {
                mode: 'choose',
                choices: ['modE', 'modB'],
            }),
            /was not an option in survey/
        );
    });
});

test('array-format survey history is normalized into the ledger without reading the unused consumed-ID file', t => {
    const guildId = `905${Date.now()}${Math.floor(Math.random() * 1000000)}`;
    const guildDirectory = path.join(__dirname, '..', 'data', 'guilds', guildId);
    t.after(() => fs.rmSync(guildDirectory, { recursive: true, force: true }));

    guildData.run(guildId, () => {
        fs.mkdirSync(guildDirectory, { recursive: true });
        fs.writeFileSync(
            path.join(guildDirectory, 'modifierSurveyHistory.json'),
            JSON.stringify([{ id: 'old-survey', modifierIds: ['modA', 'modB'] }])
        );

        assert.deepEqual(modifierPool.GetSurveyHistory(), [
            { id: 'old-survey', modifierIds: ['modA', 'modB'] },
        ]);
        const ledger = JSON.parse(fs.readFileSync(
            path.join(guildDirectory, 'modifierSurveyHistory.json'),
            'utf8'
        ));
        assert.deepEqual(ledger.consumedModifierIds, ['modA', 'modB']);
    });
});

test('barracks gives new fighters one random choice from every completed survey', t => {
    const guildId = `904${Date.now()}${Math.floor(Math.random() * 1000000)}`;
    const guildDirectory = path.join(__dirname, '..', 'data', 'guilds', guildId);
    t.after(() => fs.rmSync(guildDirectory, { recursive: true, force: true }));

    guildData.run(guildId, () => {
        modifierManager.LoadModifiers();
        const allModifierIds = Object.keys(modifierManager.GetModifiers());
        const surveyableModifierIds = modifierPool.GetSurveyableModifierIds(allModifierIds);
        assert.ok(surveyableModifierIds.length >= 4);
        modifierPool.RecordCompletedSurvey('survey-1', surveyableModifierIds.slice(0, 2));
        modifierPool.RecordCompletedSurvey('survey-2', surveyableModifierIds.slice(2, 4));

        barracks.LoadAllFighters();
        const fighter = barracks.CreateFighter('Test fighter', '🐉', 1);
        const earnedModifierIds = fighter.baseModifierIds.slice(4);

        assert.equal(fighter.baseModifierIds.length, 6);
        assert.ok(surveyableModifierIds.slice(0, 2).includes(earnedModifierIds[0]));
        assert.ok(surveyableModifierIds.slice(2, 4).includes(earnedModifierIds[1]));
    });
});
