const { MessageFlags } = require('discord.js');
const arenaManager = require('./arenaManager.js');
const gameEngine = require('./gameEngine.js');
const guildData = require('./guildData.js');
const { GetLogText } = require('./logTexts.js');

function createOutput(channel, locale) {
	return {
		async log(message, { useConsole = false, sendToChannel = true, ephemeral = false } = {}) {
			let localizedMessage;
			if (typeof message === 'string') {
				localizedMessage = message;
			}
			else if (message?.key) {
				localizedMessage = GetLogText(message.key, message.values)[locale?.toLowerCase().startsWith('fr') ? 'fr' : 'en'];
			}
			else if (message && typeof message === 'object') {
				localizedMessage = message[locale?.toLowerCase().startsWith('fr') ? 'fr' : 'en'];
			}
			else {
				throw new TypeError('Game log message must be a string, localization object, or log descriptor');
			}

			const timestampedMessage = `[${new Date().toLocaleString('fr-FR')}]: ${localizedMessage}`;
			arenaManager.AppendLogEntry(timestampedMessage);
			if (useConsole)
				console.log(timestampedMessage);
			if (sendToChannel && channel) {
				await channel.send({
					content: localizedMessage,
					...(ephemeral ? { flags: MessageFlags.Ephemeral } : {}),
				});
			}
		},
		sendError(message) {
			return channel.send(message);
		},
	};
}

module.exports = {
	CreateOutput: createOutput,

	RunCombat(channel, seed, options) {
		const { locale } = guildData.getSettings();
		return gameEngine.RunCombat(createOutput(channel, locale), seed, options);
	},
};
