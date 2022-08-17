const mongoose = require('mongoose');
const ModelSchema = mongoose.Schema({
    key: {
        type: String,
        required: true,
        trim: true,
    },
    roles: [{
        name: {
            type: String,
            trim: true,
            unique: true
        },
        permissions: [{
            name: {
                type: String,
                trim: true
            },
            code: {
                type: String,
                trim: true
            },
            module: {
                type: String,
                trim: true
            }
        }]
    }]
}, {
    timestamps: true
});

ModelSchema.plugin(require('mongoose-beautiful-unique-validation'));
module.exports = mongoose.model('System', ModelSchema);