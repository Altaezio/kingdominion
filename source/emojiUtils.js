const emojiPattern = /\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3/u;

module.exports = {
    GetFirstEmoji(value) {
        const segments = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value);
        for (const { segment } of segments) {
            if (emojiPattern.test(segment))
                return segment;
        }
    },
};
