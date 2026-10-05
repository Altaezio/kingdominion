const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} = require('discord.js');
const modifierLocalizations = require('./modifierLocalizations.js');
const { Text } = require('./commandLocalizations.js');

const collectionTimeout = 14 * 60 * 1000;

async function awaitComponent(interaction, message, customId, deadline, matchPrefix = false) {
	const remainingTime = deadline - Date.now();
	if (remainingTime <= 0)
		return undefined;

	try {
		return await message.awaitMessageComponent({
			filter: component => component.user.id === interaction.user.id &&
				(matchPrefix ? component.customId.startsWith(customId) : component.customId === customId),
			time: remainingTime,
			errors: ['time'],
		});
	}
	catch (error) {
		if (error.code !== 'InteractionCollectorError')
			throw error;
		return undefined;
	}
}

async function chooseMissedSurveyModifiers(interaction, surveyHistory, modifierManager, deadline) {
	const choices = [];
	const locale = interaction.locale;

	for (let surveyIndex = 0; surveyIndex < surveyHistory.length; surveyIndex++) {
		const survey = surveyHistory[surveyIndex];
		const customId = `join-survey-choice:${interaction.id}:${surveyIndex}`;
		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId(customId)
			.setPlaceholder(Text(interaction, 'join', 'surveyChoicePlaceholder', {
				surveyNumber: surveyIndex + 1,
			}))
			.setMinValues(1)
			.setMaxValues(1)
			.addOptions(survey.modifierIds.map(modifierId => {
				const modifier = modifierManager.GetModifier(modifierId);
				if (!modifier)
					throw new Error(`Survey modifier ${modifierId} is not loaded`);
				return new StringSelectMenuOptionBuilder()
					.setLabel(modifierLocalizations.GetName(modifierId, locale))
					.setValue(modifierId)
					.setDescription(modifierLocalizations.GetDescription(modifierId, locale).slice(0, 100));
			}));
		const message = await interaction.editReply({
			content: Text(interaction, 'join', 'surveyChoicePrompt', {
				surveyNumber: surveyIndex + 1,
				surveyCount: surveyHistory.length,
			}),
			components: [new ActionRowBuilder().addComponents(selectMenu)],
		});

		const componentInteraction = await awaitComponent(interaction, message, customId, deadline);
		if (!componentInteraction) {
			await interaction.editReply({
				content: Text(interaction, 'join', 'choiceTimedOut'),
				components: [],
			});
			return undefined;
		}

		choices.push(componentInteraction.values[0]);
		await componentInteraction.deferUpdate();
	}

	return choices;
}

module.exports = {
	async ChooseMissedSurveyModifiers(interaction, surveyHistory, modifierManager) {
		const deadline = Date.now() + collectionTimeout;
		const customId = `join-modifier-mode:${interaction.id}`;
		const buttons = [
			['none', ButtonStyle.Secondary],
			['random', ButtonStyle.Primary],
			['choose', ButtonStyle.Success],
		].map(([mode, style]) => new ButtonBuilder()
			.setCustomId(`${customId}:${mode}`)
			.setLabel(Text(interaction, 'join', `mode${mode[0].toUpperCase()}${mode.slice(1)}`))
			.setStyle(style));
		const message = await interaction.editReply({
			content: Text(interaction, 'join', 'modifierModePrompt'),
			components: [new ActionRowBuilder().addComponents(buttons)],
		});
		const modeInteraction = await awaitComponent(interaction, message, `${customId}:`, deadline, true);
		if (!modeInteraction) {
			await interaction.editReply({
				content: Text(interaction, 'join', 'choiceTimedOut'),
				components: [],
			});
			return undefined;
		}
		const mode = modeInteraction.customId.slice(customId.length + 1);
		if (!['none', 'random', 'choose'].includes(mode))
			throw new Error(`Unknown modifier catch-up mode: ${mode}`);
		await modeInteraction.deferUpdate();

		const choices = mode === 'choose'
			? await chooseMissedSurveyModifiers(interaction, surveyHistory, modifierManager, deadline)
			: [];
		if (!choices)
			return undefined;
		return { mode, choices };
	},
};
