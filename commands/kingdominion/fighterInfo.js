const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const userHandler = require('../../source/userHandler.js');
const barracks = require('../../source/barracks.js');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('fighter-info')
        .setDescription('Gives info on the given fighter')
        .setStringOption(option =>
            option.setName('name')
                .setDescription('The name for you fighter')
                .setMinLength(3)
                .setRequired(true)
        ),
    async execute(interaction) {
        const fighter = barracks.GetFighterByName(interaction.options.getString('name'));
        const user = userHandler.GetLocalUserByAccountId(interaction.user.id);
        await interaction.reply({ content: `Name : ${fighter.name}\nOwner : ${user.name}` });
    },
};