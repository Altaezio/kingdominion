const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const userHandler = require('../../source/userHandler.js');
const barracks = require('../../source/barracks.js');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Te donne un combattant et te permet de rejoindre l\'amusement')
        .setStringOption(option =>
            option.setName('name')
                .setDescription('Le nom que tu veux donner à ton combattant')
                .setMinLength(3)
                .setRequired(true)
        ),
    async execute(interaction) {
        const user = userHandler.GetLocalUserByAccountId(interaction.user.id);
        const newFighter = barracks.CreateFighter(interaction.options.getString('name'), user.id);
        await interaction.reply({ content: `Tu as un nouveau combattant: ${newFighter.name}` });
    },
};