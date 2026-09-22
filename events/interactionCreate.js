const { Events, MessageFlags } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('modifier-survey:')) {
            await this.executeModifierSurveyVote(interaction);
            return;
        }
        if (!interaction.isChatInputCommand()) return;
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            await interaction.reply({ content: `No command matching ${interaction.commandName} was found.`, flags: MessageFlags.Ephemeral });
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
                await interaction.followUp({ content: `There was an error while executing this command! Error: ${error}, Interaction: ${interaction}`, flags: MessageFlags.Ephemeral });
            }
            else {
                await interaction.editReply({ content: `There was an error while executing this command! Error: ${error}, Interaction: ${interaction}`, flags: MessageFlags.Ephemeral });
            }
        }
    },

    async executeModifierSurveyVote(interaction) {
        const surveyManager = require('../source/modifierSurvey.js');
        const userHandler = require('../source/userHandler.js');
        const barracks = require('../source/barracks.js');
        const modifierManager = require('../source/modifierManager.js');
        const surveyId = interaction.customId.split(':')[1];
        const survey = surveyManager.GetCurrentSurvey();

        if (!survey || survey.id !== surveyId || survey.status !== 'open') {
            await interaction.reply({ content: 'Ce sondage est termine.', flags: MessageFlags.Ephemeral });
            return;
        }
        if (interaction.values.length !== 1) {
            await interaction.reply({ content: 'Tu peux choisir un seul modificateur.', flags: MessageFlags.Ephemeral });
            return;
        }

        const user = userHandler.GetLocalUserByDiscordUser(interaction.user);
        const fighters = barracks.GetFightersForUser(user.id);
        if (fighters.length === 0) {
            await interaction.reply({ content: 'Tu dois avoir un combattant pour voter.', flags: MessageFlags.Ephemeral });
            return;
        }
        if (fighters.length > 1) {
            await interaction.reply({ content: "Le sondage ne supporte actuellement qu'un combattant par joueur.", flags: MessageFlags.Ephemeral });
            return;
        }

        const modifierId = interaction.values[0];
        if (!surveyManager.RegisterVote(surveyId, fighters[0].id, modifierId)) {
            await interaction.reply({ content: "Ton vote n'a pas pu etre enregistre.", flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.reply({
            content: `Vote enregistre pour ${modifierManager.GetModifier(modifierId).name}.`,
            flags: MessageFlags.Ephemeral,
        });
        const updatedSurvey = surveyManager.GetCurrentSurvey();
        await interaction.message.edit(surveyManager.BuildMessage(updatedSurvey, modifierManager));
    },
}
