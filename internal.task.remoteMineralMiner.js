const mod = {};
module.exports = mod;
mod.name = 'remoteMineralMiner';
mod.minControllerLevel = 2;
mod.maxCount = flag => {
    if (flag.memory.noMineralMiners) return 0;
    if (!flag.room) return 1;
    let max = 0;
    flag.room.minerals.forEach(mineral => {
        if (mineral.mineralAmount > 0) max++;
    });
    return max;
};
mod.name = 'remoteMineralMiner';
mod.register = () => {};
mod.checkValidRoom = flag => {
    return Room.isCenterNineRoom(flag.pos.roomName);
};
mod.handleFlagFound = flag => {
    if (Task.remoteMineralMiner.checkValidRoom(flag) && flag.compareTo(FLAG_COLOR.claim.mining) && Task.nextCreepCheck(flag, mod.name)) {
        Util.set(flag.memory, 'task', mod.name);
        Task.remoteMineralMiner.checkForRequiredCreeps(flag);
    }
};
mod.handleFlagRemoved = flagName => {
    const flagMem = Memory.flags[flagName];
    
    if (flagMem && flagMem.task === mod.name && flagMem.roomName) {
        const flags = FlagDir.filter(FLAG_COLOR.claim.mining, new RoomPosition(25, 25, flagMem.roomName), true);
        if (flags && flags.length > 0) {
            return;
        }
        Task.clearMemory(mod.name, flagMem.roomName);
    }
};
mod.fieldOrFunction = (flag, value) => {
    return typeof value === 'function' ? value(flag) : value;
};
mod.checkForRequiredCreeps = flag => {
    // console.log(mod.name, flag.name, 'checkRequired');
    const roomName = flag.pos.roomName;
    const flagName = flag.name;
    const room = Game.rooms[roomName];
    
    const type = mod.name;
    
    const memory = Task.remoteMineralMiner.memory(roomName);   
    // re-validate if too much time has passed in the queue
    Task.validateAll(memory, flag, mod.name, {roomName: flag.pos.roomName, subKey: 'remoteMineralMiner', checkValid: true});
    const mineralMinerCount = memory.queued[type].length + memory.spawning[type].length + memory.running[type].length;
    
    if(DEBUG && TRACE) trace('Task', {Task: mod.name, flagName, mineralMinerCount, [mod.name]: 'Flag.found'}, 'checking flag@', flag.pos);
    
    if (mineralMinerCount < Task.remoteMineralMiner.fieldOrFunction(flag, mod.maxCount)) {
        if (DEBUG && TRACE) trace('Task', {Task: mod.name, room: roomName, mineralMinerCount, mineralMinerTTLs: _.map(_.map(memory.running.remoteMineralMiner, n => Game.creeps[n]), 'ticksToLive'), [mod.name]: 'mineralMinerCount'});
        
        const mineralMiner = mod.setupCreep(roomName, Task.remoteMineralMiner.creep);
        
        for (let i = mineralMinerCount; i < Task.remoteMineralMiner.fieldOrFunction(flag, mod.maxCount); i++) {
            Task.spawn(
                mineralMiner,
                {
                    task: mod.name,
                    targetName: flag.name,
                    type: Task.remoteMineralMiner.creep.behaviour,
                },
                {
                    targetRoom: roomName,
                    minEnergyCapacity: 550,
                    rangeRclRatio: 1,
                },
                creepSetup => {
                    const memory = Task.remoteMineralMiner.memory(creepSetup.destiny.room);
                    memory.queued[creepSetup.behaviour].push({
                        room: creepSetup.queueRoom,
                        name: creepSetup.name,
                    });
                }
            );
        }
    }
};
mod.handleSpawningStarted = params => {
    if (!params.destiny || !params.destiny.task || params.destiny.task !== mod.name) return;
    const flag = Game.flags[params.destiny.targetName]; 
    if (flag) {
        const memory = Task.remoteMineralMiner.memory(params.destiny.room);
        Task.validateQueued(memory, mod.name, {subKey: params.destiny.type});

        if (params.body) params.body = _.countBy(params.body);
        memory.spawning[params.destiny.type].push(params);
    }
};
mod.handleSpawningCompleted = creep => {
    if (!creep.data.destiny || !creep.data.destiny.task || creep.data.destiny.task !== mod.name) {
        return;
    }
    if (creep.data.destiny.homeRoom) {
        creep.data.homeRoom = creep.data.destiny.homeRoom;
    }
    const flag = Game.flags[creep.data.destiny.targetName];
    if (flag) {
        creep.data.predictedRenewal = creep.data.spawningTime + routeRange(creep.data.homeRoom, creep.data.destiny.room) * 50;
        
        const memory = Task.remoteMineralMiner.memory(creep.data.destiny.room);
        memory.running[creep.data.destiny.type].push(creep.name);
        Task.validateSpawning(memory, flag, mod.name, {roomName: creep.data.destiny.room, subKey: creep.data.destiny.type});
    }
};
mod.handleCreepDied = name => {
    const mem = Memory.population[name];
    
    if (!mem || !mem.destiny || !mem.destiny.task || mem.destiny.task !== mod.name) return;
    const flag = Game.flags[mem.destiny.targetName];
    if (flag) {
        const memory = Task.mining.memory(mem.destiny.room);
        Task.validateRunning(memory, flag, mod.name, {subKey: mem.creepType, deadCreep: name});
    }
};
mod.needsReplacement = creep => {
    return !creep || (creep.ticksToLive || CREEP_LIFE_TIME) < (creep.data.predictedRenewal || 0);
};
mod.findSpawning = (roomName, type) => {
    const spawning = [];
    _(Game.spawns)
        .filter(s => s.spawning && (_.includes(s.spawning.name, type) || (s.newSpawn && _.includes(s.newSpawn.name, type))))
        .forEach(s => {
            const c = Population.getCreep(s.spawning.name);
            if (c && c.destiny.room === roomName) {
                spawning.push({
                    spawn: s.name,
                    name: s.spawning.name,
                    destiny: c.name,
                });
            }
        });
    return spawning;
};
mod.findRunning = (roomName, type) => {
    return _(Game.creeps)
        .filter(c => !c.spawning && c.data && c.data.creepType === type && c.data.destiny && c.data.destiny.room === roomName)
        .map(c => c.name);
};
mod.memory = key => {
    const memory = Task.memory(mod.name, key);
    if (!Reflect.has(memory, 'queued')) {
        memory.queued = {
            remoteMineralMiner: [],
        };
    }
    if (!Reflect.has(memory, 'spawning')) {
        memory.spawning = {
            remoteMineralMiner: Task.remoteMineralMiner.findSpawning(key, 'remoteMineralMiner'),
        };
    }
    if (!Reflect.has(memory, 'running')) {
        memory.running = {
            remoteMineralMiner: Task.remoteMineralMiner.findRunning(key, 'remoteMineralMiner'),
        };
    }
    return memory;
};
mod.creep = {
    fixedBody: [WORK, WORK, WORK, CARRY, MOVE],
    multiBody: [WORK, WORK, WORK, MOVE],
    minMulti: 1,
    maxMulti: 11,
    behaviour: 'remoteMineralMiner',
    queue: 'Low',
};
mod.setupCreep = (roomName, definition) => {
    const memory = Task.remoteMineralMiner.memory(roomName);
    if (!memory.harvestSize) {
        return definition;
    }
    
    const isWork = b => b === WORK;
    const baseBody = _.reject(definition.fixedBody, isWork);
    const workParts = _.sum(definition.fixedBody, isWork) + memory.harvestSize;
    
    return _.create(definition, {
        fixedBody: _.times(workParts, _.constant(WORK))
            .concat(_.times(Math.ceil(memory.harvestSize * 0.5), _.constant(MOVE)))
            .concat(baseBody),
        moveBalance: (memory.havestSize % 2) * -0.5,
    });
};