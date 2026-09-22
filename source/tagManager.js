const tags = {
	elemental: { parents: [] },
	fire: { parents: ['elemental'] },
	flame: { parents: ['fire'] },
	damage: { parents: [] },
	physical: { parents: ['damage'] },
	defense: { parents: [] },
	health: { parents: ['defense'] },
	movement: { parents: [] },
};

function getParents(tagId) {
	return tags[tagId]?.parents ?? [];
}

function getAllTags(directTags) {
	const allTags = new Set();
	const pendingTags = [...directTags];

	while (pendingTags.length > 0) {
		const tagId = pendingTags.pop();
		if (allTags.has(tagId))
			continue;

		allTags.add(tagId);
		pendingTags.push(...getParents(tagId));
	}

	return allTags;
}

function validateTag(tagId, visitingTags, validatedTags) {
	if (validatedTags.has(tagId))
		return;
	if (!tags[tagId])
		throw new Error(`Unknown tag ${tagId}`);
	if (visitingTags.has(tagId))
		throw new Error(`Tag hierarchy contains a cycle involving ${tagId}`);

	visitingTags.add(tagId);
	for (const parentTagId of getParents(tagId))
		validateTag(parentTagId, visitingTags, validatedTags);
	visitingTags.delete(tagId);
	validatedTags.add(tagId);
}

module.exports = {
	GetTags() {
		return tags;
	},

	GetAllTags(directTags) {
		return getAllTags(directTags);
	},

	HasTag(directTags, tagId) {
		return getAllTags(directTags).has(tagId);
	},

	ValidateTags() {
		const validatedTags = new Set();
		for (const tagId of Object.keys(tags))
			validateTag(tagId, new Set(), validatedTags);
	},

	ValidateModifier(modifier) {
		this.ValidateTags();
		for (const tagId of modifier.tags ?? [])
			validateTag(tagId, new Set(), new Set());
	},
};