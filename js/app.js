    // =================================================================
    // CONFIGURAZIONE FIREBASE - INCOLLA QUI I TUOI DATI
    // =================================================================
    const firebaseConfig = {
        apiKey: "AIzaSyBFEHRIEhzCvZj4-uegJC4K5gcpPNKmZxc",
        authDomain: "teatroapp-8a84c.firebaseapp.com",
        databaseURL: "https://teatroapp-8a84c-default-rtdb.firebaseio.com", // O .firebaseio.com
        projectId: "teatroapp-8a84c",
        storageBucket: "teatroapp-8a84c.firebasestorage.app",
        messagingSenderId: "997937568412",
        appId: "1:997937568412:web:f974d01722cd78ac182b59"
    };
    // =================================================================

    // INIZIALIZZA FIREBASE
    let db;
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
    } catch(e) {
        console.error("Errore Firebase. Hai inserito la config?", e);
        alert("ERRORE: Devi inserire la configurazione Firebase nel codice!");
    }

    // LAYOUT DEI POSTI
    const baseLayouts = {
        "platea": {
            "A": ["X","X","W","10","9","8","7","6","W","X","W","5","4","3","2","1","W","X","X"],
            "B": ["X","W","12","11","10","9","8","7","W","X","W","6","5","4","3","2","1","W","X"],
            "C": ["W","14","13","12","11","10","9","8","W","X","W","7","6","5","4","3","2","1","W"],
            "D": ["W","14","13","12","11","10","9","8","W","X","W","7","6","5","4","3","2","1","W"],
            "E": ["W","14","13","12","11","10","9","8","W","X","W","7","6","5","4","3","2","1","W"],
            "F": ["W","14","13","12","11","10","9","8","W","X","W","7","6","5","4","3","2","1","W"],
            "G": ["W","14","13","12","11","10","9","8","W","X","W","7","6","5","4","3","2","1","W"],            
            "H": ["W","14","13","12","11","10","9","8","W","X","W","7","6","5","4","3","2","1","W"],
            "I": ["W","14","13","12","11","10","9","8","W","X","W","7","6","5","4","3","2","1","W"],
            "L": ["W","14","13","12","11","10","9","8","W","X","W","7","6","5","4","3","2","1","W"],
            "CORRIDOIO": ["SPACE"],
            "M": ["W","14","13","12","11","10","9","8","W","X","W","7","6","5","4","3","2","1","W"],
            "N": ["W","14","13","12","11","10","9","8","W","X","W","7","6","5","4","3","2","1","W"],
            "O": ["W","14","13","12","11","10","9","8","W","X","W","7","6","5","4","3","2","1","W"],
            "P": ["W","14","13","12","11","10","9","8","W","X","W","7","6","5","4","3","2","1","W"],
            "Q": ["W","14","13","12","11","10","9","8","W","X","W","7","6","5","4","3","2","1","W"],
            "R": ["W","14","13","12","11","10","9","8","W","X","W","7","6","5","4","3","2","1","W"],
            "S": ["W","14","13","12","11","10","9","8","W","X","W","7","6","5","4","3","2","1","W"],
            "T": ["W","14","13","12","11","10","9","8","W","X","W","7","6","5","4","3","2","1","W"],
            "U": ["X","10","9","8","X","X","7","6","X","X","5","4","X","3","2","1","X"]
        },
        "galleria": {
            "A": ["2","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","1"],
            "B": ["2","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","1"],
            "C": ["2","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","1"],
            "D": ["2","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","1"],
            "E": ["2","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","1"],
            "F": ["2","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","1"],
            "G": ["2","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","1"],
            "H": ["2","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","1"],
            "I": ["2","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","1"],
            "L": ["2","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","1"],
            "M": ["2","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","X","1"],
            "N": ["X","14","13","12","11","10","9","8","X","7","6","5","4","3","2","1"],
            "O": ["X","14","13","12","11","10","9","8","X","7","6","5","4","3","2","1"],
            "P": ["X","10","9","8","X","7","6","X","X","X","X","5","4","X","3","2","1","X"]
        }
    };

    // VARIABILI GLOBALI
    let localEvents = {}; // Copia locale dei dati
    let currentEventId = null;
    let currentArea = 'platea';
    let selected = [];
    let extraVisible = false;
    let pendingAction = null;

    // --- AVVIO ---
    document.addEventListener('DOMContentLoaded', () => {
        setupFirebaseListeners();
        
        // Mobile Sidebar handling
        if(window.innerWidth <= 768) document.getElementById('closeSidebarBtn').style.display = 'block';

        // Form Submit
        document.getElementById('createEventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            createEvent();
        });

        document.getElementById('bookingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            confirmBooking();
        });
    });

    // --- FIREBASE SYNC ---
    function setupFirebaseListeners() {
        const connectedRef = db.ref(".info/connected");
        connectedRef.on("value", (snap) => {
            const el = document.getElementById('dbStatus');
            const txt = document.getElementById('statusText');
            if (snap.val() === true) {
                el.classList.add('status-online');
                txt.textContent = "Online";
                el.style.backgroundColor = "#2ecc71";
            } else {
                el.classList.remove('status-online');
                txt.textContent = "Offline";
                el.style.backgroundColor = "#e74c3c";
            }
        });

        // Ascolta TUTTI gli eventi. Appena qualcosa cambia nel DB, viene eseguito questo.
        db.ref('events').on('value', (snapshot) => {
            localEvents = snapshot.val() || {};
            renderEventList();
            
            // Se c'è un evento selezionato, aggiorna la mappa in tempo reale
            if (currentEventId && localEvents[currentEventId]) {
                updateHeader();
                renderMap(); // Ridisegna la mappa con i nuovi dati
            } else if (currentEventId && !localEvents[currentEventId]) {
                // L'evento è stato cancellato da qualcun altro
                currentEventId = null;
                document.getElementById('seatMap').innerHTML = '<div style="padding:20px; text-align:center;">Evento eliminato</div>';
            }
        });
    }

    // --- GESTIONE EVENTI ---
    async function createEvent() {
        const title = document.getElementById('eventTitle').value;
        const date = document.getElementById('eventDate').value;
        const time = document.getElementById('eventTime').value;
        const loc = document.getElementById('eventLoc').value;
        const price = parseFloat(document.getElementById('eventPrice').value);
        const imgFile = document.getElementById('eventImg').files[0];
        
        let imgData = null;
        if (imgFile) {
            // Se c'è un'immagine, la comprimiamo
            imgData = await compressImage(imgFile);
        }

        const newId = 'evt_' + Date.now();
        
        let maps = {};
        for(let area in baseLayouts) {
            maps[area] = {};
            for(let row in baseLayouts[area]) {
                if(row === 'CORRIDOIO') continue;
                maps[area][row] = baseLayouts[area][row].map(token => {
                    if(token === 'X') return { state: 'empty' };
                    if(token === 'W') return { id: 'Sedia', state: 'free', extra: true };
                    return { id: token, state: 'free', extra: false };
                });
            }
        }

        // Salviamo anche l'immagine (imgData)
        db.ref('events/' + newId).set({ 
            id: newId, title, date, time, location: loc, price, maps, image: imgData 
        })
        .then(() => { 
            document.getElementById('createEventForm').reset(); 
            selectEvent(newId); 
            if(window.innerWidth <= 768) toggleSidebar(); 
        })
        .catch(err => alert("Errore: " + err.message));
    }

    function initMapStructure() {
        let maps = {};
        for(let area in baseLayouts) {
            maps[area] = {};
            for(let row in baseLayouts[area]) {
                if(row === 'CORRIDOIO') continue;
                maps[area][row] = baseLayouts[area][row].map(token => {
                    if(token === 'X') return { state: 'empty' };
                    if(token === 'W') return { id: 'Sedia', state: 'free', extra: true };
                    return { id: token, state: 'free', extra: false };
                });
            }
        }
        return maps;
    }

    function renderEventList() {
        const list = document.getElementById('eventList');
        list.innerHTML = '';
        const keys = Object.keys(localEvents);
        
        if(keys.length === 0) {
            list.innerHTML = '<div style="padding:10px; text-align:center; color:#ddd;">Nessun evento</div>';
            return;
        }

        // Ordina per data
        keys.sort((a,b) => localEvents[b].id.localeCompare(localEvents[a].id));

        keys.forEach(key => {
            const evt = localEvents[key];
            const div = document.createElement('div');
            div.className = 'event-item';
            if(evt.id === currentEventId) div.className += ' active';
            
            div.innerHTML = `
                <div style="font-weight:bold;">${evt.title}</div>
                <div style="font-size:0.8rem; opacity:0.8;">${formatDate(evt.date)} ore ${evt.time}</div>
                <div class="delete-btn" onclick="deleteEvent('${evt.id}', event)">✕</div>
            `;
            div.onclick = (e) => {
                if(!e.target.classList.contains('delete-btn')) selectEvent(evt.id);
            };
            list.appendChild(div);
        });
    }

    
    function selectEvent(id) {
        currentEventId = id;
        selected = [];
        updateHeader();
        renderMap();
        if(window.innerWidth <= 768) toggleSidebar();
    }

    function updateHeader() {
        const evt = localEvents[currentEventId];
        if(evt) {
            document.getElementById('currentEventTitle').textContent = evt.title;
            document.getElementById('currentEventDetails').textContent = `${formatDate(evt.date)} - ${evt.time}`;
        }
    }

    // --- MAPPA E LOGICA ---
    function renderMap() {
        const evt = localEvents[currentEventId];
        const container = document.getElementById('seatMap');
        container.innerHTML = '';
        
        if(!evt) return;

        const areaMap = evt.maps[currentArea];
        
        // Calcola totali mentre renderizzi
        let counts = { free:0, paid:0, blocked:0, omaggio:0 };
        
        // Calcolo totale su TUTTE le aree, non solo quella visibile
        for(let a in evt.maps) {
            for(let r in evt.maps[a]) {
                evt.maps[a][r].forEach(s => {
                     if(s.state !== 'empty') {
                         if(!s.extra || extraVisible || s.state !== 'free') {
                            counts[s.state]++;
                         }
                     }
                });
            }
        }

        document.getElementById('freeCount').textContent = counts.free;
        document.getElementById('paidCount').textContent = counts.paid;
        document.getElementById('blockedCount').textContent = counts.blocked;
        document.getElementById('giftCount').textContent = counts.omaggio;
        document.getElementById('totalRevenue').textContent = '€' + (counts.paid * evt.price);

        // Rendering vero e proprio
        for(const rowLabel in baseLayouts[currentArea]) {
            if(rowLabel === 'CORRIDOIO') {
                container.appendChild(Object.assign(document.createElement('div'), {style:'height:25px'}));
                continue;
            }

            const rowDiv = document.createElement('div');
            rowDiv.className = 'row';
            rowDiv.appendChild(Object.assign(document.createElement('div'), {className:'row-label', textContent:rowLabel}));

            areaMap[rowLabel].forEach((seat, idx) => {
                const sDiv = document.createElement('div');
                sDiv.className = 'seat ' + seat.state;
                if(seat.state === 'empty') sDiv.classList.add('empty');
                else {
                    sDiv.textContent = seat.id;
                    if(seat.extra && !extraVisible && seat.state === 'free') sDiv.classList.add('hidden');
                    
                    const seatKey = `${currentArea}|${rowLabel}|${idx}`;
                    if(selected.includes(seatKey)) sDiv.classList.add('selected');
                    
                    sDiv.onclick = () => toggleSelect(seatKey);
                }
                rowDiv.appendChild(sDiv);
            });
            container.appendChild(rowDiv);
        }
    }

    function toggleSelect(key) {
        if(selected.includes(key)) selected = selected.filter(k => k !== key);
        else selected.push(key);
        renderMap(); // Rerender locale rapido per mostrare la selezione
    }

    function clearSelection() {
        selected = [];
        renderMap();
    }

    function switchArea(area, tab) {
        currentArea = area;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        selected = []; // Cambio area resetta selezione
        renderMap();
    }

    function toggleExtraSeats() {
        if(currentArea !== 'platea') return alert("Le sedie extra sono solo in platea");
        extraVisible = !extraVisible;
        document.getElementById('extraTab').textContent = extraVisible ? '- Sedie' : '+ Sedie';
        renderMap();
    }

    // --- AZIONI E SALVATAGGIO CLOUD ---
    function applyAction(action) {
        if(!currentEventId) return;
        if(selected.length === 0) return alert("Seleziona almeno un posto.");

        if(action === 'free') {
            // Libera posti direttamente
            updateSeatsOnCloud('free', null);
        } else {
            // Richiede dati cliente
            pendingAction = action;
            document.getElementById('selectedCountLabel').textContent = selected.length;
            
            // Prefill se è un solo posto già occupato
            const evt = localEvents[currentEventId];
            const firstKey = selected[0];
            const [a, r, i] = firstKey.split('|');
            const seat = evt.maps[a][r][i];
            
            if(selected.length === 1 && seat.booking) {
                document.getElementById('bookingCognome').value = seat.booking.cognome;
                document.getElementById('bookingNome').value = seat.booking.nome;
                document.getElementById('bookingTelefono').value = seat.booking.telefono;
            } else {
                document.getElementById('bookingForm').reset();
            }
            
            document.getElementById('bookingModal').classList.add('active');
        }
    }

    function confirmBooking() {
        const data = {
            cognome: document.getElementById('bookingCognome').value.trim(),
            nome: document.getElementById('bookingNome').value.trim(),
            telefono: document.getElementById('bookingTelefono').value.trim()
        };
        updateSeatsOnCloud(pendingAction, data);
        closeModal('bookingModal');
    }

    function updateSeatsOnCloud(newState, bookingData) {
        if(selected.length === 0) return;
        
        // Creiamo un oggetto di aggiornamenti per Firebase
        // Per aggiornare solo i posti specifici senza sovrascrivere tutto l'evento
        let updates = {};
        
        selected.forEach(key => {
            const [area, row, idx] = key.split('|');
            const path = `events/${currentEventId}/maps/${area}/${row}/${idx}`;
            
            updates[path + '/state'] = newState;
            updates[path + '/booking'] = (newState === 'free') ? null : bookingData;
        });

        // Invio atomico
        db.ref().update(updates)
            .then(() => {
                selected = [];
                // Il listener on('value') ridisegna PRIMA di questo punto, con la selezione ancora attiva:
                // serve un ridisegno per togliere l'evidenziazione
                renderMap();
            })
            .catch(err => alert("Errore di sincronizzazione: " + err.message));
    }

    // --- REGISTRO PDF ---
    function downloadRegistryPDF() {
        if(!currentEventId) return alert("Nessun evento selezionato");
        const evt = localEvents[currentEventId];
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // 1. Raccogli dati
        let rows = [];
        for(let area in evt.maps) {
            for(let row in evt.maps[area]) {
                evt.maps[area][row].forEach((seat) => {
                    if(['paid','blocked','omaggio'].includes(seat.state) && seat.booking) {
                        rows.push([
                            seat.booking.cognome + ' ' + seat.booking.nome,
                            seat.booking.telefono || '',
                            `${area.toUpperCase()} ${row}-${seat.id}`,
                            seat.state.toUpperCase()
                        ]);
                    }
                });
            }
        }

        // Ordina per cognome
        rows.sort((a,b) => a[0].localeCompare(b[0]));

        // Intestazione
        doc.setFontSize(18);
        doc.text(`REGISTRO: ${evt.title}`, 14, 20);
        doc.setFontSize(12);
        doc.text(`Data: ${formatDate(evt.date)} - Ore ${evt.time}`, 14, 28);
        doc.text(`Totale Prenotazioni: ${rows.length}`, 14, 34);

        // Tabella
        doc.autoTable({
            startY: 40,
            head: [['Nominativo', 'Telefono', 'Posto', 'Stato']],
            body: rows,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] },
            styles: { fontSize: 10 },
            alternateRowStyles: { fillColor: [240, 240, 240] }
        });

        doc.save(`Registro_${evt.title.replace(/\s/g,'_')}.pdf`);
    }

    function viewDetails() {
        if(!currentEventId) return;
        if(selected.length !== 1) return alert("Seleziona UN solo posto per i dettagli.");
        
        const evt = localEvents[currentEventId];
        const [area, row, idx] = selected[0].split('|');
        const seat = evt.maps[area][row][idx];

        let html = `<div style="font-size:1.2rem; font-weight:bold; margin-bottom:10px;">
                        ${area.toUpperCase()} - Fila ${row} - Posto ${seat.id}
                    </div>
                    <div>Stato: <b>${seat.state.toUpperCase()}</b></div>`;
        
        if(seat.booking) {
            html += `<hr style="margin:10px 0; border:0; border-top:1px solid #eee;">
                     <div>👤 ${seat.booking.cognome} ${seat.booking.nome}</div>
                     <div style="margin-top:5px;">📞 <a href="tel:${seat.booking.telefono}">${seat.booking.telefono}</a></div>`;
        }
        
        document.getElementById('detailsContent').innerHTML = html;
        document.getElementById('detailsModal').classList.add('active');
    }

    // --- FUNZIONE CERCA ---
    function searchAndSelect() {
        const query = document.getElementById('searchInput').value.trim().toLowerCase();
        if(!query) return alert("Inserisci un nome.");
        const evt = localEvents[currentEventId];
        if(!evt) return alert("Nessun evento selezionato.");
        
        selected = [];
        let foundArea = null;

        for(let area in evt.maps) {
            for(let row in evt.maps[area]) {
                evt.maps[area][row].forEach((seat, idx) => {
                    if(seat.booking) {
                        const nomeCompleto = (seat.booking.cognome + " " + seat.booking.nome).toLowerCase();
                        if(nomeCompleto.includes(query)) {
                            selected.push(`${area}|${row}|${idx}`);
                            if(!foundArea) foundArea = area;
                        }
                    }
                });
            }
        }

        if(selected.length > 0) {
            if(foundArea && foundArea !== currentArea) {
                currentArea = foundArea;
                // Aggiorna tab attive
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                const tabs = document.querySelectorAll('.tab');
                if(foundArea === 'platea') tabs[0].classList.add('active'); else tabs[1].classList.add('active');
            }
            renderMap();
            if(window.innerWidth <= 768) toggleSidebar(); // Chiudi menu su mobile
            alert(`Trovati ${selected.length} posti.`);
        } else {
            alert("Nessuna prenotazione trovata.");
        }
    }

    // --- FUNZIONE REGISTRO A SCHERMO ---
    function openRegistry() {
        if(!currentEventId) return;
        const evt = localEvents[currentEventId];
        const container = document.getElementById('registryList');
        container.innerHTML = '';
        
        let list = [];
        for(let area in evt.maps) {
            for(let row in evt.maps[area]) {
                evt.maps[area][row].forEach((seat) => {
                    if(['paid','blocked','omaggio'].includes(seat.state) && seat.booking) {
                        list.push({
                            name: seat.booking.cognome + ' ' + seat.booking.nome,
                            phone: seat.booking.telefono,
                            seat: `${area.toUpperCase()} ${row}-${seat.id}`,
                            state: seat.state
                        });
                    }
                });
            }
        }

        if(list.length === 0) container.innerHTML = '<p>Nessuna prenotazione.</p>';
        else {
            list.sort((a,b) => a.name.localeCompare(b.name));
            list.forEach(item => {
                // Colore bordo in base allo stato
                let color = '#ccc';
                if(item.state === 'paid') color = '#e74c3c';
                if(item.state === 'blocked') color = '#f39c12';
                if(item.state === 'omaggio') color = '#3498db';

                const div = document.createElement('div');
                div.style.cssText = `border:1px solid #eee; padding:10px; margin-bottom:5px; border-left:5px solid ${color}; background:white;`;
                div.innerHTML = `
                    <div style="font-weight:bold;">${item.name}</div>
                    <div style="font-size:0.8rem; color:#666;">${item.seat} - ${item.state.toUpperCase()}</div>
                    ${item.phone ? `<div style="font-size:0.8rem;">📞 ${item.phone}</div>` : ''}
                `;
                container.appendChild(div);
            });
        }
        document.getElementById('registryModal').classList.add('active');
    }

    // --- FUNZIONE STAMPA BIGLIETTI ---
    function openTicketConfig() {
        if(selected.length === 0) return alert("Seleziona i posti sulla mappa per stamparli.");
        document.getElementById('ticketCountLabel').innerText = selected.length;
        document.getElementById('ticketModal').classList.add('active');
    }

    function generateTickets() {
        const { jsPDF } = window.jspdf;
        const evt = localEvents[currentEventId];
        const format = document.getElementById('ticketFormat').value;
        
        let dim = [210, 297]; // A4
        if(format === 'A6') dim = [105, 148];
        if(format === '80') dim = [80, 150];

        selected.forEach(key => {
            const doc = new jsPDF({ unit: 'mm', format: dim });
            const [area, row, idx] = key.split('|');
            const seat = evt.maps[area][row][idx];
            const booking = seat.booking || { cognome: '---', nome: '' };
            const w = dim[0];
            const h = dim[1];

            // 1. Cornice
            doc.setLineWidth(0.5); 
            doc.rect(3, 3, w-6, h-6);
            
            // 2. Calcoliamo quanto spazio serve al testo (Zona Riservata in basso)
            // Riserviamo gli ultimi 80mm (8cm) per il testo. Tutto il resto sopra è per la foto.
            const textHeightNeeded = 80; 
            const maxImgH = h - textHeightNeeded - 10; // -10 per margine in alto
            const maxImgW = w - 10; // -10 per margini laterali

            // 3. Posizionamento e Scalatura Immagine
            if (evt.image) {
                const imgProps = doc.getImageProperties(evt.image);
                
                // Calcola il fattore di scala per larghezza e altezza
                const ratioW = maxImgW / imgProps.width;
                const ratioH = maxImgH / imgProps.height;
                
                // Scegli il rapporto minore per farla entrare tutta senza tagliarla
                const ratio = Math.min(ratioW, ratioH);

                const finalW = imgProps.width * ratio;
                const finalH = imgProps.height * ratio;

                // Centra orizzontalmente
                const xPos = (w - finalW) / 2;
                
                // Disegna partendo da 5mm dall'alto
                doc.addImage(evt.image, 'JPEG', xPos, 5, finalW, finalH);
            }

            // 4. Stampa il Testo (Ancorato in basso)
            // Iniziamo a scrivere esattamente dove finisce lo spazio riservato alla foto
            let y = h - textHeightNeeded + 5; 

            // Titolo
            doc.setFontSize(14); doc.setFont("helvetica","bold");
            doc.text(evt.title, w/2, y, {align:"center", maxWidth: w-10});
            
            y += 6; 
            
            // Data
            doc.setFontSize(10); doc.setFont("helvetica","normal");
            doc.text(`${formatDate(evt.date)} ore ${evt.time}`, w/2, y, {align:"center"});
            y += 5;
            doc.text(evt.location, w/2, y, {align:"center"});

            // Linea
            y += 4; 
            doc.setDrawColor(150); doc.line(15, y, w-15, y); doc.setDrawColor(0);
            y += 8;

            // Posto (Grande)
            doc.setFontSize(22); doc.setFont("helvetica","bold");
            doc.text(area.toUpperCase(), w/2, y, {align:"center"});
            y += 8;
            doc.setFontSize(18);
            doc.text(`Fila ${row} - Posto ${seat.id}`, w/2, y, {align:"center"});
            
            // Nome (in basso)
            y += 10; 
            doc.setFontSize(9); doc.setFont("helvetica","normal");
            doc.text("Prenotato per:", w/2, y, {align:"center"});
            y += 6;
            doc.setFontSize(14); doc.setFont("helvetica","bold");
            
            let nomeCompleto = `${booking.cognome} ${booking.nome}`;
            if(nomeCompleto.length > 22) nomeCompleto = nomeCompleto.substring(0,22) + "...";
            doc.text(nomeCompleto, w/2, y, {align:"center"});

            doc.save(`Ticket_${booking.cognome}_${seat.id}.pdf`);
        });
        closeModal('ticketModal');
    }

    // --- UTILITIES ---
    function toggleSidebar() { 
        const sb = document.getElementById('mainSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sb.classList.toggle('active'); 
        overlay.classList.toggle('active');
    }
    function closeModal(id) { document.getElementById(id).classList.remove('active'); }
    function formatDate(d) { 
        if(!d) return '';
        const parts = d.split('-'); // assume YYYY-MM-DD
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // --- FUNZIONE LOGIN ---
    function checkLogin() {
        const pass = document.getElementById('appPass').value;
        if(pass === 'frullatore543') {
            document.getElementById('loginOverlay').style.display = 'none';
        } else {
            alert("Password Errata! Riprova.");
            document.getElementById('appPass').value = '';
        }
    }

    // --- FUNZIONE BACKUP TOTALE SALVAVITA ---
    // --- GENERATORE PDF PER BACKUP (Helper interno) ---
    function createPdfBlob(evt) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Raccogli i dati
        let rows = [];
        for(let area in evt.maps) {
            for(let row in evt.maps[area]) {
                evt.maps[area][row].forEach((seat) => {
                    if(['paid','blocked','omaggio'].includes(seat.state) && seat.booking) {
                        rows.push([
                            seat.booking.cognome + ' ' + seat.booking.nome,
                            seat.booking.telefono || '',
                            `${area.toUpperCase()} ${row}-${seat.id}`,
                            seat.state.toUpperCase()
                        ]);
                    }
                });
            }
        }
        // Ordina
        rows.sort((a,b) => a[0].localeCompare(b[0]));

        // Crea Documento
        doc.setFontSize(16); doc.text(`REGISTRO: ${evt.title}`, 14, 20);
        doc.setFontSize(10); doc.text(`Data: ${evt.date} - Ore: ${evt.time}`, 14, 26);
        doc.text(`Totale Prenotazioni: ${rows.length}`, 14, 32);
        
        doc.autoTable({
            startY: 38,
            head: [['Nominativo', 'Telefono', 'Posto', 'Stato']],
            body: rows,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] },
            styles: { fontSize: 10 }
        });

        // Restituisce il file "grezzo" senza scaricarlo
        return doc.output('blob');
    }

    // --- FUNZIONE BACKUP ZIP COMPLETO ---
    async function downloadFullZipBackup() {
        if(Object.keys(localEvents).length === 0) return alert("Nessun dato da salvare.");
        
        const btn = document.querySelector('button[onclick="downloadFullZipBackup()"]');
        const oldText = btn.innerText;
        btn.innerText = "⏳ Creazione ZIP in corso...";
        btn.disabled = true;

        try {
            const zip = new JSZip();
            
            // 1. Aggiungi il file DATABASE completo (JSON)
            const jsonStr = JSON.stringify(localEvents, null, 2);
            zip.file("DATABASE_COMPLETO.json", jsonStr);

            // 2. Crea una cartella per i registri
            const pdfFolder = zip.folder("REGISTRI_PDF");

            // 3. Genera un PDF per OGNI evento
            const keys = Object.keys(localEvents);
            for(let key of keys) {
                const evt = localEvents[key];
                // Pulisci il nome del file da caratteri strani
                const safeTitle = evt.title.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
                const fileName = `${evt.date}_${safeTitle}.pdf`;
                
                // Genera il PDF in memoria
                const pdfBlob = createPdfBlob(evt);
                
                // Aggiungilo allo zip
                pdfFolder.file(fileName, pdfBlob);
            }

            // 4. Genera e scarica lo ZIP finale
            const content = await zip.generateAsync({type:"blob"});
            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(content);
            downloadLink.download = `BACKUP_TEATRO_${new Date().toISOString().slice(0,10)}.zip`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            downloadLink.remove();

        } catch(e) {
            alert("Errore durante il backup: " + e.message);
        }

        btn.innerText = oldText;
        btn.disabled = false;
    }

    // ==========================================
    // FUNZIONI DI SICUREZZA TOTALE (VERSIONE DEFINITIVA)
    // ==========================================

    // 1. BACKUP AUTOMATICO "LIVE" (Legge direttamente dal Cloud per massima sicurezza)
    async function emergencyBackup(motivo = 'AUTO') {
        try {
            // Legge i dati freschi direttamente da Firebase (snapshot live)
            const snapshot = await db.ref('events').once('value');
            const dataObj = snapshot.val() || {};

            // Se il database è vuoto, non scarica nulla per non creare file inutili
            if (Object.keys(dataObj).length === 0) {
                console.log('Backup annullato: database vuoto.');
                return { ok: true, path: null };
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0,19);
            const filename = `PARACADUTE_${motivo}_${timestamp}.json`;

            const jsonStr = JSON.stringify(dataObj, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();

            // Pulisce la memoria dopo 2 secondi
            setTimeout(() => URL.revokeObjectURL(url), 2000);

            return { ok: true, path: filename };
        } catch (err) {
            console.error('Errore Backup:', err);
            // Non blocchiamo l'esecuzione, ma segnaliamo l'errore
            return { ok: false, error: err };
        }
    }

    // 2. CANCELLAZIONE CON "CESTINO CLOUD" (Soft Delete)
    async function deleteEvent(id, e) {
        if(e) e.stopPropagation();

        if(!confirm("⚠️ ATTENZIONE: Stai per eliminare questo evento.\n\n1. Verrà scaricato un backup sul PC.\n2. L'evento sarà spostato nel 'Cestino' del server (events_deleted).\n\nConfermi?")) {
            return;
        }

        // A) Backup fisico immediato sul PC
        const bk = await emergencyBackup('PRIMA_DI_ELIMINARE_EVENTO');
        if(!bk.ok) {
            // Se fallisce il backup fisico, ci fermiamo per sicurezza
            alert('Errore critico nel backup di sicurezza. Operazione annullata.');
            return;
        }

        try {
            // B) Legge l'evento per spostarlo
            const evSnap = await db.ref('events/' + id).once('value');
            const evData = evSnap.val();
            
            if (!evData) {
                alert('Evento non trovato (forse già eliminato?).');
                return;
            }

            // Metadati per sapere quando e come è stato cancellato
            const deletedMeta = {
                deletedAt: (new Date()).toISOString(),
                backupFile: bk.path || null,
                originalId: id,
                reason: 'manual_delete'
            };

            // C) Scrive nella cartella "events_deleted" (CESTINO SU FIREBASE)
            await db.ref('events_deleted/' + id).set({ meta: deletedMeta, data: evData });

            // D) Rimuove dalla cartella principale (questo aggiornerà la lista visiva)
            await db.ref('events/' + id).remove();

            alert('✅ Evento eliminato.\nÈ stato salvato un backup nei download ed è stata creata una copia nel cestino del server.');
        } catch (err) {
            alert('Errore durante l\'eliminazione: ' + err.message);
        }
    }

    // 3. RIPRISTINO BLINDATO (Con Storico Importazioni su Firebase)
    async function restoreData(inputElement) {
        const file = inputElement.files[0];
        if (!file) return;

        const conferma = confirm("⚠️ PERICOLO ESTREMO ⚠️\n\nStai per sovrascrivere il database con un file esterno.\n\nIl sistema farà un backup automatico dei dati attuali prima di procedere.\n\nSei sicuro al 100%?");
        
        if (!conferma) {
            inputElement.value = '';
            return;
        }

        // A) Backup preventivo di quello che c'è ORA (Paracadute)
        const bk = await emergencyBackup('PRIMA_DI_RIPRISTINO_TOTALE');
        if(!bk.ok) {
            alert('Impossibile creare il backup di sicurezza. Operazione annullata.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async function(ev) {
            try {
                const parsed = JSON.parse(ev.target.result);

                // Controllo base validità
                if (typeof parsed !== 'object' || parsed === null) {
                    throw new Error('Il file non è valido.');
                }

                // B) Salva traccia dell'operazione su Firebase (AUDIT LOG)
                // Così sai sempre chi ha caricato un backup e quando
                const importMeta = {
                    importedAt: (new Date()).toISOString(),
                    filename: file.name,
                    backupCreated: bk.path || null
                };
                await db.ref('events_import_history').push(importMeta);

                // C) Sovrascrittura (Operazione nucleare)
                await db.ref('events').set(parsed);

                alert('✅ Ripristino completato! \nUn backup dei dati precedenti è stato salvato nei tuoi download.');
                location.reload();

            } catch (err) {
                alert('Errore Ripristino: ' + err.message);
            } finally {
                inputElement.value = '';
            }
        };
        reader.readAsText(file);
    }    

    // --- FUNZIONE MANCANTE PER COMPRIMERE FOTO ---
    function compressImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    // Ridimensiona a larghezza 500px (ottimo per PDF)
                    const scale = 500 / img.width;
                    canvas.width = 500;
                    canvas.height = img.height * scale;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // Restituisce l'immagine compressa (JPEG qualità 0.7)
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
            };
        });
    }
