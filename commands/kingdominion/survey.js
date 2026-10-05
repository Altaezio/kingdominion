const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('survey')
        .setDescription('Crée ou ferme le sondage des modificateurs'),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const surveyManager = require('../../source/modifierSurvey.js');
        const barracks = require('../../source/barracks.js');
        const modifierManager = require('../../source/modifierManager.js');
        const { surveyChannelId } = require('../../source/guildData.js').getSettings();
        const { Text } = require('../../source/commandLocalizations.js');
        const survey = surveyManager.GetCurrentSurvey();

        try {
            modifierManager.LoadModifiers();
            if (!survey || survey.status !== 'open') {
                const channel = interaction.client.channels.cache.get(surveyChannelId ?? interaction.channelId);
                if (!channel) {
                    await interaction.editReply({ content: Text(interaction, 'survey', 'channelNotFound') });
                    return;
                }

                await surveyManager.StartSurvey(channel, modifierManager);
                await interaction.editReply({ content: Text(interaction, 'survey', 'started') });
            }
            else {
                barracks.LoadAllFighters();
                const channel = interaction.client.channels.cache.get(survey.channelId)
                    ?? interaction.client.channels.cache.get(surveyChannelId);
                const result = await surveyManager.CloseSurvey(barracks, modifierManager, channel);
                await interaction.editReply({ content: Text(interaction, 'survey', 'closed', { count: result.appliedModifiers.length }) });
            }
        }
        catch (error) {
            console.error(error);
            await interaction.editReply({ content: error.message });
        }
    },
};