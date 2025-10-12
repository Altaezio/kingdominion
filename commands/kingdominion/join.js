const { SlashCommandBuilder, MessageFlags } = require('discord.js');

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
        await interaction.deferReply();
        const userHandler = require(`../../source/userHandler.js`);
        const barracks = require(`../../source/barracks.js`);
        const fighterName = interaction.options.getString('name').trim();
        const iconOption = interaction.options.getString('icon');
        const emotes = iconOption.match(/\p{Extended_Pictographic}/gu);
        if (!emotes || emotes.length <= 0) {
            console.debug("not possible emoji :", emotes, "from :", iconOption);
            await interaction.editReply({ content: `Tu dois mettre un emoji comme icon : ${iconOption} n'est pas possible`, flags: MessageFlags.Ephemeral });
            return;
        }
        const icon = emotes[0];

        if (barracks.NameIsTaken(fighterName)) {
            await interaction.editReply({ content: `Nom déjà utilisé, essaye encore`, flags: MessageFlags.Ephemeral });
            return;
        }
        const user = userHandler.GetLocalUserByAccountId(interaction.user.id);
        const newFighter = barracks.CreateFighter(fighterName, icon, user.id);
        await interaction.editReply({ content: `Tu as un nouveau combattant: ${newFighter.icon} ${newFighter.name}` });
    },
};