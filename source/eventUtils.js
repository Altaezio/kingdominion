function ValidateEvent(event) {
    if (!event || typeof event.id !== 'string' || event.id.trim().length === 0)
        throw new TypeError('Event must have a non-empty string id');
    if (event.targets === undefined)
        event.targets = [];
    else if (!Array.isArray(event.targets))
        throw new TypeError(`Event '${event.id}' must have a targets array`);
    return event;
}

module.exports = { ValidateEvent };
