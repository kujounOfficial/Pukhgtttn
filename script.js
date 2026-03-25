const base = Module.findBaseAddress("libg.so");
const malloc = new NativeFunction(Module.getExportByName("libc.so", "malloc"), "pointer", ["uint"]);

let state = {
    aimbot: true
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
    Gui_showFloaterTextAtDefaultPos: 0x7CB220
};

const natives = {
    BattleMode_getInstance: new NativeFunction(base.add(OFFSETS.BattleMode_getInstance), "pointer", []),
    LogicGameObjectClient_getX: new NativeFunction(base.add(OFFSETS.LogicGameObjectClient_getX), "uint32", ["pointer"]),
    LogicGameObjectClient_getY: new NativeFunction(base.add(OFFSETS.LogicGameObjectClient_getY), "uint32", ["pointer"]),
    LogicBattleModeClient_getOwnCharacter: new NativeFunction(base.add(OFFSETS.LogicBattleModeClient_getOwnCharacter), "pointer", ["pointer"]),
    Gui_getInstance: new NativeFunction(base.add(OFFSETS.Gui_getInstance), "pointer", []),
    StringCtor: new NativeFunction(base.add(OFFSETS.StringCtor), "pointer", ["pointer", "pointer"]),
    Gui_showFloaterTextAtDefaultPos: new NativeFunction(base.add(OFFSETS.Gui_showFloaterTextAtDefaultPos), "void", ["pointer", "pointer", "int", "int"])
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

function main() {
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
            logToConsole(args[6]);
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
//AIMBOT

setTimeout(main, 10000);
