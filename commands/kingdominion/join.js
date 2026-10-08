const {
    MessageFlags,
    SlashCommandBuilder,
} = require('discord.js');
const joinModifierChoices = require('../../source/joinModifierChoices.js');

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
        const { Text } = require('../../source/commandLocalizations.js');
        const userHandler = require(`../../source/userHandler.js`);
        const barracks = require(`../../source/barracks.js`);
        const modifierManager = require('../../source/modifierManager.js');
        const modifierPool = require('../../source/modifierPool.js');
        const guildData = require('../../source/guildData.js');
        const { maxFightersPerUser } = guildData.getSettings();
        const fighterName = interaction.options.getString('name').trim();
        const iconOption = interaction.options.getString('icon');
        const emotes = iconOption.match(/\p{Extended_Pictographic}/gu);
        if (!emotes || emotes.length <= 0) {
            console.debug('not possible emoji :', emotes, 'from :', iconOption);
            await interaction.reply({ content: Text(interaction, 'join', 'invalidIcon', { icon: iconOption }), flags: MessageFlags.Ephemeral });
            return;
        }
        const icon = emotes[0];

        if (barracks.NameIsTaken(fighterName)) {
            await interaction.reply({ content: Text(interaction, 'join', 'nameTaken'), flags: MessageFlags.Ephemeral });
            return;
        }
        const user = userHandler.GetLocalUserByDiscordUser(interaction.user);
        if (user.id !== 0 && barracks.GetFightersForUser(user.id).length >= maxFightersPerUser) {
            await interaction.reply({ content: Text(interaction, 'join', 'limit', { limit: maxFightersPerUser }), flags: MessageFlags.Ephemeral });
            return;
        }

        modifierManager.LoadModifiers();
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const surveyHistory = modifierPool.GetSurveyHistory();
        let modifierMode = 'none';
        let modifierChoices = [];
        if (surveyHistory.length > 0) {
            const catchUpSelection = await joinModifierChoices.ChooseMissedSurveyModifiers(
                interaction,
                surveyHistory,
                modifierManager
            );
            if (!catchUpSelection)
                return;
            modifierMode = catchUpSelection.mode;
            modifierChoices = catchUpSelection.choices;
        }

        if (barracks.NameIsTaken(fighterName)) {
            await interaction.editReply({ content: Text(interaction, 'join', 'nameTaken') });
            return;
        }
        const latestMaxFightersPerUser = guildData.getSettings().maxFightersPerUser;
        if (user.id !== 0 && barracks.GetFightersForUser(user.id).length >= latestMaxFightersPerUser) {
            await interaction.editReply({
                content: Text(interaction, 'join', 'limit', { limit: latestMaxFightersPerUser }),
            });
            return;
        }

        const newFighter = barracks.CreateFighter(fighterName, icon, user.id, {
            modifierMode,
            modifierChoices,
        });
        await interaction.followUp({ content: Text(interaction, 'join', 'created', { icon: newFighter.icon, name: newFighter.name }) });
    },
};