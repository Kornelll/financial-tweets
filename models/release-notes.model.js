const mongoose = require('mongoose');

const ModelSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    version: {
        type: String,
        required: [true, 'Version is required'],
        trim: true,
        unique: '{VALUE} already exists'
    },
    releaseDate: Date,
    notes: String
}, {
    timestamps: true
});

ModelSchema.plugin(require('mongoose-beautiful-unique-validation'));

module.exports = mongoose.model('ReleaseNote', ModelSchema);