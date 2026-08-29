const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const schedule = require('node-schedule');

module.exports = {
    category: 'kingdominion',
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Arrête complêtement le combat en cours')
        .addBooleanOption(option =>
            option.setName('stop-all')
                .setDescription('Option pour arrêter le jeu entier (default False)')
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const stopAll = interaction.options.getBoolean('stop-all') ?? false;

        const arenaManager = require('../../source/arenaManager.js');
        const arena = arenaManager.GetArena();

        if (!stopAll) {
            arenaManager.SetState('finished'); // 'stopped' instead ?
            await interaction.editReply({ content: "Combat arrêté" });
        }
        else {
            const canceled = schedule.cancelJob('runningGame');
            if (!canceled){
                console.error('[' + currentTime.toLocaleString('fr-FR') + `]: Game not stopped`);
                await interaction.editReply({ content: "Echec de l'arrêt du jeu" });
            }
            else{
                await interaction.editReply({ content: "Jeu arrêté" });
            }
        }
        arenaManager.SaveArena('currentArena');
    },
};