const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => Array.from(el.querySelectorAll(q));
const storageKey = 'acad_cal_final_hybrid_fix_v27';
const LT_MONTHS = ["Sausis", "Vasaris", "Kovas", "Balandis", "Gegužė", "Birželis", "Liepa", "Rugpjūtis", "Rugsėjis", "Spalis", "Lapkritis", "Gruodis"];
const DAYS_SHORT = ['Pir', 'Ant', 'Tre', 'Ket', 'Pen', 'Šeš', 'Sek'];
const DAYS_FULL = ['Pirmadienį', 'Antradienį', 'Trečiadienį', 'Ketvirtadienį', 'Penktadienį', 'Šeštadienį', 'Sekmadienį'];
const LESSON_SLOTS = [
    { id: 0, t: "07:00 - 07:45" }, { id: 1, t: "08:00 - 08:45" }, { id: 2, t: "08:55 - 09:40" },
    { id: 3, t: "09:50 - 10:35" }, { id: 4, t: "10:45 - 11:30" }, { id: 5, t: "12:15 - 13:00" },
    { id: 6, t: "13:10 - 13:55" }, { id: 7, t: "14:05 - 14:50" }, { id: 8, t: "15:00 - 15:45" },
    { id: 9, t: "15:55 - 16:40" }, { id: 10, t: "16:50 - 17:35" }, { id: 11, t: "17:45 - 18:30" }, { id: 12, t: "18:40 - 19:25" }
];

// JSONBin.io konfigūracija
const JSONBIN_BIN_ID = 'JŪSŲ_BIN_ID'; // ĮRAŠYKITE SAVO BIN_ID ČIA! Pvz.: '65e...123'
const JSONBIN_API_KEY = 'JŪSŲ_API_KEY'; // ĮRAŠYKITE SAVO API_KEY ČIA! Pvz.: '$2a$10$abc...'
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

let state = { modules: [], vacations: [], sem2Start: '', semEnd: '' };

function isJsonBinConfigured() {
    return JSONBIN_BIN_ID !== 'JŪSŲ_BIN_ID' && JSONBIN_API_KEY !== 'JŪSŲ_API_KEY';
}

async function loadFromCloud() {
    const local = localStorage.getItem(storageKey);
    if (!isJsonBinConfigured()) {
        if (local) state = JSON.parse(local);
        return;
    }
    try {
        const res = await fetch(JSONBIN_URL, { headers: { 'X-Master-Key': JSONBIN_API_KEY } });
        const data = await res.json();
        if (data && data.record) {
            state = data.record;
            localStorage.setItem(storageKey, JSON.stringify(state)); // local backup
        }
    } catch(e) {
        console.error("Cloud load error, falling back to local:", e);
        if (local) state = JSON.parse(local);
    }
}

async function saveToCloud() {
    localStorage.setItem(storageKey, JSON.stringify(state)); // local instant save
    if (!isJsonBinConfigured()) return;
    try {
        await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_API_KEY },
            body: JSON.stringify(state)
        });
        console.log("Sėkmingai išsaugota debesyje (JSONBin)!");
    } catch(e) {
        console.error("Cloud save error:", e);
    }
}


// ... (in DOMContentLoaded event)
document.addEventListener('DOMContentLoaded', async () => {
    // Užkrauname iš debesies prieš piešdami UI
    await loadFromCloud();

    if (!state.vacations) state.vacations = [];
    if (!state.modules) state.modules = [];

    // ... existing initialization ...
    renderFilters();
    renderInputs();
    renderGroupCheckboxes(); // Init checkboxes
    renderVacations();
    renderYear();

    // Listeners for Select All / None
    const btnAll = $('#btnSelAll');
    if (btnAll) btnAll.onclick = selectAllGroups;
    const btnNone = $('#btnSelNone');
    if (btnNone) btnNone.onclick = clearGroupSelection;

    // Init actions
    const btnAdd = $('#addVac');
    if (btnAdd) {
        btnAdd.onclick = () => {
            console.log("AddVac clicked");
            try {
                // Debug 1: Entry
                // alert("DEBUG: 1. Mygtukas paspaustas");

                const vType = $('#vType').value;
                const vFrom = $('#vFrom').value;
                const vTo = $('#vTo').value;
                const vGroups = getSelectedGroups();

                // Debug 2: Values
                // alert(`DEBUG: 2. Reikšmės: Tipas=${vType}, Nuo=${vFrom}, Iki=${vTo}, Grupių=${vGroups.length}`);

                if (!vFrom || !vTo) {
                    alert('Klaida: Būtina pasirinkti "Nuo" ir "Iki" datas.');
                    return;
                }

                // Debug 3: Pushing
                if (!state.vacations) state.vacations = [];
                state.vacations.push({ type: vType, from: vFrom, to: vTo, groups: vGroups });

                // Debug 4: Saving
                save();

                // Debug 5: Rendering
                renderVacationsList();
                renderYear();
                renderVacationGantt();

                // Debug 6: Success
                // alert("Sėkmingai pridėta! Sąrašas atnaujintas.");

                // Clear inputs
                // $('#vFrom').value = ''; $('#vTo').value = ''; // Optional cleanup
                clearGroupSelection();
            } catch (err) {
                alert("KRITINĖ KLAIDA (addVac): " + err.message);
                console.error(err);
            }
        };
    } else {
        console.error("Button #addVac not found!");
    }

    // Initialize Week Picker
    // (Existing code for week picker is inside openWeeklyDialog, but we might want global one)

    // VACATION DATE PICKERS
    const vFrom = $('#vFrom');
    const vTo = $('#vTo');
    if (vFrom) flatpickr(vFrom, { locale: 'lt', allowInput: true });
    if (vTo) flatpickr(vTo, { locale: 'lt', allowInput: true });

    // ... module inputs ...
    const mStart = $('#mStart');
    if (mStart) flatpickr(mStart, { locale: 'lt', allowInput: true });

    // ... rest of init
});


function save() { saveToCloud(); }
function load() { /* loadFromCloud handles this */ }

function toLocalISO(d) { const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0'); return `${y}-${m}-${day}`; }
function todayISO() { const d = new Date(); d.setHours(0, 0, 0, 0); return toLocalISO(d); }
function yesterdayISO() { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 1); return toLocalISO(d); }
function parseISO(s) { const [y, m, d] = s.split('-').map(Number); const dt = new Date(y, (m || 1) - 1, d || 1); dt.setHours(0, 0, 0, 0); return dt; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function dayIndex(dateObj) { const js = dateObj.getDay(); return (js + 6) % 7; }
function escapeHTML(s) { return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function vacationAppliesToGroup(v, group) {
    if (!v || !group) return Array.isArray(v.groups) ? v.groups.length === 0 : true;
    if (!Array.isArray(v.groups) || v.groups.length === 0) return true;
    return v.groups.includes(group);
}
function getGroupEventType(dateObj, group) {
    const tStr = toLocalISO(dateObj); // Compare Strings YYYY-MM-DD

    // 1. Check for WORK EXCEPTIONS first
    const workException = (state.vacations || []).find(v => {
        if (v.type !== 'work') return false;
        if (!v.from || !v.to) return false;
        if (!vacationAppliesToGroup(v, group)) return false;
        return v.from <= tStr && tStr <= v.to;
    });

    if (workException) return null; // It is a WORK DAY, ignore any underlying vacation

    // 2. Check for Normal Vacations
    for (const v of state.vacations || []) {
        if (v.type === 'work') continue; // Skip work exceptions here
        if (!v.from || !v.to) continue;
        if (!vacationAppliesToGroup(v, group)) continue;

        // Use string comparison for safety
        if (v.from <= tStr && tStr <= v.to) return v.type || 'vac';
    }
    return null;
}

function inVacationForGroup(dateObj, group) {
    return getGroupEventType(dateObj, group) !== null;
}

function vacationAppliesToGroup(vac, group) {
    if (!vac.groups || vac.groups.length === 0) return true; // All groups
    if (!group) return false; // If module has no group, specific vacation can't match? 
    // Actually, if vacation is specific to "PI24", and module has NO group, it shouldn't apply.
    // If vacation is "All", it applies. (Handled above).

    // Robust check: Compare trimmed, lowercase strings
    const gNorm = String(group).trim().toLowerCase();
    return vac.groups.some(vg => String(vg).trim().toLowerCase() === gNorm);
}

// ... existing code ...

const LT_MONTHS_SHORT = ["Saus.", "Vas.", "Kov.", "Bal.", "Geg.", "Birž.", "Liep.", "Rugp.", "Rugs.", "Spal.", "Lapkr.", "Gruod."];

function formatVacationDate(dateStr) {
    if (!dateStr) return "???";
    const d = parseISO(dateStr);
    const mInfo = LT_MONTHS_SHORT[d.getMonth()];
    return `${mInfo} ${d.getDate()}`;
}

function getDurationDays(from, to) {
    const d1 = parseISO(from);
    const d2 = parseISO(to);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
}


// --- VACATION UI LOGIC (TABLE & CHECKBOXES) ---

function renderGroupCheckboxes() {
    const c = $('#groupCheckboxes');
    if (!c) return;
    const groups = distinctGroups();
    // Keep selection if possible (though often connection redraw resets it, but here we can try)
    // Actually, getSelectedGroups reads from DOM. If we wipe DOM, we lose selection.
    // Ideally we shouldn't wipe if identical, but for now let's just render.

    // Check if we already have checkboxes. If yes, don't redraw to avoid losing selection?
    // But `renderFilters` calls this. 
    // Let's just redraw and add listeners.

    c.innerHTML = groups.map((g, i) => `
        <label class="inline-flex items-center gap-2 cursor-pointer bg-white border border-slate-200 rounded px-2 py-1 hover:bg-slate-50 transition-colors">
            <input type="checkbox" value="${g}" class="checkbox-group form-checkbox w-3 h-3 text-navy-900 rounded border-slate-300 focus:ring-navy-900">
            <span class="text-[10px] font-bold text-slate-600 uppercase">${g}</span>
        </label>
    `).join('');

    // Add listeners for live filtering
    $$('.checkbox-group', c).forEach(cb => {
        cb.onchange = () => {
            renderVacationsList();
        };
    });
}

function getSelectedGroups() {
    const boxes = $$('.checkbox-group:checked', $('#groupCheckboxes'));
    return boxes.map(cb => cb.value);
}

function clearGroupSelection() {
    $$('.checkbox-group', $('#groupCheckboxes')).forEach(cb => cb.checked = false);
}

function selectAllGroups() {
    $$('.checkbox-group', $('#groupCheckboxes')).forEach(cb => cb.checked = true);
}


function renderVacationsList() {
    // console.log("--- renderVacationsList START ---");
    try {
        const tbody = $('#vacTableBody');
        if (!tbody) {
            console.error("CRITICAL: #vacTableBody NOT FOUND.");
            return;
        }
        tbody.innerHTML = '';

        // Filter by Checkboxes (User Request: "Atostogu grafiko filtras")
        const selectedGroups = getSelectedGroups(); // Returns array of strings e.g. ["IN25V"] or []
        console.log(`DEBUG: Filter Groups (Checkboxes): ${selectedGroups.join(', ')}`);

        let vacs = state.vacations || [];

        if (selectedGroups.length > 0) {
            // Show if it's GLOBAL (always show) OR matches ANY of the selected groups
            vacs = vacs.filter(v => {
                // If vacation is global (no groups assigned), always show it
                if (!v.groups || v.groups.length === 0) return true;

                // If vacation has groups, check if ANY of them overlap with selectedGroups
                // Using vacationAppliesToGroup logic for robust matching
                return selectedGroups.some(g => vacationAppliesToGroup(v, g));
            });
        }

        if (vacs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-slate-400 italic">Nerasta įrašų pasirinktoms grupėms.</td></tr>`;
            return;
        }

        // Safe Sort
        const sorted = vacs.slice().sort((a, b) => (a.from || '').localeCompare(b.from || ''));

        sorted.forEach((v, i) => {
            const isAll = (!v.groups || !v.groups.length);
            // Handle missing dates visually
            const hasDates = v.from && v.to;
            const dateStr = hasDates ? `${formatVacationDate(v.from)} – ${formatVacationDate(v.to)}` : '<span class="text-red-500 font-bold">KLAIDA: Nėra datos</span>';
            const duration = hasDates ? getDurationDays(v.from, v.to) : 0;

            let badgeClass = 'bg-slate-100 text-slate-600';
            let typeIcon = 'beach_access';
            let typeText = 'Atostogos';

            if (v.type === 'sick') {
                badgeClass = 'bg-red-50 text-red-700 border border-red-100';
                typeIcon = 'medication';
                typeText = 'Liga';
            } else if (v.type === 'work') {
                badgeClass = 'bg-green-50 text-green-700 border border-green-100';
                typeIcon = 'work';
                typeText = 'Darbo D.';
            } else {
                badgeClass = 'bg-blue-50 text-blue-700 border border-blue-100';
            }

            const groupsContent = isAll
                ? `<div class="font-bold text-navy-900 text-xs bg-navy-900 text-white inline-block px-2 py-0.5 rounded">VISOS GRUPĖS</div>`
                : `<div class="flex flex-wrap gap-1">${(v.groups || []).map(g => `<span class="bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm">${g}</span>`).join('')}</div>`;

            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50 transition-colors group";
            tr.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap">
                    <div class="flex flex-col">
                        <span class="text-xs font-bold text-navy-900">${dateStr}</span>
                        <span class="text-[10px] text-slate-400 font-medium">${duration} d.</span>
                    </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                    <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold ${badgeClass}">
                        <span class="material-symbols-outlined text-[14px]">${typeIcon}</span> ${typeText}
                    </span>
                </td>
                <td class="px-4 py-3">
                    ${groupsContent}
                </td>
                <td class="px-4 py-3 text-center">
                    <button onclick="delVac(${i})" class="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors" title="Ištrinti">
                        <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Render Vacations Error:", e);
        // alert("Klaida nuskaitant atostogas: " + e.message); 
        // Silent fail or minimal UI feedback to avoid annoyance
        $('#vacTableBody').innerHTML = `<tr><td colspan="4" class="p-4 text-red-500 text-center font-bold">Klaida: ${e.message}</td></tr>`;
    }
}

function inVacationForGroup(dateObj, group) { return getGroupEventType(dateObj, group) !== null; }

function getEffectiveSchedule(mod, dateObj) {
    const ovs = (mod.overrides || []).slice().filter(x => x.from).sort((a, b) => parseISO(a.from) - parseISO(b.from));
    let sched = mod.sched || [0, 0, 0, 0, 0, 0, 0];
    const tStr = toLocalISO(dateObj); // Compare Strings YYYY-MM-DD
    for (const ov of ovs) {
        if (ov.from <= tStr) sched = ov.sched || sched; else break;
    }
    return sched;
}
function getEffectiveStartSlot(mod, dateObj) {
    const tStr = toLocalISO(dateObj); // Compare Strings YYYY-MM-DD
    const ovs = (mod.overrides || []).slice().filter(x => x.from).sort((a, b) => parseISO(a.from) - parseISO(b.from));
    let starts = mod.schedStarts || [1, 1, 1, 1, 1, 1, 1];
    for (const ov of ovs) {
        if (ov.from <= tStr && ov.schedStarts) starts = ov.schedStarts; else break;
    }
    const dayIdxVal = dayIndex(dateObj);
    return starts[dayIdxVal] !== undefined ? starts[dayIdxVal] : 1;
}

// --- LAYOUT HELPERS ---
function getSlotSet(count, start) {
    let set = new Set();
    for (let i = 0; i < count; i++) set.add(start + i);
    return set;
}

function packEvents(events) {
    // Sort by start time, then length (desc)
    events.sort((a, b) => (a.start - b.start) || (b.len - a.len));

    const rows = [];
    for (const ev of events) {
        let placed = false;
        // Try to fit in existing rows
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            // Check if this event overlaps with anything in this row
            // Events in row are sorted by start time implicitly
            const lastInRow = row[row.length - 1];
            // Simple overlap check: start < end AND end > start.
            // Here we use slots. adjacent is ok.
            // If new event starts AFTER the last one ends (>=), it fits.
            if (ev.start >= (lastInRow.start + lastInRow.len)) {
                row.push(ev);
                ev.rowIndex = i;
                placed = true;
                break;
            }
        }
        // If not placed, create new row
        if (!placed) {
            rows.push([ev]);
            ev.rowIndex = rows.length - 1;
        }
    }
    return rows.length; // Total rows needed
}

function getDayInfo(mod, dateObj) {
    const evtType = getGroupEventType(dateObj, mod.group);
    if (evtType) return { count: 0, start: 1, event: evtType };
    const idx = dayIndex(dateObj);
    const count = Number(getEffectiveSchedule(mod, dateObj)[idx] || 0);
    const start = getEffectiveStartSlot(mod, dateObj);
    return { count, start, event: null };
}

function isOverridden(mod, dateObj) {
    const t = dateObj.getTime();
    const ovs = (mod.overrides || []).slice().filter(x => x.from).sort((a, b) => parseISO(a.from) - parseISO(b.from));
    for (const ov of ovs) { if (parseISO(ov.from).getTime() <= t) return true; }
    return false;
}



function dayPlanRaw(mod, dateObj) {
    if (parseISO(mod.start) > dateObj) return 0;
    const info = getDayInfo(mod, dateObj);

    // DEBUG ANNUAL VIEW - REMOVED


    return info.count;
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
function planForDate(mod, dateObj) {
    const prev = addDays(dateObj, -1);
    const leftBefore = Math.max(0, Number(mod.target || 0) - plannedByCapped(mod, toLocalISO(prev)));
    if (leftBefore <= 0) return 0;
    const raw = dayPlanRaw(mod, dateObj);
    return Math.min(raw, leftBefore);
}
function getFinishDate(mod) {
    let cur = parseISO(mod.start), acc = 0;
    for (let i = 0; i < 365 * 4; i++) {
        const raw = dayPlanRaw(mod, cur);
        acc += Math.min(raw, Math.max(0, mod.target - acc));
        if (acc >= mod.target) return toLocalISO(cur);
        cur = addDays(cur, 1);
    }
    return null;
}
function forecastFinish(mod) {
    const fd = getFinishDate(mod);
    return fd || '—';
}
function acadYearOf(date) { const y = date.getFullYear(); const m = date.getMonth(); return (m >= 8) ? y : (y - 1); }
function distinctGroups() { return Array.from(new Set(state.modules.map(m => m.group || '').filter(Boolean))).sort(); }
function distinctTeachers() { return Array.from(new Set(state.modules.map(m => m.teacher || '').filter(Boolean))).sort(); }
function modulesFiltered() {
    const gf = $('#groupFilter').value;
    const mf = $('#moduleFilter').value;
    const tf = $('#teacherFilter').value;
    return state.modules.filter(m =>
        (!gf || m.group === gf) &&
        (!mf || m.id === mf) &&
        (!tf || m.teacher === tf)
    );
}

function formatTime(slotId) {
    if (!LESSON_SLOTS[slotId]) return "??";
    return LESSON_SLOTS[slotId].t.split(' - ')[0];
}
function getSlotSet(count, start) {
    let set = new Set();
    for (let i = 0; i < count; i++) set.add(start + i);
    return set;
}
function formatRange(start, count) {
    if (!LESSON_SLOTS[start]) return "??";
    const end = start + count - 1;
    const sTime = LESSON_SLOTS[start].t.split(' - ')[0];
    const eTime = LESSON_SLOTS[end] ? LESSON_SLOTS[end].t.split(' - ')[1] : '...';
    return `${sTime}–${eTime} (${start}-${end} pam.)`;
}

function getWeeklyComparison(mondayCurrent) {
    const mondayPrev = addDays(mondayCurrent, -7);
    const reportMap = new Map();
    modulesFiltered().forEach(mod => {
        const changes = [];
        const modStart = parseISO(mod.start);
        const isNewModule = modStart >= mondayCurrent && modStart <= addDays(mondayCurrent, 6);
        if (isNewModule) changes.push(`<span class="report-start">✨ Startuoja naujas modulis</span>`);

        const finishStr = getFinishDate(mod);
        if (finishStr) {
            const finishDate = parseISO(finishStr);
            if (finishDate >= mondayCurrent && finishDate <= addDays(mondayCurrent, 6)) {
                changes.push(`<span class="report-finish">🏁 Modulio pabaiga (paskutinės valandos)</span>`);
            }
        }

        for (let i = 0; i < 7; i++) {
            const curDate = addDays(mondayCurrent, i);
            const prevDate = addDays(mondayPrev, i);
            const curInfo = getDayInfo(mod, curDate);
            const prevInfo = getDayInfo(mod, prevDate);
            const curSet = getSlotSet(curInfo.count, curInfo.start);
            const prevSet = getSlotSet(prevInfo.count, prevInfo.start);
            const added = [...curSet].filter(x => !prevSet.has(x)).sort((a, b) => a - b);
            const removed = [...prevSet].filter(x => !curSet.has(x)).sort((a, b) => a - b);

            if (added.length > 0 || removed.length > 0) {
                let msg = `<b>${DAYS_FULL[i]} (${DAYS_SHORT[i]}):</b> `;
                if (prevInfo.event === 'sick' && curInfo.count > 0) msg += `<span class="report-good">Grįžtama į grafiką po ligos</span>`;
                else if (prevInfo.event === 'vac' && curInfo.count > 0) msg += `<span class="report-good">Grįžtama į grafiką po atostogų</span>`;
                else if (curInfo.event === 'sick') msg += `<span class="report-bad">Nėra pamokų (LIGA)</span>`;
                else if (curInfo.event === 'vac') msg += `<span class="report-info">Nėra pamokų (ATOSTOGOS)</span>`;
                else {
                    let parts = [];
                    if (added.length > 0) parts.push(`<span class="report-good">Prisidėjo:</span> ${added.join(', ')} pam.`);
                    if (removed.length > 0) parts.push(`<span class="report-bad">Nuimtos:</span> ${removed.join(', ')} pam.`);
                    msg += parts.join('; ');
                }
                if (!isNewModule) changes.push(msg);
            }
        }
        if (changes.length > 0) reportMap.set(mod.id, changes);
    });
    return reportMap;
}

// --- RENDERERS ---

function renderInputs() {
    const c = $('#scheduleInputs');
    if (!c) return;
    c.innerHTML = '';
    const labels = ['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št', 'Sk'];
    labels.forEach((l, i) => {
        const div = document.createElement('div');
        div.className = "flex items-center gap-2 border-b border-slate-100 pb-1 last:border-0";
        let options = '';
        LESSON_SLOTS.forEach(slot => {
            options += `<option value="${slot.id}">Pam. ${slot.id} (${slot.t.split(' - ')[0]})</option>`;
        });
        div.innerHTML = `
                <span class="w-6 text-[10px] text-slate-400 font-bold">${l}</span>
                <input class="d${i} w-16 text-center text-xs p-1.5 border-slate-200 rounded focus:ring-navy-900" type="number" min="0" value="0" placeholder="Kiek">
                <select class="ds${i} flex-1 text-xs p-1.5 border-slate-200 rounded focus:ring-navy-900 text-slate-600 bg-white">
                    <option value="1" disabled selected>-- Pradžia --</option>
                    ${options}
                </select>
            `;
        c.appendChild(div);
    });
}

function renderFilters() {
    const ysel = $('#acadYearSelect');
    const startY = parseInt(ysel.value, 10) || acadYearOf(new Date());
    const years = new Set(); const today = new Date();
    years.add(acadYearOf(today) - 1); years.add(acadYearOf(today)); years.add(acadYearOf(today) + 1);
    state.modules.forEach(m => { if (m.start) years.add(acadYearOf(parseISO(m.start))); });
    const sortedY = Array.from(years).sort((a, b) => a - b);
    const curY = ysel.value;
    ysel.innerHTML = sortedY.map(y => { const sel = (y == curY || (!curY && y === acadYearOf(today))) ? 'selected' : ''; return `<option value="${y}" ${sel}>${y}–${y + 1}</option>`; }).join('');

    const gf = $('#groupFilter'); const mf = $('#moduleFilter'); const tf = $('#teacherFilter');
    const groups = distinctGroups();
    const curG = gf.value;
    gf.innerHTML = '<option value="">Visos</option>' + groups.map(g => `<option value="${g}" ${g === curG ? 'selected' : ''}>${g}</option>`).join('');

    const curM = mf.value;
    const mOpts = state.modules.filter(m => (!gf.value || m.group === gf.value) && (!tf.value || m.teacher === tf.value)).map(m => `<option value="${m.id}" ${m.id === curM ? 'selected' : ''}>${escapeHTML(m.name)}</option>`).join('');
    mf.innerHTML = '<option value="">Visi</option>' + mOpts;

    const teachers = distinctTeachers();
    const curT = tf.value;
    tf.innerHTML = '<option value="">Visi</option>' + teachers.map(t => `<option value="${t}" ${t === curT ? 'selected' : ''}>${t}</option>`).join('');

    const vg = $('#groupSuggestions');
    if (vg) vg.innerHTML = groups.map(g => `<option value="${g}"></option>`).join('');

    const vt = $('#teacherSuggestions');
    if (vt) vt.innerHTML = teachers.map(t => `<option value="${t}"></option>`).join('');

    const vgCheck = $('#groupCheckboxes');
    if (vgCheck) renderGroupCheckboxes(); // New Logic

}

// --- MAIN CALENDAR RENDER ---
function renderYear(targetId = 'yearWall') {
    const todayEl = $('#todayStr');
    if (todayEl) todayEl.textContent = todayISO();

    const startY = parseInt($('#acadYearSelect').value, 10);
    if (!startY) return;

    const wall = document.getElementById(targetId);
    if (!wall) return;
    wall.innerHTML = '';

    const events = {};
    const gf = $('#groupFilter').value;
    (state.vacations || []).forEach(v => {
        // Fix: If gf is empty (All), show ALL vacations (including specific ones).
        // Only filter out if gf is set AND vacation doesn't apply.
        if (gf && !vacationAppliesToGroup(v, gf)) return;
        let d = parseISO(v.from), end = parseISO(v.to);
        const type = v.type || 'vac';
        for (let i = 0; i < 999 && d <= end; i++) { events[toLocalISO(d)] = type; d = addDays(d, 1); }
    });

    // --- PERFORMANCE OPTIMIZATION: Pre-calculate plans O(Days * Modules) ---
    // Instead of re-calculating "planned so far" for every single day (squared complexity),
    // we iterate days sequentially and maintain the running counter.
    const activeMods = modulesFiltered();
    const modPlans = new Map(); // Map<DateISO, List<Module>>
    const runningPlanned = new Map(); // Map<ModID, count>

    // Initialize counters
    activeMods.forEach(m => runningPlanned.set(m.id, 0));

    // Determine range of year to scan
    // Scan from start of any module (or start of year) to end of year
    // Actually, simply scanning the academic year (Sept 1 to Aug 31) covers the display.
    // However, `plannedByCapped` logic starts counting from `mod.start`.
    // We need to sync our running counters with `mod.start`.
    // Simpler approach: 
    // 1. For each module, iterate from its Start Date until Target is met or Year End.
    // 2. Store the "Active" days in a map.
    // This is much faster than day-by-day query.

    activeMods.forEach(mod => {
        let cur = parseISO(mod.start);
        let acc = 0;
        // Limit loop to avoid infinite if something is wrong, and stop if we go way beyond view
        // View is approx 12 months from startY-09-01.
        const viewEnd = new Date(startY + 1, 8, 1); // Next Sept 1

        // We might need to handle pre-rendering logic if module started before this view?
        // But `plannedByCapped` counts from `mod.start`.
        // If `mod.start` is BEFORE current view, we must "fast forward" the accumulator.
        // But for visual correctness, we just need to know if it plays on Date D.

        while (acc < mod.target && cur < viewEnd) {
            const dStr = toLocalISO(cur);
            // Verify if we are inside the vacation/event logic?
            // dayPlanRaw checks `getDayInfo` which checks events.
            // We need to handle Global events (events map we just built) vs Group events.
            // `dayPlanRaw` calls `getDayInfo` -> `getGroupEventType`.
            // Optimization: pass `events` map to a faster helper? 
            // `getDayInfo` is relatively cheap if avoiding heavy loops.

            const raw = dayPlanRaw(mod, cur); // This is O(1) mostly, checks overrides (small list) + vacs (small list)

            if (raw > 0) {
                const left = mod.target - acc;
                const take = Math.min(raw, left);
                acc += take;

                // If this date is within our viewally rendered year, mark it
                // We only care about rendering, so populate map
                if (!modPlans.has(dStr)) modPlans.set(dStr, []);
                modPlans.get(dStr).push(mod);
            }
            cur = addDays(cur, 1);

            // Safety break
            if (acc >= mod.target && cur > viewEnd) break;
        }
    });

    for (let i = 0; i < 12; i++) {
        const mObj = new Date(startY, 8 + i, 1);
        const y = mObj.getFullYear(), m = mObj.getMonth();
        const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);

        const card = document.createElement('div');
        // Added calendar-card for CSS optimization
        card.className = 'bg-white rounded-xl shadow-card border border-slate-200/60 p-4 flex flex-col h-full hover:shadow-card-hover transition-shadow duration-300 calendar-card';
        card.innerHTML = `<div class="flex justify-between items-center mb-3"><h3 class="font-bold text-navy-900 capitalize">${LT_MONTHS[m]}</h3><span class="text-xs text-slate-400 font-medium">${y}</span></div><div class="grid grid-cols-7 mb-1 text-center">${['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št', 'Sk'].map((d, idx) => `<span class="text-[10px] font-bold text-slate-400 uppercase ${idx > 4 ? 'text-slate-300' : ''}">${d}</span>`).join('')}</div>`;
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-7 gap-y-1 text-center text-sm text-slate-600 flex-1 content-start';

        const pad = (first.getDay() + 6) % 7;
        for (let k = 0; k < pad; k++) grid.innerHTML += `<div class="h-8"></div>`;

        for (let d = 1; d <= last.getDate(); d++) {
            const dateObj = new Date(y, m, d);
            const dStr = toLocalISO(dateObj);
            const isT = dStr === todayISO();
            const evtType = events[dStr];
            const dayOfW = (dateObj.getDay() + 6) % 7;
            const isW = dayOfW > 4;

            let classes = `cell ${isT ? 'today' : ''} ${isW && !isT && !evtType ? 'weekend' : ''}`;
            if (evtType === 'vac') classes += ' vac';
            if (evtType === 'sick') classes += ' sick';

            if (state.sem2Start && dStr === state.sem2Start) classes += ' sem-start';
            if (state.semEnd && dStr === state.semEnd) classes += ' sem-end';

            // USE PRE-CALCULATED PLAN
            const mods = (modPlans.get(dStr) || []);

            // Fix: If there are lessons, it's NOT a full vacation day (even if global implies it).
            // This handles "Work Day" exceptions correctly across ALL views.
            if (mods.length > 0 && evtType === 'vac') {
                classes = classes.replace(' vac', ''); // Remove vacation styling if lessons exist
            }

            // Conflict Check Using Pre-Calculated Data (Massive performance boost)
            if (!evtType && !isW && mods.length > 1) {
                const byGroup = {};
                for (const m of mods) {
                    if (!byGroup[m.group]) byGroup[m.group] = [];
                    byGroup[m.group].push(m);
                }
                let hasConflict = false;
                for (const g in byGroup) {
                    if (byGroup[g].length > 1) {
                        const occupied = new Set();
                        for (const m of byGroup[g]) {
                            const info = getDayInfo(m, dateObj);
                            for (let j = 0; j < info.count; j++) {
                                const slot = info.start + j;
                                if (occupied.has(slot)) hasConflict = true;
                                occupied.add(slot);
                            }
                        }
                    }
                }
                if (hasConflict) classes += ' conflict';
            }

            const cell = document.createElement('div');
            cell.className = classes;
            if (isT) cell.id = 'currentDayMarker';
            cell.innerHTML = d;

            if (mods.length) {
                const container = document.createElement('div');
                container.className = 'markers-col';
                mods.forEach(mod => {
                    const bar = document.createElement('div');
                    bar.className = 'marker-bar';
                    bar.style.backgroundColor = mod.color || '#0f172a';
                    bar.title = `${mod.name} (${mod.group})${mod.teacher ? ' - ' + mod.teacher : ''}`;
                    container.appendChild(bar);
                });
                cell.appendChild(container);
            }
            cell.onclick = () => openDayDialog(dStr);
            grid.appendChild(cell);
        }
        card.appendChild(grid);
        wall.appendChild(card);
    }
}

// --- ELITE WEEKLY VIEW ---
function openWeeklyDialog() {
    const tpl = $('#weeklyDialogTpl').content.cloneNode(true);
    const ov = tpl.querySelector('.overlay');
    const container = ov.querySelector('#gridContainer');
    const picker = ov.querySelector('#weekPicker');

    // Navigation Buttons
    const btnPrev = ov.querySelector('#prevWeek');
    const btnNext = ov.querySelector('#nextWeek');

    // Sidebar Elements
    const alertsList = ov.querySelector('#urgentAlertsList');
    const weekReport = ov.querySelector('#weekReportContent');
    const statAtt = ov.querySelector('#statAttendance');

    let currentMonday = getMonday(new Date());

    const updateView = (mon) => {
        currentMonday = mon;
        // Update Picker Text
        const sunday = addDays(mon, 6);
        picker.value = `${toLocalISO(mon)} — ${toLocalISO(sunday)}`;

        // Render Everything
        renderEliteGrid(container, mon);
        renderSmartInsights(mon, alertsList, weekReport, statAtt);
    };

    // Initialize Flatpickr for week selection
    flatpickr(picker, {
        locale: 'lt',
        mode: "range",
        defaultDate: [currentMonday, addDays(currentMonday, 6)],
        onChange: (selectedDates) => {
            if (selectedDates.length > 0) {
                const newMon = getMonday(selectedDates[0]);
                updateView(newMon);
            }
        }
    });

    btnPrev.onclick = () => updateView(addDays(currentMonday, -7));
    btnNext.onclick = () => updateView(addDays(currentMonday, 7));

    ov.querySelector('.close').onclick = () => ov.remove();
    document.body.appendChild(ov);

    // Initial Render
    updateView(currentMonday);
}

function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

function renderEliteGrid(container, monday) {
    container.innerHTML = '';

    // 1. Header Row (Time Slots)
    const headerRow = document.createElement('div');
    headerRow.className = 'elite-header-row';
    // Corner
    const corner = document.createElement('div');
    corner.className = 'elite-header-cell';
    corner.innerHTML = '<span class="material-symbols-outlined text-slate-300">schedule</span>';
    headerRow.appendChild(corner);

    // Time Columns
    LESSON_SLOTS.forEach((slot, idx) => {
        const cell = document.createElement('div');
        cell.className = 'elite-header-cell flex-col justify-between py-2';
        const times = slot.t.split(' - ');
        // Design: Number in circle at top, Start time bigger, End time dimmer
        cell.innerHTML = `
            <div class="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-extrabold flex items-center justify-center mb-1 shadow-sm">${idx}</div>
            <div class="flex flex-col items-center">
                <span class="text-[12px] font-bold text-navy-900 leading-none">${times[0]}</span>
                <span class="text-[9px] text-slate-400 font-medium leading-tight mt-0.5">${times[1]}</span>
            </div>
        `;
        headerRow.appendChild(cell);
    });
    container.appendChild(headerRow);

    // 2. Day Rows
    const todayStr = todayISO();

    for (let i = 0; i < 7; i++) {
        const curDate = addDays(monday, i);
        const curDateStr = toLocalISO(curDate);
        const isToday = curDateStr === todayStr;

        const row = document.createElement('div');
        row.className = 'elite-body-row';
        if (isToday) row.style.backgroundColor = '#fffbeb'; // Highlight today row slightly

        // Day Cell
        const dayCell = document.createElement('div');
        dayCell.className = 'elite-day-cell';
        if (isToday) dayCell.style.color = '#d97706';

        // Format: MON 26
        const dayNameShort = DAYS_SHORT[i].toUpperCase();
        const dayNum = curDate.getDate();
        dayCell.innerHTML = `<span class="day-name">${dayNameShort}</span><span class="day-date">${dayNum}</span>`;
        row.appendChild(dayCell);

        // Content Cell (Grid + Modules)
        const contentCell = document.createElement('div');
        contentCell.className = 'elite-content-cell';

        // Background Grid Lines
        const gridLines = document.createElement('div');
        gridLines.className = 'elite-grid-lines';
        for (let k = 0; k < 13; k++) {
            const line = document.createElement('div');
            line.className = 'elite-line';
            gridLines.appendChild(line);
        }
        contentCell.appendChild(gridLines);

        // Render Events
        const rowEvents = getEventsForDay(curDate);
        rowEvents.forEach(ev => {
            const block = document.createElement('div');
            block.className = 'elite-block';

            const colWidth = 100 / 13;
            const left = (ev.start) * colWidth;
            const width = (ev.len) * colWidth;

            block.style.left = `calc(${left}% + 2px)`;
            block.style.width = `calc(${width}% - 4px)`;
            block.style.borderColor = ev.mod.color || '#0f172a';
            // Use lighter background for the block based on module color (simple opacity simulation via border color usage or fixed)
            // Since we can't easily hex2rgba here without helper, let's use a trick or just simple style
            // We'll set a background with opacity using inline style trick if possible, or just stay white but add thicker border/visuals
            // User requested "visually seen", so let's add background-color.
            block.style.backgroundColor = ev.mod.color ? ev.mod.color + '20' : '#f1f5f9'; // 20 is ~12% opacity hex
            block.style.borderLeftWidth = '4px';

            if (ev.isOverride) block.classList.add('is-override');
            if (ev.isNew) block.classList.add('is-new');
            if (ev.isRemoved) block.classList.add('is-removed');

            // Block Content
            const timeRange = formatRange(ev.start, ev.len).split(' ')[0]; // Just times
            const teacher = ev.mod.teacher ? `<span class="material-symbols-outlined text-[10px]">person</span> ${escapeHTML(ev.mod.teacher.split(' ')[0])}` : '';

            let statusIcon = '';
            if (ev.isRemoved) statusIcon = '<span class="material-symbols-outlined text-[10px] text-red-700">cancel</span> ';

            // Calculate Lesson Numbers string (e.g. "1-2 pam.")
            // ev.start is 0-based index? No, LESSON_SLOTS ids.
            // slot.id is 0,1,2...
            // If start=1 (08:00), len=2, then valid slots are 1 and 2.
            const startNum = ev.start;
            const endNum = ev.start + ev.len - 1;
            const pamStr = (startNum === endNum) ? `${startNum} pam.` : `${startNum}-${endNum} pam.`;

            block.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="time text-[10px] font-extrabold text-navy-900">${pamStr}</div>
                    <div class="time text-[9px] opacity-70">${timeRange}</div>
                </div>
                <div class="title font-bold text-xs mt-1 leading-tight" title="${escapeHTML(ev.mod.name)}">${statusIcon}${escapeHTML(ev.mod.name)}</div>
                <div class="details mt-1">
                    <span class="bg-white/50 px-1 rounded text-[10px] font-semibold">${escapeHTML(ev.mod.group)}</span>
                    ${teacher ? '<span>' + teacher + '</span>' : ''}
                </div>
            `;

            contentCell.appendChild(block);
        });

        // "NOW" Indicator (Vertical Line) if Today
        if (isToday) {
            const now = new Date();
            const nowMins = now.getHours() * 60 + now.getMinutes();
            const startMins = 7 * 60;
            const endMins = 19 * 60 + 25;
            const totalRange = endMins - startMins;
            const currentPos = Math.max(0, Math.min(100, (nowMins - startMins) / totalRange * 100));

            if (nowMins >= startMins && nowMins <= endMins) {
                const line = document.createElement('div');
                line.className = 'now-indicator-line';
                line.style.left = `${currentPos}% `;
                line.innerHTML = `<div class="now-indicator-head">DABAR</div>`;
                contentCell.appendChild(line);
            }
        }

        row.appendChild(contentCell);
        container.appendChild(row);
    }
}

function getEventsForDay(dateObj) {
    const events = [];
    // REMOVED Global Check that prevented exceptions:
    // const grpEvt = getGroupEventType(dateObj, null);
    // if (grpEvt) return [];

    modulesFiltered().forEach(mod => {
        if (getGroupEventType(dateObj, mod.group)) return;

        const info = getDayInfo(mod, dateObj);

        // Calculate slots for current day and previous/default baseline
        const prevDate = addDays(dateObj, -7);
        const prevInfo = getDayInfo(mod, prevDate);
        const prevSet = getSlotSet(prevInfo.count, prevInfo.start);

        // Use either info from override or default logic
        const curSet = getSlotSet(info.count, info.start);



        // Calculate differences
        const keptSlots = [...curSet].filter(x => prevSet.has(x)).sort((a, b) => a - b);
        const newSlots = [...curSet].filter(x => !prevSet.has(x)).sort((a, b) => a - b);
        const removedSlots = [...prevSet].filter(x => !curSet.has(x)).sort((a, b) => a - b);

        const chunks = [];

        // Helper to buffer ranges
        const toRanges = (slots, status) => {
            if (slots.length === 0) return;
            let start = slots[0], count = 1;
            for (let i = 1; i < slots.length; i++) {
                if (slots[i] === slots[i - 1] + 1) {
                    count++;
                } else {
                    chunks.push({ start, len: count, mod, isNew: status === 'new', isRemoved: status === 'removed', isOverride: isOverridden(mod, dateObj) });
                    start = slots[i]; count = 1;
                }
            }
            chunks.push({ start, len: count, mod, isNew: status === 'new', isRemoved: status === 'removed', isOverride: isOverridden(mod, dateObj) });
        };

        if (keptSlots.length > 0) toRanges(keptSlots, 'normal');
        if (newSlots.length > 0) toRanges(newSlots, 'new');

        // Only show removed lessons if it is an override day (meaning we explicitly changed it)
        // OR if count became 0 unexpectedly. But usually override dictates change.
        // Only show removed lessons if there is an actual difference detected from previous week
        if (removedSlots.length > 0) {
            toRanges(removedSlots, 'removed');
        }

        chunks.forEach(c => events.push(c));
    });
    return events;
}


function renderSmartInsights(monday, alertsContainer, reportContainer, statAtt) {
    // 1. Calculate Plan Execution (was Attendance)
    let totalDone = 0;
    let totalTarget = 0;
    modulesFiltered().forEach(m => {
        totalDone += plannedByCapped(m, yesterdayISO());
        totalTarget += m.target;
    });
    const percentage = totalTarget > 0 ? Math.round((totalDone / totalTarget) * 100) : 0;
    statAtt.textContent = `${percentage}% `;

    // Add context if element exists (requires adding ID to footer text in HTML or just finding it via DOM traversal)
    // Since statAtt is the percentage number, the text below is in DOM layout
    // Let's find the parent .insight-stat-circle and append/update info or use selector
    const circle = statAtt.closest('.insight-stat-circle');
    let contextEl = circle.querySelector('.stat-context');
    if (!contextEl) {
        contextEl = document.createElement('div');
        contextEl.className = 'stat-context text-[9px] text-slate-400 font-medium absolute -bottom-6 w-max';
        circle.appendChild(contextEl);
    }
    contextEl.textContent = `${totalDone} / ${totalTarget} val.`;

    // 2. Urgent Alerts
    alertsContainer.innerHTML = '';
    const today = new Date();

    // Check for next holiday
    const upcomingVad = state.vacations.find(v => parseISO(v.from) > today);
    if (upcomingVad) {
        const diffDays = Math.ceil((parseISO(upcomingVad.from) - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 14) {
            alertsContainer.innerHTML += `
                <div class="alert-item">
                    <span class="material-symbols-outlined alert-icon">event_busy</span>
                    <div class="alert-text">
                        <h4>Artėjantis Įvykis</h4>
                        <p>${upcomingVad.type === 'vac' ? 'Atostogos' : 'Laikotarpis'} prasideda už ${diffDays} d. (${upcomingVad.from})</p>
                    </div>
                </div>`;
        }
    }

    if (alertsContainer.innerHTML === '') {
        alertsContainer.innerHTML = '<div class="text-xs text-slate-400 italic text-center py-2">Skubių pranešimų nėra.</div>';
    }

    // 3. Weekly Report
    const reportMap = getWeeklyComparison(monday);
    reportContainer.innerHTML = '';
    if (reportMap.size === 0) {
        reportContainer.innerHTML = '<div class="text-xs text-slate-400 italic">Šią savaitę pakeitimų nėra.</div>';
    } else {
        reportMap.forEach((changes, modId) => {
            const m = state.modules.find(x => x.id === modId);
            const div = document.createElement('div');
            div.className = 'mb-2 pb-2 border-b border-blue-100 last:border-0';
            div.innerHTML = `<div class="font-bold text-[10px] text-blue-700 mb-1">${escapeHTML(m.name)}</div>`;
            changes.forEach(c => {
                div.innerHTML += `<div class="pl-2 border-l-2 border-blue-200 text-[10px] text-slate-600 mb-0.5">${c}</div>`;
            });
            reportContainer.appendChild(div);
        });
    }
}

function renderSidebar() {
    const list = $('#miniList');
    if (!list) return;
    list.innerHTML = '';
    modulesFiltered().forEach(m => {
        const done = plannedByCapped(m, yesterdayISO());
        const left = Math.max(0, m.target - done);
        const finish = forecastFinish(m);
        const modColor = m.color || '#0f172a';

        const div = document.createElement('div');
        div.className = 'bg-white border border-slate-200 rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all group';
        div.style.borderLeft = `4px solid ${modColor}`;
        div.innerHTML = `<div class="flex justify-between items-start mb-2">
            <div>
                <h4 class="text-sm font-bold text-navy-900 leading-tight">${escapeHTML(m.name)}</h4>
                <span class="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block font-medium">${escapeHTML(m.group)}</span>
                ${m.teacher ? `<div class="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><span class="material-symbols-outlined text-[10px] align-text-bottom">person</span>${escapeHTML(m.teacher)}</div>` : ''}
            </div>
            <div class="flex">
                <button class="text-slate-300 hover:text-blue-500 transition-colors p-1" data-act="editMod" data-mid="${m.id}"><span class="material-symbols-outlined text-lg">edit</span></button>
                <button class="text-slate-300 hover:text-red-500 transition-colors p-1" data-act="delMod" data-mid="${m.id}"><span class="material-symbols-outlined text-lg">delete</span></button>
            </div>
        </div>
          <div class="text-xs text-slate-500 space-y-1.5"><div class="flex justify-between"><span>Tikslas:</span> <span class="font-bold text-navy-900">${m.target}</span></div><div class="flex justify-between"><span>Pravesta:</span> <span class="font-bold text-navy-900">${done}</span></div><div class="flex justify-between"><span>Liko:</span> <span class="font-bold text-navy-900">${left}</span></div><div class="flex justify-between"><span>Prognozė:</span> <span class="font-bold text-emerald-600">${finish}</span></div></div>
          <div class="mt-3 pt-2 border-t border-slate-100 flex gap-2">
            <button class="flex-1 text-xs font-semibold text-navy-900 hover:text-blue-600 flex items-center justify-center gap-1 transition-colors py-1.5 rounded hover:bg-slate-50" data-act="editMod" data-mid="${m.id}"><span class="material-symbols-outlined text-sm">edit</span> Redaguoti</button>
            <div class="w-px bg-slate-200 my-1"></div>
            <button class="flex-1 text-xs font-semibold text-navy-900 hover:text-blue-600 flex items-center justify-center gap-1 transition-colors py-1.5 rounded hover:bg-slate-50" data-act="addOv" data-mid="${m.id}"><span class="material-symbols-outlined text-sm">edit_calendar</span> Grafikas</button>
          </div>`;
        list.appendChild(div);
    });
    list.onclick = (e) => {
        const btn = e.target.closest('button'); if (!btn) return;
        const act = btn.dataset.act, mid = btn.dataset.mid;
        if (act === 'delMod') { if (confirm('Trinti?')) { state.modules = state.modules.filter(x => x.id !== mid); save(); renderAll(); } }
        if (act === 'editMod') { openEditModuleDialog(mid); }
        if (act === 'addOv') { openOverrideDialog(mid); }
    };
}

function renderVacations() {
    const box = $('#vacList');
    if (!box) return;
    box.innerHTML = '';
    if (!state.vacations.length) { box.innerHTML = '<span class="text-xs text-slate-400 italic">Nėra pridėtų atostogų.</span>'; return; }
    state.vacations.slice().sort((a, b) => a.from.localeCompare(b.from)).forEach((v, i) => {
        const grp = (!v.groups || !v.groups.length) ? 'Visos' : v.groups.join(', ');
        const typeLabel = (v.type === 'sick') ? '<span class="text-red-500 font-bold">LIGA</span>' : 'Atostogos';
        const tag = document.createElement('span');
        tag.className = 'inline-flex items-center text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200';
        tag.innerHTML = `${typeLabel} <b>${v.from}</b><span class="text-slate-400 mx-1">➜</span><b>${v.to}</b> <span class="text-slate-400 ml-1">(${grp})</span> <button class="ml-2 text-slate-400 hover:text-red-500 font-bold" onclick="delVac(${i})">×</button>`;
        box.appendChild(tag);
    });
}

// --- ACTIONS ---
function addModule() {
    const name = $('#mName').value.trim(); const group = $('#mGroup').value.trim();
    const elTeacher = $('#mTeacher'); const teacher = elTeacher ? elTeacher.value.trim() : '';
    const target = parseInt($('#mTarget').value, 10); const start = $('#mStart').value; const color = $('#mColor').value;
    const sched = []; const schedStarts = [];
    for (let i = 0; i < 7; i++) { sched[i] = parseInt($(`.d${i}`).value, 10) || 0; schedStarts[i] = parseInt($(`.ds${i}`).value, 10) || 1; }
    if (!name || !group || !target || !start) return alert('Užpildykite visus laukus');
    state.modules.push({ id: 'm' + Date.now(), name, group, teacher, target, start, color, sched, schedStarts, overrides: [] });
    save(); $('#mName').value = ''; if (elTeacher) elTeacher.value = ''; $('#mTarget').value = ''; for (let i = 0; i < 7; i++) { $(`.d${i}`).value = 0; $(`.ds${i}`).value = 1; }
    renderAll();
}
function addVac() {
    try {
        const from = $('#vFrom').value, to = $('#vTo').value;
        if (!from || !to) { alert('Nurodykite datas (Nuo - Iki)!'); return; }

        const selectedOptions = Array.from($('#vGroups').selectedOptions);
        const grps = selectedOptions.map(o => o.value);
        const type = $('#vType').value;

        // Validation: If Work Day, maybe warn if no group selected?
        if (type === 'work' && grps.length === 0) {
            if (!confirm('Pridedate "Darbo dieną" VISOMS grupėms. Ar tikrai?')) return;
        }

        state.vacations.push({ from, to, groups: grps, type });
        save();

        // Clear inputs
        $('#vFrom').value = '';
        $('#vTo').value = '';
        // Reset selection
        Array.from($('#vGroups').options).forEach(o => o.selected = false);

        renderAll();
        // alert('Pakeitimas sėkmingai pridėtas!'); // Optional: Feedback
    } catch (err) {
        console.error(err);
        alert('Įvyko klaida pridedant įrašą: ' + err.message);
    }
}
function addSickThisWeek() {
    const today = new Date(); const day = today.getDay(); const diff = today.getDate() - day + (day == 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff)); const sunday = new Date(today.setDate(diff + 6));
    if (confirm(`Ar tikrai žymėti ligą šiai savaitei?`)) {
        state.vacations.push({ from: toLocalISO(monday), to: toLocalISO(sunday), groups: [], type: 'sick' }); save(); renderAll();
    }
}
function importLithuanianHolidays() {
    const year = parseInt($('#acadYearSelect').value) || new Date().getFullYear();
    const dates = [`${year}-11-01`, `${year}-12-24`, `${year}-12-25`, `${year}-12-26`, `${year + 1}-01-01`, `${year + 1}-02-16`, `${year + 1}-03-11`, `${year + 1}-05-01`, `${year + 1}-06-24`, `${year + 1}-07-06`];
    let cnt = 0; dates.forEach(d => { if (!state.vacations.find(v => v.from === d && v.to === d)) { state.vacations.push({ from: d, to: d, groups: [], type: 'vac' }); cnt++; } });
    save(); renderAll(); alert(`Pridėta ${cnt} šventinių dienų.`);
}
function importScheduleFromImage() {
    if (!confirm('Įkelti 2025-2026 grafiką?')) return;
    const schedule = [{ from: '2025-11-03', to: '2025-11-09', groups: [], type: 'vac' }, { from: '2025-12-24', to: '2026-01-04', groups: [], type: 'vac' }, { from: '2026-02-16', to: '2026-02-22', groups: [], type: 'vac' }, { from: '2025-07-01', to: '2025-08-31', groups: [], type: 'vac' }, { from: '2026-03-30', to: '2026-04-05', groups: [], type: 'vac' }, { from: '2026-04-06', to: '2026-04-12', groups: [], type: 'vac' }];
    schedule.forEach(item => { if (!state.vacations.find(v => v.from === item.from)) state.vacations.push(item); });
    save(); renderAll(); alert(`Įkelta!`);
}
window.delVac = (i) => { state.vacations.splice(i, 1); save(); renderAll(); };

// --- DIALOGS ---
function openDayDialog(dateISO) {
    const tpl = $('#dayDialogTpl').content.cloneNode(true);
    const ov = tpl.querySelector('.overlay');
    ov.querySelector('.date').textContent = dateISO;
    const listContainer = ov.querySelector('.list-container');
    let sd = 0, sc = 0, sl = 0;

    modulesFiltered().forEach(m => {
        const pd = planForDate(m, parseISO(dateISO));
        const pc = plannedByCapped(m, dateISO);
        const pl = Math.max(0, m.target - pc);
        sd += pd; sc += pc; sl += pl;

        const mCol = m.color || '#0f172a';

        // CARD UI
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-colors';

        const teacherHtml = m.teacher ? `<div class="flex items-center gap-1 text-[10px] text-slate-400 mt-1"><span class="material-symbols-outlined text-[12px]">person</span>${escapeHTML(m.teacher)}</div>` : '';

        card.innerHTML = `
            <div class="flex flex-col">
                <div class="flex items-center gap-2 mb-0.5">
                    <span class="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style="background:${mCol}"></span>
                    <span class="font-bold text-navy-900 text-sm">${escapeHTML(m.name)}</span>
                </div>
                <div class="ml-4.5">
                    <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">${escapeHTML(m.group)}</span>
                    ${teacherHtml}
                </div>
            </div>
            <div class="flex items-center gap-6 text-right">
                <div class="flex flex-col items-end">
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Šiandien</span>
                    <span class="text-xl font-bold ${pd > 0 ? 'text-blue-600' : 'text-slate-300'}">${pd}</span>
                </div>
                <div class="w-px h-8 bg-slate-100 mx-1"></div>
                <div class="flex flex-col items-end gap-0.5 w-16">
                    <div class="flex justify-between w-full text-[10px]"><span class="text-slate-400">Pravesta:</span> <span class="font-bold text-navy-900">${pc}</span></div>
                    <div class="flex justify-between w-full text-[10px]"><span class="text-slate-400">Liko:</span> <span class="font-bold text-navy-900">${pl}</span></div>
                </div>
            </div>
        `;
        listContainer.appendChild(card);
    });

    ov.querySelector('.sumDay').textContent = sd;
    ov.querySelector('.sumCum').textContent = sc;
    ov.querySelector('.sumLeft').textContent = sl;
    ov.querySelector('.close').onclick = () => ov.remove();
    document.body.appendChild(ov);
}

function openOverrideDialog(mid) {
    const m = state.modules.find(x => x.id === mid); if (!m) return;
    const tpl = $('#overrideDialogTpl').content.cloneNode(true);
    const ov = tpl.querySelector('.overlay');
    const container = ov.querySelector('#ovInputsContainer');

    // Inject Delete Button (Hidden by default, shown if date matches)
    const footer = ov.querySelector('.save').parentElement;
    const btnDel = document.createElement('button');
    btnDel.className = 'px-4 py-2 bg-red-100 text-red-700 font-semibold rounded hover:bg-red-200 transition-colors hidden mr-auto';
    btnDel.innerHTML = '<span class="material-symbols-outlined text-sm align-middle mr-1">delete</span>Trinti šią';
    footer.insertBefore(btnDel, footer.firstChild);

    // Inject List Container for Active Overrides
    const listHeader = document.createElement('div');
    listHeader.className = 'mt-4 border-t border-slate-100 pt-2';
    listHeader.innerHTML = '<h5 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Aktyvūs pakeitimai</h5>';
    const listContainer = document.createElement('div');
    listContainer.className = 'space-y-1 max-h-32 overflow-y-auto';

    // Insert before footer (or append to container)
    // The dialog structure is a bit simple, let's append to the main content div
    const mainContent = ov.querySelector('.bg-white'); // Assuming the dialog content wrapper has bg-white
    // Actually, looking at previous code, `container` is `#ovInputsContainer`.
    // Let's stick it after `container`.
    container.parentElement.insertBefore(listHeader, footer);
    container.parentElement.insertBefore(listContainer, footer);


    const renderOverrideList = () => {
        listContainer.innerHTML = '';
        if (!m.overrides || m.overrides.length === 0) {
            listContainer.innerHTML = '<div class="text-xs text-slate-400 italic">Nėra pakeitimų</div>';
            return;
        }
        // Sor by date
        m.overrides.sort((a, b) => a.from.localeCompare(b.from));

        m.overrides.forEach(o => {
            const row = document.createElement('div');
            row.className = 'flex justify-between items-center text-xs bg-slate-50 p-1.5 rounded border border-slate-100';
            row.innerHTML = `<span><b>${o.from}</b> <span class="text-slate-400">(${o.sched.reduce((a, b) => a + b, 0)} val.)</span></span>`;

            const btn = document.createElement('button');
            btn.className = 'text-red-500 hover:bg-red-100 p-0.5 rounded transition-colors';
            btn.innerHTML = '<span class="material-symbols-outlined text-sm">delete</span>';
            btn.title = 'Trinti';
            btn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Trinti pakeitimą ${o.from}?`)) {
                    m.overrides = m.overrides.filter(x => x.from !== o.from);
                    save();
                    renderOverrideList();
                    // Also refresh inputs if we happened to be on that date
                    const currentInputDate = $('#ovFrom', ov).value;
                    if (currentInputDate === o.from) {
                        refreshInputs(currentInputDate);
                    }
                    renderAll(); // Refresh background
                }
            };
            row.appendChild(btn);

            // Allow clicking row to select that date?
            row.onclick = () => {
                const inputs = ov.querySelector('#ovFrom');
                if (inputs._flatpickr) {
                    inputs._flatpickr.setDate(o.from, true); // true to trigger onChange
                } else {
                    inputs.value = o.from;
                    refreshInputs(o.from);
                }
            };
            row.style.cursor = 'pointer';

            listContainer.appendChild(row);
        });
    };

    const refreshInputs = (dateStr) => {
        const existing = m.overrides ? m.overrides.find(o => o.from === dateStr) : null;

        // Show/Hide Delete Button
        if (existing) {
            btnDel.classList.remove('hidden');
            btnDel.onclick = () => {
                if (confirm('Ar tikrai trinti šios dienos pakeitimus?')) {
                    m.overrides = m.overrides.filter(o => o.from !== dateStr);
                    save(); renderAll();
                    // Don't close, just refresh
                    renderOverrideList();
                    refreshInputs(dateStr);
                }
            };
        } else {
            btnDel.classList.add('hidden');
            btnDel.onclick = null;
        }

        const useSched = existing ? existing.sched : m.sched;
        const useStarts = existing ? existing.schedStarts : (m.schedStarts || [1, 1, 1, 1, 1, 1, 1]);

        container.innerHTML = '';
        ['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št', 'Sk'].forEach((l, i) => {
            const div = document.createElement('div'); div.className = "flex items-center gap-2 border-b border-slate-100 pb-1 last:border-0";
            let options = '';
            const currentStart = (useStarts[i] !== undefined) ? useStarts[i] : 1;
            LESSON_SLOTS.forEach(s => {
                const sel = (s.id === currentStart) ? 'selected' : '';
                options += `<option value="${s.id}" ${sel}>Pam. ${s.id} (${s.t.split(' - ')[0]})</option>`;
            });
            const currentCount = (useSched[i] !== undefined) ? useSched[i] : 0;

            div.innerHTML = `<span class="w-6 text-[10px] text-slate-400 font-bold">${l}</span><input class="ovd${i} w-16 text-center text-xs p-1.5 border-slate-200 rounded focus:ring-navy-900" type="number" min="0" value="${currentCount}"><select class="ovs${i} flex-1 text-xs p-1.5 border-slate-200 rounded focus:ring-navy-900 text-slate-600 bg-white"><option value="1" disabled>-- Pradžia --</option>${options}</select>`;
            container.appendChild(div);
        });
    };

    flatpickr(ov.querySelector('#ovFrom'), {
        locale: 'lt', dateFormat: 'Y-m-d',
        onChange: (s, dStr) => refreshInputs(dStr)
    });

    renderOverrideList();
    refreshInputs('');

    ov.querySelector('.save').onclick = () => {
        const from = $('#ovFrom', ov).value; if (!from) return alert('Data?');
        const sched = [], schedStarts = [];
        for (let i = 0; i < 7; i++) {
            sched[i] = parseInt($(`.ovd${i}`, ov).value, 10) || 0;
            schedStarts[i] = parseInt($(`.ovs${i}`, ov).value, 10) || 1;
        }

        if (!m.overrides) m.overrides = [];
        m.overrides = m.overrides.filter(o => o.from !== from);
        m.overrides.push({ from, sched, schedStarts });
        save(); renderAll(); ov.remove();
    };
    ov.querySelector('.cancel').onclick = () => ov.remove();
    document.body.appendChild(ov);
}

function openEditModuleDialog(mid) {
    const m = state.modules.find(x => x.id === mid); if (!m) return;
    const tpl = $('#editModuleDialogTpl').content.cloneNode(true);
    const ov = tpl.querySelector('.overlay');

    const els = {
        name: $('#emName', ov),
        teacher: $('#emTeacher', ov),
        group: $('#emGroup', ov),
        color: $('#emColor', ov),
        target: $('#emTarget', ov),
        start: $('#emStart', ov)
    };

    els.name.value = m.name || '';
    els.teacher.value = m.teacher || '';
    els.group.value = m.group || '';
    els.color.value = m.color || '#3b82f6';
    els.target.value = m.target || '';

    flatpickr(els.start, {
        locale: 'lt', dateFormat: 'Y-m-d', defaultDate: m.start || ''
    });

    ov.querySelector('.save').onclick = () => {
        const newName = els.name.value.trim();
        const newGroup = els.group.value.trim();
        const newTarget = parseInt(els.target.value, 10);

        if (!newName || !newGroup || !newTarget) return alert('Užpildykite visus privalomus laukus');

        m.name = newName;
        m.teacher = els.teacher.value.trim();
        m.group = newGroup;
        m.color = els.color.value;
        m.target = newTarget;
        m.start = els.start.value;

        save();
        renderAll();
        ov.remove();
    };

    ov.querySelector('.cancel').onclick = () => ov.remove();
    document.body.appendChild(ov);
}




function openYearlyGridDialog() {
    const tpl = $('#yearlyGridDialogTpl').content.cloneNode(true);
    const ov = tpl.querySelector('.overlay');
    const container = tpl.querySelector('#yGridContainer');

    // FORCE SYNC STATE FROM INPUTS
    const elEndInput = $('#semEnd');
    if (elEndInput && elEndInput.value) {
        state.semEnd = elEndInput.value;
    }

    // Determine Academic Year
    const startY = parseInt($('#acadYearSelect').value, 10) || acadYearOf(new Date());
    const startDate = new Date(startY, 8, 1); // Sept 1st

    // Determine End Date (Default July 1st, or custom School Year End)
    let endDate = new Date(startY + 1, 6, 1); // July 1st default
    if (state.semEnd) {
        const customEnd = parseISO(state.semEnd);
        // Only use custom end if it's logically after start date
        if (customEnd > startDate) {
            // We want to include the week of the end date. 
            // Logic below: while (cur < endDate).
            // If customEnd is a Friday, and we want to show that week,
            // endDate needs to be AFTER that week's start (Monday).
            // Ideally, set endDate to customEnd + 1 day to be safe, or just use it.
            // If customEnd is 2026-06-15 (Monday), loop: cur=2026-06-15 < 2026-06-15 is FALSE.
            // So week starts on 15th serves.
            // Let's add 7 days to customEnd to ensure we cover the final week?
            // Or better: ensure endDate is the Monday AFTER the custom end.

            // Simple approach: Use customEnd. 
            // But we need to make sure the loop condition (cur < endDate) covers the last week.
            // If customEnd is e.g. June 18 (Thursday).
            // The week starts June 15 (Monday).
            // We want this week to appear.
            // 15 < 18 (True). So it generates.
            // Next week starts June 22.
            // 22 < 18 (False). Stops.
            // So using customEnd directly should work found for loop `while(cur < endDate)`.
            // However, let's bump it by 1 day to be inclusive if it falls exactly on Monday?
            // If End is Monday June 15. Cur is June 15. 15 < 15 is False.
            // So we would MISS the last week if it ends exactly on Monday.
            // So let's add 1 day.
            endDate = addDays(customEnd, 1);
        }
    }

    // SEMESTER SPLIT
    // Default to Feb 1st next year if not set
    const sem2StartStr = state.sem2Start || `${startY + 1}-02-01`;
    const sem2Date = parseISO(sem2StartStr);


    // Generate Weeks
    const weeks = [];
    let cur = new Date(startDate);
    const day = cur.getDay(); // 0=Sun, 1=Mon
    const diff = cur.getDate() - day + (day === 0 ? -6 : 1);
    cur.setDate(diff); // Align to Monday

    while (cur < endDate) {
        const wEnd = addDays(cur, 6);
        weeks.push({ start: toLocalISO(cur), end: toLocalISO(wEnd), month: cur.getMonth() });
        cur = addDays(cur, 7);
    }

    // Calculate Semester Spans (in weeks)
    let sem1Weeks = 0;
    let sem2Weeks = 0;
    const sem2StartMs = sem2Date.getTime();

    weeks.forEach(w => {
        const t = parseISO(w.start).getTime();
        if (t < sem2StartMs) sem1Weeks++; else sem2Weeks++;
    });




    // HEADER HTML
    // Row 1: Fixed Cols (rowspan 3) + Semester Headers
    let htmlSem = `<th class="y-col-fixed" rowspan="3" style="z-index:40; top:0; height:72px;">Modulis</th>
                   <th class="y-col-fixed y-teacher" rowspan="3" style="z-index:40; top:0; height:72px;">Dėstytojas</th>
                   <th class="y-col-fixed y-target" rowspan="3" style="z-index:40; top:0; height:72px;">Tikslas</th>
                   <th class="y-col-fixed y-sem1" rowspan="3" style="z-index:40; top:0; height:72px;">I pusm.</th>
                   <th class="y-col-fixed y-sem2" rowspan="3" style="z-index:40; top:0; height:72px;">II pusm.</th>
                   <th colspan="${sem1Weeks}" class="y-header-sem">I PUSMETIS</th>
                   <th colspan="${sem2Weeks + 1}" class="y-header-sem">II PUSMETIS</th>`;

    // Row 2: Months (sticky top 24)
    let htmlMonth = '';

    // Row 3: Weeks (sticky top 48)
    let htmlWeek = '';

    let currentM = -1;
    let currentSpan = 0;

    // CHECK FOR OVERLAP: Does the School Year End fall exactly on the start of the last generated week?
    // We compare strings "YYYY-MM-DD"
    const lastWeek = weeks.length > 0 ? weeks[weeks.length - 1] : null;
    const semEndStr = state.semEnd || "";
    // If semEnd is valid and matches the last week's start date string -> OVERLAP.
    const isOverlap = lastWeek && semEndStr && (lastWeek.start === semEndStr);

    // Generate Weeks Header
    weeks.forEach((w, i) => {
        if (w.month !== currentM && i > 0) {
            htmlMonth += `<th colspan="${currentSpan}" class="y-header-month">${LT_MONTHS[currentM]}</th>`;
            currentSpan = 0;
        }
        currentM = w.month;
        currentSpan++;

        let dStart = parseISO(w.start).getDate();
        let dEnd = parseISO(w.end).getDate();
        const pad = (n) => n < 10 ? '0' + n : n;
        let label = `${pad(dStart)}-${pad(dEnd)}`;

        // Slightly smaller font for the range
        let classes = "y-header-week text-[9px] tracking-tighter";

        // If this is the last week AND we have an Overlap, mark it as PABAIGA in header
        if (i === weeks.length - 1 && isOverlap) {
            classes += " text-red-600 font-bold border-r border-red-200";
        }

        htmlWeek += `<th class="${classes}">${label}</th>`;
    });

    // IF NO OVERLAP (and semEnd is set), we append a separate PABAIGA column
    let pabaigaDateObj = null;
    if (state.semEnd && !isOverlap) {
        pabaigaDateObj = parseISO(state.semEnd);
        currentSpan++;
        htmlWeek += `<th class="y-header-week text-red-600 font-bold border-l border-red-200">${pabaigaDateObj.getDate()}</th>`;
    }

    htmlMonth += `<th colspan="${currentSpan}" class="y-header-month">${LT_MONTHS[currentM]}</th>`;

    const table = document.createElement('table');
    table.className = 'y-table';
    table.innerHTML = `<thead>
        <tr>${htmlSem}</tr>
        <tr>${htmlMonth}</tr>
        <tr>${htmlWeek}</tr>
    </thead>`;

    const tbody = document.createElement('tbody');
    modulesFiltered().forEach(m => {
        const tr = document.createElement('tr');

        // FIX: Match `renderYear` logic exactly by simulating from mod.start
        // This ensures that if the Main Calendar shows lessons, the Yearly Grid does too.

        const modHours = {};
        let acc = 0;
        let sem1 = 0;
        let sem2 = 0;

        // Track the last date we actually added hours to
        let lastActiveDate = null;

        let simDate = m.start ? parseISO(m.start) : new Date(startDate);

        const gridEndMs = endDate.getTime();
        const gridStartMs = startDate.getTime();
        const sem2StartMs = sem2Date.getTime();

        // Loop limit to prevent browser hang on bad data (e.g. 1900 start date)
        let safety = 365 * 5;

        while (simDate.getTime() < gridEndMs && safety-- > 0) {
            if (acc >= m.target) break;

            const dStr = toLocalISO(simDate);
            const raw = Number(dayPlanRaw(m, simDate));

            if (raw > 0) {
                const left = m.target - acc;
                const add = Math.min(raw, left);
                if (add > 0) {
                    acc += add;
                    // Keep track of the last date we were active
                    lastActiveDate = new Date(simDate);

                    const t = simDate.getTime();
                    if (t >= gridStartMs) {
                        modHours[dStr] = (modHours[dStr] || 0) + add;
                        if (t < sem2StartMs) sem1 += add; else sem2 += add;
                    }
                }
            }
            simDate.setDate(simDate.getDate() + 1);
        }

        const weeklySchedSum = (m.sched || []).reduce((a, b) => a + b, 0);
        const gridKeys = Object.keys(modHours);

        // SMART STATUS DIAGNOSTIC
        let statusMsg = '';
        let statusColor = '';
        const mStart = m.start ? parseISO(m.start) : startDate;

        if (mStart >= endDate) {
            statusMsg = `! Startuoja vėliau(${m.start})`;
            statusColor = 'text-red-500';
        } else if (acc >= m.target) {
            // statusMsg = '✓ Užbaigta'; 
        } else if (weeklySchedSum === 0) {
            statusMsg = '! Nėra grafiko (0 val.)';
            statusColor = 'text-red-500';
        } else if (gridKeys.length === 0) {
            statusMsg = '! Nerasta pamokų (tikrinti datas)';
            statusColor = 'text-orange-500';
        }

        const bgStyle = m.color ? `background-color: color-mix(in srgb, ${m.color}, white 85%);` : '';
        const borderStyle = `border-left: 4px solid ${m.color || '#cbd5e1'};`;

        let rowHtml = `<td class="y-col-fixed cursor-pointer hover:brightness-95 relative group" onclick="openEditModuleDialog('${m.id}')" title="${escapeHTML(m.name)}" style="${borderStyle} ${bgStyle}">
            <div class="flex items-center h-full w-full font-semibold text-navy-900 group-hover:text-blue-900 transition-colors whitespace-normal text-left">
                <span class="material-symbols-outlined text-[10px] mr-1 align-middle opacity-0 group-hover:opacity-100 flex-shrink-0">edit</span>
                <span>${escapeHTML(m.name)}</span>
            </div>
            ${statusMsg ? `<div class="text-[9px] ${statusColor} font-bold mt-1">${statusMsg}</div>` : ''}
        </td>
                       <td class="y-col-fixed y-teacher">${escapeHTML(m.teacher || '')}</td>
                       <td class="y-col-fixed y-target">${m.target}</td>
                       <td class="y-col-fixed y-sem1 font-bold text-slate-700">${sem1 || ''}</td>
                       <td class="y-col-fixed y-sem2 font-bold text-slate-700">${sem2 || ''}</td>`;

        // Generate Body Cells
        weeks.forEach((w, i) => {
            let sum = 0;
            let wd = parseISO(w.start);
            // Check if lastActiveDate falls within this week
            let isFinishWeek = false;
            let finishDay = 0;

            if (acc >= m.target && lastActiveDate) {
                const wEnd = addDays(wd, 7); // week end is exclusive in this simple check or inclusive?
                // Simple range check: lastActiveDate >= wd AND lastActiveDate < wEnd (next week start)
                if (lastActiveDate >= wd && lastActiveDate < wEnd) {
                    isFinishWeek = true;
                    finishDay = lastActiveDate.getDate();
                }
            }

            let details = [];
            const dayNames = ['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št', 'Sk'];

            for (let k = 0; k < 7; k++) {
                const val = (modHours[toLocalISO(wd)] || 0);
                sum += val;
                if (val > 0) details.push(`${dayNames[k]}: ${val}`);
                wd = addDays(wd, 1);
            }
            const cls = sum > 0 ? 'y-cell-val relative' : 'y-cell-empty relative';
            const cellStyle = sum > 0 ? bgStyle : '';
            const titleAttr = details.length ? `title="${details.join(', ')}"` : '';

            let content = sum > 0 ? sum : '';

            // MODULE FINISHED BADGE (Green)
            if (isFinishWeek) {
                content += `<div class="absolute inset-x-0 bottom-0 pointer-events-none flex justify-center pb-0.5">
                                <div class="bg-green-500 text-white text-[5px] font-bold px-1 rounded-[2px] leading-tight tracking-wider shadow-sm flex items-center justify-center gap-0.5" style="font-size: 5px;">
                                    <span>${finishDay}</span>
                                    <span>BAIGTA</span>
                                </div>
                             </div>`;
            }

            // IF OVERLAP: Mark last cell if it is End Date inside the week
            if (i === weeks.length - 1 && isOverlap) {
                content += `<div class="absolute inset-x-0 bottom-0 pointer-events-none flex justify-center pb-0.5" style="${isFinishWeek ? 'bottom: 8px;' : ''}"> 
                                <div class="bg-red-500 text-white text-[5px] font-bold px-1 rounded-[2px] leading-tight tracking-wider shadow-sm" style="font-size: 5px;">PABAIGA</div>
                             </div>`;
                // Note: If both BAIGTA and PABAIGA happen in same cell, I shift PABAIGA up slightly or stack them?
                // Currently just stacking PABAIGA on top if needed, or ensuring they don't overlap completely.
                // Added style bottom: 8px if isFinishWeek to stack them visually.
            }

            rowHtml += `<td class="${cls}" style="${cellStyle}" ${titleAttr}>${content}</td>`;
        });

        // IF NO OVERLAP: New Cell
        if (state.semEnd && !isOverlap && pabaigaDateObj) {
            rowHtml += `<td class="y-cell-empty relative" style="border-left: 1px solid #e2e8f0; min-width: 24px;">
                <div class="absolute inset-0 m-0.5 flex flex-col items-center justify-center bg-red-50/50 rounded border border-red-100">
                    <div class="text-[9px] font-bold text-red-600 leading-none">${pabaigaDateObj.getDate()}</div>
                    <div class="bg-red-500 text-white text-[5px] font-bold px-0.5 rounded-sm leading-none mt-0.5 tracking-wide">PABAIGA</div>
                </div>
            </td>`;
        }

        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    ov.querySelector('.close').onclick = () => ov.remove();
    document.body.appendChild(ov);

    // Render the Calendar in the bottom half
    setTimeout(() => {
        renderYear('yReportCalendarGrid');
    }, 100);

    // --- SPLITTER LOGIC ---
    const splitter = ov.querySelector('#ySplitter');
    const topPane = ov.querySelector('#yGridContainer');
    // bottomPane is flex-1, so just changing topPane height works

    let isDragging = false;
    let dragStartY, dragStartHeight;

    const onDrag = (e) => {
        if (!isDragging) return;
        const delta = e.clientY - dragStartY;
        const newHeight = dragStartHeight + delta;

        // Min height constraints
        if (newHeight > 50 && newHeight < (ov.clientHeight - 100)) {
            topPane.style.height = `${newHeight}px`;
            // Force flex prop to none if it was flex-1 before?
            // topPane has inline style height now, so it should override class flex-1 if relevant
            // actually topPane had style="height: 50%" initially.
        }
    };

    const stopDrag = () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.cursor = '';
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
        }
    };

    splitter.onmousedown = (e) => {
        isDragging = true;
        dragStartY = e.clientY;
        dragStartHeight = topPane.getBoundingClientRect().height;
        document.body.style.cursor = 'row-resize';
        e.preventDefault(); // prevent text selection

        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
    };

    ov.querySelector('.close').onclick = () => {
        stopDrag(); // Ensure cleanup
        ov.remove();
    };
    document.body.appendChild(ov);
}

function exportJSON() { const b = new Blob([JSON.stringify(state)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'kalendorius.json'; a.click(); }
function importJSON(e) { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => { try { state = JSON.parse(ev.target.result); save(); renderFilters(); renderAll(); alert('Įkelta!'); } catch (x) { alert('Klaida'); } }; r.readAsText(f); }
function renderAll() {
    // renderFilters(); // Removed to prevent resetting selection on change
    try { renderInputs(); } catch (e) { console.error("Input Render Error:", e); }
    try { renderYear(); } catch (e) { console.error("Year Render Error:", e); }
    try { renderSidebar(); } catch (e) { console.error("Sidebar Render Error:", e); }
    try { renderVacationsList(); } catch (e) { console.error("Vacation Render Error:", e); }
    try { renderVacationGantt(); } catch (e) { console.error("Gantt Render Error:", e); }
}

// SAFE INIT
document.addEventListener('DOMContentLoaded', () => {
    const elAddMod = $('#addMod'); if (elAddMod) elAddMod.onclick = addModule;
    const elAddVac = $('#addVac'); if (elAddVac) elAddVac.onclick = addVac;
    const elSick = $('#btnSickThisWeek'); if (elSick) elSick.onclick = addSickThisWeek;

    const elWeekly = $('#btnWeekly'); if (elWeekly) elWeekly.onclick = openWeeklyDialog;
    const elYearly = $('#btnYearly'); if (elYearly) elYearly.onclick = openYearlyGridDialog;

    // Init Filters ONCE
    try { renderFilters(); } catch (e) { console.error(e); }

    const elVAll = $('#vAll');
    // vAll removed
    // if (elVAll) elVAll.onchange = (e) => { const t = $('#vGroups'); if (t) t.disabled = e.target.checked; };

    const elAH = $('#btnAutoHolidays'); if (elAH) elAH.onclick = importLithuanianHolidays;
    const elAI = $('#btnAutoImage'); if (elAI) elAI.onclick = importScheduleFromImage;

    const elGF = $('#groupFilter'); if (elGF) elGF.onchange = renderAll;
    const elMF = $('#moduleFilter'); if (elMF) elMF.onchange = renderAll;
    const elTF = $('#teacherFilter'); if (elTF) elTF.onchange = renderAll;
    const elAY = $('#acadYearSelect'); if (elAY) elAY.onchange = renderAll;

    const elSem = $('#sem2Start');
    if (elSem) {
        flatpickr("#sem2Start", {
            locale: "lt", dateFormat: "Y-m-d", defaultDate: state.sem2Start,
            onChange: (selected, dateStr) => { state.sem2Start = dateStr; save(); renderYear(); }
        });
    }

    const elEnd = $('#semEnd');
    if (elEnd) {
        flatpickr("#semEnd", {
            locale: "lt", dateFormat: "Y-m-d", defaultDate: state.semEnd,
            onChange: (selected, dateStr) => { state.semEnd = dateStr; save(); renderYear(); }
        });
    }

    const elExp = $('#btnExport'); if (elExp) elExp.onclick = exportJSON;
    const elImp = $('#fileImport'); if (elImp) elImp.onchange = importJSON;


    // Force Render All on Init
    console.log("App Initialized. Vacations:", state.vacations.length);

    // Sidebar Toggle Logic
    const toggleBtn = $('#sidebarToggleBtn');
    const sidebarWrapper = $('#sidebarWrapper');
    const rightSidebar = $('#rightSidebar');

    if (toggleBtn && sidebarWrapper && rightSidebar) {
        let isCollapsed = false;

        toggleBtn.onclick = () => {
            isCollapsed = !isCollapsed;

            if (isCollapsed) {
                // Collapse
                sidebarWrapper.style.width = '0px';
                rightSidebar.style.transform = 'translateX(100%)';
                rightSidebar.style.opacity = '0';
                toggleBtn.innerHTML = '<span class="material-symbols-outlined text-lg">chevron_left</span>';
            } else {
                // Expand
                sidebarWrapper.style.width = ''; // Auto/Original
                rightSidebar.style.transform = 'translateX(0)';
                rightSidebar.style.opacity = '1';
                toggleBtn.innerHTML = '<span class="material-symbols-outlined text-lg">chevron_right</span>';
            }
        };
    }
});

// SAFETY: Ensure renderAll is called if DOMContentLoaded fired before script loaded (though unlikely for defer)
// But to be sure, let's expose renderAll globally if not already (it is)
// And try to run it safely
try {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(renderAll, 100);
    }
} catch (e) { console.error(e); }

console.log("Script loaded completely.");

// --- VACATION GANTT CHART ---
// Old renderVacationGantt removed

// --- ENHANCED GANTT CHART (OVERWRITE) ---
function renderVacationGantt() {
    console.log("Rendering Gantt Chart (Sticky Headers Version)");
    const container = $('#ganttChartContent');
    const wrapper = $('#vacationGanttContainer');
    if (!container || !wrapper) return;

    // 1. Timeframe
    const ySel = $('#acadYearSelect');
    const startYear = parseInt(ySel.value, 10) || acadYearOf(new Date());
    const startDate = new Date(startYear, 8, 1);
    // User Request: Exclude July & August (end at July 1st)
    const endDate = new Date(startYear + 1, 6, 1);

    const TOTAL_DAYS = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Fit to screen? 
    // Container width is roughly window width - margins.
    // Let's target ~5px per day to fit 365 days in ~1825px (Full HD is 1920).
    // User Request: Wider view (scrollable). 10px per day.
    const PX_PER_DAY = 10;
    const TOTAL_WIDTH = TOTAL_DAYS * PX_PER_DAY;
    const SIDE_COL_WIDTH = 100;

    // 2. Filter
    const gf = $('#groupFilter').value;
    let groups = distinctGroups();
    if (gf) groups = groups.filter(g => g === gf);

    if (groups.length === 0) { wrapper.classList.add('hidden'); return; }
    wrapper.classList.remove('hidden');

    // 3. Build HTML
    let html = '';

    // --- Header ---
    html += `<div class="gantt-header-wrapper" style="width: fit-content; min-width: 100%;">`;
    // Removed absolute corner header

    // Months
    html += `<div class="gantt-header-months" style="width: ${TOTAL_WIDTH + SIDE_COL_WIDTH}px">`;
    html += `<div class="gantt-header-sticky">METAI</div>`;
    let cur = new Date(startDate);
    while (cur < endDate) {
        const m = cur.getMonth();
        const y = cur.getFullYear();
        const nextMonth = new Date(y, m + 1, 1);
        const effectiveEnd = nextMonth > endDate ? endDate : nextMonth;
        const daysInM = (effectiveEnd - cur) / (1000 * 60 * 60 * 24);
        const w = daysInM * PX_PER_DAY;
        html += `<div class="gantt-month-cell" style="width: ${w}px; overflow:hidden;">${LT_MONTHS[m]}</div>`;
        cur = nextMonth;
    }
    html += `</div>`;

    // Days
    html += `<div class="gantt-header-days" style="width: ${TOTAL_WIDTH + SIDE_COL_WIDTH}px">`;
    html += `<div class="gantt-header-sticky">GRUPĖ</div>`;

    cur = new Date(startDate);
    for (let i = 0; i < TOTAL_DAYS; i++) {
        const d = cur.getDate();
        // Show number if it's 1, 5, 10, 15, 20, 25
        const showNum = (d === 1 || d % 5 === 0);
        const txt = showNum ? d : '';
        const borderStyle = (d === 1) ? 'border-left:1px solid #94a3b8;' : 'border-right:1px solid #f1f5f9;';

        html += `<div class="gantt-day-header-cell" style="width: ${PX_PER_DAY}px; ${borderStyle} font-size:8px; padding:0;">${txt}</div>`;
        cur = addDays(cur, 1);
    }
    html += `</div></div>`;

    // --- Body ---
    const vacs = state.vacations || [];
    const getPos = (d) => (d - startDate) / (1000 * 60 * 60 * 24) * PX_PER_DAY;

    // Grid: Dotted lines every 5 days? Or just solid every month?
    // At 5px, strict 1px grid lines might be too heavy. 
    // Let's use a lighter grid.
    const gridStyle = `background-image:linear-gradient(to right, #f1f5f9 1px, transparent 1px);background-size:${PX_PER_DAY}px 100%;`;

    groups.forEach(g => {
        html += `<div class="gantt-body-row" style="width: fit-content; min-width: 100%;">`;
        html += `<div class="gantt-group-col">${g}</div>`;
        html += `<div class="gantt-day-grid" style="width: ${TOTAL_WIDTH}px">`;

        // Background Grid
        html += `<div style="position:absolute;inset:0;${gridStyle}pointer-events:none;"></div>`;

        const groupVacs = vacs.filter(v => vacationAppliesToGroup(v, g));
        groupVacs.forEach(v => {
            if (!v.from || !v.to) return;
            let d1 = parseISO(v.from), d2 = parseISO(v.to);
            if (d2 < startDate || d1 >= endDate) return;
            if (d1 < startDate) d1 = startDate;
            if (d2 >= endDate) d2 = new Date(endDate - 1);

            const left = Math.floor(getPos(d1));
            // Width
            const width = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24) + 1) * PX_PER_DAY;
            const type = v.type || 'vac';
            const tooltip = `${type === 'sick' ? 'Liga' : type === 'work' ? 'Darbo d.' : 'Atostogos'}: ${v.from} - ${v.to}`;

            // Minimal label
            // At 5px per day, 1 week = 35px. 'Atost...' might fit.
            const label = width > 35 ? (width > 50 ? tooltip.split(':')[0] : '..') : '';

            html += `<div class="gantt-bar ${type}" style="left: ${left}px; width: ${Math.max(width, 2)}px;" title="${tooltip}"><span class="gantt-bar-label">${label}</span></div>`;
        });
        html += `</div></div>`;
    });
    container.innerHTML = html;
}
