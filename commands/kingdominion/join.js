const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { maxFightersPerUser } = require('../../settings.json');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Te donne un combattant et te permet de rejoindre l\'amusement')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Le nom que tu veux donner à ton combattant')
                .setMinLength(3)
                .setMaxLength(10)
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('icon')
                .setDescription('Icon représentant ton combattant')
                .setMinLength(1)
                .setMaxLength(1999)
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const { Text } = require('../../source/commandLocalizations.js');
        const userHandler = require(`../../source/userHandler.js`);
        const barracks = require(`../../source/barracks.js`);
        const fighterName = interaction.options.getString('name').trim();
        const iconOption = interaction.options.getString('icon');
        const emotes = iconOption.match(/\p{Extended_Pictographic}/gu);
        if (!emotes || emotes.length <= 0) {
            console.debug('not possible emoji :', emotes, 'from :', iconOption);
            await interaction.editReply({ content: Text(interaction, 'join', 'invalidIcon', { icon: iconOption }) });
            return;
        }
        const icon = emotes[0];

        if (barracks.NameIsTaken(fighterName)) {
            await interaction.editReply({ content: Text(interaction, 'join', 'nameTaken') });
            return;
        }
        const user = userHandler.GetLocalUserByDiscordUser(interaction.user);
        if (user.id !== 0 && barracks.GetFightersForUser(user.id).length >= maxFightersPerUser) {
            await interaction.editReply({ content: Text(interaction, 'join', 'limit', { limit: maxFightersPerUser }) });
            return;
        }
        const newFighter = barracks.CreateFighter(fighterName, icon, user.id);
        await interaction.editReply({ content: Text(interaction, 'join', 'created', { icon: newFighter.icon, name: newFighter.name }) });
    },
};