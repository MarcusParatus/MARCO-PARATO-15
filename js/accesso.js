    // =================================================================
    // ACCESSO: registrazione, login, approvazione dei collaboratori
    // -----------------------------------------------------------------
    // Dati nel database:
    //   utenti/{uid} = { nome, email, stato, richiestoIl }
    //                  stato: 'in_attesa' | 'approvato' | 'revocato'
    //   admin/{uid}  = true   -> l'amministratore. NON si imposta dall'app:
    //                  si scrive dalla console Firebase o dal terminale.
    // Chi può leggere e scrivere lo decidono le regole in database.rules.json.
    // =================================================================

    const auth = firebase.auth();
    let utenteCorrente = null;   // { uid, email, nome, admin }
    let appAvviata = false;
    let smettiDiAscoltareUtente = null;

    // --- Cambio di stato dell'accesso (login, logout, riapertura della pagina) ---
    auth.onAuthStateChanged(async (user) => {
        if (smettiDiAscoltareUtente) { smettiDiAscoltareUtente(); smettiDiAscoltareUtente = null; }
        if (!user) {
            utenteCorrente = null;
            esciDallApp();
            mostraAccesso('login');
            return;
        }

        let admin = false;
        try { admin = (await db.ref('admin/' + user.uid).once('value')).val() === true; }
        catch (e) { admin = false; }

        // Ascolta la propria scheda: l'approvazione (o la revoca) ha effetto subito, senza ricaricare
        const ref = db.ref('utenti/' + user.uid);
        const suCambio = (snap) => {
            const u = snap.val();
            utenteCorrente = { uid: user.uid, email: user.email, nome: (u && u.nome) || user.email, admin };
            document.querySelectorAll('.accesso-chi').forEach(el => el.textContent = `${utenteCorrente.nome} (${user.email})`);
            if (admin || (u && u.stato === 'approvato')) entraNellApp();
            else { esciDallApp(); mostraAccesso(u && u.stato === 'revocato' ? 'revocato' : 'attesa'); }
        };
        ref.on('value', suCambio, () => { esciDallApp(); mostraAccesso('attesa'); });
        smettiDiAscoltareUtente = () => ref.off('value', suCambio);
    });

    // Mostra uno dei pannelli della schermata di accesso: 'login' | 'registra' | 'attesa' | 'revocato'
    function mostraAccesso(quale) {
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('formAccesso').hidden = quale !== 'login';
        document.getElementById('formRegistra').hidden = quale !== 'registra';
        document.getElementById('pannelloAttesa').hidden = quale !== 'attesa';
        document.getElementById('pannelloRevocato').hidden = quale !== 'revocato';
        messaggioAccesso('');
    }

    function messaggioAccesso(testo, errore = true) {
        const el = document.getElementById('accessoMsg');
        el.textContent = testo;
        el.style.color = errore ? '#e74c3c' : '#2ecc71';
    }

    function entraNellApp() {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('utenteNome').textContent = utenteCorrente.nome;
        document.getElementById('btnCollaboratori').style.display = utenteCorrente.admin ? 'flex' : 'none';
        if (!appAvviata) {
            appAvviata = true;
            setupFirebaseListeners();
            if (utenteCorrente.admin) ascoltaRichieste();
        }
    }

    function esciDallApp() {
        if (!appAvviata) return;
        appAvviata = false;
        stopFirebaseListeners();
        db.ref('utenti').off();
        closeModal('collaboratoriModal');
    }

    // Chiamata da app.js quando il database rifiuta la lettura degli eventi (es. accesso revocato)
    function accessoNegato() {
        esciDallApp();
        mostraAccesso(utenteCorrente ? 'attesa' : 'login');
    }

    function esci() {
        auth.signOut();
    }

    // Traduce gli errori di Firebase; se il codice non è tra questi mostra il messaggio originale
    function erroreLeggibile(err) {
        const testi = {
            'auth/invalid-email': 'Email non valida.',
            'auth/user-not-found': 'Email o password errate.',
            'auth/wrong-password': 'Email o password errate.',
            'auth/invalid-credential': 'Email o password errate.',
            'auth/email-already-in-use': 'Questa email è già registrata: usa "Entra".',
            'auth/weak-password': 'Password troppo corta: almeno 6 caratteri.',
            'auth/too-many-requests': 'Troppi tentativi. Riprova tra qualche minuto.',
            'auth/network-request-failed': 'Nessuna connessione a internet.'
        };
        return testi[err.code] || ('Errore: ' + err.message);
    }

    // --- Moduli di accesso e registrazione ---
    document.getElementById('formAccesso').addEventListener('submit', (e) => {
        e.preventDefault();
        messaggioAccesso('Accesso in corso...', false);
        auth.signInWithEmailAndPassword(
            document.getElementById('accessoEmail').value.trim(),
            document.getElementById('accessoPassword').value
        ).catch(err => messaggioAccesso(erroreLeggibile(err)));
    });

    document.getElementById('formRegistra').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('registraNome').value.trim();
        const email = document.getElementById('registraEmail').value.trim();
        messaggioAccesso('Registrazione in corso...', false);
        try {
            const cred = await auth.createUserWithEmailAndPassword(email, document.getElementById('registraPassword').value);
            await db.ref('utenti/' + cred.user.uid).set({ nome, email, stato: 'in_attesa', richiestoIl: new Date().toISOString() });
        } catch (err) {
            messaggioAccesso(erroreLeggibile(err));
        }
    });

    function passwordDimenticata() {
        const email = document.getElementById('accessoEmail').value.trim();
        if (!email) return messaggioAccesso('Scrivi la tua email nel campo qui sopra, poi premi di nuovo "Password dimenticata?".');
        auth.sendPasswordResetEmail(email)
            .then(() => messaggioAccesso('Ti abbiamo inviato un\'email per scegliere una nuova password.', false))
            .catch(err => messaggioAccesso(erroreLeggibile(err)));
    }

    // =================================================================
    // PANNELLO COLLABORATORI (solo amministratore)
    // =================================================================
    let elencoUtenti = {};

    function ascoltaRichieste() {
        db.ref('utenti').on('value', (snap) => {
            elencoUtenti = snap.val() || {};
            const inAttesa = Object.values(elencoUtenti).filter(u => u.stato === 'in_attesa').length;
            document.getElementById('badgeAttesa').textContent = inAttesa ? inAttesa + ' in attesa' : '';
            if (document.getElementById('collaboratoriModal').classList.contains('active')) disegnaCollaboratori();
        });
    }

    function apriCollaboratori() {
        disegnaCollaboratori();
        document.getElementById('collaboratoriModal').classList.add('active');
    }

    function disegnaCollaboratori() {
        const box = document.getElementById('collaboratoriLista');
        box.innerHTML = '';
        const gruppi = [
            ['in_attesa', '⏳ In attesa', [['approvato', 'Approva', 'btn-success'], ['revocato', 'Rifiuta', 'btn-danger']]],
            ['approvato', '✅ Approvati', [['revocato', 'Revoca', 'btn-danger']]],
            ['revocato', '⛔ Revocati', [['approvato', 'Riattiva', 'btn-success']]]
        ];
        let totale = 0;
        gruppi.forEach(([stato, titolo, azioni]) => {
            const lista = Object.entries(elencoUtenti).filter(([, u]) => u.stato === stato)
                                .sort((a, b) => (a[1].nome || '').localeCompare(b[1].nome || ''));
            if (!lista.length) return;
            totale += lista.length;
            const h = document.createElement('h4');
            h.textContent = `${titolo} (${lista.length})`;
            h.style.margin = '12px 0 6px';
            box.appendChild(h);
            lista.forEach(([uid, u]) => {
                const riga = document.createElement('div');
                riga.className = 'collab-riga';
                riga.innerHTML = `<div><b>${esc(u.nome)}</b><br><small>${esc(u.email)}</small></div><div class="collab-azioni"></div>`;
                if (uid !== utenteCorrente.uid) {
                    azioni.forEach(([nuovo, etichetta, classe]) => {
                        const b = document.createElement('button');
                        b.className = 'btn ' + classe;
                        b.textContent = etichetta;
                        b.onclick = () => cambiaStato(uid, u, nuovo);
                        riga.querySelector('.collab-azioni').appendChild(b);
                    });
                }
                box.appendChild(riga);
            });
        });
        if (!totale) box.innerHTML = '<p>Nessun collaboratore registrato. Manda il link dell\'app: chi si registra comparirà qui.</p>';
    }

    function cambiaStato(uid, u, nuovo) {
        if (nuovo === 'revocato' && u.stato === 'approvato' &&
            !confirm(`Togliere l'accesso a ${u.nome}?\nNon potrà più vedere né modificare le prenotazioni.`)) return;
        db.ref('utenti/' + uid + '/stato').set(nuovo)
            .catch(err => alert('Errore: ' + err.message));
    }
