// This task will react on sourceKiller flags
let mod = {};
module.exports = mod;
mod.name = 'sourceKiller';
// hook into events
mod.register = () => {};
// for each flag
mod.handleFlagFound = flag => {
    // if it is a sourceKiller flag
    if (flag.compareTo(FLAG_COLOR.sourceKiller) && Task.nextCreepCheck(flag, mod.name)) {
        Util.set(flag.memory, 'task', mod.name);
        // check if a new creep has to be spawned
        Task.sourceKiller.checkForRequiredCreeps(flag);
    }
};
// check if a new creep has to be spawned
mod.checkForRequiredCreeps = (flag) => {
    // console.log(mod.name, flag.name, 'checkRequired');
    // get task memory
    let memory = Task.sourceKiller.memory(flag);
    // re-validate if too much time has passed
    Task.validateAll(memory, flag, mod.name, {roomName: flag.pos.roomName, checkValid: true});
    // count creeps assigned to task
    let count = memory.queued.length + memory.spawning.length + memory.running.length;
    
    // if creep count below requirement spawn a new creep creep 
    if( count < 1 ) {
        Task.spawn(
            Task.sourceKiller.creep.sourceKiller, // creepDefinition
            { // destiny
                task: 'sourceKiller', // taskName
                targetName: flag.name, // targetName
            }, 
            { // spawn room selection params
                targetRoom: flag.pos.roomName, 
                minEnergyCapacity: 4100,
                maxRange: 5,
                allowTargetRoom: true
            },
            creepSetup => { // callback onQueued
                let memory = Task.sourceKiller.memory(Game.flags[creepSetup.destiny.targetName]);
                memory.queued.push({
                    room: creepSetup.queueRoom,
                    name: creepSetup.name
            });
        });
    }
};
// when a creep starts spawning
mod.handleSpawningStarted = params => { // params: {spawn: spawn.name, name: creep.name, destiny: creep.destiny}
    // ensure it is a creep which has been queued by this task (else return)
    if ( !params.destiny || !params.destiny.task || params.destiny.task != 'sourceKiller' )
        return;
    // get flag which caused queueing of that creep
    // TODO: remove  || creep.data.destiny.flagName (temporary backward compatibility)
    let flag = Game.flags[params.destiny.targetName || params.destiny.flagName];
    if (flag) {
        // get task memory
        let memory = Task.sourceKiller.memory(flag);
        // save spawning creep to task memory
        memory.spawning.push(params);
        // clean/validate task memory queued creeps
        Task.validateQueued(memory, flag, mod.name);
    }
};
// when a creep completed spawning
mod.handleSpawningCompleted = creep => {
    // ensure it is a creep which has been requested by this task (else return)
    if (!creep.data || !creep.data.destiny || !creep.data.destiny.task || creep.data.destiny.task != 'sourceKiller')
        return;
    // get flag which caused request of that creep
    // TODO: remove  || creep.data.destiny.flagName (temporary backward compatibility)
    let flag = Game.flags[creep.data.destiny.targetName || creep.data.destiny.flagName];
    if (flag) {
        // calculate & set time required to spawn and send next substitute creep
        // TODO: implement better distance calculation
        creep.data.predictedRenewal = creep.data.spawningTime + (routeRange(creep.data.homeRoom, flag.pos.roomName)*50);

        // get task memory
        let memory = Task.sourceKiller.memory(flag);
        // save running creep to task memory
        memory.running.push(creep.name);
        // clean/validate task memory spawning creeps
        Task.validateSpawning(memory, flag, mod.name);
    }
};
// when a creep died (or will die soon)
mod.handleCreepDied = name => {
    // get creep memory
    let mem = Memory.population[name];
    // ensure it is a creep which has been requested by this task (else return)
    if (!mem || !mem.destiny || !mem.destiny.task || mem.destiny.task != 'sourceKiller')
        return;
    // get flag which caused request of that creep
    // TODO: remove  || creep.data.destiny.flagName (temporary backward compatibility)
    let flag = Game.flags[mem.destiny.targetName || mem.destiny.flagName];
    if (flag) {
        // get task memory
        let memory = Task.sourceKiller.memory(flag);
        // clean/validate task memory running creeps
        Task.validateRunning(memory, flag, mod.name, {roomName: flag.pos.roomName, deadCreep: name});
    }
};
// get task memory
mod.memory = (flag) => {
    if( !flag.memory.tasks ) 
        flag.memory.tasks = {};
    if( !flag.memory.tasks.sourceKiller ) {
        flag.memory.tasks.sourceKiller = {
            queued: [], 
            spawning: [],
            running: []
        };
    }
    return flag.memory.tasks.sourceKiller;
};

mod.creep = {
    sourceKiller: {
        fixedBody: {
            [ATTACK]: 20,
            [HEAL]: 5,
            [MOVE]: 25,
        },
        multiBody: [],
        sort: (a, b) => {
            const partsOrder = [MOVE, ATTACK, HEAL];
            const indexOfA = partsOrder.indexOf(a);
            const indexOfB = partsOrder.indexOf(b);
            return indexOfA - indexOfB;
        },
        name: "sourceKiller", 
        behaviour: "sourceKiller", 
        queue: 'Low'
    },
};
