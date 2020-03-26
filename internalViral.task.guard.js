let mod = {};
module.exports = mod;
mod.creep = {
    guard: {
        fixedBody: [ATTACK, MOVE],
        multiBody: [TOUGH, ATTACK, RANGED_ATTACK, HEAL, MOVE, MOVE],
        boostedBody: {
            fixedBody:[RANGED_ATTACK,MOVE],
            multiBody:[TOUGH,RANGED_ATTACK,HEAL,MOVE],
        },
        name: "guard", 
        behaviour: "warrior", 
        queue: 'Low'
    },
};
mod.handleFlagFound = flag => {
    // if it is a yellow/yellow flag
    if ((flag.compareTo(FLAG_COLOR.defense) || flag.compareTo(FLAG_COLOR.defense.boosted)) && Task.nextCreepCheck(flag, mod.name)) {
        Util.set(flag.memory, 'task', mod.name);
        // check if a new creep has to be spawned
        Task.guard.checkForRequiredCreeps(flag);
    }
};
mod.checkForRequiredCreeps = (flag) => {
    // get task memory
    let memory = Task.guard.memory(flag);
    // re-validate if too much time has passed
    Task.validateAll(memory, flag, mod.name, {roomName: flag.pos.roomName, checkValid: true});
    // count creeps assigned to task
    let count = memory.queued.length + memory.spawning.length + memory.running.length;
    let boosted = flag.compareTo(FLAG_COLOR.defense.boosted) ? true : false;
    let guard = Task.guard.creep.guard;
    if(boosted){
        guard.fixedBody=guard.boostedBody.fixedBody;
        guard.multiBody=guard.boostedBody.multiBody;
    }
    // if creep count below requirement spawn a new creep creep
    if( count < 1 ) {
        Task.spawn(
            guard, // creepDefinition
            { // destiny
                task: 'guard', // taskName
                targetName: flag.name, // targetName
                flagName: flag.name, // custom
                boosted: boosted, 
            }, 
            { // spawn room selection params
                targetRoom: flag.pos.roomName, 
                minEnergyCapacity: 1800, 
                rangeRclRatio: 3, // stronger preference of higher RCL rooms
                allowTargetRoom: true,
            },
            creepSetup => { // callback onQueued
                let memory = Task.guard.memory(Game.flags[creepSetup.destiny.targetName]);
                memory.queued.push({
                    room: creepSetup.queueRoom,
                    name: creepSetup.name,
                    targetName: flag.name
                });
            }
        );
    }
};
