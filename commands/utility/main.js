const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const schedule = require('node-schedule');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('run')
        .setDescription('Commence les jeux !'),
    async execute(interaction) {
        const alreadyRunning = schedule.scheduledJobs.includes('runningGame');
        if (alreadyRunning) {
            await interaction.reply({ content: 'Game already running', flags: MessageFlags.Ephemeral });
            return;
        }

        const job = schedule.scheduleJob('runningGame', '0 * * * *', async function () {
            const barrack = require('../../source/barracks.js');
            const arena = require('../../source/arena.js');
            const modifierManager = require('../../source/modifierManager.js');

            barrack.LoadAllFighters();
            arena.LoadMap();
            modifierManager.LoadModifiers();

            const fighters = barrack.GetFighters();
            const fightersIds = Object.keys(fighters);
            const nFighters = fighters.length;
            if (nFighters < 2) {
                await interaction.reply({ content: `Not enough fighters (${nFighters})`, flags: MessageFlags.Ephemeral });
                return;
            }

            {
                const currentTime = new Date();
                console.log('[' + currentTime.toLocaleString('fr-FR') + ']: New turn');
            }

            let justStarted = false;
            if (arena.GetState() == "initialisation") {
                justStarted = true;
                interaction.reply({ content: 'Que les jeux commencent !' });
                // give fighters positions
                const spawnPoints = arena.GetSpawnPositions(nFighters);
                for (let i = 0; i < nFighters; i++) {
                    arena.AddObjectsToPosition(fightersIds[i], spawnPoints[i]);
                }
                arena.SetState("battling");
            }

            if (arena.GetState() == "battling") {
                if (justStarted) {
                    interaction.reply({ content: 'Premier tour' });
                }
                else {
                    interaction.reply({ content: 'Nouveau tour' });
                }

                // Gather what info they want
                let info = {};
                fightersIds.forEach(fighterId => {
                    fighters[fighterId].modifierIds.forEach(modId => {
                        modifierManager[modId].GatherWantedInfo(info);
                    });
                });

                // Gather the info wanted
                fightersIds.forEach(fighterId => {
                    fighters[fighterId].modifierIds.forEach(modId => {
                        modifierManager[modId].GatherInfo(barrack, fighterId, arena, info);
                    });
                });

                // Get the commands and instructions
                let commands = {};
                let instructions = {};
                fightersIds.forEach(fighterId => {
                    fighters[fighterId].modifierIds.forEach(modId => {
                        const mod = modifierManager[modId];
                        if (mod.type === "action") {
                            let command = mod.GetCommand(barrack, fighterId, arena, info);
                            console.assert(command.hasOwnProperty(type), `Command does not have a type`);
                            if (command.type === "actionCommand") {
                                if (!commands.hasOwnProperty(fighterId))
                                    commands[fighterId] = [];
                                commands[fighterId].concat(command);
                            } else {
                                console.assert(command.type === "instruction", `Command type \'${command}\' is not supported`);
                                if (!instructions.hasOwnProperty(fighterId))
                                    instructions[fighterId] = [];
                                instructions[fighterId].concat(command);
                            }
                        }
                    });
                });

                // Get the move commands based on the instructions
                const fightersWithInstructions = Object.keys(instructions);
                fightersWithInstructions.forEach(fighterId => {
                    if (!commands.hasOwnProperty(fighterId))
                        commands[fighterId] = [];
                    instructions[fighterId].forEach(instruction => {
                        const totalWeightToShare = instruction.weight;
                        const firstNewInstructionInd = commands[fighterId].length;
                        fighters[fighterId].modifierIds.forEach(modId => {
                            if (modifierManager[modId].type === "move") {
                                let moveCommand = modifierManager[modId].GetCommand(barrack, fighterId, arena, info, instruction);
                                if (moveCommand !== undefined)
                                    commands[fighterId].concat(moveCommand);
                            }
                        });
                        const commandsAdded = commands[fighterId].length - firstNewInstructionInd;
                        if (commandsAdded > 0) {
                            const newCommandWeight = totalWeightToShare / commandsAdded;
                            for (let i = firstNewInstructionInd; i < commands[fighterId].length; i++) {
                                commands[fighterId][i].weight = newCommandWeight;
                            }
                        }
                    });
                });

                // select one command per fighter 
                let pickedCommands = {};
                const fightersWithCommands = Object.keys(commands);
                fightersWithCommands.forEach(fighterId => {
                    let totalWeight = 0;
                    commands[fighterId].forEach(command => {
                        totalWeight += command.weight;
                    });
                    const pickedWeight = Math.random() * totalWeight;
                    totalWeight = 0;
                    const commandInd = commands[fighterId].findIndex(command => {
                        totalWeight += command.weight;
                        return totalWeight >= pickedWeight;
                    });
                    console.assert(commandInd >= 0, 'A command was not found');
                    pickedCommands[fighterId] = commands[fighterId][commandInd];
                });

                // Add the selected commands to the respective fighters stack
                // Do first all action commands

                // Then the move commands


            }

            barrack.SaveFighters();
            arena.SaveMap();
        });
    },
};
