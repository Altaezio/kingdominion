const guildData = require('./guildData.js');
const { sleep, ShuffleInPlace } = require('../utils.js');
const { GetLogDescriptor } = require('./logTexts.js');

function logText(key, values = {}) {
    return GetLogDescriptor(key, values);
}

module.exports = {
    async RunCombat(output, seed, {
        persistFighterStats = true,
        turnDelaySeconds = 30,
        actionDelaySeconds = 30,
    } = {}) {
        for (const [name, delay] of Object.entries({ turnDelaySeconds, actionDelaySeconds })) {
            if (!Number.isFinite(delay) || delay < 0)
                throw new RangeError(`${name} must be a non-negative number`);
        }

        const barrack = require('./barracks.js');
        const arenaManager = require('./arenaManager.js');
        const modifierManager = require('./modifierManager.js');
        const { maxFightersPerUser } = guildData.getSettings();

        const currentTime = new Date();
        {
            console.log('[' + currentTime.toLocaleString('fr-FR') + ']: Load data');
        }
        barrack.LoadAllFighters();
        arenaManager.LoadArena('currentArena');
        modifierManager.LoadModifiers();

        let arena = arenaManager.GetArena();
        if (arena.paused) {
            await output.log(logText('paused'), { useConsole: true, ephemeral: true });
            return;
        }

        const fighterHolder = barrack.GetFighterHolder();
        const fightersPerUser = {};
        const fightersIds = Object.keys(fighterHolder.allFighters).filter(fighterId => {
            const fighter = fighterHolder.allFighters[fighterId];
            if (arena.state === 'initialisation' && fighter.isRetired)
                return false;
            if (fighter.userLocalId === 0)
                return true;

            fightersPerUser[fighter.userLocalId] ??= 0;
            if (fightersPerUser[fighter.userLocalId] >= maxFightersPerUser)
                return false;

            fightersPerUser[fighter.userLocalId]++;
            return true;
        });

        if (arenaManager.GetState() === 'initialisation') {
            try {
                // reset map
                arenaManager.ResetArena();

                let nFighters = fightersIds.length;
                if (nFighters < 2) {
                    await output.log(logText('notEnoughFighters', { count: nFighters }), { useConsole: true, ephemeral: true });
                    return;
                }

                const combatSeed = arenaManager.SetSeed(seed);
                await output.log(logText('combatStart', { seed: combatSeed }), { useConsole: true });

                // give fighters positions
                const spawnPoints = arenaManager.GetSpawnPoints(nFighters);
                for (let i = 0; i < nFighters; i++) {
                    const fighterId = fightersIds[i]
                    const fighter = fighterHolder.allFighters[fighterId]
                    arenaManager.AddFighter(fighter, spawnPoints[i]);
                }
                await output.log(logText('departure', { map: arenaManager.GetMapVisualisation() }));
                arenaManager.SetState('battling');

            }
            catch (error) {
                console.error('Error : ', error);
                await output.sendError(`Error while initialising game :\n\`\`\`${error}\`\`\``);
                return;
            }
        }

        arena = arenaManager.GetArena();
        let failSafe = 1000;
        while (arena.state !== 'finished' && failSafe > 0) {
            if (arena.paused) {
                return;
            }
            try {

                const fighterPositions = {};
                fightersIds.forEach((id) => {
                    const position = arenaManager.GetObjectPosition(id);
                    fighterPositions[id] = position;
                })
                const fightersOnMapIds = Object.keys(fighterPositions);
                // console.debug('fighters on map', fightersOnMapIds);

                if (arena.state === 'battling') {
                    arena.turn['fightersOnMapIds'] = fightersOnMapIds;
                    await this.NewTurn(arena.turn, output, { actionDelaySeconds });
                    arena = arenaManager.GetArena();
                }

                if (arena.state === 'battling') { // can be stopped during turn
                    // Victory test
                    let fightersPerTeam = {};
                    let fighterAlive = undefined;
                    for (let i = 0; i < fightersIds.length; i++) {
                        const fighter = fighterHolder.allFighters[fightersIds[i]];
                        if (arena.fighterData[fighter.id].isOutOfCombat) {
                            fightersIds.splice(i, 1);
                            i--;
                        }
                        else {
                            fighterAlive = fighter;
                            if (!fightersPerTeam.hasOwnProperty(fighter.currentTeamId))
                                fightersPerTeam[fighter.currentTeamId] = 0;
                            fightersPerTeam[fighter.currentTeamId]++;
                        }
                    }
                    await output.log(logText('fightersAlive', { fighters: fightersIds }), { useConsole: true, sendToChannel: false });
                    const nTeams = Object.keys(fightersPerTeam).length;
                    if (nTeams < 2) {
                        let msg;
                        if (nTeams === 1) {
                            const winningTeamId = Object.keys(fightersPerTeam)[0];
                            if (persistFighterStats)
                                barrack.RecordMatchResult(Object.keys(arena.fighterData), Number(winningTeamId));
                            // WINNER
                            if (fightersPerTeam[0] == 1) {
                                msg = logText('winner', { fighter: barrack.GetFighterFullName(fighterAlive) });
                            }
                            else {
                                msg = logText('teamWinner', { fighter: barrack.GetFighterFullName(fighterAlive) });
                            }
                        }
                        else if (nTeams === 0) {
                            // EQUALITY
                            msg = logText('draw');
                        }
                        await output.log(msg, { useConsole: true });
                        arenaManager.SetState('finished');
                        const currentTime = new Date();
                        arenaManager.SaveArena(`${currentTime.toLocaleDateString('fr-FR').replaceAll('/', '-')}_currentArena`);
                        arenaManager.ResetArena();
                        return;
                    }
                }

                if (persistFighterStats)
                    barrack.SaveFighters();
                arenaManager.SaveArena('currentArena');
            }
            catch (error) {
                console.log('Error : ', error);
                await output.sendError(`Error while running game :\n\`\`\`${error}\`\`\`\nPile d'évènement vidée, combat mis en pause. \`/stop\` pour arrêter ce combat`);
                arena.paused = true;
                try {
                    arenaManager.SaveArena('currentArena');
                }
                catch (error) {
                    await output.sendError(`Error while saving after crash : \n\`\`\`${error}\`\`\`\\nProgress lost`)
                }
                return;
            }
            failSafe--;
            await sleep(turnDelaySeconds);
            arenaManager.LoadArena('currentArena');
        }
        if (failSafe == 0) {
            arena.paused = true;
            console.error('[' + currentTime.toLocaleString('fr-FR') + `]: Too many turn loop (increase fail safe if trigger in normal conditions)`);
            await output.sendError(`Combat mis en pause: trop de boucles. \`/stop\` pour arrêter ce combat`);
        }
    },

    async NewTurn(turnObject, output, { actionDelaySeconds = 30 } = {}) {
        const barrack = require('./barracks.js');
        const arenaManager = require('./arenaManager.js');
        const modifierManager = require('./modifierManager.js');
        const { locale } = guildData.getSettings();

        const fighterHolder = barrack.GetFighterHolder();

        if (!turnObject.hasOwnProperty('turnOrder') || turnObject.turnOrder.length == 0) {
            // Sort in order of actions
            console.assert(turnObject.hasOwnProperty('fightersOnMapIds'), 'turn object is missing fightersOnMapIds');
            let fightersInOrder = turnObject.fightersOnMapIds.toSpliced(); // copy
            ShuffleInPlace(fightersInOrder, () => arenaManager.Random());
            turnObject['turnOrder'] = fightersInOrder;
        }
        let fighterOrderTxt = '';
        for (let i = 0; i < turnObject.turnOrder.length; i++) {
            const fighterId = turnObject.turnOrder[i];
            fighterOrderTxt += ` ${barrack.GetFighterFullNameById(fighterId)}`
            if (i < turnObject.turnOrder.length - 1)
                fighterOrderTxt += ' > '
        }

        const eventStack = [];

        // Tell beginning of combat or turn
        if (turnObject.number === 0) {
            await output.log(logText('combatBeginning'), { useConsole: true });
            const beginningOfCombatEvent = {
                id: 'beginningOfCombat'
            };
            eventStack.push(beginningOfCombatEvent);
            await this.ResolveEventStack(eventStack, turnObject.turnOrder, 0, output);
            turnObject.number++;
        }

        await output.log(logText('turn', { number: turnObject.number }), { useConsole: true });

        await output.log(logText('turnOrder', { order: fighterOrderTxt }), { useConsole: true });

        await output.log(logText('beginningOfTurn'), { useConsole: true, sendToChannel: false });
        const beginningOfTurnEvent = {
            id: 'beginningOfTurn'
        }
        eventStack.push(beginningOfTurnEvent);
        await this.ResolveEventStack(eventStack, turnObject.turnOrder, 0, output);

        const arena = arenaManager.GetArena();

        // Find and execute fighters actions
        for (let i = turnObject.currentTurnTakerInd; i < turnObject.turnOrder.length; i++) {
            if (arena.state !== 'battling' || arena.paused) {
                return;
            }

            const fighterId = turnObject.turnOrder[i];
            const fighter = fighterHolder.allFighters[fighterId];

            if (arena.fighterData[fighter.id].isOutOfCombat)
                continue;

            turnObject.currentTurnTakerInd = i;
            eventStack.push({
                id: 'beginningOfYourTurn',
                executor: fighterId
            });
            await this.ResolveEventStack(eventStack, turnObject.turnOrder, i, output);

            await output.log(logText('action', { fighter: barrack.GetFighterFullName(fighter) }), { useConsole: true });

            // Gather what info they want
            console.log('Gather wanted info');
            let info = {};
            arena.fighterData[fighterId].modifierIds.forEach(modId => {
                modifierManager.GetModifier(modId).GatherWantedInfo(info);
            });
            // console.debug('Wanted info:', info);

            // Gather the info wanted
            console.log('Gather actual info');
            arena.fighterData[fighterId].modifierIds.forEach(modId => {
                modifierManager.GetModifier(modId).GatherInfo(barrack, fighterId, arenaManager, info);
            });
            // console.debug('Gathered info:', info);

            // Get the commands and instructions
            console.log('Get the commands and instructions');
            let commands = [];
            let instructions = [];
            arena.fighterData[fighterId].modifierIds.forEach(modId => {
                const mod = modifierManager.GetModifier(modId);
                if (mod.type === 'action') {
                    let command = mod.GetCommand(barrack, fighterId, arenaManager, info);
                    console.assert(command.hasOwnProperty('type'), `Command does not have a type`);
                    if (command.type === 'actionCommand') {
                        commands.push(command);
                    } else {
                        console.assert(command.type === 'instruction', `Command type '${command.type}' is not supported`);
                        instructions.push(command);
                    }
                }
            });
            // console.debug('Commands after adding actions :', commands);
            // console.debug('Instructions :', instructions);

            // Get the move commands based on the instructions
            console.log('Get move commands');
            instructions.forEach(instruction => {
                const totalWeightToShare = instruction.weight;
                const firstNewInstructionInd = commands.length;
                arena.fighterData[fighterId].modifierIds.forEach(modId => {
                    if (modifierManager.GetModifier(modId).type === 'move') {
                        const moveCommands = modifierManager.GetModifier(modId).GetCommand(barrack, fighterId, arenaManager, info, instruction);
                        if (moveCommands === undefined)
                            return;
                        if (Array.isArray(moveCommands))
                            commands.push(...moveCommands);
                        else
                            commands.push(moveCommands);
                    }
                });
                const commandsAdded = commands.length - firstNewInstructionInd;
                if (commandsAdded > 0) {
                    const newCommandWeight = totalWeightToShare / commandsAdded;
                    for (let i = firstNewInstructionInd; i < commands.length; i++) {
                        commands[i].weight = newCommandWeight;
                    }
                }

            });
            // console.debug('Commands after adding moves :', commands);

            // select one command  
            console.log('Select one command');
            let totalWeight = 0;
            commands.forEach(command => {
                totalWeight += command.weight;
            });
            const pickedWeight = arenaManager.Random() * totalWeight;
            totalWeight = 0;
            const commandInd = commands.findIndex(command => {
                totalWeight += command.weight;
                return totalWeight >= pickedWeight;
            });
            console.assert(commandInd >= 0, 'A command was not found');
            const pickedCommand = commands[commandInd];
            // console.debug('Picked command :', pickedCommand);

            eventStack.push(pickedCommand.resultingEvent);

            // Process all events
            await this.ResolveEventStack(eventStack, turnObject.turnOrder, i, output);

            // End state visualisation
            await output.log(logText('afterAction', { fighter: barrack.GetFighterFullName(fighter), map: arenaManager.GetMapVisualisation() }));
            await sleep(actionDelaySeconds);
        }
        turnObject.number++;
        turnObject.turnOrder = [];
        turnObject.currentTurnTakerInd = 0;
        arena.turn = turnObject;
    },

    async ResolveEventStack(eventStack, fightersInOrder, turnTakerInd, output) {

        const barrack = require('./barracks.js');
        const arenaManager = require('./arenaManager.js');
        const modifierManager = require('./modifierManager.js');
        const eventTextConstructor = require('./eventTextConstructor.js');
        const eventUtils = require('./eventUtils.js');
        const { locale } = guildData.getSettings();

        const fighterHolder = barrack.GetFighterHolder();
        const arena = arenaManager.GetArena();

        console.log('Process', eventStack.length, 'events');
        let failSafe = 1000;
        while (eventStack.length > 0 && failSafe > 0) {
            failSafe--;
            const event = eventUtils.ValidateEvent(eventStack.pop());

            if (!event.hasOwnProperty('timing'))
                event.timing = 'before';
            if (!Array.isArray(event.consequences))
                event.consequences = [];

            // console.log('Process event', event.id);

            const fighterIdsToProcess = [...new Set([
                ...(event.executor === undefined ? [] : [event.executor]),
                ...event.targets,
            ])];

            // Process the executor first, then the affected fighters.
            fighterIdsToProcess.forEach(fighterId => {
                arena.fighterData[fighterId].modifierIds.forEach(modId => {
                    const mod = modifierManager.GetModifier(modId);
                    mod.ProcessEvent(barrack, fighterId, arenaManager, event);
                });
            });

            // then all the others
            for (let i = 0; i < fightersInOrder.length; i++) {
                let otherFighterId = fightersInOrder[(turnTakerInd + i) % fightersInOrder.length];
                if (!fighterIdsToProcess.includes(otherFighterId)) {
                    arena.fighterData[otherFighterId].modifierIds.forEach(modId => {
                        const mod = modifierManager.GetModifier(modId);
                        mod.ProcessEvent(barrack, otherFighterId, arenaManager, event);
                    });
                }

            }

            if (event.timing === 'during') {
                const text = eventTextConstructor.GetEventText(event, locale, 'detailed');
                if (text && text.length > 0) {
                    await output.log(text, { useConsole: true });
                }
            }

            let consequences = []
            if (event.hasOwnProperty('consequences') && event.consequences.length > 0)
                consequences = structuredClone(event.consequences);

            arenaManager.RecordEvent(event, arena.turn.number);

            if (event.timing === 'before') {
                event.timing = 'during';
                event.consequences = [];
                eventStack.push(event);
            }

            consequences.forEach(consequence => {
                eventStack.push(consequence);
            });
        }
        console.assert(failSafe > 0, 'Infinite loop or too many events');
        console.assert(eventStack.length === 0, 'Not all events were processed');
    }
};
