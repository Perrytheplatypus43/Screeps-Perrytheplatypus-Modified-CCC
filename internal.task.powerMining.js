let mod = {};
module.exports = mod;
mod.minControllerLevel = 7;
mod.name = 'powerMining';
mod.register = () => {};
mod.handleFlagRemoved = flagName => {
    // check flag
    const flagMem = Memory.flags[flagName];
    if( flagMem && flagMem.task === mod.name && flagMem.roomName ){
        // if there is still a powerMining flag in that room ignore. 
        const flags = FlagDir.filter(FLAG_COLOR.powerMining, new RoomPosition(25,25,flagMem.roomName), true);
        if( flags && flags.length > 0 ) 
            return;
        else {
            // no more powerMining in that room. 
            // clear memory
            Task.clearMemory(mod.name, flagMem.roomName);
        }
    }
};
mod.handleFlagFound = flag => {
    // Analyze Flag
    if (flag.compareTo(FLAG_COLOR.powerMining) && Task.nextCreepCheck(flag, mod.name)){
        flag.memory.roomName = flag.pos.roomName;
        flag.memory.task = mod.name;
        // check if a new creep has to be spawned
        Task.powerMining.checkForRequiredCreeps(flag);
    }
};
// remove creep from task memory of queued creeps
mod.handleSpawningStarted = params => {
    if ( !params.destiny || !params.destiny.task || params.destiny.task != mod.name )
        return;
    const flag = Game.flags[params.destiny.targetName];
    if (flag) {
        const memory = Task.powerMining.memory(params.destiny.room);
        const priority = _.find(Task.powerMining.creep, {behaviour: params.destiny.type}).queue;
        Task.validateQueued(memory, flag, mod.name, {subKey: params.destiny.type, queues: [priority]});

        if (params.body) params.body = _.countBy(params.body);
        // save spawning creep to task memory
        memory.spawning[params.destiny.type].push(params);
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
        const memory = Task.powerMining.memory(creep.data.destiny.room);
        // save running creep to task memory
        memory.running[creep.data.destiny.type].push(creep.name);
        // clean/validate task memory spawning creeps
        Task.validateSpawning(memory, flag, mod.name, {roomName: creep.data.destiny.room, subKey: creep.data.destiny.type});
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
        const memory = Task.powerMining.memory(mem.destiny.room);
        Task.validateRunning(memory, flag, mod.name, {roomName: mem.destiny.room, subKey: mem.creepType, deadCreep: name});
    }
};
// this only exists so action.harvestPower can work, once that is refactored not to look at the task it can be removed
mod.validateRunning = function(roomName, type) {
    const memory = Task.powerMining.memory(roomName);
    Task.validateRunning(memory, null, mod.name, {roomName, subKey: type});
};
mod.needsReplacement = (creep) => {
    // (c.ticksToLive || CREEP_LIFE_TIME) < (50 * travel - 40 + c.data.spawningTime)
    return !creep || (creep.ticksToLive || CREEP_LIFE_TIME) < (creep.data.predictedRenewal || 0);
};
// check if a new creep has to be spawned
mod.checkForRequiredCreeps = (flag) => {
    // console.log(mod.name, flag.name, 'checkRequired');
    const roomName = flag.pos.roomName;
    const room = Game.rooms[roomName];
    // Use the roomName as key in Task.memory?
    // Prevents accidentally processing same room multiple times if flags > 1
    const memory = Task.powerMining.memory(roomName);

    const trainCount = memory.trainCount || 1;
    let countExisting = type => {
        const priority = _.find(Task.powerMining.creep, {behaviour: type}).queue;
        Task.validateAll(memory, flag, mod.name, {roomName, subKey: type, queues: [priority], checkValid: true});
        return memory.queued[type].length + memory.spawning[type].length + memory.running[type].length;
    };
    const haulerCount = countExisting('powerHauler');
    const minerCount = countExisting('powerMiner');
    const healerCount = countExisting('powerHealer');

   // console.log('haul '+haulerCount + ' miner ' + minerCount+' healer '+healerCount)
    if( DEBUG && TRACE ) trace('Task', {Task:mod.name, flagName:flag.name, trainCount, haulerCount, minerCount, healerCount, [mod.name]:'Flag.found'}, 'checking flag@', flag.pos);


    if(minerCount < trainCount) {
        if( DEBUG && TRACE ) trace('Task', {Task:mod.name, room:roomName, minerCount,
            minerTTLs: _.map(_.map(memory.running.powerMiner, n=>Game.creeps[n]), "ticksToLive"), [mod.name]:'minerCount'});

        for(let i = minerCount; i < trainCount; i++) {
            Task.spawn(
                Task.powerMining.creep.miner, // creepDefinition
                { // destiny
                    task: mod.name, // taskName
                    targetName: flag.name, // targetName
                    type: Task.powerMining.creep.miner.behaviour // custom
                }, 
                { // spawn room selection params
                    targetRoom: roomName,
                    minEnergyCapacity: 3000,
                    rangeRclRatio: 1,
                },
                creepSetup => { // onQueued callback
                    let memory = Task.powerMining.memory(creepSetup.destiny.room);
                    memory.queued[creepSetup.behaviour].push({
                        room: creepSetup.queueRoom,
                        name: creepSetup.name
                    });
                }
            );
        }
    }
    // spawn 2 healers after powerMiner queued, but not more than the number we want
    let maxHealers = Math.min(trainCount, minerCount) * 2;
    if(healerCount < maxHealers ) {
        for(let i = healerCount; i < maxHealers; i++) {
            Task.spawn(
                Task.powerMining.creep.healer, // creepDefinition
                { // destiny
                    task: mod.name, // taskName
                    targetName: flag.name, // targetName
                    type: Task.powerMining.creep.healer.behaviour // custom
                }, 
                { // spawn room selection params
                    targetRoom: roomName,
                    minEnergyCapacity: 3000
                },
                creepSetup => { // onQueued callback
                    let memory = Task.powerMining.memory(creepSetup.destiny.room);
                    memory.queued[creepSetup.behaviour].push({
                        room: creepSetup.queueRoom,
                        name: creepSetup.name
                    });
                }
            );
        }
    }

    // only spawn haulers when powerbank hits are lower than 650k
    // (flag && flag.room.powerBank && flag.room.powerBank.hits < 100000)
    if (!flag.room || !flag.room.powerBank) return;
    if(flag.room){
    	let maxHaulers = Math.ceil(flag.room.powerBank.power / 1250);
        let neededCarryParts = Math.ceil(flag.room.powerBank.power / 50) - (haulerCount * 25);
        if((POWER_MINE_LOG && Game.time % 20 == 0) || room.name == 'sim'){
            logSystem('Power Mining', 'Target: '+flag+' | '+flag.pos.roomName+' | Power: '+flag.room.powerBank.power+ ' | Hits Left: '+flag.room.powerBank.hits+' Haulers: '+haulerCount+'/'+maxHaulers+' Time left: '+flag.room.powerBank.ticksToDecay)
        }
        if(haulerCount < maxHaulers && (flag && flag.room.powerBank && flag.room.powerBank.hits < 400000)) {
            for(let i = haulerCount; i < maxHaulers; i++) {
                const spawnRoom = mod.strategies.hauler.spawnRoom(roomName);
                if( !spawnRoom ) break;

                const storageRoom = mod.strategies.hauler.spawnRoom(roomName) || spawnRoom;

                // spawning a new hauler
                const creepDefinition = _.create(Task.powerMining.creep.hauler);
                if (neededCarryParts > 25){
                    creepDefinition.minMulti = 24;
                    neededCarryParts -= 25;
                    if (neededCarryParts <= 0) logError('too few carry parts', haulerCount, neededCarryParts);
                } else creepDefinition.maxMulti = neededCarryParts - 1;

                Task.spawn(
                    creepDefinition,
                    { // destiny
                        task: mod.name, // taskName
                        targetName: flag.name, // targetName
                        type: Task.powerMining.creep.hauler.behaviour, // custom
                        homeRoom: storageRoom.name
                    }, {
                        targetRoom: roomName,
                        explicit: spawnRoom.name,
                    },
                    creepSetup => { // onQueued callback
                        let memory = Task.powerMining.memory(creepSetup.destiny.room);
                        memory.queued[creepSetup.behaviour].push({
                            room: creepSetup.queueRoom,
                            name: creepSetup.name,
                            body: _.countBy(creepSetup.parts)
                        });
                    }
                );
            }
        }
    }    
};
mod.findSpawning = (roomName, type) => {
    let spawning = [];
    _.forEach(Game.spawns, s => {
        if (s.spawning && (_.includes(s.spawning.name, type) || (s.newSpawn && _.includes(s.newSpawn.name, type)))) {
            let c = Population.getCreep(s.spawning.name);
            if (c && c.destiny.room === roomName) {
                let params = {
                    spawn: s.name,
                    name: s.spawning.name,
                    destiny: c.destiny
                };
                spawning.push(params);
            }
        }
    });
    return spawning;
};
mod.findRunning = (roomName, type) => {
    let running = [];
    _.forEach(Game.creeps, c => {
        if (!c.spawning && c.data.creepType === type && c.data && c.data.destiny && c.data.destiny.room === roomName) {
            running.push(c.name);
        }
    });
    return running;
};
mod.memory = key => {
    let memory = Task.memory(mod.name, key);
    if( !memory.hasOwnProperty('queued') ){
        memory.queued = {
            powerMiner:[],
            powerHauler:[],
            powerHealer:[]
        };
    }
    if( !memory.hasOwnProperty('spawning') ){
        memory.spawning = {
            powerMiner: Task.powerMining.findSpawning(key, 'powerMiner'),
            powerHauler: Task.powerMining.findSpawning(key, 'powerHauler'),
            powerHealer: Task.powerMining.findSpawning(key, 'powerHealer')
        };
    }
    if( !memory.hasOwnProperty('running') ){
        memory.running = {
            powerMiner: Task.powerMining.findRunning(key, 'powerMiner'),
            powerHauler: Task.powerMining.findRunning(key, 'powerHauler'),
            powerHealer: Task.powerMining.findRunning(key, 'powerHealer')
        };
    }
    if( !memory.hasOwnProperty('trainCount') ){
        memory.trainCount = 1;
    }
    // temporary migration
    if( memory.queued.miner ){
        memory.queued.powerMiner = memory.queued.miner;
        delete memory.queued.miner;
    }
    if( memory.queued.hauler ){
        memory.queued.powerHauler = memory.queued.hauler;
        delete memory.queued.hauler;
    }
    if( memory.queued.healer ){
        memory.queued.powerHealer = memory.queued.healer;
        delete memory.queued.healer;
    }

    return memory;
};
mod.creep = {
    miner: {
        fixedBody: {
            [ATTACK]: 25,
            [MOVE]: 25,
        },
        sort: (a, b) => {
            const partsOrder = [MOVE, ATTACK];
            const indexOfA = partsOrder.indexOf(a);
            const indexOfB = partsOrder.indexOf(b);
            return indexOfA - indexOfB;
        },
        multiBody: [],
        maxMulti: 24,
        behaviour: 'powerMiner',
        queue: 'Medium' // power needs to be high ish priority as there is a time limit.
    },
    hauler: {
        fixedBody: [CARRY, MOVE],
        multiBody: [CARRY, MOVE],
        behaviour: 'powerHauler',
        queue: 'Medium'
    },
    healer: {
        fixedBody: {
            [HEAL]: 16,
            [MOVE]: 16,
        },
        multiBody: [], 
        behaviour: 'powerHealer',
        queue: 'Medium'
    }
};

mod.storage = function(roomName, storageRoom) {
    const room = Game.rooms[roomName];
    let memory = Task.powerMining.memory(roomName);
    if (storageRoom) {
        const was = memory.storageRoom;
        memory.storageRoom = storageRoom;
        return `Task.${mod.name}: room ${roomName}, now sending haulers to ${storageRoom}, (was ${was})`;
    } else if (!memory.storageRoom) {
        return `Task.${mod.name}: room ${roomName}, no custom storage destination`;
    } else if (storageRoom === false) {
        const was = memory.storageRoom;
        delete memory.storageRoom;
        return `Task.${mod.name}: room ${roomName}, cleared custom storage room (was ${was})`;
    } else {
        return `Task.${mod.name}: room ${roomName}, sending haulers to ${memory.storageRoom}`;
    }
};

mod.strategies = {
    defaultStrategy: {
        name: `default-${mod.name}`,
    },
    hauler: {
        name: `hauler-${mod.name}`,
        homeRoom: function(flagRoomName) {
            // Explicity set by user?
            let memory = Task.powerMining.memory(flagRoomName);
            if(memory.storageRoom) return Game.rooms[memory.storageRoom];
            // Otherwise, score it
            return Room.bestSpawnRoomFor(flagRoomName);
        },
        spawnRoom: function(flagRoomName) {
            return Room.findSpawnRoom({
                targetRoom: flagRoomName,
                minEnergyCapacity: 1500
            });
        },
        
    },
};
