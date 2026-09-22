const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('fighter-info')
        .setDescription('Donne les info sur ton combattant')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Le nom de ton combattant')
                .setMinLength(3)
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option.setName('in-combat')
                .setDescription('Si tu veux ses informations en direct pendant le combat (default True)')
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const barracks = require(`../../source/barracks.js`);
        const arenaManager = require('../../source/arenaManager.js');
        const userHandler = require(`../../source/userHandler.js`);
        const modifierManager = require(`../../source/modifierManager.js`);
        const { Text } = require('../../source/commandLocalizations.js');

        const fighterName = interaction.options.getString('name');
        const fighter = barracks.GetFighterByName(fighterName);
        if (!fighter) {
            await interaction.editReply({ content: Text(interaction, 'fighter-info', 'fighterNotFound', { fighterName }) });
            return;
        }

        let combatInfo = interaction.options.getBoolean('in-combat') ?? true;

        const arena = arenaManager.GetArena();
        if (combatInfo && !arena) {
            console.error(`No arena loaded`);
        }
        let fighterData;
        if (combatInfo && arena && !arena.fighterData.hasOwnProperty(fighter.id)) {
            console.error(`Arena doesn't have data for ${fighterName}`);
        }
        else {
            fighterData = arena.fighterData[fighter.id];
        }

        const user = userHandler.GetLocalUserByDiscordUser(interaction.user);
        if (!user) {
            await interaction.editReply({ content: Text(interaction, 'fighter-info', 'userNotFound', { userId: interaction.user.id }) });
            return;
        }

        const modifiers = modifierManager.GetModifiers();
        if (!modifiers) {
            await interaction.editReply({ content: Text(interaction, 'fighter-info', 'noModifier') });
            return;
        }


        let modifiersText;
        let modifierIds;
        if (combatInfo && fighterData) {
            modifiersText = Text(interaction, 'fighter-info', 'currentCount', { count: fighterData.modifierIds.length });
            modifierIds = fighterData.modifierIds;
        }
        else {
            modifiersText = Text(interaction, 'fighter-info', 'baseCount', { count: fighter.baseModifierIds.length });
            modifierIds = fighter.baseModifierIds;
        }

        modifierIds.forEach(modId => {
            const mod = modifiers[modId];
            modifiersText = modifiersText.concat(`\n - **${mod.name}** (*${mod.type}*), ${mod.description}.`);
            if ((combatInfo && fighterData && fighterData.modifierData.hasOwnProperty(mod.id) ||
                !combatInfo && fighter.baseModifierData.hasOwnProperty(mod.id))) {

                let dataKeys;
                if (combatInfo && fighterData) {
                    dataKeys = Object.keys(fighterData.modifierData[mod.id]);
                }
                else {
                    dataKeys = Object.keys(fighter.baseModifierData[mod.id]);
                }
                if (dataKeys.length > 0) {
                    modifiersText = modifiersText.concat(` __Data__`);
                    dataKeys.forEach(key => {
                        if (combatInfo && fighterData) {
                            modifiersText = modifiersText.concat(` ${key}: **${fighterData.modifierData[mod.id][key]}**.`);
                        }
                        else {
                            modifiersText = modifiersText.concat(` ${key}: **${fighter.baseModifierData[mod.id][key]}**.`);
                        }
                    });
                }
            }
        });
        let msg = `${fighter.icon}\n${Text(interaction, 'fighter-info', 'name')} : **${fighter.name}**\n${Text(interaction, 'fighter-info', 'player')} : **${user.name}**\n${Text(interaction, 'fighter-info', 'wins')} : **${fighter.wins ?? 0}**\n${Text(interaction, 'fighter-info', 'losses')} : **${fighter.losses ?? 0}**\n${modifiersText}`;
        if (combatInfo && fighterData && fighterData.isOutOfCombat) {
            msg = Text(interaction, 'fighter-info', 'outOfCombat') + '\n' + msg;
        }
        await interaction.editReply({ content: msg });
    },
};
