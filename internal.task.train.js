let mod = {};
module.exports = mod;
mod.minControllerLevel = 7;
mod.name = 'train';
mod.register = () => {};
mod.checkFlag = (flag) => { 
    // 2xhealer flag - flag.compareTo(FLAG_COLOR.trainHeal) 
    if (flag.compareTo(FLAG_COLOR.trainTurret) || flag.compareTo(FLAG_COLOR.boostedTrain)) {
        Util.set(flag.memory, 'task', 'train');
        Util.set(flag.memory, 'type', 'trainTurret');
        Util.set(flag.memory, 'trainCount', 1);
        return true;
    }
    return false;
};
mod.handleFlagRemoved = flagName => {
    // check flag
    let flagMem = Memory.flags[flagName];
    if( flagMem && flagMem.task === 'train' && flagMem.roomName ){
        // if there is still a train flag in that room ignore. 
        // 2x heal flag - FLAG_COLOR.trainHeal ||
        let flags = FlagDir.filter((FLAG_COLOR.trainTurret), new RoomPosition(25,25,flagMem.roomName), true);
        if( flags && flags.length > 0 ) 
            return;
        else {
            for (let trainNum in Task.train.memory(flagMem)) {
                // no more train in that room, clear memory
                Task.removeQueued(Task.train.trainMemory(flagMem, trainNum));
            }
        }
    }
};
mod.handleFlagFound = flag => {
    // Analyze Flag
    if (Task.train.checkFlag(flag) && Task.nextCreepCheck(flag, mod.name)){
        // check if a new creep has to be spawned
        Task.train.checkForRequiredCreeps(flag);
    }
};
// remove creep from task memory of queued creeps
mod.handleSpawningStarted = params => {
    if ( !params.destiny || !params.destiny.task || params.destiny.task != 'train' )
        return;
    const flag = Game.flags[params.destiny.targetName];
    if (flag) {
        const memory = Task.train.trainMemory(flag, params.destiny.trainNum);
        if (params.body) params.body = _.countBy(params.body);
        // save spawning creep to task memory
        params.trainNum = params.destiny.trainNum;
        params.trainOrder = params.destiny.trainOrder;
        memory.spawning.push(params);
        // clean/validate task memory queued creeps
        Task.validateQueued(memory, flag, mod.name);
    }
};
mod.handleSpawningCompleted = creep => {
    if ( !creep.data.destiny || !creep.data.destiny.task || creep.data.destiny.task != mod.name )
        return;
    if( creep.data.destiny.homeRoom ) {
        creep.data.homeRoom = creep.data.destiny.homeRoom;
    }
    const flag = Game.flags[creep.data.destiny.targetName];
    if (flag) {
        // calculate & set time required to spawn and send next substitute creep
        // TODO: implement better distance calculation
        creep.data.predictedRenewal = creep.data.spawningTime + (routeRange(creep.data.homeRoom, creep.data.destiny.room)*50);
        // get task memory
        const trainNum = creep.data.destiny.trainNum;
        const trainOrder = creep.data.destiny.trainOrder;
        const memory = Task.train.trainMemory(flag, trainNum);
        // save running creep to task memory
        memory.running.push({
            name: creep.name,
            trainNum,
            trainOrder,
        });
        // clean/validate task memory spawning creeps
        Task.validateSpawning(memory, flag, mod.name);
    }
};
// when a creep died (or will die soon)
mod.handleCreepDied = name => {
    // get creep memory
    let mem = Memory.population[name];
    // ensure it is a creep which has been requested by this task (else return)
    if (!mem || !mem.destiny || !mem.destiny.task || mem.destiny.task != mod.name)
        return;
    const flag = Game.flags[mem.destiny.targetName];
    if (flag) {
        // clean/validate task memory running creeps
        const memory = Task.train.trainMemory(flag, mem.destiny.trainNum);
        Task.validateRunning(memory, flag, mod.name, {roomName: mem.destiny.room, deadCreep: name});
    }
};
// check if a new creep has to be spawned
mod.checkForRequiredCreeps = (flag) => {
    // console.log(mod.name, flag.name, 'checkRequired');
    const roomName = flag.pos.roomName;
    const members = Task.train.getMembers(flag);
    const trainCount = flag.memory.trainCount;

    for (let trainNum = 0; trainNum < trainCount; trainNum++) {
        // roomName as key prevents accidentally processing same room multiple times if flags > 1
        const memory = Task.train.trainMemory(flag, trainNum);
        Task.validateAll(memory, flag, mod.name, {roomName, checkValid: true});
        for (let order = 0; order < members.length; order++) {
            const type = members[order];
            // do we have a queued/spawning/running creep of the correct order?
            if (!_.some([memory.running, memory.spawning, memory.queued], q => _.some(q, {trainOrder: order}))) {
                const definition = Object.assign({}, Task.train.creep[type]);
                definition.name = 'T' + trainNum + '.' + order + '-' + definition.name;
                let boosted = flag.compareTo(FLAG_COLOR.boostedTrain) ? true : false;
                if(boosted){
                    definition.fixedBody = definition.boostedBody.fixedBody;
                    definition.multiBody = definition.boostedBody.multiBody;
                }
                Task.spawn(
                    definition, // creepDefinition
                    { // destiny
                        task: flag.memory.task, // taskName
                        targetName: flag.name, // targetName
                        trainOrder: order, // which member am I?
                        trainNum, // which train is this?
                        type: definition.behaviour, // custom
                        boosted: boosted,
                    }, 
                    { // spawn room selection params
                        targetRoom: roomName,
                        minEnergyCapacity: definition.minEnergyCapacity,
                        rangeRclRatio: 1,
                        allowTargetRoom: true,
                    },
                    creepSetup => { // onQueued callback
                        memory.queued.push({
                            room: creepSetup.queueRoom,
                            name: creepSetup.name,
                            trainNum,
                            trainOrder: order,
                        });
                    }
                );
            }
        }
    }
};
mod.getMembers = flag => {
    return Task.train.members[flag.memory.type];
};
mod.trainLength = type => {
    return Task.train.members[type].length;
};
// find the creep directly ahead of creep in the same train
mod.findLeading = function(creep) {
    // find the creep ahead of us in the train
    return mod.findMember(creep, creep.data.destiny.trainOrder - 1);
};
// find the creep at position 'order' in the same train as creep
mod.findMember = function(creep, order) {
    const trainNum = creep.data.destiny.trainNum;
    return Game.creeps[creep.findGroupMemberBy(c => c.destiny && c.destiny.trainOrder === order && c.destiny.trainNum === trainNum)];
};
mod.memory = flag => {
    return Util.get(flag.memory || flag, ['tasks', mod.name], {});
};
mod.trainMemory = (flag, trainNum) => {
    const memory = Util.get(Task.train.memory(flag), trainNum, {});
    Util.set(memory, 'queued', []);
    Util.set(memory, 'spawning', []);
    Util.set(memory, 'running', []);
    return memory;
};
mod.members = {
    trainTurret: [
        'trainLeader',
        'trainMedic',
        'trainRanged'
    ],
};
mod.creep = {
    trainLeader: {
        name: 'leader',
        behaviour: 'trainLeader',
        queue: 'Low',
        fixedBody: [],
        multiBody: [MOVE, WORK],
        boostedBody: {
            fixedBody:[RANGED_ATTACK],
            multiBody:[TOUGH,WORK,WORK,MOVE],
        },
        minMulti: 25,
        maxMulti: 25,
        minAbsEnergyAvailable: 3750,
        minEnergyAvailable: 0.5,
    },
    trainMedic: {
        name: 'medic',
        behaviour: 'trainMedic',
        queue: 'Low',
        fixedBody: [],
        multiBody: [MOVE, HEAL],
        boostedBody: {
            fixedBody:[],
            multiBody:[TOUGH,HEAL,HEAL,MOVE],
        },
        minMulti: 7,
        maxMulti: 25,
        minAbsEnergyAvailable: 3600,
        minEnergyAvailable: 0.5,
    },
    trainRanged: {
        name: 'turret',
        behaviour: 'trainRanged',
        queue: 'Low',
        fixedBody: [],
        multiBody: [MOVE, RANGED_ATTACK],
        boostedBody: {
            fixedBody:[],
            multiBody:[TOUGH,RANGED_ATTACK,RANGED_ATTACK,MOVE],
        },
        minMulti: 18,
        maxMulti: 25,
        minAbsEnergyAvailable: 3600,
        minEnergyAvailable: 0.5,
    },
    // Old setups we can't currently spawn using Task.spawn
    // trainRangedLow: {
    //     fixedBody: [TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE],
    //     multiBody: [MOVE, RANGED_ATTACK],
    //     minAbsEnergyAvailable: 2300,
    //     minEnergyAvailable: 0.5,
    //     minMulti: 8,
    //     maxMulti: 20,
    // },
    // trainMedicLow: {
    //     fixedBody: [TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE],
    //     multiBody: [MOVE, HEAL],
    //     minAbsEnergyAvailable: 2280,
    //     minEnergyAvailable: 0.5,
    //     minMulti: 7,
    //     maxMulti: 25,
    // },
};
