const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const guildData = require('../source/guildData.js');
const modifierSurvey = require('../source/modifierSurvey.js');

function makeModifierManager() {
	const modifierIds = ['lanceAttack', 'dodge', 'spinAttack', 'bowShoot', 'dash'];
	return {
		GetSurveyableModifiers() {
			throw new Error('StartSurvey should not separately read the pool');
		},
		SelectModifiersForSurvey(count) {
			assert.equal(count, 5);
			return modifierIds.map(id => ({ id }));
		},
		GetModifier(id) {
			return { id };
		},
	};
}

test('starting a survey selects directly without a separate pool read', async t => {
	const guildId = `905${Date.now()}${Math.floor(Math.random() * 1000000)}`;
	const guildDirectory = path.join(__dirname, '..', 'data', 'guilds', guildId);
	t.after(() => fs.rmSync(guildDirectory, { recursive: true, force: true }));

	await guildData.run(guildId, async () => {
		const modifierManager = makeModifierManager();
		const sentMessages = [];
		const channel = {
			id: 'survey-channel',
			async send(message) {
				sentMessages.push(message);
				return { id: 'survey-message' };
			},
		};

		const survey = await modifierSurvey.StartSurvey(channel, modifierManager);

		assert.equal(survey.modifierIds.length, 5);
		assert.equal(sentMessages.length, 1);
		assert.equal(modifierSurvey.GetCurrentSurvey().messageId, 'survey-message');
	});
});

test('closing a survey randomly awards an option to fighters without votes', async t => {
	const guildId = `906${Date.now()}${Math.floor(Math.random() * 1000000)}`;
	const guildDirectory = path.join(__dirname, '..', 'data', 'guilds', guildId);
	t.after(() => fs.rmSync(guildDirectory, { recursive: true, force: true }));

	await guildData.run(guildId, async () => {
		const survey = modifierSurvey.CreateSurvey(['lanceAttack', 'dodge', 'spinAttack']);
		const fighters = {
			'1': { id: 1, baseModifierIds: [], baseModifierData: {} },
			'2': { id: 2, baseModifierIds: [], baseModifierData: {} },
			'3': { id: 3, baseModifierIds: ['lanceAttack', 'dodge', 'spinAttack'], baseModifierData: {} },
		};
		modifierSurvey.RegisterVote(survey.id, 1, 'dodge');
		let saveCount = 0;
		const barracks = {
			GetFighterHolder: () => ({ allFighters: fighters }),
			SaveFighters: () => { saveCount++; },
		};
		const modifierManager = {
			GetModifier: id => ({ id }),
		};

		const result = await modifierSurvey.CloseSurvey(barracks, modifierManager, undefined, { random: () => 0 });

		assert.equal(fighters['1'].baseModifierIds[0], 'dodge');
		assert.equal(fighters['2'].baseModifierIds[0], 'lanceAttack');
		assert.deepEqual(fighters['3'].baseModifierIds, ['lanceAttack', 'dodge', 'spinAttack']);
		assert.equal(result.survey.votes['1'], 'dodge');
		assert.equal(result.survey.votes['2'], undefined);
		assert.equal(result.survey.autoAssignments['2'], 'lanceAttack');
		assert.equal(result.appliedModifiers.length, 2);
		assert.equal(saveCount, 1);
	});
});
