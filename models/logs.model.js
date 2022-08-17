const mongoose = require('mongoose');

const ModelSchema = mongoose.Schema({
    application: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        // required: true
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        trim: true,
    },
    data: mongoose.Schema.Types.Mixed,
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true
});

ModelSchema.plugin(require('mongoose-beautiful-unique-validation'));
ModelSchema.pre('remove', { query: true }, async function (next) {
    // let department = await DepartmentModel.find({ campus: this.id });
    // if (department && department.length) {
    //     throw { message: `Cannot delete the record`, message2: `This records has some associated departments. I.e. ${department.map(d => d.name).join(', ')}` }
    // }
    next();
});

module.exports = mongoose.model('Log', ModelSchema);