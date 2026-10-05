const { AsyncLocalStorage } = require('node:async_hooks');
const fs = require('node:fs');
const path = require('node:path');

const guildContext = new AsyncLocalStorage();
const dataRoot = path.join(__dirname, '..', 'data');
const guildsRoot = path.join(dataRoot, 'guilds');
const configPath = path.join(__dirname, '..', 'config.json');
const defaultSettings = require('../settings.json');

function createEmptyArena() {
	return {
		state: 'initialisation',
		turn: { number: 0, turnOrder: [], currentTurnTakerInd: 0 },
		paused: false,
		width: 5,
		height: 5,
		map: {},
		fighterData: {},
		log: [],
		eventHistory: [],
	};
}

function getGuildId() {
	const guildId = guildContext.getStore();
	if (!guildId)
		throw new Error('Guild data accessed outside a Discord guild context');
	return guildId;
}

function getGuildDirectory(guildId = getGuildId()) {
	if (!/^\d+$/.test(guildId))
		throw new Error(`Invalid Discord guild ID: ${guildId}`);
	return path.join(guildsRoot, guildId);
}

function ensureGuildData(guildId = getGuildId()) {
	const guildDirectory = getGuildDirectory(guildId);
	fs.mkdirSync(guildDirectory, { recursive: true });

	const config = fs.existsSync(configPath)
		? JSON.parse(fs.readFileSync(configPath, 'utf8'))
		: {};
	const isLegacyGuild = guildId === config.guildId;
	const settingsPath = path.join(guildDirectory, 'settings.json');
	if (!fs.existsSync(settingsPath)) {
		const settings = isLegacyGuild
			? JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'settings.json'), 'utf8'))
			: {
				locale: defaultSettings.locale,
				emptyTile: defaultSettings.emptyTile,
				maxFightersPerUser: defaultSettings.maxFightersPerUser,
			};
		fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4));
	}

	const legacyFiles = {
		fighters: { filename: 'fighters.json', fallback: { allFighters: {}, nextId: 0 } },
		currentArena: { filename: 'currentArena.json', fallback: createEmptyArena() },
		interactionData: { filename: 'interactionData.json', fallback: { lastGameMessageId: '', runCommandMessageId: '' } },
	};
	for (const { filename, fallback } of Object.values(legacyFiles)) {
		const destination = path.join(guildDirectory, filename);
		if (fs.existsSync(destination))
			continue;
		const legacyPath = path.join(dataRoot, filename);
		if (isLegacyGuild && fs.existsSync(legacyPath)) {
			fs.copyFileSync(legacyPath, destination);
		}
		else if (fallback !== undefined) {
			fs.writeFileSync(destination, JSON.stringify(fallback, null, 4));
		}
	}

	const surveyPath = path.join(guildDirectory, 'modifierSurvey.json');
	const legacySurveyPath = path.join(dataRoot, 'modifierSurvey.json');
	if (isLegacyGuild && !fs.existsSync(surveyPath) && fs.existsSync(legacySurveyPath))
		fs.copyFileSync(legacySurveyPath, surveyPath);

	const usersPath = path.join(guildDirectory, 'users.json');
	if (!fs.existsSync(usersPath)) {
		const users = isLegacyGuild && config.users
			? { users: config.users, nextUserNumber: config.nextUserNumber ?? 1 }
			: { users: {}, nextUserNumber: 1 };
		fs.writeFileSync(usersPath, JSON.stringify(users, null, 4));
	}

	return guildDirectory;
}

module.exports = {
	run(guildId, callback) {
		if (!guildId)
			throw new Error('This command can only be used in a Discord server');
		ensureGuildData(guildId);
		return guildContext.run(guildId, callback);
	},

	getGuildId,

	getFilePath(filename) {
		return path.join(ensureGuildData(), filename);
	},

	getSettings() {
		const guildSettingsPath = this.getFilePath('settings.json');
		return JSON.parse(fs.readFileSync(guildSettingsPath, 'utf8'));
	},
};
