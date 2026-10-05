const schedule = require('node-schedule');
const guildData = require('./guildData.js');
const discordGameAdapter = require('./discordGameAdapter.js');

async function startModifierSurvey(client, surveyChannelId) {
	const surveyManager = require('./modifierSurvey.js');
	const modifierManager = require('./modifierManager.js');
	const channel = client.channels.cache.get(surveyChannelId);
	if (!channel)
		return;

	modifierManager.LoadModifiers();
	try {
		await surveyManager.StartSurvey(channel, modifierManager);
	}
	catch (error) {
		console.error(error.message);
	}
}

async function closeModifierSurvey(client) {
	const surveyManager = require('./modifierSurvey.js');
	const barracks = require('./barracks.js');
	const modifierManager = require('./modifierManager.js');
	const { surveyChannelId } = guildData.getSettings();
	const survey = surveyManager.GetCurrentSurvey();
	if (!survey || survey.status !== 'open')
		return;

	barracks.LoadAllFighters();
	modifierManager.LoadModifiers();
	const channel = client.channels.cache.get(survey.channelId) ?? client.channels.cache.get(surveyChannelId);
	const result = await surveyManager.CloseSurvey(barracks, modifierManager, channel);
	if (!result)
		return;

	console.log(`Modifier survey closed: ${result.appliedModifiers.length} modifiers applied`);
}

module.exports = {
	ScheduleGuildGame(client, guildId, settings, defaultChannelId) {
		const combatChannel = client.channels.cache.get(settings.detailedLogsChannelId ?? defaultChannelId);
		const surveyChannelId = settings.surveyChannelId ?? defaultChannelId;

		schedule.scheduleJob(`runningGame:${guildId}`, '0 8 * * 1-5', async () => {
			await guildData.run(guildId, () => discordGameAdapter.RunCombat(combatChannel));
		});

		schedule.scheduleJob(`startModifierSurvey:${guildId}`, '0 10 * * 6', async () => {
			await guildData.run(guildId, () => startModifierSurvey(client, surveyChannelId));
		});

		schedule.scheduleJob(`closeModifierSurvey:${guildId}`, '0 20 * * 0', async () => {
			await guildData.run(guildId, () => closeModifierSurvey(client));
		});
	},
};
