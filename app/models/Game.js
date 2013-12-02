var mongoose = require('mongoose')

module.exports = function (dal) {
    var PlayerSchema = mongoose.Schema({
        id: String,
        proceed: Boolean,
        name: String,
        status: String
    }, { _id: false })

    var GameSchema = mongoose.Schema({

        room: { type: String },
        round: Number,
        status: String,
        numPlayers: Number,
        players: [PlayerSchema]

    });

    GameSchema.statics.findByRoom = function(room, callback){
        return this.find({room: room}, callback);
    }

    GameSchema.statics.findPlayer = function(playerId){
        return this.find({room: room}, callback);
    }

    return  mongoose.model('games', GameSchema);
}