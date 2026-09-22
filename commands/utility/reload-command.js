const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('reload-command')
        .setDescription('Reloads a command.')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('The command to reload.')
                .setRequired(true)),
    async execute(interaction) {
        const { Text } = require('../../source/commandLocalizations.js');
        const commandName = interaction.options.getString('command', true);
        const command = interaction.client.commands.get(commandName);

        if (!command) {
            return interaction.reply({ content: Text(interaction, 'reload-command', 'notFound', { name: commandName }), flags: MessageFlags.Ephemeral });
        }

        delete require.cache[require.resolve(`../${command.category}/${command.data.name}.js`)];

        try {
            const newCommand = require(`../${command.category}/${command.data.name}.js`);
            interaction.client.commands.set(newCommand.data.name, newCommand);
            await interaction.reply({ content: Text(interaction, 'reload-command', 'reloaded', { name: newCommand.data.name }), flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: Text(interaction, 'reload-command', 'error', { name: command.data.name, error: error.message }), flags: MessageFlags.Ephemeral });
        }
    },
};
