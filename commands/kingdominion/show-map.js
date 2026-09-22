const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('show-map')
        .setDescription('Affiche la carte actuelle'),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const { Text } = require('../../source/commandLocalizations.js');
        const arena = require(`../../source/arenaManager.js`);
        let msg = `${Text(interaction, 'show-map', 'title')}\n${arena.GetMapVisualisation()}`;
        await interaction.editReply({ content: msg });
    },
};
