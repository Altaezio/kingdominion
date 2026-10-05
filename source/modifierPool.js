const fs = require('node:fs');
const guildData = require('./guildData.js');

const defaultModifierIds = ['health', 'vision', 'simpleAttack', 'simpleCrossMove'];

function loadArray(filename) {
	const filePath = guildData.getFilePath(filename);
	if (!fs.existsSync(filePath))
		return undefined;
	const value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
	if (!Array.isArray(value))
		throw new Error(`${filename} must contain a JSON array`);
	return value;
}

function saveArray(filename, values) {
	fs.writeFileSync(guildData.getFilePath(filename), JSON.stringify(values, null, 4));
}

function saveSurveyLedger(ledger) {
	fs.writeFileSync(
		guildData.getFilePath('modifierSurveyHistory.json'),
		JSON.stringify(ledger, null, 4)
	);
}

function getSurveyLedger() {
	const historyPath = guildData.getFilePath('modifierSurveyHistory.json');
	let ledger = { surveys: [], consumedModifierIds: [] };
	let needsMigration = false;

	if (fs.existsSync(historyPath)) {
		const value = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
		if (Array.isArray(value)) {
			ledger.surveys = value;
			needsMigration = true;
		}
		else if (value && Array.isArray(value.surveys) && Array.isArray(value.consumedModifierIds)) {
			ledger = value;
		}
		else {
			throw new Error('modifierSurveyHistory.json must contain a survey ledger');
		}
	}

	if (ledger.consumedModifierIds.some(modifierId => typeof modifierId !== 'string'))
		throw new Error('modifierSurveyHistory.json consumedModifierIds must contain only modifier IDs');
	ledger.surveys.forEach(survey => {
		if (!survey || typeof survey.id !== 'string' || !Array.isArray(survey.modifierIds) ||
			survey.modifierIds.some(modifierId => typeof modifierId !== 'string')) {
			throw new Error('modifierSurveyHistory.json contains an invalid survey entry');
		}
	});

	const consumedModifierIds = new Set(ledger.consumedModifierIds);
	ledger.surveys.forEach(survey => survey.modifierIds.forEach(modifierId => consumedModifierIds.add(modifierId)));
	if (consumedModifierIds.size !== ledger.consumedModifierIds.length) {
		ledger.consumedModifierIds = [...consumedModifierIds];
		needsMigration = true;
	}

	if (needsMigration)
		saveSurveyLedger(ledger);
	return ledger;
}

function getOpenSurveyModifierIds() {
	const activeSurveyPath = guildData.getFilePath('modifierSurvey.json');
	if (!fs.existsSync(activeSurveyPath))
		return [];
	const activeSurvey = JSON.parse(fs.readFileSync(activeSurveyPath, 'utf8'));
	return activeSurvey.status === 'open' && Array.isArray(activeSurvey.modifierIds)
		? activeSurvey.modifierIds
		: [];
}

function getAvailableModifierIds(allModifierIds) {
	let availableModifierIds = loadArray('surveyableModifierIds.json');
	const surveyLedger = getSurveyLedger();
	const alreadySurveyedIds = new Set([
		...surveyLedger.consumedModifierIds,
		...getOpenSurveyModifierIds(),
	]);

	if (availableModifierIds === undefined) {
		availableModifierIds = allModifierIds.filter(modifierId =>
			!defaultModifierIds.includes(modifierId) && !alreadySurveyedIds.has(modifierId)
		);
	}
	else {
		if (availableModifierIds.some(modifierId => typeof modifierId !== 'string'))
			throw new Error('surveyableModifierIds.json must contain only modifier IDs');

		const knownIds = new Set([...availableModifierIds, ...alreadySurveyedIds]);
		allModifierIds.forEach(modifierId => {
			if (!defaultModifierIds.includes(modifierId) && !knownIds.has(modifierId))
				availableModifierIds.push(modifierId);
		});
		availableModifierIds = availableModifierIds.filter(modifierId => !alreadySurveyedIds.has(modifierId));
	}
	saveArray('surveyableModifierIds.json', availableModifierIds);
	return availableModifierIds;
}

module.exports = {
	GetDefaultModifierIds() {
		return [...defaultModifierIds];
	},

	GetSurveyableModifierIds(allModifierIds) {
		return getAvailableModifierIds(allModifierIds);
	},

	SelectModifiersForSurvey(allModifierIds, count, random = Math.random) {
		const availableModifierIds = getAvailableModifierIds(allModifierIds);
		if (availableModifierIds.length < count)
			throw new Error(`Cannot select ${count} survey modifiers: only ${availableModifierIds.length} remain`);

		const remainingModifierIds = [...availableModifierIds];
		const selectedModifierIds = [];
		for (let index = 0; index < count; index++) {
			const selectedIndex = Math.floor(random() * remainingModifierIds.length);
			if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= remainingModifierIds.length)
				throw new RangeError('Random source must return a value in the range [0, 1)');
			selectedModifierIds.push(remainingModifierIds.splice(selectedIndex, 1)[0]);
		}
		const surveyLedger = getSurveyLedger();
		const consumedModifierIds = new Set(surveyLedger.consumedModifierIds);
		selectedModifierIds.forEach(modifierId => consumedModifierIds.add(modifierId));
		surveyLedger.consumedModifierIds = [...consumedModifierIds];
		saveSurveyLedger(surveyLedger);
		saveArray('surveyableModifierIds.json', remainingModifierIds);
		return selectedModifierIds;
	},

	RecordCompletedSurvey(surveyId, modifierIds) {
		const ledger = getSurveyLedger();
		if (ledger.surveys.some(survey => survey.id === surveyId))
			return;
		ledger.surveys.push({ id: surveyId, modifierIds: [...modifierIds] });
		modifierIds.forEach(modifierId => {
			if (!ledger.consumedModifierIds.includes(modifierId))
				ledger.consumedModifierIds.push(modifierId);
		});
		saveSurveyLedger(ledger);
	},

	GetSurveyHistory() {
		return getSurveyLedger().surveys;
	},

	GetNewFighterModifierIds(allModifierIds, { mode = 'random', choices = [], random = Math.random } = {}) {
		const modifiers = new Set(allModifierIds);
		const modifierIds = this.GetDefaultModifierIds();
		const history = getSurveyLedger().surveys;

		if (mode === 'none') {
			if (choices.length > 0)
				throw new Error('No-modifier mode cannot include survey choices');
			return modifierIds;
		}
		if (mode !== 'random' && mode !== 'choose')
			throw new Error(`Unknown modifier catch-up mode: ${mode}`);
		if (mode === 'choose' && choices.length !== history.length)
			throw new Error(`Expected ${history.length} survey choices, received ${choices.length}`);

		history.forEach((survey, surveyIndex) => {
			if (survey.modifierIds.length === 0)
				throw new Error(`Survey ${survey.id} has no modifier choices`);
			let selectedModifierId;
			if (mode === 'choose') {
				selectedModifierId = choices[surveyIndex];
				if (!survey.modifierIds.includes(selectedModifierId))
					throw new Error(`Modifier ${selectedModifierId} was not an option in survey ${survey.id}`);
			}
			else {
				const selectedIndex = Math.floor(random() * survey.modifierIds.length);
				if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= survey.modifierIds.length)
					throw new RangeError('Random source must return a value in the range [0, 1)');
				selectedModifierId = survey.modifierIds[selectedIndex];
			}
			if (!modifiers.has(selectedModifierId))
				throw new Error(`Survey modifier ${selectedModifierId} is not loaded`);
			modifierIds.push(selectedModifierId);
		});
		return modifierIds;
	},
};
