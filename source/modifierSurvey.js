const fs = require('node:fs');
const path = require('node:path');
const {
	ActionRowBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} = require('discord.js');

const surveyPath = path.join(__dirname, '..', 'data', 'modifierSurvey.json');

function loadSurvey() {
	if (!fs.existsSync(surveyPath))
		return undefined;
	return JSON.parse(fs.readFileSync(surveyPath, 'utf8'));
}

function saveSurvey(survey) {
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

		const modifiers = Object.values(modifierManager.GetModifiers());
		// if (modifiers.length < 5)
		// 	throw new Error(`Cannot start modifier survey: ${modifiers.length} modifiers loaded, 5 required`);

		const modifierIds = modifiers.slice(0, 3).map(modifier => modifier.id);
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
		const options = survey.modifierIds.map(modifierId => {
			const modifier = modifierManager.GetModifier(modifierId);
			return new StringSelectMenuOptionBuilder()
				.setLabel(modifier.name)
				.setValue(modifier.id)
				.setDescription(modifier.description.slice(0, 100));
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
			.map(modifierId => `${modifierManager.GetModifier(modifierId).name}: ${voteCounts[modifierId]} vote(s)`)
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

	async CloseSurvey(barracks, modifierManager, channel) {
		const survey = loadSurvey();
		if (!survey || survey.status !== 'open')
			return undefined;

		const fighterHolder = barracks.GetFighterHolder();
		const appliedModifiers = [];
		Object.entries(survey.votes).forEach(([fighterId, modifierId]) => {
			const fighter = fighterHolder.allFighters[fighterId];
			if (!fighter || fighter.baseModifierIds.includes(modifierId))
				return;

			const modifier = modifierManager.GetModifier(modifierId);
			fighter.baseModifierIds.push(modifierId);
			if (modifier.defaultData)
				fighter.baseModifierData[modifierId] = structuredClone(modifier.defaultData);
			appliedModifiers.push({ fighterId, modifierId });
		});
		barracks.SaveFighters();
		survey.status = 'closed';
		saveSurvey(survey);
		if (channel && survey.messageId) {
			const message = await channel.messages.fetch(survey.messageId);
			await message.edit(this.BuildMessage(survey, modifierManager));
		}
		return { survey, appliedModifiers };
	},
};