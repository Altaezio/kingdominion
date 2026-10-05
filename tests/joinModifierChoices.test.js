const assert = require('node:assert/strict');
const test = require('node:test');
const joinCommand = require('../commands/kingdominion/join.js');
const joinModifierChoices = require('../source/joinModifierChoices.js');

test('/join keeps only name and icon options', () => {
    assert.deepEqual(
        joinCommand.data.toJSON().options.map(option => option.name),
        ['name', 'icon']
    );
});

test('missed-survey catch-up offers mode buttons then one menu per survey', async () => {
    const prompts = [];
    const deferUpdates = [];
    const interaction = {
        id: 'join-interaction',
        locale: 'en-US',
        user: { id: 'user-1' },
        async editReply(payload) {
            prompts.push(payload);
            return {
                awaitMessageComponent: async options => {
                    const component = prompts.length === 1
                        ? {
                            customId: 'join-modifier-mode:join-interaction:choose',
                            user: { id: 'user-1' },
                        }
                        : {
                            customId: `join-survey-choice:join-interaction:${prompts.length - 2}`,
                            user: { id: 'user-1' },
                            values: [prompts.length === 2 ? 'health' : 'simpleAttack'],
                        };
                    assert.equal(options.filter(component), true);
                    return {
                        ...component,
                        async deferUpdate() {
                            deferUpdates.push(component.customId);
                        },
                    };
                },
            };
        },
    };
    const modifierManager = {
        GetModifier(id) {
            return { id };
        },
    };
    const surveyHistory = [
        { id: 'survey-1', modifierIds: ['health', 'vision'] },
        { id: 'survey-2', modifierIds: ['simpleAttack', 'simpleCrossMove'] },
    ];

    const result = await joinModifierChoices.ChooseMissedSurveyModifiers(
        interaction,
        surveyHistory,
        modifierManager
    );

    assert.deepEqual(result, { mode: 'choose', choices: ['health', 'simpleAttack'] });
    assert.equal(prompts.length, 3);
    assert.equal(prompts[0].components[0].components.length, 3);
    assert.match(prompts[1].content, /survey 1 of 2/i);
    assert.match(prompts[2].content, /survey 2 of 2/i);
    assert.equal(deferUpdates.length, 3);
});
