const mod = {};
module.exports = mod;
mod.defaultStrategy = {
    targetFilter: function(creep) {
        return function (target) {
            if (target.my) {
                return !(target.data && target.data.creepType === 'sourceKiller') || creep.pos.getRangeTo(target) < 5;
            } else {
                return Task.reputation.allyOwner(target);
            }
        }
    },
};
