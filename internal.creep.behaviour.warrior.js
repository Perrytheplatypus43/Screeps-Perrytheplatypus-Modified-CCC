const mod = new Creep.Behaviour('warrior');
module.exports = mod;
const super_invalidAction = mod.invalidAction;
mod.invalidAction = function(creep) {
    return super_invalidAction.call(this, creep) ||
        (creep.action.name === 'guarding' &&
            (!creep.flag || creep.flag.pos.roomName === creep.pos.roomName || creep.leaveBorder())
        );
};
const super_run = mod.run;
mod.run = function(creep) {
    creep.flee = creep.flee || !creep.hasActiveBodyparts([ATTACK, RANGED_ATTACK]);
    creep.attacking = false;
    creep.attackingRanged = false;
    super_run.call(this, creep);
    Creep.behaviour.ranger.heal.call(this, creep);
};
mod.actions = function(creep) {
    let temp = [
        Creep.action.invading,
        Creep.action.defending,
        Creep.action.healing,
        Creep.action.guarding,
    ];
    if(creep.data.destiny.boosted) temp.unshift(Creep.action.boosting);
    return temp;
};
mod.strategies = {
    defaultStrategy: {
        name: `default-${mod.name}`,
        moveOptions: function(options) {
            // // allow routing in and through hostile rooms
            // if (_.isUndefined(options.allowHostile)) options.allowHostile = true;
            return options;
        }
    }
};
mod.selectStrategies = function(actionName) {
    return [mod.strategies.defaultStrategy, mod.strategies[actionName]];
};

mod.strategies.defending = {
    name: `defending-${mod.name}`,
    targetFilter: function(creep) {
        return function (hostile) {
            if (hostile.owner.username === 'Source Keeper') {
                return creep.pos.getRangeTo(hostile) <= 5;
            }
            return true;
        }
    },
    priorityTargetFilter: function(creep) {
        return function(hostile) {
            if (hostile.owner.username === 'Source Keeper') {
                return creep.pos.getRangeTo(hostile) <= 5;
            } else {
                return hostile.hasBodyparts(ATTACK) || hostile.hasBodyparts(RANGED_ATTACK) || hostile.hasBodyparts(WORK);
            }
        }
    }
};
mod.strategies.healing = {
    moveOptions: function (options) {
        options.respectRamparts = true;
        return options;
    }
};
