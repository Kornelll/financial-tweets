
const mongoose = require('mongoose');

const ModelSchema = mongoose.Schema({

    seq: {
        type: Number,
        default: 0
    },
    prefix: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    }

}, {
    timestamps: true
});
ModelSchema.plugin(require('mongoose-beautiful-unique-validation'));
ModelSchema.index({ prefix: 1, model: 1 }, { unique: true })

module.exports = mongoose.model('_Counter', ModelSchema);