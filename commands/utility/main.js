const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const schedule = require('node-schedule');
const fs = require('node:fs');
const { channelId } = require('../../settings.json');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('run')
        .setDescription('Commence les jeux !'),
    async execute(interaction) {
        const alreadyRunning = schedule.scheduledJobs.hasOwnProperty('runningGame');
        if (alreadyRunning) {
            await interaction.reply({ content: 'Game already running', flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.reply({ content: 'Scheduling game', flags: MessageFlags.Ephemeral });
        const job = schedule.scheduleJob('runningGame', '*/10 * * * * *', async function () {
            const channel = interaction.client.channels.cache.get(channelId);

            const barrack = require('../../source/barracks.js');
            const arena = require('../../source/arena.js');
            const modifierManager = require('../../source/modifierManager.js');

            try {
                {
                    const currentTime = new Date();
                    console.log('[' + currentTime.toLocaleString('fr-FR') + ']: Load data');
                }
                barrack.LoadAllFighters();
                arena.LoadMap("currentMap");
                modifierManager.LoadModifiers();

                const fighterHolder = barrack.GetFighterHolder();
                const fightersIds = Object.keys(fighterHolder.allFighters);
                const nFighters = fightersIds.length;
                if (nFighters < 2) {
                    console.log(`Not enough fighters (${nFighters})`);
                    channel.send({ content: `Not enough fighters (${nFighters})`, flags: MessageFlags.Ephemeral });
                    return;
                }

                {
                    const currentTime = new Date();
                    console.log('[' + currentTime.toLocaleString('fr-FR') + ']: New turn');
                }

                let justStarted = false;
                if (arena.GetState() == "initialisation") {
                    justStarted = true;
                    await channel.send({ content: 'Que les jeux commencent !' })
                        .then((message) => {
                            const interactionData = JSON.parse(fs.readFileSync(`./data/interactionData.json`, 'utf8'));
                            interactionData.runCommandMessageId = message.id.toString();
                            const data = JSON.stringify(interactionData, null, 4);
                            fs.writeFileSync('./data/interactionData.json', data);
                        });

                    // give fighters positions
                    const spawnPoints = arena.GetSpawnPositions(nFighters);
                    for (let i = 0; i < nFighters; i++) {
                        arena.AddObjectsToPosition(fightersIds[i], spawnPoints[i]);
                    }
                    channel.send({ content: `Départ :\n${arena.GetMapVisualisation()}` });
                    arena.SetState("battling");
                }

                const fighterPositions = {};
                fightersIds.forEach((id) => {
                    const position = arena.GetObjectPosition(id);
                    fighterPositions[id] = position;
                })
                const fightersOnMapIds = Object.keys(fighterPositions);
                // console.debug('fighters on map', fightersOnMapIds);

                if (arena.GetState() == "battling") {
                    if (justStarted) {
                        await channel.send({ content: 'Premier tour' });
                    }
                    else {
                        await channel.send({ content: 'Nouveau tour' });
                    }

                    // Gather what info they want
                    console.log('Gather wanted info');
                    let info = {};
                    fightersOnMapIds.forEach(fighterId => {
                        info[fighterId] = {};
                        fighterHolder.allFighters[fighterId].modifierIds.forEach(modId => {
                            modifierManager.GetModifier(modId).GatherWantedInfo(info[fighterId]);
                        });
                    });
                    console.debug('Wanted info:', info);

                    // Gather the info wanted
                    console.log('Gather actual info');
                    fightersOnMapIds.forEach(fighterId => {
                        fighterHolder.allFighters[fighterId].modifierIds.forEach(modId => {
                            modifierManager.GetModifier(modId).GatherInfo(barrack, fighterId, arena, info[fighterId]);
                        });
                    });
                    console.debug('Gathered info:', info);
                    console.debug('First info :', info[0]);

                    // Get the commands and instructions
                    console.log('Get the commands and instructions');
                    let commands = {};
                    let instructions = {};
                    fightersOnMapIds.forEach(fighterId => {
                        fighterHolder.allFighters[fighterId].modifierIds.forEach(modId => {
                            const mod = modifierManager.GetModifier(modId);
                            if (mod.type === "action") {
                                let command = mod.GetCommand(barrack, fighterId, arena, info[fighterId]);
                                console.assert(command.hasOwnProperty("type"), `Command does not have a type`);
                                if (command.type === "actionCommand") {
                                    if (!commands.hasOwnProperty(fighterId))
                                        commands[fighterId] = [];
                                    commands[fighterId] = commands[fighterId].concat(command);
                                } else {
                                    console.assert(command.type === "instruction", `Command type \'${command}\' is not supported`);
                                    if (!instructions.hasOwnProperty(fighterId))
                                        instructions[fighterId] = [];
                                    instructions[fighterId] = instructions[fighterId].concat(command);
                                }
                            }
                        });
                    });
                    console.debug('Commands after adding actions :', commands);
                    console.debug('Instructions :', instructions);
                    console.debug('First Instructions :', instructions[0]);

                    // Get the move commands based on the instructions
                    console.log('Get move commands');
                    const fightersWithInstructions = Object.keys(instructions);
                    fightersWithInstructions.forEach(fighterId => {
                        if (!commands.hasOwnProperty(fighterId))
                            commands[fighterId] = [];
                        instructions[fighterId].forEach(instruction => {
                            const totalWeightToShare = instruction.weight;
                            const firstNewInstructionInd = commands[fighterId].length;
                            fighterHolder.allFighters[fighterId].modifierIds.forEach(modId => {
                                if (modifierManager.GetModifier(modId).type === "move") {
                                    let moveCommand = modifierManager.GetModifier(modId).GetCommand(barrack, fighterId, arena, info[fighterId], instruction);
                                    if (moveCommand !== undefined)
                                        commands[fighterId] = commands[fighterId].concat(moveCommand);
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
                    console.debug('Commands after adding moves :', commands);

                    // select one command per fighter 
                    console.log('Select commands for fighters')
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
                    console.debug('Picked commands :', pickedCommands);

                    // Add the selected commands to the respective fighters stack
                    // Do first all action commands
                    // console.log('Do actions commands');

                    // Then the move commands
                    // console.log('Do move commands');

                    // End state visualisation
                    await channel.send({ content: `Après actions :\n${arena.GetMapVisualisation()}` });
                }

                barrack.SaveFighters();
                arena.SaveMap('currentMap');
            }
            catch (error) {
                console.log('Error : ', error);
                const interactionData = JSON.parse(fs.readFileSync(`./data/interactionData.json`, 'utf8'));
                const runCommandMessage = channel.messages.fetch(interactionData.runCommandMessageId);
                if (typeof (runCommandMessage) === 'Message') {
                    runCommandMessage.reply({ content: `Error while running game : ${error}`, flags: MessageFlags.Ephemeral });
                    if (arena.GetState() == "initialisation") {
                        job.cancel();
                        runCommandMessage.reply({ content: "Stop job due to an error in initialisation", flags: MessageFlags.Ephemeral });
                    }
                }
                else {
                    await channel.send(`Error while running game : ${error}`);
                    if (arena.GetState() == "initialisation") {
                        job.cancel();
                        await channel.send("Stop job due to an error in initialisation");
                    }
                }
            }
        });
    }
};
