const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const userHandler = require('../../source/userHandler.js');
const barracks = require('../../source/barracks.js');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Gives you a fighter and allows you to join the fun')
        .setStringOption(option =>
            option.setName('name')
                .setDescription('The name for you fighter')
                .setMinLength(3)
                .setRequired(true)
        ),
    async execute(interaction) {
        const user = userHandler.GetLocalUserByAccountId(interaction.user.id);
        const newFighter = barracks.CreateFighter(interaction.options.getString('name'), user.id);
        await interaction.reply({ content: `You got a new fighter: ${newFighter.name}` });
    },
};