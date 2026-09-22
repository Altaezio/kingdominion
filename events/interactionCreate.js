const { Events, MessageFlags } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        const { Text } = require('../source/commandLocalizations.js');
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('modifier-survey:')) {
            await this.executeModifierSurveyVote(interaction);
            return;
        }
        if (!interaction.isChatInputCommand()) return;
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            await interaction.reply({ content: Text(interaction, 'interaction', 'commandNotFound', { name: interaction.commandName }), flags: MessageFlags.Ephemeral });
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            if (!interaction.deferred && !interaction.replied) {
                try {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                }
                catch (error) {
                    console.error(`Interaction: `, interaction);
                }
            }
            console.error(`Error: `, error);
            console.error(`Interaction: `, interaction);
            if (interaction.replied) {
                await interaction.followUp({ content: Text(interaction, 'interaction', 'error', { error }), flags: MessageFlags.Ephemeral });
            }
            else {
                await interaction.editReply({ content: Text(interaction, 'interaction', 'error', { error }), flags: MessageFlags.Ephemeral });
            }
        }
    },

    async executeModifierSurveyVote(interaction) {
        const surveyManager = require('../source/modifierSurvey.js');
        const userHandler = require('../source/userHandler.js');
        const barracks = require('../source/barracks.js');
        const modifierManager = require('../source/modifierManager.js');
        const { Text } = require('../source/commandLocalizations.js');
        const surveyId = interaction.customId.split(':')[1];
        const survey = surveyManager.GetCurrentSurvey();

        if (!survey || survey.id !== surveyId || survey.status !== 'open') {
            await interaction.reply({ content: Text(interaction, 'survey-vote', 'closed'), flags: MessageFlags.Ephemeral });
            return;
        }
        if (interaction.values.length !== 1) {
            await interaction.reply({ content: Text(interaction, 'survey-vote', 'single'), flags: MessageFlags.Ephemeral });
            return;
        }

        const user = userHandler.GetLocalUserByDiscordUser(interaction.user);
        const fighters = barracks.GetFightersForUser(user.id);
        if (fighters.length === 0) {
            await interaction.reply({ content: Text(interaction, 'survey-vote', 'noFighter'), flags: MessageFlags.Ephemeral });
            return;
        }
        if (fighters.length > 1) {
            await interaction.reply({ content: Text(interaction, 'survey-vote', 'multipleFighters'), flags: MessageFlags.Ephemeral });
            return;
        }

        const modifierId = interaction.values[0];
        if (!surveyManager.RegisterVote(surveyId, fighters[0].id, modifierId)) {
            await interaction.reply({ content: Text(interaction, 'survey-vote', 'voteFailed'), flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.reply({
            content: Text(interaction, 'survey-vote', 'voteRecorded', { name: modifierManager.GetModifier(modifierId).name }),
            flags: MessageFlags.Ephemeral,
        });
        const updatedSurvey = surveyManager.GetCurrentSurvey();
        await interaction.message.edit(surveyManager.BuildMessage(updatedSurvey, modifierManager));
    },
}
