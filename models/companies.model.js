const mongoose = require('mongoose');

const ModelSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        unique: '{VALUE} already exists'
    },
    verified: Boolean
}, {
    timestamps: true
});

ModelSchema.plugin(require('mongoose-beautiful-unique-validation'));

module.exports = mongoose.model('Company', ModelSchema);