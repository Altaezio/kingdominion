const fs = require('node:fs');
const guildData = require('./guildData.js');
const modifierPool = require('./modifierPool.js');
const modifierLocalizations = require('./modifierLocalizations.js');
const {
	ActionRowBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} = require('discord.js');

function loadSurvey() {
	const surveyPath = guildData.getFilePath('modifierSurvey.json');
	if (!fs.existsSync(surveyPath))
		return undefined;
	return JSON.parse(fs.readFileSync(surveyPath, 'utf8'));
}

function saveSurvey(survey) {
	const surveyPath = guildData.getFilePath('modifierSurvey.json');
	fs.writeFileSync(surveyPath, JSON.stringify(survey, null, 4));
}

function getVoteCounts(survey) {
	const voteCounts = Object.fromEntries(survey.modifierIds.map(modifierId => [modifierId, 0]));
	Object.values(survey.votes).forEach(modifierId => {
		if (voteCounts.hasOwnProperty(modifierId))
			voteCounts[modifierId]++;
	});
	return voteCounts;
}

module.exports = {
	GetCurrentSurvey() {
		return loadSurvey();
	},

	CreateSurvey(modifierIds) {
		const survey = {
			id: String(Date.now()),
			modifierIds: modifierIds,
			votes: {},
			status: 'open',
			messageId: undefined,
			channelId: undefined,
		};
		saveSurvey(survey);
		return survey;
	},

	async StartSurvey(channel, modifierManager) {
		const existingSurvey = loadSurvey();
		if (existingSurvey?.status === 'open')
			return undefined;

		const modifierIds = modifierManager.SelectModifiersForSurvey(5).map(modifier => modifier.id);
		const survey = this.CreateSurvey(modifierIds);
		const message = await channel.send(this.BuildMessage(survey, modifierManager));
		this.SetMessageLocation(survey.id, channel.id, message.id);
		return survey;
	},

	SetMessageLocation(surveyId, channelId, messageId) {
		const survey = loadSurvey();
		if (!survey || survey.id !== surveyId)
			throw new Error('Survey not found');
		survey.channelId = channelId;
		survey.messageId = messageId;
		saveSurvey(survey);
	},

	BuildMessage(survey, modifierManager) {
		const locale = guildData.getSettings().locale;
		const options = survey.modifierIds.map(modifierId => {
			const modifier = modifierManager.GetModifier(modifierId);
			return new StringSelectMenuOptionBuilder()
				.setLabel(modifierLocalizations.GetName(modifier.id, locale))
				.setValue(modifier.id)
				.setDescription(modifierLocalizations.GetDescription(modifier.id, locale).slice(0, 100));
		});
		const menu = new StringSelectMenuBuilder()
			.setCustomId(`modifier-survey:${survey.id}`)
			.setPlaceholder('Choisis un modificateur pour ton combattant')
			.setMinValues(1)
			.setMaxValues(1)
			.setDisabled(survey.status !== 'open')
			.addOptions(options);
		const voteCounts = getVoteCounts(survey);
		const description = survey.modifierIds
			.map(modifierId => `${modifierLocalizations.GetName(modifierId, locale)}: ${voteCounts[modifierId]} vote(s)`)
			.join('\n');
		return {
			content: survey.status === 'open'
				? `Vote pour le modificateur de ton combattant avant dimanche.\n\n${description}`
				: `Sondage terminé.\n\n${description}`,
			components: [new ActionRowBuilder().addComponents(menu)],
		};
	},

	RegisterVote(surveyId, fighterId, modifierId) {
		const survey = loadSurvey();
		if (!survey || survey.id !== surveyId || survey.status !== 'open')
			return false;
		if (!survey.modifierIds.includes(modifierId))
			return false;
		survey.votes[String(fighterId)] = modifierId;
		saveSurvey(survey);
		return true;
	},

	async CloseSurvey(barracks, modifierManager, channel, { random = Math.random } = {}) {
		const survey = loadSurvey();
		if (!survey || survey.status !== 'open')
			return undefined;

		const fighterHolder = barracks.GetFighterHolder();
		survey.autoAssignments ??= {};
		Object.values(fighterHolder.allFighters).forEach(fighter => {
			if (survey.votes[fighter.id] !== undefined || survey.autoAssignments[fighter.id] !== undefined)
				return;

			const eligibleModifiers = survey.modifierIds.filter(modifierId =>
				!fighter.baseModifierIds.includes(modifierId)
			);
			if (eligibleModifiers.length === 0)
				return;
			const selectedIndex = Math.floor(random() * eligibleModifiers.length);
			if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= eligibleModifiers.length)
				throw new RangeError('Random source must return a value in the range [0, 1)');
			survey.autoAssignments[String(fighter.id)] = eligibleModifiers[selectedIndex];
		});
		saveSurvey(survey);

		const appliedModifiers = [];
		const fighterModifierAssignments = {
			...survey.votes,
			...survey.autoAssignments,
		};
		Object.entries(fighterModifierAssignments).forEach(([fighterId, modifierId]) => {
			const fighter = fighterHolder.allFighters[fighterId];
			if (!fighter || fighter.baseModifierIds.includes(modifierId))
				return;

			const modifier = modifierManager.GetModifier(modifierId);
			if (!modifier)
				throw new Error(`Survey modifier ${modifierId} is not loaded`);
			fighter.baseModifierIds.push(modifierId);
			if (modifier.defaultData)
				fighter.baseModifierData[modifierId] = structuredClone(modifier.defaultData);
			appliedModifiers.push({ fighterId, modifierId });
		});
		barracks.SaveFighters();
		modifierPool.RecordCompletedSurvey(survey.id, survey.modifierIds);
		survey.status = 'closed';
		saveSurvey(survey);
		if (channel && survey.messageId) {
			const message = await channel.messages.fetch(survey.messageId);
			await message.edit(this.BuildMessage(survey, modifierManager));
		}
		return { survey, appliedModifiers };
	},
};