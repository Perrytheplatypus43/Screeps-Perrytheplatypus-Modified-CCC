let mod = {};
module.exports = mod;
mod.extend = function(){
    try {
        // Temporary requirement to force `delete Memory.modules`
        if (!Memory.modules.internalViral.global) delete Memory.modules;

        // Install Tasks
        Task.installTask(...[
            'flagSequence',
            'hopper',
            'powerMining',
            'remoteMineralMiner',
            'sourceKiller',
            'train',
        ]);
        _.merge(Creep, {
            action: {
                diplomacy: load('creep.action.diplomacy'),
                harvestPower: load('creep.action.harvestPower'),
                pickPower: load('creep.action.pickPower'),
                sourceKiller: load('creep.action.sourceKiller'),
            },
            behaviour: {
                hopper: load('creep.behaviour.hopper'),
                powerHauler: load('creep.behaviour.powerHauler'),
                powerHealer: load('creep.behaviour.powerHealer'),
                powerMiner: load('creep.behaviour.powerMiner'),
                remoteMineralMiner: load('creep.behaviour.remoteMineralMiner'),
                sourceKiller: load('creep.behaviour.sourceKiller'),
                trainLeader: load('creep.behaviour.trainLeader'),
                trainMedic: load('creep.behaviour.trainMedic'),
                trainRanged: load('creep.behaviour.trainRanged'),
                warrior: load('creep.behaviour.warrior'),
            },
        });
    }
    catch(e){
        console.log(e.stack || e);
    }
};
//mod.flush = function(){};
//mod.analyze = function(){};
//mod.register = function(){};
//mod.execute = function(){};
//mod.cleanup = function(){};

