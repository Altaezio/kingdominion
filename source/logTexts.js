const texts = {
	paused: { fr: 'Combat déjà en pause. /pause pour le relancer ou /stop pour l\'arrêter', en: 'Combat is already paused. Use /pause to resume it or /stop to stop it' },
	notEnoughFighters: { fr: 'Pas assez de combattants pour commencer ({count})', en: 'Not enough fighters to start ({count})' },
	combatStart: { fr: 'Que les jeux commencent !', en: 'Let the games begin!' },
	departure: { fr: 'Départ :\n{map}', en: 'Start:\n{map}' },
	fightersAlive: { fr: 'Combattants vivants : {fighters}', en: 'Fighters alive: {fighters}' },
	combatBeginning: { fr: '# --- **Début du combat** ---', en: '# --- **Combat begins** ---' },
	turn: { fr: '## --- Tour **{number}** ---', en: '## --- **Turn {number}** ---' },
	turnOrder: { fr: 'Ordre d\'actions : {order}', en: 'Action order: {order}' },
	beginningOfTurn: { fr: 'Début du tour', en: 'Beginning of turn' },
	action: { fr: '> Action de {fighter}', en: '> {fighter}\'s action' },
	afterAction: { fr: 'Après action de {fighter} :\n{map}', en: 'After {fighter}\'s action:\n{map}' },
	winner: { fr: '👑 Bravo à {fighter} pour sa victoire ! 👑', en: '👑 Congratulations to {fighter} for winning! 👑' },
	teamWinner: { fr: '👑 Bravo à l\'équipe de {fighter} pour sa victoire ! 👑', en: '👑 Congratulations to {fighter}\'s team for winning! 👑' },
	draw: { fr: 'Bravo à personne pour cette égalité', en: 'Congratulations to nobody for this draw' },
};

function GetLogText(key, values = {}) {
	const text = texts[key];
	if (!text)
		throw new Error(`Missing log localization: ${key}`);

	return Object.fromEntries(Object.entries(text).map(([locale, template]) => [
		locale,
		template.replace(/\{(\w+)\}/g, (placeholder, valueKey) => values[valueKey] ?? placeholder),
	]));
}

function GetLogDescriptor(key, values = {}) {
	return { key, values };
}

module.exports = { GetLogText, GetLogDescriptor };