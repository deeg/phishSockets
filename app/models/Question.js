var mongoose = require('mongoose')

module.exports = function (dal) {

    var QuestionSchema = mongoose.Schema({
        question: String,
        answer: String,
        fakeAnswer1: String,
        fakeAnswer2: String,
        fakeAnswer3: String,
        additionalInfo: String

    });

    return mongoose.model('questions', QuestionSchema);
}