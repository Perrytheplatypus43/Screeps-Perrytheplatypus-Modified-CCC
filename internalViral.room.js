const mod = {
    extend() {
        this.baseOf.internalViral.extend.call(this);

        Object.defineProperties(Room.prototype, {
            'allyCreeps': {
                configurable: true,
                get: function () {
                    if (_.isUndefined(this._allyCreeps)) {
                        this._allyCreeps = this.find(FIND_CREEPS, { filter: Task.reputation.allyOwner });
                    }
                    return this._allyCreeps;
                }
            },
            'casualties': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._casualties) ){
                        var isInjured = creep => creep.hits < creep.hitsMax &&
                        (creep.towers === undefined || creep.towers.length == 0);
                        this._casualties = _.chain(this.allyCreeps).filter(isInjured).sortBy('hits').value();
                    }
                    return this._casualties;
                }
            },
            'fuelable': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._fuelables) ){
                        var that = this;
                        var factor = that.room.situation.invasion ? 0.9 : 0.82;
                        var fuelable = target => (target.energy < (target.energyCapacity * factor));
                        this._fuelables = _.sortBy( _.filter(this.towers, fuelable), 'energy') ; // TODO: Add Nuker
                    }
                    return this._fuelables;
                }
            },
        });
    },

};
module.exports = mod;

