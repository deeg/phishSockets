var mongoose = require('mongoose')

module.exports = function (dal) {
    var PlayerSchema = mongoose.Schema({
        id: String,
        proceed: Boolean,
        name: String,
        status: String
    }, { _id: false })

    var QuestionSchema = mongoose.Schema({
        question: String,
        answer: String,
        fakeAnswer1: String,
        fakeAnswer2: String,
        fakeAnswer3: String,
        additionalInfo: String,
        answeredCorrectly: Boolean,
        winningUser: String

    });

    var GameSchema = mongoose.Schema({

        room: { type: String },
        round: Number,
        status: String,
        questionNumber: Number,
        playersAnswered: Number,
        numPlayers: Number,
        players: [PlayerSchema],
        questions: [QuestionSchema]

    });

    GameSchema.statics.findByRoom = function(room, callback){
        return this.find({room: room}, callback);
    }

    GameSchema.statics.findPlayer = function(playerId){
        return this.find({room: room}, callback);
    }

    return  mongoose.model('games', GameSchema);
}