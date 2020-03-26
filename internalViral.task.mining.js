let mod = {};
module.exports = mod;
mod.setupCreep = function(roomName, definition) {
    definition = this.baseOf.internalViral.setupCreep.apply(this, [roomName, definition]);

    switch (definition.behaviour) {
        default:
            return definition;

        case 'remoteMiner':
            let memory = this.memory(roomName);
            if (!memory.healSize) {
                return definition;
            }

            const healParts = Math.max(0, memory.healSize);
            const extraMoveParts = Math.ceil(healParts * 0.5 + definition.moveBalance);

            return _.create(definition, {
                fixedBody: definition.fixedBody
                    .concat(_.times(extraMoveParts, _.constant(MOVE)))
                    .concat(_.times(healParts, _.constant(HEAL))),
                moveBalance: (healParts % 2) * -0.5 + definition.moveBalance,
            });
    }
};
mod.heal = function(roomName, partChange) {
    let memory = Task.mining.memory(roomName);
    memory.healSize = (memory.healSize || 0) + (partChange || 0);
    return `Task.${this.name}: healing capacity for ${roomName} ${memory.healSize >= 0 ? 'increased' : 'decreased'} to ${Math.abs(memory.healSize)} per miner.`;
};
mod.strategies = {
    miner: {
        setup: function (roomName) {
            return Task.mining.setupCreep(roomName, Room.isCenterNineRoom(roomName) ? Task.mining.creep.SKMiner : Task.mining.creep.miner);
        }
    },
    hauler: {
        ept: function(roomName) {
            const room = Game.rooms[roomName];
            if (Room.isCenterNineRoom(roomName)) {
                return room ? 14 * room.sources.length : 42;
            } else {
                //FIXME: I would like to be able to call the base class of Task.mining here
                return room ? 10 * room.sources.length : 20;
            }
        }
    }
};
mod.creep = {
    SKMiner: {
        fixedBody: [MOVE, WORK, WORK, WORK, WORK, WORK],
        multiBody: [MOVE, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, CARRY],
        maxMulti: 1,
        behaviour: 'remoteMiner',
        queue: 'Medium' // not much point in hauling or working without a miner, and they're a cheap spawn.
    }
};