const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('reload-file')
        .setDescription('Reloads a file.')
        .addStringOption(option =>
            option.setName('file-path')
                .setDescription('The path to the file to reload.')
                .setRequired(true)),
    async execute(interaction) {
        const { Text } = require('../../source/commandLocalizations.js');
        const filePath = interaction.options.getString('file-path', true);

        try {
            const file = require.resolve(`../../${filePath}`);
            delete require.cache[file];
            return interaction.reply({ content: Text(interaction, 'reload-file', 'removed', { path: filePath }), flags: MessageFlags.Ephemeral });
        } catch {
            return interaction.reply({ content: Text(interaction, 'reload-file', 'notFound', { path: filePath }), flags: MessageFlags.Ephemeral });
        }
    },
};