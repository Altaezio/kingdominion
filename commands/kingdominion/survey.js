const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { surveyChannelId } = require('../../settings.json');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('survey')
        .setDescription('Créé ou Ferme le sondage des modificateurs'),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const surveyManager = require('../../source/modifierSurvey.js');
        const barracks = require('../../source/barracks.js');
        const modifierManager = require('../../source/modifierManager.js');
        const survey = surveyManager.GetCurrentSurvey();

        try {
            modifierManager.LoadModifiers();
            if (!survey || survey.status !== 'open') {
                const channel = interaction.client.channels.cache.get(surveyChannelId);
                if (!channel) {
                    await interaction.editReply({ content: 'Le canal du sondage est introuvable.' });
                    return;
                }

                await surveyManager.StartSurvey(channel, modifierManager);
                await interaction.editReply({ content: 'Le sondage a ete lance.' });
            }
            else {
                barracks.LoadAllFighters();
                const channel = interaction.client.channels.cache.get(survey.channelId)
                    ?? interaction.client.channels.cache.get(surveyChannelId);
                const result = await surveyManager.CloseSurvey(barracks, modifierManager, channel);
                await interaction.editReply({ content: `Le sondage est ferme. ${result.appliedModifiers.length} modificateur(s) ajoute(s).` });
            }
        }
        catch (error) {
            console.error(error);
            await interaction.editReply({ content: error.message });
        }
    },
};