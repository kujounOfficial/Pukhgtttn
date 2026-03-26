const base = Module.findBaseAddress("libg.so");
const malloc = new NativeFunction(Module.getExportByName("libc.so", "malloc"), "pointer", ["uint"]);

let state = {
    aimbot: true,
    dodge: true
}

const OFFSETS = {
    LogicBattleModeClient_update: 0xB1E934,
    BattleMode_getInstance: 0x906734,
    LogicGameObjectClient_getX: 0xA7C8EC,
    LogicGameObjectClient_getY: 0xA7C8F4,
    LogicBattleModeClient_getOwnCharacter: 0xB2047C,
    ClientInput_type_offset: 4,
    BattleScreen_getClosestTargetForAutoshoot: 0x7C7778,
    BattleScreen_activateSkill: 0x7B6C90,
    Gui_getInstance: 0x573ED0,
    StringCtor: 0xD525A0,
    Gui_showFloaterTextAtDefaultPos: 0x7CB220,
    LogicBattleModeClient_getOwnPlayerTeam: 0xB200D4,
    LogicGameObjectClient_getGlobalID: 0xA7C898,
    LogicGameObjectClient_getData: 0xA7C61C,
    LogicProjectileData_getRadius: 0xA204FC,
    LogicProjectileData_getSpeed: 0xA2047C,
    VTABLE_PROJECTILE_DATA: 0x10C36F8,
    LogicCharacterData_getCollisionRadius: 0x9DC700,
    ClientInputManager_addInput: 0x752564,
    ClientInput_constructor_int: 0xAE44EC
};

const natives = {
    BattleMode_getInstance: new NativeFunction(base.add(OFFSETS.BattleMode_getInstance), "pointer", []),
    LogicGameObjectClient_getX: new NativeFunction(base.add(OFFSETS.LogicGameObjectClient_getX), "uint32", ["pointer"]),
    LogicGameObjectClient_getY: new NativeFunction(base.add(OFFSETS.LogicGameObjectClient_getY), "uint32", ["pointer"]),
    LogicBattleModeClient_getOwnCharacter: new NativeFunction(base.add(OFFSETS.LogicBattleModeClient_getOwnCharacter), "pointer", ["pointer"]),
    Gui_getInstance: new NativeFunction(base.add(OFFSETS.Gui_getInstance), "pointer", []),
    StringCtor: new NativeFunction(base.add(OFFSETS.StringCtor), "pointer", ["pointer", "pointer"]),
    Gui_showFloaterTextAtDefaultPos: new NativeFunction(base.add(OFFSETS.Gui_showFloaterTextAtDefaultPos), "void", ["pointer", "pointer", "int", "int"]),
    LogicGameObjectClient_getGlobalID: new NativeFunction(base.add(OFFSETS.LogicGameObjectClient_getGlobalID), "uint32", ["pointer"]),
    LogicBattleModeClient_getOwnCharacter: new NativeFunction(base.add(OFFSETS.LogicBattleModeClient_getOwnCharacter), "pointer", ["pointer"]),
    LogicBattleModeClient_getOwnPlayerTeam: new NativeFunction(base.add(OFFSETS.LogicBattleModeClient_getOwnPlayerTeam), "uint32", ["pointer"]),
    LogicGameObjectClient_getData: new NativeFunction(base.add(OFFSETS.LogicGameObjectClient_getData), "pointer", ["pointer"]),
    LogicProjectileData_getSpeed: new NativeFunction(base.add(OFFSETS.LogicProjectileData_getSpeed), "uint32", ["pointer"]),
    LogicProjectileData_getRadius: new NativeFunction(base.add(OFFSETS.LogicProjectileData_getRadius), "uint32", ["pointer"]),
    LogicCharacterData_getCollisionRadius: new NativeFunction(base.add(OFFSETS.LogicCharacterData_getCollisionRadius), "uint32", ["pointer"]),
    ClientInput_constructor_int: new NativeFunction(base.add(OFFSETS.ClientInput_constructor_int), "pointer", ["pointer", "int"]),
    ClientInputManager_addInput: new NativeFunction(base.add(OFFSETS.ClientInputManager_addInput), "void", ["pointer", "pointer"]),
};

//CONFIG
const config = {
    lastpositionsLen: 3,
    projectileSpeed: 3255,
    useWeightedAverage: false,
    timeToHitMultiplyCoeficient: 0.8
};
//CONFIG

//AIMBOT
const getinstance = natives.Gui_getInstance;
const stringctor = natives.StringCtor;
const floater = natives.Gui_showFloaterTextAtDefaultPos;

const latestX = createRecentArray(config.lastpositionsLen);
const latestY = createRecentArray(config.lastpositionsLen);
const timeDiffs = createRecentArray(config.lastpositionsLen - 1);
let battleMode = null;
let lastTime = 0;

function createRecentArray(max = 2) {
    const arr = [];
    return {
        array: arr,
        push: val => {
            arr.push(val);
            if (arr.length > max) arr.shift();
        },
        setMax: newMax => {
            max = newMax;
            while (arr.length > max) arr.shift();
        }
    };
}

function predictFuturePosition(timeToPredictSeconds) {
    if (latestX.array.length < 2 || timeDiffs.array.length < 1) {
        return { x: latestX.array[latestX.array.length - 1] || 0, y: latestY.array[latestY.array.length - 1] || 0 };
    }

    const totalTimeDiff = timeDiffs.array.reduce((sum, diff) => sum + diff, 0);
    const avgTimeDiff = totalTimeDiff / timeDiffs.array.length / 1000;

    let totalVx = 0;
    let totalVy = 0;
    let weightSum = 0;

    for (let i = 1; i < latestX.array.length; i++) {
        const dx = latestX.array[i] - latestX.array[i - 1];
        const dy = latestY.array[i] - latestY.array[i - 1];
        const dt = timeDiffs.array[i - 1] / 1000;

        if (dt <= 0) continue;

        const weight = i;
        totalVx += (dx / dt) * weight;
        totalVy += (dy / dt) * weight;
        weightSum += weight;
    }

    const avgVx = weightSum > 0 ? totalVx / weightSum : 0;
    const avgVy = weightSum > 0 ? totalVy / weightSum : 0;

    const currentX = latestX.array[latestX.array.length - 1];
    const currentY = latestY.array[latestY.array.length - 1];

    const predictedX = currentX + avgVx * timeToPredictSeconds;
    const predictedY = currentY + avgVy * timeToPredictSeconds;

    return { x: predictedX, y: predictedY };
}

function calculateDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function calculateTimeToHit(x1, y1, x2, y2) {
    const distance = calculateDistance(x1, y1, x2, y2);
    return distance / config.projectileSpeed;
}

function getStrPtr(str) {
    return Memory.allocUtf8String(str);
}

function getScPtr(str) {
    var pointer = malloc(40);
    stringctor(pointer, getStrPtr(str)); 
    return pointer;
}

function showFloater(text) {
    floater(getinstance(), getScPtr(text), 0, -1);
}

function aimbot() {
    Interceptor.attach(base.add(OFFSETS.BattleScreen_getClosestTargetForAutoshoot), {
        onLeave: function(retval) {
            if (retval == 0x0) {
                return;
            }
            const x = natives.LogicGameObjectClient_getX(retval);
            const y = natives.LogicGameObjectClient_getY(retval);
            latestX.push(x);
            latestY.push(y);

            const now = Date.now();

            if (lastTime !== 0) {
                const diff = now - lastTime;
                timeDiffs.push(diff);
            }

            lastTime = now;
        }
    });

    Interceptor.attach(base.add(OFFSETS.BattleScreen_activateSkill), {
        onEnter: function(args) {
            if (!state.aimbot || !battleMode) {
                return;
            }

            let isAutoshot = (parseInt(args[6]) !== 0);
            if (!isAutoshot) {
                return;
            }

            try {
                const ownLogicCharacter = natives.LogicBattleModeClient_getOwnCharacter(battleMode);
                const ownX = natives.LogicGameObjectClient_getX(ownLogicCharacter);
                const ownY = natives.LogicGameObjectClient_getY(ownLogicCharacter);
                const timeToHit = config.timeToHitMultiplyCoeficient * calculateTimeToHit(
                    ownX, 
                    ownY, 
                    latestX.array[latestX.array.length - 1], 
                    latestY.array[latestY.array.length - 1]
                );
                const predictedPos = predictFuturePosition(timeToHit);

                args[5] = ptr(0);
                args[1] = ptr(Math.round(predictedPos.x));
                args[2] = ptr(Math.round(predictedPos.y));
            } catch (e) {
            }
        },
    });

    Interceptor.attach(base.add(OFFSETS.LogicBattleModeClient_update), {
        onEnter: function(args) {
            battleMode = args[0];
        }
    });

    showFloater("aimbot loaded");
}

//DODGE
const PTR_VTABLE_PROJECTILE_DATA = base.add(OFFSETS.VTABLE_PROJECTILE_DATA);

const CONFIG = {
    DODGE_DISTANCE: 500,
    DODGE_COOLDOWN: 10,
    INPUT_COOLDOWN: 3,
    FORCE_DODGE_DELAY: 5,
    MOVEMENT_UPDATE_INTERVAL: 3,
    DODGE_UPDATE_MS: 3,
    FORCE_BLOCK_DURATION: 300,
    PREDICTION_TIME_MS: 100
};

let current = {
    x: 0,
    y: 0
}

let previous = {
    x: 0,
    y: 0
}

let movement = {
    previousTime: 0,
    dirX: 0,
    dirY: 0,
    speed: 0
}

const projectiles = new Map();

let ownCharacter = ptr(-1);
let myRadius = 1;
let lastDodgeTime = 0;

function analyzeProjectilesAndPlayers(objects, count, myTeamId) {
    const now = Date.now();
    const currentIds = new Set();
    for (let i = 0; i < count; i++) {
        try {
            const objPtr = objects.add(i * 8).readPointer();
            if (!objPtr || objPtr.isNull()) continue;

            const dataPtr = natives.LogicGameObjectClient_getData(objPtr);
            if (!dataPtr || dataPtr.isNull()) continue;

            const vtable = dataPtr.readPointer();
            const id = natives.LogicGameObjectClient_getGlobalID(objPtr).toString();
            currentIds.add(id);

            const teamId = objPtr.add(64).readU32();
            const x = natives.LogicGameObjectClient_getX(objPtr);
            const y = natives.LogicGameObjectClient_getY(objPtr);

            if (vtable.equals(PTR_VTABLE_PROJECTILE_DATA)) {
                const stateFlag = objPtr.add(208).readU32();
                if (teamId === myTeamId || stateFlag !== 0) {
                    projectiles.delete(id);
                    continue;
                }

                const speed = natives.LogicProjectileData_getSpeed(dataPtr);
                const radius = natives.LogicProjectileData_getRadius(dataPtr);

                const prev = projectiles.get(id) || {};

                let dirx = x - (prev.x || x);
                let diry = y - (prev.y || y);

                const length = Math.sqrt(dirx * dirx + diry * diry);

                if (length > 0) {
                    dirx = dirx / length;
                    diry = diry / length;
                } else {
                    dirx = 0;
                    diry = 0;
                }

                projectiles.set(id, {
                    x: x,
                    y: y,
                    speed: speed,
                    radius: radius,
                    dirX: dirx,
                    dirY: diry,
                    lastSeen: now
                });
            }
        } catch (e) {}
    }

    for (const id of projectiles.keys()) {
        const p = projectiles.get(id);
        if (!currentIds.has(id) || now - p.lastSeen > 1000) {
            projectiles.delete(id);
        }
    }
}

function predictPosition(x, y, dirX, dirY, speed, timeMs) {
    const timeSec = timeMs / 1000;
    return {
        x: x + dirX * speed * timeSec,
        y: y + dirY * speed * timeSec
    };
}

function willCollide(projectile, myX, myY, myRadius) {
    const prediction = predictPosition(
        projectile.x,
        projectile.y,
        projectile.dirX,
        projectile.dirY,
        projectile.speed,
        CONFIG.PREDICTION_TIME_MS
    );

    const dx = prediction.x - myX;
    const dy = prediction.y - myY;
    const distanceSq = dx * dx + dy * dy;
    const collisionRadius = myRadius + projectile.radius;

    return distanceSq <= (collisionRadius * collisionRadius);
}

function getDodgeDirection(projectile, myX, myY) {
    // Směr projektilu
    const projDirX = projectile.dirX;
    const projDirY = projectile.dirY;

    // Vektor od hráče k projektilu
    const toProjX = projectile.x - myX;
    const toProjY = projectile.y - myY;

    // Normálový vektor k směru projektilu (dva možné směry)
    const normal1X = -projDirY;
    const normal1Y = projDirX;
    const normal2X = projDirY;
    const normal2Y = -projDirX;

    // Vybereme normálový vektor, který směřuje "stranou" od projektilu
    // Použijeme vektorový součin pro zjištění směru
    const dotProduct1 = toProjX * normal1X + toProjY * normal1Y;
    const dodgeDirX = dotProduct1 > 0 ? normal1X : normal2X;
    const dodgeDirY = dotProduct1 > 0 ? normal1Y : normal2Y;

    // Normalizujeme vektor úhybu
    const length = Math.sqrt(dodgeDirX * dodgeDirX + dodgeDirY * dodgeDirY);
    if (length > 0) {
        return { x: dodgeDirX / length, y: dodgeDirY / length };
    } else {
        return { x: 1, y: 0 }; // Výchozí směr
    }
}

function dodge() {
    Interceptor.attach(base.add(OFFSETS.ClientInputManager_addInput), {
        onEnter: function(args) {
            try {
                if (!state.dodge) return;
                const inputPtr = args[1];
                const inputId = inputPtr.add(10).readInt().toString();
                const now = Date.now();
                showFloater(inputId);
                /*/
                if (!inputPtr.isNull() && (now - lastDodgeTime > CONFIG.DODGE_COOLDOWN)) {
                    const moveX = inputPtr.add(8).readS32();
                    const moveY = inputPtr.add(12).readS32();

                    if (!ownCharacter.isNull()) {
                        const myX = natives.LogicGameObjectClient_getX(ownCharacter);
                        const myY = natives.LogicGameObjectClient_getY(ownCharacter);

                        let needsToDodge = false;
                        let bestDodgeDir = { x: 0, y: 0 };

                        for (const projectile of projectiles.values()) {
                            if (willCollide(projectile, myX, myY, myRadius)) {
                                needsToDodge = true;
                                bestDodgeDir = getDodgeDirection(projectile, myX, myY);
                                break; // Prozatím reagujeme na první hrozící projektil
                            }
                        }

                        if (needsToDodge) {
                            lastDodgeTime = now;
                            const dodgeStrength = CONFIG.DODGE_DISTANCE; // Jak daleko uhnout
                            const dodgeMoveX = Math.round(myX + bestDodgeDir.x * dodgeStrength);
                            const dodgeMoveY = Math.round(myY + bestDodgeDir.y * dodgeStrength);

                            inputPtr.add(8).writeS32(dodgeMoveX);
                            inputPtr.add(12).writeS32(dodgeMoveY);
                        }
                    }
                }
                /*/
            } catch (e) {}
        }
    });

    Interceptor.attach(base.add(OFFSETS.LogicBattleModeClient_update), {
        onEnter: function(args) {
            const battleMode = args[0];
            const now = Date.now();
            if (!state.dodge) return;

            try {
                ownCharacter = natives.LogicBattleModeClient_getOwnCharacter(battleMode);
                let ownTeamId = natives.LogicBattleModeClient_getOwnPlayerTeam(battleMode);
                if (!ownCharacter || ownCharacter.isNull() || ownTeamId === -1) return;

                //let data = natives.LogicGameObjectClient_getData(ownCharacter);
                //myRadius = natives.LogicCharacterData_getCollisionRadius(data);

                //const myX = natives.LogicGameObjectClient_getX(ownCharacter);
                //const myY = natives.LogicGameObjectClient_getY(ownCharacter);

                const objMgr = battleMode.add(40).readPointer();
                if (!objMgr || objMgr.isNull()) return;

                const objects = objMgr.readPointer();
                const count = objMgr.add(12).readU32();
            } catch (e) {}
        }
    });

    showFloater("dodge loaded");
}

function main() {
    aimbot();
    dodge();
}

setTimeout(main, 5000);