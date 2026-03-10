
// Mock Helpers
function toLocalISO(d) { const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0'); return `${y}-${m}-${day}`; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function parseISO(s) { const [y, m, d] = s.split('-').map(Number); const dt = new Date(y, (m || 1) - 1, d || 1); dt.setHours(0, 0, 0, 0); return dt; }
function dayIndex(dateObj) { const js = dateObj.getDay(); return (js + 6) % 7; }

// Mock State
const state = {
    vacations: []
};

// Mock Functions
function getEffectiveSchedule(mod, dateObj) {
    // Simplified: always return [2, 2, 2, 2, 2, 0, 0] (10 hours a week)
    return [2, 2, 2, 2, 2, 0, 0];
}

function getGroupEventType(dateObj, group) { return null; }

function getDayInfo(mod, dateObj) {
    const idx = dayIndex(dateObj);
    const count = getEffectiveSchedule(mod, dateObj)[idx];
    return { count, start: 1, event: null };
}

function dayPlanRaw(mod, dateObj) {
    if (parseISO(mod.start) > dateObj) return 0;
    return getDayInfo(mod, dateObj).count;
}

function plannedByCapped(mod, dateISO) {
    const end = parseISO(dateISO);
    let cur = parseISO(mod.start);
    let acc = 0;
    for (let i = 0; i < 365 * 6 && cur <= end; i++) {
        const left = Math.max(0, Number(mod.target || 0) - acc);
        if (left <= 0) break;
        const raw = dayPlanRaw(mod, cur);
        const add = Math.min(raw, left);
        acc += add;
        cur = addDays(cur, 1);
    }
    return acc;
}

// The Logic to Test (WITH FIX)
function runSimulation(modStart, gridStartYear) {
    const startDate = new Date(gridStartYear, 8, 1); // 2025-09-01
    const m = {
        id: 'test',
        target: 100, // 100 hours
        start: modStart // e.g. '2025-08-01'
    };

    console.log(`--- Simulation: Mod Start ${modStart}, Grid Start ${toLocalISO(startDate)} ---`);

    // NEW LOGIC FROM APP.JS
    const modHours = {};
    let acc = 0;
    // START FROM MODULE START
    let simDate = m.start ? parseISO(m.start) : new Date(startDate);

    const gridEndMs = new Date(gridStartYear + 1, 6, 1).getTime(); // July 1st next year
    const gridStartMs = startDate.getTime();

    console.log(`Debug: Grid Start: ${startDate.toISOString()}, Grid End: ${new Date(gridEndMs).toISOString()}`);
    console.log(`Debug: Sim Start: ${simDate.toISOString()}`);

    let safety = 365 * 5;

    while (simDate.getTime() < gridEndMs && safety-- > 0) {
        if (acc >= m.target) {
            console.log(`Debug: Target reached at ${simDate.toISOString()} with acc ${acc}`);
            break;
        }

        const dStr = toLocalISO(simDate);
        const raw = dayPlanRaw(m, simDate);

        if (raw > 0) {
            const left = m.target - acc;
            const add = Math.min(raw, left);
            if (add > 0) {
                acc += add;
                // Only record if within grid range
                if (simDate.getTime() >= gridStartMs) {
                    // console.log(`Debug: Adding ${add} hours on ${dStr}`);
                    modHours[dStr] = add;
                }
            }
        }
        simDate.setDate(simDate.getDate() + 1);
    }

    console.log(`Total Progress: ${acc}`);
    const schedDays = Object.keys(modHours);
    if (schedDays.length > 0) {
        console.log(`Grid Hours Scheduled: ${schedDays.length * 2} (approx)`); // assuming 2 hours/day for simplicity in summary
        console.log(`First Grid Day: ${schedDays[0]}`);
        console.log(`Last Grid Day: ${schedDays[schedDays.length - 1]}`);
    } else {
        console.log(`Grid Hours Scheduled: 0`);
    }
    console.log('--------------------------------------------------');
}

// Scenarios
runSimulation('2025-09-01', 2025); // Starts ON grid start
runSimulation('2025-10-01', 2025); // Starts AFTER grid start
runSimulation('2025-08-01', 2025); // Starts BEFORE grid start (Should have pre-grid hours!)
