const mongoose = require('mongoose');

const ModelSchema = mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    timestamp: {
        type: String,
    },
    externalId: String,
    symbols: String,
    company: {
        type: mongoose.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company is required'],
    },
    url: String

}, {
    timestamps: true
});

ModelSchema.plugin(require('mongoose-beautiful-unique-validation'));

module.exports = mongoose.model('Tweet', ModelSchema);