
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

// The Logic to Test
function runSimulation(modStart, gridStartYear) {
    const startDate = new Date(gridStartYear, 8, 1); // 2025-09-01
    const m = {
        id: 'test',
        target: 100, // 100 hours
        start: modStart // e.g. '2025-08-01'
    };

    console.log(`--- Simulation: Mod Start ${modStart}, Grid Start ${toLocalISO(startDate)} ---`);

    const modHours = {};
    let d = new Date(startDate);
    let acc = 0;

    // Simulate loop
    for (let i = 0; i < 370; i++) {
        if (acc >= m.target) break;

        let canCount = true;
        if (m.start) {
            const s = parseISO(m.start);
            if (d < s) canCount = false;
        }

        if (canCount) {
            const info = getDayInfo(m, d);
            if (info.count > 0) {
                const left = m.target - acc;
                const add = Math.min(info.count, left);
                if (add > 0) {
                    modHours[toLocalISO(d)] = add;
                    acc += add;
                }
            }
        }
        d = addDays(d, 1);
    }

    console.log(`Total Scheduled in Grid: ${acc}`);
    const firstDay = Object.keys(modHours)[0];
    console.log(`First Day with Hours: ${firstDay}`);
    console.log(`Last Day with Hours: ${Object.keys(modHours)[Object.keys(modHours).length - 1]}`);
    console.log('--------------------------------------------------');
}

// Scenarios
runSimulation('2025-09-01', 2025); // Starts ON grid start
runSimulation('2025-10-01', 2025); // Starts AFTER grid start
runSimulation('2025-08-01', 2025); // Starts BEFORE grid start
