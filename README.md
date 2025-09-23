# Funzione Diastolica Nuragica (PWA)

PWA minimalista per la valutazione della funzione diastolica e la stima della LAP a riposo coerente con le nuove linee guida 2025 (tutti gli scenari).
Ottimizzata per smartphone (iPhone), installabile e offline.

## Avvio locale
Apri `index.html` in un browser moderno. Per testare il Service Worker devi servire via HTTP:
```bash
python3 -m http.server 8000
```
poi visita http://localhost:8000

## GitHub Pages
1. Crea un nuovo repository chiamato **diastolic-pwa**.
2. Carica tutti i file di questa cartella nella root del repo.
3. Vai in **Settings → Pages** e seleziona:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` / root (`/`)
4. Attendi la pubblicazione. L’app sarà disponibile su `https://<tuo-utente>.github.io/diastolic-pwa/`.

## Installazione su iPhone
- Apri l’URL in Safari → `Condividi` → `Aggiungi alla schermata Home`.
- Dopo il primo caricamento l’app funziona offline grazie al Service Worker.

## Note di implementazione
- Algoritmo principale (ritmo sinusale): e′ (soglie per età), E/e′, TR≥2.8 m/s o PASP≥35 mmHg; se discordanti, usa LARS≤18%, PV S/D≤0.67, LAVi>34 mL/m², IVRT≤70 ms; parametri supplementari come PR end‑diast ≥2 m/s, PADP≥16 mmHg, L‑wave≥50 cm/s, Ar–A>30 ms, Valsalva (ΔE/A≥50%).
- Grading: se LAP↑ → Grado 2 (E/A<2) o Grado 3 (E/A≥2). Se LAP normale ma e′ ridotta con E/A≤0.8 → Grado 1.
- FA: approccio multiparametrico con 4 criteri principali (E≥100, E/e′ settale>11, TR≥2.8 o PASP≥35, DT≤160) + supporti (LARS≤18%, PV S/D≤0.67).
- Popolazioni speciali: pannello informativo con indicazioni pratiche (PH, blocchi/pacing, HCM, restrittiva/amyloid, pericardite costrittiva, valvulopatie, HTX).

## Licenza
MIT
