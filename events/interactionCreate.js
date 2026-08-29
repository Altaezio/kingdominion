const { Events, MessageFlags } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
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
}
