// A single public plan, with explicit writes and optimistic concurrency.
(() => {
    const endpoint = 'https://api.github.com/repos/mantasloost-max/Grafikas/contents/data/plan.json';
    const baseKey = storageKey + ':github-base';
    const tokenKey = 'grafikas:github-token';
    let busy = false;
    let lastError = '';
    const canonical = value => JSON.stringify(value, function (key, item) {
        return item && typeof item === 'object' && !Array.isArray(item)
            ? Object.keys(item).sort().reduce((out, k) => { out[k] = item[k]; return out; }, {}) : item;
    });
    const getBase = () => localStorage.getItem(baseKey);
    const getToken = () => sessionStorage.getItem(tokenKey) || localStorage.getItem(tokenKey) || '';
    function status() {
        const el = document.getElementById('saveStatus');
        if (el) el.textContent = busy ? 'Jungiamasi prie GitHub…' : lastError || (getBase() === canonical(state) ? 'Išsaugota GitHub' : 'Yra tik naršyklėje · išsaugokite į GitHub');
        document.querySelectorAll('[data-sync-action]').forEach(b => b.disabled = busy);
    }
    async function request(method = 'GET', body) {
        const headers = {'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10'};
        // Public reads need no credential; tokens are sent only to this fixed GitHub endpoint.
        if (method !== 'GET') headers.Authorization = 'Bearer ' + getToken();
        if (body) headers['Content-Type'] = 'application/json';
        const response = await fetch(endpoint + (method === 'GET' ? '?ref=main' : ''), {
            method, headers, cache: 'no-store', body: body ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(20000)
        });
        if (response.status === 404 && method === 'GET') return null;
        if (!response.ok) {
            const message = response.status === 401 ? 'Prieigos raktas netinka arba nebegalioja.'
                : response.status === 403 ? 'GitHub neleidžia užklausos. Patikrinkite rakto teises arba bandykite vėliau.'
                : response.status === 409 || response.status === 422 ? 'Planas tuo metu pasikeitė. Įkelkite GitHub versiją arba pakartokite išsaugojimą.'
                : 'GitHub užklausa nepavyko (' + response.status + ').';
            throw new Error(message);
        }
        return response.json();
    }
    function decode(file) {
        if (!file || file.encoding !== 'base64' || !file.sha) throw new Error('Netinkamas GitHub plano failas.');
        const bytes = Uint8Array.from(atob(file.content.replace(/\s/g, '')), c => c.charCodeAt(0));
        const plan = JSON.parse(new TextDecoder().decode(bytes));
        if (!plan || !Array.isArray(plan.modules) || !Array.isArray(plan.vacations) || plan.modules.some(m =>
            !m.id || typeof m.name !== 'string' || !m.start || !Array.isArray(m.sched) || m.sched.length !== 7 || !(Number(m.target) > 0))) {
            throw new Error('GitHub faile netinkami plano duomenys. Vietiniai duomenys nepakeisti.');
        }
        return plan;
    }
    function apply(plan) {
        const next = JSON.stringify(plan);
        const previous = JSON.stringify(state);
        localStorage.setItem(storageKey, next);
        state = plan; undoState = previous;
        localStorage.setItem(baseKey, canonical(plan));
        for (const [id, value] of [['sem2Start', plan.sem2Start], ['semEnd', plan.semEnd]]) {
            const input = document.getElementById(id);
            if (input?._flatpickr) input._flatpickr.setDate(value || '', false);
            else if (input) input.value = value || '';
        }
        renderAll(); renderVacationsList();
        showNotice('Įkeltas GitHub planas.', true);
    }
    async function run(action) {
        if (busy) return;
        busy = true; lastError = ''; status();
        try { await action(); }
        catch (error) { lastError = 'Nesinchronizuota'; showNotice(error.name === 'TypeError' || error.name === 'TimeoutError' ? 'Nepavyko prisijungti. Vietiniai duomenys išliko; bandykite dar kartą.' : error.message); }
        finally { busy = false; status(); }
    }
    async function pull(automatic = false) {
        await run(async () => {
            const before = canonical(state);
            const localExists = localStorage.getItem(storageKey) !== null;
            const file = await request();
            if (!file) { if (!automatic) showNotice('GitHub plano dar nėra. Kompiuteryje su moduliais spauskite „Išsaugoti į GitHub“.'); return; }
            const plan = decode(file), remote = canonical(plan);
            if (before !== canonical(state)) { showNotice('Planas redaguotas įkėlimo metu. Bandykite įkelti dar kartą.'); return; }
            if (remote === before) { localStorage.setItem(baseKey, remote); return; }
            if (automatic && localExists && getBase() !== before) {
                lastError = 'GitHub yra planas · vietiniai pakeitimai išsaugoti'; return;
            }
            if (!automatic && !(await askConfirmation('Įkelti GitHub planą?', 'Šios naršyklės planą pakeis GitHub versija. Dabartinė versija bus išsaugota kaip atsarginė kopija.'))) return;
            if (before !== canonical(state)) throw new Error('Planas pasikeitė. Pakartokite įkėlimą.');
            localStorage.setItem(storageKey + ':before-github-load', JSON.stringify(state));
            apply(plan);
        });
    }
    async function push() {
        if (!getToken()) { openSettings(); return; }
        await run(async () => {
            const snapshot = JSON.parse(JSON.stringify(state));
            const content = canonical(snapshot);
            const file = await request();
            const remote = file ? canonical(decode(file)) : null;
            if (remote === content) { localStorage.setItem(baseKey, content); showNotice('GitHub jau yra ši plano versija.'); return; }
            if (file && remote !== getBase()) {
                if (!(await askConfirmation('GitHub yra kita plano versija', 'Kito kompiuterio arba ankstesni duomenys skiriasi. Patvirtinus juos pakeis šios naršyklės planas. Norėdami parsisiųsti juos, atšaukite ir rinkitės „Įkelti iš GitHub“.'))) return;
            }
            const bytes = new TextEncoder().encode(JSON.stringify(snapshot, null, 2));
            let binary = ''; bytes.forEach(byte => binary += String.fromCharCode(byte));
            const body = {message: 'Save teaching plan [skip ci]', content: btoa(binary), branch: 'main'};
            if (file) body.sha = file.sha;
            await request('PUT', body);
            localStorage.setItem(baseKey, content);
            showNotice(canonical(state) === content ? 'Planas išsaugotas GitHub. Jį matysite ir kitame kompiuteryje.' : 'Versija išsaugota GitHub. Naujesnius vietinius pakeitimus išsaugokite dar kartą.');
        });
    }
    function openSettings() {
        const overlay = document.createElement('div'); overlay.className = 'annual-edit-overlay';
        overlay.innerHTML = `<section class="annual-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="syncTitle">
            <h3 id="syncTitle">Išsaugojimas į GitHub</h3>
            <p>Planas bus viešas. Peržiūrai kitame kompiuteryje rakto nereikia.</p>
            <ol><li>Atidarykite <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">GitHub rakto kūrimą</a>.</li>
            <li>Pasirinkite „Only select repositories“ → „Grafikas“.</li><li>Pridėkite „Contents“ → „Read and write“, tada „Generate token“.</li></ol>
            <label for="syncToken">Prieigos raktas</label><input id="syncToken" type="password" autocomplete="off" spellcheck="false" placeholder="Įklijuokite sukurtą raktą">
            <label><input id="syncRemember" type="checkbox"> Prisiminti šiame asmeniniame kompiuteryje</label>
            <p>Nežymint raktas galios tik šiame naršyklės skirtuke. Jis neįtraukiamas į planą ar eksportą.</p>
            <footer><button id="syncForget">Pašalinti raktą</button><button id="syncClose">Uždaryti</button><button id="syncConnect" class="save">Išsaugoti planą</button></footer></section>`;
        document.body.appendChild(overlay);
        const input = overlay.querySelector('#syncToken'); input.value = getToken();
        overlay.querySelector('#syncRemember').checked = !!localStorage.getItem(tokenKey);
        overlay.querySelector('#syncClose').onclick = () => overlay.remove();
        overlay.querySelector('#syncForget').onclick = () => { sessionStorage.removeItem(tokenKey); localStorage.removeItem(tokenKey); input.value = ''; showNotice('Prieigos raktas pašalintas.'); };
        overlay.querySelector('#syncConnect').onclick = () => {
            if (!input.value.trim()) { fieldError(input, 'Įklijuokite prieigos raktą.'); return; }
            const token = input.value.trim();
            sessionStorage.removeItem(tokenKey); localStorage.removeItem(tokenKey);
            (overlay.querySelector('#syncRemember').checked ? localStorage : sessionStorage).setItem(tokenKey, token);
            overlay.remove(); push();
        };
        input.focus();
    }
    window.updateGitHubStatus = () => { lastError = ''; status(); };
    document.addEventListener('DOMContentLoaded', () => {
        const anchor = document.getElementById('saveStatus');
        const actions = document.createElement('div'); actions.className = 'github-actions';
        for (const [label, handler] of [['Išsaugoti į GitHub', push], ['Įkelti iš GitHub', () => pull()], ['Ryšys', openSettings]]) {
            const button = document.createElement('button'); button.textContent = label; button.dataset.syncAction = 'true'; button.onclick = handler; actions.appendChild(button);
        }
        anchor.after(actions); status(); pull(true);
    });
})();
