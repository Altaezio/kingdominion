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
        const filePath = interaction.options.getString('file-path', true);

        try {
            const file = require.resolve(`../../${filePath}`);
            delete require.cache[file];
            return interaction.reply({ content: `File at ${filePath} removed from cache`, flags: MessageFlags.Ephemeral });
        } catch {
            return interaction.reply({ content: `There is no such file here \`${filePath}\`!`, flags: MessageFlags.Ephemeral });
        }
    },
};