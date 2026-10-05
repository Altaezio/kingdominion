const assert = require('node:assert/strict');
const test = require('node:test');
const joinCommand = require('../commands/kingdominion/join.js');
const joinModifierChoices = require('../source/joinModifierChoices.js');
const modifierManager = require('../source/modifierManager.js');
const modifierPool = require('../source/modifierPool.js');
const barracks = require('../source/barracks.js');
const userHandler = require('../source/userHandler.js');
const guildData = require('../source/guildData.js');

test('/join rechecks fighter name after catch-up choices', async t => {
	const original = {
		getUser: userHandler.GetLocalUserByDiscordUser,
		nameIsTaken: barracks.NameIsTaken,
		getFighters: barracks.GetFightersForUser,
		createFighter: barracks.CreateFighter,
		loadModifiers: modifierManager.LoadModifiers,
		getHistory: modifierPool.GetSurveyHistory,
		choose: joinModifierChoices.ChooseMissedSurveyModifiers,
		getSettings: guildData.getSettings,
	};
	t.after(() => {
		userHandler.GetLocalUserByDiscordUser = original.getUser;
		barracks.NameIsTaken = original.nameIsTaken;
		barracks.GetFightersForUser = original.getFighters;
		barracks.CreateFighter = original.createFighter;
		modifierManager.LoadModifiers = original.loadModifiers;
		modifierPool.GetSurveyHistory = original.getHistory;
		joinModifierChoices.ChooseMissedSurveyModifiers = original.choose;
		guildData.getSettings = original.getSettings;
	});

	let nameChecks = 0;
	let createCount = 0;
	const replies = [];
	userHandler.GetLocalUserByDiscordUser = () => ({ id: 1 });
	barracks.NameIsTaken = () => ++nameChecks > 1;
	barracks.GetFightersForUser = () => [];
	barracks.CreateFighter = () => {
		createCount++;
		return { icon: '🐉', name: 'New fighter' };
	};
	modifierManager.LoadModifiers = () => {};
	modifierPool.GetSurveyHistory = () => [{ id: 'past-survey', modifierIds: ['health'] }];
	joinModifierChoices.ChooseMissedSurveyModifiers = async () => ({ mode: 'none', choices: [] });
	guildData.getSettings = () => ({ maxFightersPerUser: 1 });

	const interaction = {
		user: { id: 'discord-user' },
		locale: 'en-US',
		options: {
			getString(name) {
				return name === 'name' ? 'New fighter' : '🐉';
			},
		},
		async deferReply() {},
		async reply(payload) {
			replies.push(payload);
		},
		async editReply(payload) {
			replies.push(payload);
		},
	};

	await joinCommand.execute(interaction);

	assert.equal(nameChecks, 2);
	assert.equal(createCount, 0);
	assert.match(replies.at(-1).content, /name already used/i);
});

test('/join rechecks the player fighter limit after catch-up choices', async t => {
	const original = {
		getUser: userHandler.GetLocalUserByDiscordUser,
		nameIsTaken: barracks.NameIsTaken,
		getFighters: barracks.GetFightersForUser,
		createFighter: barracks.CreateFighter,
		loadModifiers: modifierManager.LoadModifiers,
		getHistory: modifierPool.GetSurveyHistory,
		choose: joinModifierChoices.ChooseMissedSurveyModifiers,
		getSettings: guildData.getSettings,
	};
	t.after(() => {
		userHandler.GetLocalUserByDiscordUser = original.getUser;
		barracks.NameIsTaken = original.nameIsTaken;
		barracks.GetFightersForUser = original.getFighters;
		barracks.CreateFighter = original.createFighter;
		modifierManager.LoadModifiers = original.loadModifiers;
		modifierPool.GetSurveyHistory = original.getHistory;
		joinModifierChoices.ChooseMissedSurveyModifiers = original.choose;
		guildData.getSettings = original.getSettings;
	});

	let fighterCountChecks = 0;
	let createCount = 0;
	const replies = [];
	userHandler.GetLocalUserByDiscordUser = () => ({ id: 1 });
	barracks.NameIsTaken = () => false;
	barracks.GetFightersForUser = () => ++fighterCountChecks === 1 ? [] : [{ id: 2 }];
	barracks.CreateFighter = () => {
		createCount++;
		return { icon: '🐉', name: 'New fighter' };
	};
	modifierManager.LoadModifiers = () => {};
	modifierPool.GetSurveyHistory = () => [{ id: 'past-survey', modifierIds: ['health'] }];
	joinModifierChoices.ChooseMissedSurveyModifiers = async () => ({ mode: 'none', choices: [] });
	guildData.getSettings = () => ({ maxFightersPerUser: 1 });

	const interaction = {
		user: { id: 'discord-user' },
		locale: 'en-US',
		options: {
			getString(name) {
				return name === 'name' ? 'New fighter' : '🐉';
			},
		},
		async deferReply() {},
		async reply(payload) {
			replies.push(payload);
		},
		async editReply(payload) {
			replies.push(payload);
		},
	};

	await joinCommand.execute(interaction);

	assert.equal(fighterCountChecks, 2);
	assert.equal(createCount, 0);
	assert.match(replies.at(-1).content, /reached the limit/i);
});
