const { REST, Routes } = require('discord.js');
const { clientId, guildId: legacyGuildId, testGuildId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const { ApplyLocalizations } = require('./source/commandLocalizations.js');

const deploymentMode = process.argv[2];
if (!['--guild', '--global'].includes(deploymentMode) || process.argv.length !== 3) {
	console.error('Usage: node deploy-commands.js --guild | --global');
	process.exitCode = 1;
	return;
}

if (typeof testGuildId !== 'string' || !/^\d{17,20}$/.test(testGuildId)) {
	console.error('Set testGuildId in config.json to a valid Discord server ID before deploying.');
	process.exitCode = 1;
	return;
}

const guildIdsToClear = [...new Set([testGuildId, legacyGuildId].filter(guildId =>
	typeof guildId === 'string' && /^\d{17,20}$/.test(guildId)
))];

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(ApplyLocalizations(command.data.toJSON()));
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const rest = new REST().setToken(token);

(async () => {
	try {
		if (deploymentMode === '--guild') {
			const data = await rest.put(
				Routes.applicationGuildCommands(clientId, testGuildId),
				{ body: commands },
			);
			console.log(`Registered ${data.length} command(s) in test guild ${testGuildId}.`);

			await rest.put(Routes.applicationCommands(clientId), { body: [] });
			console.log('Cleared global commands to avoid duplicates in the test guild.');
		}
		else {
			const data = await rest.put(
				Routes.applicationCommands(clientId),
				{ body: commands },
			);
			console.log(`Registered ${data.length} global command(s).`);
		}
		const staleGuildIds = deploymentMode === '--guild'
			? guildIdsToClear.filter(guildId => guildId !== testGuildId)
			: guildIdsToClear;
		for (const guildId of staleGuildIds) {
			await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
			console.log(`Cleared guild-specific commands in ${guildId}.`);
		}
	} catch (error) {
		console.error(`Failed to deploy ${deploymentMode} commands:`, error);
		process.exitCode = 1;
	}
})();
