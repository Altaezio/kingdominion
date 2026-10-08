const localizations = {
    'fighter-info': {
        description: { fr: 'Donne les informations sur ton combattant', en: 'Shows information about your fighter' },
        options: {
            name: { fr: 'Nom de ton combattant', en: 'Your fighter\'s name' },
            'in-combat': { fr: 'Afficher les informations du combat en cours', en: 'Show information about the current combat' },
        },
        responses: {
            fighterNotFound: { fr: 'Aucun combattant trouvé avec le nom \'{fighterName}\'.', en: 'No fighter found with name \'{fighterName}\'.' },
            userNotFound: { fr: 'Aucun utilisateur trouvé avec l\'identifiant \'{userId}\'.', en: 'No user found with ID \'{userId}\'.' },
            noModifier: { fr: 'Aucun modificateur chargé.', en: 'No modifier loaded.' },
            currentCount: { fr: 'Ce combattant a *actuellement* **{count}** modificateur(s)', en: 'This fighter currently has **{count}** modifier(s)' },
            baseCount: { fr: 'Ce combattant a *de base* **{count}** modificateur(s)', en: 'This fighter has **{count}** base modifier(s)' },
            name: { fr: 'Nom', en: 'Name' },
            player: { fr: 'Joueur', en: 'Player' },
            wins: { fr: 'Victoires', en: 'Wins' },
            losses: { fr: 'Défaites', en: 'Losses' },
            outOfCombat: { fr: 'Combattant actuellement décédé ☠️', en: 'Fighter is currently out of combat ☠️' },
        },
    },
    'fighter-list': {
        description: { fr: 'Donne la liste de tous les combattants', en: 'Shows the list of all fighters' },
        responses: {
            header: { fr: 'Liste de tous les combattants :', en: 'List of all fighters:' },
            entry: { fr: '\n - {icon} Nom : **{name}**, Joueur : **{player}**{status}', en: '\n - {icon} Name: **{name}**, Player: **{player}**{status}' },
            retired: { fr: ' (retraité)', en: ' (retired)' },
        },
    },
    join: {
        description: { fr: 'Donne un combattant et permet de rejoindre l\'amusement', en: 'Gives you a fighter and lets you join the game' },
        options: {
            name: { fr: 'Nom de ton combattant', en: 'The name of your fighter' },
            icon: { fr: 'Icône représentant ton combattant', en: 'An icon representing your fighter' },
        },
        responses: {
            invalidIcon: { fr: 'Tu dois mettre un emoji comme icône : {icon} n\'est pas possible', en: 'You must use an emoji as the icon: {icon} is not valid' },
            nameTaken: { fr: 'Nom déjà utilisé, essaye encore', en: 'Name already used, try again' },
            limit: { fr: 'Tu as déjà atteint la limite de {limit} combattant(s).', en: 'You have reached the limit of {limit} fighter(s).' },
            created: { fr: 'Tu as un nouveau combattant : {icon} {name}', en: 'You have a new fighter: {icon} {name}' },
            modifierModePrompt: { fr: 'Tu as manqué des sondages. Comment veux-tu choisir les modificateurs de ton combattant ?', en: 'You missed modifier surveys. How would you like to choose your fighter’s modifiers?' },
            modeNone: { fr: 'Modificateurs de base uniquement', en: 'Base modifiers only' },
            modeRandom: { fr: 'Choix aléatoire pour chaque sondage', en: 'Random choice for each survey' },
            modeChoose: { fr: 'Choisir un par un', en: 'Choose one by one' },
            surveyChoicePlaceholder: { fr: 'Choisis le modificateur du sondage {surveyNumber}', en: 'Choose a modifier from survey {surveyNumber}' },
            surveyChoicePrompt: { fr: 'Choisis un modificateur pour le sondage {surveyNumber} sur {surveyCount}.', en: 'Choose a modifier for survey {surveyNumber} of {surveyCount}.' },
            choiceTimedOut: { fr: 'Temps écoulé. Aucun combattant n’a été créé ; relance /join pour réessayer.', en: 'Time expired. No fighter was created; run /join again to try once more.' },
        },
    },
    retire: {
        description: { fr: 'Retire un de tes combattants', en: 'Retires one of your fighters' },
        options: {
            name: { fr: 'Nom de ton combattant', en: 'Your fighter’s name' },
        },
        responses: {
            notFound: { fr: 'Tu n’as aucun combattant actif nommé **{name}**.', en: 'You do not have an active fighter named **{name}**.' },
            retired: { fr: '**{name}** a été retiré. Ses données sont conservées, mais il ne participera plus aux prochains combats.', en: '**{name}** has been retired. Its data is preserved, but it will not join future fights.' },
        },
    },
    rename: {
        description: { fr: 'Change le nom et l’icône d’un de tes combattants', en: 'Changes the name and icon of one of your fighters' },
        options: {
            name: { fr: 'Nom actuel de ton combattant', en: 'Your fighter’s current name' },
            'new-name': { fr: 'Nouveau nom ou nom actuel', en: 'New name or current name' },
            'new-icon': { fr: 'Nouvel emoji ou emoji actuel', en: 'New emoji icon or current icon' },
        },
        responses: {
            keepNameChoice: { fr: 'Garder le nom actuel : {name}', en: 'Keep current name: {name}' },
            keepIconChoice: { fr: 'Garder l’icône actuelle : {icon}', en: 'Keep current icon: {icon}' },
            invalidName: { fr: 'Le nouveau nom doit contenir entre 3 et 10 caractères.', en: 'The new name must be between 3 and 10 characters.' },
            invalidIcon: { fr: '`{icon}` ne contient pas d’emoji valide.', en: '`{icon}` does not contain a valid emoji.' },
            fighterNotFound: { fr: 'Tu n’as aucun combattant actif nommé **{name}**.', en: 'You do not have an active fighter named **{name}**.' },
            nameTaken: { fr: 'Le nom **{name}** est déjà utilisé.', en: 'The name **{name}** is already in use.' },
            noChange: { fr: 'Aucun changement effectué.', en: 'Nothing changed.' },
            failed: { fr: 'Impossible de renommer ce combattant. Réessaie.', en: 'Could not rename this fighter. Please try again.' },
            renamed: { fr: '{oldIcon} **{oldName}** devient {newIcon} **{newName}** !', en: '{oldIcon} **{oldName}** is now {newIcon} **{newName}**!' },
        },
    },
    'fighter-history': {
        description: { fr: 'Affiche les anciens noms et icônes d’un combattant', en: 'Shows a fighter’s previous names and icons' },
        options: {
            name: { fr: 'Combattant à consulter', en: 'The fighter to look up' },
        },
        responses: {
            notFound: { fr: 'Aucun combattant actuel trouvé avec le nom **{name}**.', en: 'No fighter currently found with the name **{name}**.' },
            header: { fr: 'Identité actuelle : {icon} **{name}**', en: 'Current identity: {icon} **{name}**' },
            noHistory: { fr: 'Aucun changement de nom ou d’icône enregistré.', en: 'No name or icon changes have been recorded.' },
            previous: { fr: 'Historique précédent :', en: 'Previous identities:' },
            entry: { fr: '{icon} **{name}** (jusqu’au {date})', en: '{icon} **{name}** (until {date})' },
            older: { fr: '… et {count} changement(s) antérieur(s).', en: '… and {count} earlier change(s).' },
        },
    },
    'modifier-info': {
        description: { fr: 'Donne la description complète d\'un modificateur', en: 'Shows the full description of a modifier' },
        options: {
            modifier: { fr: 'Identifiant du modificateur', en: 'The modifier ID' },
        },
        responses: {
            notFound: { fr: 'Aucun modificateur trouvé avec l\'identifiant \'{id}\'.', en: 'No modifier found with ID \'{id}\'.' },
            id: { fr: 'Identifiant', en: 'ID' },
            type: { fr: 'Type', en: 'Type' },
            description: { fr: 'Description', en: 'Description' },
            tags: { fr: 'Tags', en: 'Tags' },
            none: { fr: 'Aucun', en: 'None' },
            defaultData: { fr: 'Données par défaut', en: 'Default data' },
        },
    },
    pause: {
        description: { fr: 'Met en pause ou relance le combat en cours', en: 'Pauses or resumes the current combat' },
        options: {
            toggle: { fr: 'Définit l\'état du combat', en: 'Sets the combat state' },
        },
        responses: {
            paused: { fr: 'Combat mis en pause', en: 'Combat paused' },
            resumed: { fr: 'Combat relancé', en: 'Combat resumed' },
        },
    },
    run: {
        description: { fr: 'Commence les jeux', en: 'Starts the games' },
        responses: {
            scheduling: { fr: 'Planification du jeu', en: 'Scheduling game' },
        },
    },
    'show-map': {
        description: { fr: 'Affiche la carte actuelle', en: 'Shows the current map' },
        responses: {
            title: { fr: 'Carte du combat :', en: 'Combat map:' },
        },
    },
    stop: {
        description: { fr: 'Arrête complètement le combat en cours', en: 'Stops the current combat completely' },
        options: {
            'stop-all': { fr: 'Arrête le jeu entier (par défaut : faux)', en: 'Stops the entire game (default: false)' },
        },
        responses: {
            stopped: { fr: 'Combat arrêté', en: 'Combat stopped' },
            failed: { fr: 'Échec de l\'arrêt du jeu', en: 'Failed to stop the game' },
            gameStopped: { fr: 'Jeu arrêté', en: 'Game stopped' },
        },
    },
    survey: {
        description: { fr: 'Crée ou ferme le sondage des modificateurs', en: 'Creates or closes the modifier survey' },
        responses: {
            channelNotFound: { fr: 'Le canal du sondage est introuvable.', en: 'The survey channel could not be found.' },
            started: { fr: 'Le sondage a été lancé.', en: 'The survey was started.' },
            closed: { fr: 'Le sondage est fermé. {count} modificateur(s) ajouté(s).', en: 'The survey is closed. {count} modifier(s) added.' },
        },
    },
    'test-combat': {
        description: { fr: 'Commence un combat de test', en: 'Starts a test combat' },
        options: {
            seed: { fr: 'Seed du combat pour le rendre reproductible', en: 'Combat seed for reproducible results' },
        },
        responses: {
            starting: { fr: 'Démarrage d\'un combat', en: 'Starting one combat' },
        },
    },
    ping: {
        description: { fr: 'Répond avec Pong !', en: 'Replies with Pong!' },
        responses: {
            pong: { fr: 'Pong !', en: 'Pong!' },
        },
    },
    'reload-command': {
        description: { fr: 'Recharge une commande', en: 'Reloads a command' },
        options: {
            command: { fr: 'Commande à recharger', en: 'The command to reload' },
        },
        responses: {
            notFound: { fr: 'Aucune commande ne porte le nom `{name}` !', en: 'There is no command with name `{name}`!' },
            reloaded: { fr: 'Commande `{name}` rechargée !', en: 'Command `{name}` was reloaded!' },
            error: { fr: 'Une erreur est survenue lors du rechargement de la commande `{name}` :\n`{error}`', en: 'There was an error while reloading a command `{name}`:\n`{error}`' },
        },
    },
    'reload-file': {
        description: { fr: 'Recharge un fichier', en: 'Reloads a file' },
        options: {
            'file-path': { fr: 'Chemin du fichier à recharger', en: 'The path of the file to reload' },
        },
        responses: {
            removed: { fr: 'Le fichier {path} a été retiré du cache', en: 'File at {path} removed from cache' },
            notFound: { fr: 'Ce fichier n\'existe pas ici : `{path}` !', en: 'There is no such file here `{path}`!' },
        },
    },
    interaction: {
        responses: {
            commandNotFound: { fr: 'Aucune commande correspondant à {name} n\'a été trouvée.', en: 'No command matching {name} was found.' },
            error: { fr: 'Une erreur est survenue pendant l\'exécution de cette commande ! Erreur : {error}', en: 'There was an error while executing this command! Error: {error}' },
        },
    },
    'survey-vote': {
        responses: {
            closed: { fr: 'Ce sondage est terminé.', en: 'This survey is closed.' },
            single: { fr: 'Tu peux choisir un seul modificateur.', en: 'You can choose only one modifier.' },
            noFighter: { fr: 'Tu dois avoir un combattant pour voter.', en: 'You need a fighter to vote.' },
            multipleFighters: { fr: 'Le sondage ne supporte actuellement qu\'un combattant par joueur.', en: 'The survey currently supports only one fighter per player.' },
            voteFailed: { fr: 'Ton vote n\'a pas pu être enregistré.', en: 'Your vote could not be recorded.' },
            voteRecorded: { fr: 'Vote enregistré pour {name}.', en: 'Vote recorded for {name}.' },
        },
    },
};

function GetLanguage(locale) {
    return locale?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

function GetLocalizedText(localization, locale) {
    const language = GetLanguage(locale);
    return localization[language];
}

function Text(interaction, commandName, responseName, values = {}) {
    const response = localizations[commandName]?.responses?.[responseName];
    if (!response)
        throw new Error(`Missing localization: ${commandName}.${responseName}`);

    return GetLocalizedText(response, interaction.locale).replace(/\{(\w+)\}/g, (placeholder, key) => values[key] ?? placeholder);
}

function ApplyLocalizations(command) {
    const commandLocalization = localizations[command.name];
    if (!commandLocalization)
        return command;

    command.description_localizations = {
        fr: GetLocalizedText(commandLocalization.description, 'fr'),
        'en-US': GetLocalizedText(commandLocalization.description, 'en'),
    };
    for (const option of command.options ?? []) {
        const description = commandLocalization.options?.[option.name];
        if (description)
            option.description_localizations = {
                fr: GetLocalizedText(description, 'fr'),
                'en-US': GetLocalizedText(description, 'en'),
            };
    }
    return command;
}

module.exports = { ApplyLocalizations, Text, GetLocalizedText };