const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('show-map')
        .setDescription('Affiche la carte actuelle'),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const arena = require(`../../source/arenaManager.js`);
        let msg = `Carte du combat:\n${arena.GetMapVisualisation()}`;
        await interaction.editReply({ content: msg });
    },
};
