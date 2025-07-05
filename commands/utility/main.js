const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const schedule = require('node-schedule');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('run')
        .setDescription('Starts the game'),
    async execute(interaction) {
        const alreadyRunning = false;
        if (alreadyRunning) {
            await interaction.reply({ content: 'Game already running', flags: MessageFlags.Ephemeral });
            return;
        }

        const job = schedule.scheduleJob('0 * * * *', async function () { // add a name so it can be searched if already running to avoid re-running the command
            const barrack = require('../../source/barracks.js');
            const arena = require('../../source/arena.js');

            const nFighters = barrack.GetFighters().length;
            if (nFighters < 2) {
                await interaction.reply({ content: `Not enough fighters (${nFighters})`, flags: MessageFlags.Ephemeral });
                return;
            }

            interaction.reply({ content: 'Do the battle' });

            if (arena.GetState() == "initialisation") {
                // give fighters positions
                arena.SetState("battling");
            }

            if (arena.GetState() == "battling") {
                // go through fighters to get their wanted info (??)

                // give the wanted infos to the fighters and get the commands

                // select one command per fighter and apply them
            }
        });
    },
};
