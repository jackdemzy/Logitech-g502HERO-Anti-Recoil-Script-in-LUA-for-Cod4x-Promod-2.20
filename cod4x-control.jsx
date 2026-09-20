import { useState, useRef, useEffect } from "react";

// ─── Data ──────────────────────────────────────────────────────────────────────

const MAPS = [
  { id: "mp_backlot", name: "Backlot" }, { id: "mp_bloc", name: "Bloc" },
  { id: "mp_bog", name: "Bog" }, { id: "mp_broadcast", name: "Broadcast" },
  { id: "mp_carentan", name: "Carentan" }, { id: "mp_citystreets", name: "City Streets" },
  { id: "mp_convoy", name: "Convoy" }, { id: "mp_countdown", name: "Countdown" },
  { id: "mp_crash", name: "Crash" }, { id: "mp_crash_snow", name: "Winter Crash" },
  { id: "mp_creek", name: "Creek" }, { id: "mp_crossfire", name: "Crossfire" },
  { id: "mp_district", name: "District" }, { id: "mp_downpour", name: "Downpour" },
  { id: "mp_facade", name: "Façade" }, { id: "mp_farm", name: "Farm" },
  { id: "mp_killhouse", name: "Killhouse" }, { id: "mp_lavacrown", name: "Lavacrown" },
  { id: "mp_overgrown", name: "Overgrown" }, { id: "mp_pipeline", name: "Pipeline" },
  { id: "mp_shipment", name: "Shipment" }, { id: "mp_showdown", name: "Showdown" },
  { id: "mp_strike", name: "Strike" }, { id: "mp_vacant", name: "Vacant" },
];

const MODES = [
  { id: "dm", name: "Free For All" }, { id: "war", name: "Team Deathmatch" },
  { id: "sab", name: "Sabotage" }, { id: "sd", name: "Search & Destroy" },
  { id: "dom", name: "Domination" }, { id: "koth", name: "Headquarters" },
  { id: "ctf", name: "Capture the Flag" }, { id: "dd", name: "Demolition" },
];

const RCON_CMDS = [
  { cmd: "status",       args: "",                    desc: "Alle Clients mit ID, Ping, IP, Rate auflisten" },
  { cmd: "clientkick",   args: "<num>",               desc: "Spieler per Client-Slot-Nr. kicken (aus status)" },
  { cmd: "kick",         args: "<name>",              desc: "Spieler per Name kicken" },
  { cmd: "ban",          args: "<name>",              desc: "Permanent-Ban per Spielername" },
  { cmd: "tempban",      args: "<name> <min>",        desc: "Temporärer Ban für N Minuten" },
  { cmd: "unban",        args: "<ip>",                desc: "Permanent-Ban per IP aufheben" },
  { cmd: "map",          args: "<mapname>",           desc: "Sofortiger Wechsel zur angegebenen Map" },
  { cmd: "map_rotate",   args: "",                    desc: "Nächste Map in der Rotation laden" },
  { cmd: "fast_restart", args: "",                    desc: "Aktuelle Map schnell neustarten (kein Reload)" },
  { cmd: "map_restart",  args: "",                    desc: "Aktuelle Map vollständig neu laden" },
  { cmd: "say",          args: "<text>",              desc: "Server-Broadcast an alle Spieler" },
  { cmd: "set",          args: "<cvar> <wert>",       desc: "Dvar auf einen Wert setzen" },
  { cmd: "get",          args: "<cvar>",              desc: "Aktuellen Dvar-Wert ausgeben" },
  { cmd: "exec",         args: "<config>",            desc: "Konfigdatei aus fs_basepath ausführen" },
  { cmd: "serverinfo",   args: "",                    desc: "Alle öffentlichen Server-Cvars anzeigen" },
  { cmd: "dumpuser",     args: "<num>",               desc: "Userinfo eines Client-Slots ausgeben" },
  { cmd: "users",        args: "",                    desc: "Vereinfachte Liste verbundener Spieler" },
  { cmd: "rcon_password",args: "<pw>",                desc: "RCON-Passwort im laufenden Betrieb ändern" },
  { cmd: "g_password",   args: "<pw>",                desc: "Server-Join-Passwort setzen" },
  { cmd: "killserver",   args: "",                    desc: "Server-Prozess beenden" },
  { cmd: "heartbeat",    args: "",                    desc: "Heartbeat an den Master-Server senden" },
  { cmd: "addbot",       args: "<name> <skill> <tm>", desc: "Bot hinzufügen (CoD4x-Erweiterung)" },
  { cmd: "player",       args: "<num>",               desc: "Erweiterte Spielerinfo für Slot (CoD4x)" },
];

const DVARS = [
  // Server
  { name: "sv_hostname",      def: "CoD4 Server", sub: "Server",     desc: "Servername im Browser" },
  { name: "sv_maxclients",    def: "18",          sub: "Server",     desc: "Maximale Client-Anzahl" },
  { name: "sv_password",      def: "",            sub: "Server",     desc: "Join-Passwort (leer = öffentlich)" },
  { name: "sv_pure",          def: "1",           sub: "Server",     desc: "Client-Dateiprüfung (1=an, 0=aus)" },
  { name: "sv_floodprotect",  def: "4",           sub: "Server",     desc: "Max. Chat-Nachrichten/Sek. vor Sperre" },
  { name: "sv_allowdownload", def: "1",           sub: "Server",     desc: "Clients dürfen fehlende Dateien downloaden" },
  { name: "sv_maxrate",       def: "25000",       sub: "Server",     desc: "Max. Netzwerkrate/Client (Bytes/Sek.)" },
  { name: "sv_fps",           def: "20",          sub: "Server",     desc: "Server-Tickrate (FPS)" },
  { name: "sv_timeout",       def: "5",           sub: "Server",     desc: "Sek. bis nicht-antwortender Client getrennt wird" },
  { name: "sv_kickbots",      def: "1",           sub: "Server",     desc: "Bots kicken wenn echte Spieler joinen" },
  // Gameplay
  { name: "g_gametype",         def: "war", sub: "Gameplay", desc: "Aktiver Spielmodus (dm/war/sd/dom/sab/koth/ctf/dd)" },
  { name: "g_maxping",          def: "0",   sub: "Gameplay", desc: "Max. Ping für Join (0=unbegrenzt)" },
  { name: "g_allowvote",        def: "1",   sub: "Gameplay", desc: "Abstimmungen erlauben" },
  { name: "g_friendlyfire",     def: "2",   sub: "Gameplay", desc: "Teamfeuer: 0=aus, 1=an, 2=reflect, 3=shared" },
  { name: "g_deadchat",         def: "1",   sub: "Gameplay", desc: "Tote Spieler dürfen chatten" },
  { name: "g_voicechat",        def: "1",   sub: "Gameplay", desc: "Sprachchat aktivieren" },
  { name: "g_inactivity",       def: "0",   sub: "Gameplay", desc: "Inaktive Spieler nach N Sek. kicken (0=aus)" },
  { name: "g_spectatormode",    def: "1",   sub: "Gameplay", desc: "Zuschauen erlauben" },
  { name: "g_teamkillpointloss",def: "0",   sub: "Gameplay", desc: "Punktverlust pro Teamkill" },
  // Script
  { name: "scr_war_scorelimit",       def: "750",  sub: "Script", desc: "Punktlimit TDM" },
  { name: "scr_war_timelimit",        def: "10",   sub: "Script", desc: "Zeitlimit TDM (Min.)" },
  { name: "scr_sd_scorelimit",        def: "1",    sub: "Script", desc: "Zu gewinnende Runden in S&D" },
  { name: "scr_sd_timelimit",         def: "2.5",  sub: "Script", desc: "Rundenzeitlimit S&D (Min.)" },
  { name: "scr_sd_roundlimit",        def: "15",   sub: "Script", desc: "Maximale Runden S&D" },
  { name: "scr_sd_bombtimer",         def: "45",   sub: "Script", desc: "Bomben-Countdown S&D (Sek.)" },
  { name: "scr_dom_scorelimit",       def: "200",  sub: "Script", desc: "Punktlimit Domination" },
  { name: "scr_dm_scorelimit",        def: "30",   sub: "Script", desc: "Kill-Limit FFA" },
  { name: "scr_dm_timelimit",         def: "10",   sub: "Script", desc: "Zeitlimit FFA (Min.)" },
  { name: "scr_koth_scorelimit",      def: "250",  sub: "Script", desc: "Punktlimit HQ" },
  { name: "scr_ctf_scorelimit",       def: "3",    sub: "Script", desc: "Punktlimit CTF" },
  { name: "scr_player_respawndelay",  def: "0",    sub: "Script", desc: "Respawn-Verzögerung (Sek.)" },
  { name: "scr_player_sprinttime",    def: "4",    sub: "Script", desc: "Sprint-Dauer (Sek.)" },
  { name: "scr_game_killstreaks",     def: "1",    sub: "Script", desc: "Killstreak-Belohnungen (1=an)" },
  { name: "scr_game_perks",           def: "1",    sub: "Script", desc: "Perks aktivieren (1=an)" },
  { name: "scr_nuketimelimit",        def: "10",   sub: "Script", desc: "GTNW Nuke-Timer (Min.)" },
  { name: "scr_team_fftype",          def: "0",    sub: "Script", desc: "Teamfeuer-Typ für geskriptete Modi" },
  // Network
  { name: "net_port", def: "28960",    sub: "Netzwerk",    desc: "UDP-Port des Servers" },
  { name: "net_ip",   def: "0.0.0.0", sub: "Netzwerk",    desc: "IP-Adresse zum Binden (0.0.0.0=alle)" },
  { name: "rate",     def: "25000",   sub: "Netzwerk",    desc: "Netzwerkrate für Clients" },
  // FS
  { name: "fs_game",     def: "",  sub: "FileSystem", desc: "Mod-Verzeichnis (leer = Basispiel)" },
  { name: "fs_basepath", def: ".", sub: "FileSystem", desc: "Basis-Dateisystempfad" },
  // Developer
  { name: "developer_script", def: "0",             sub: "Developer", desc: "Script-Debug-Ausgabe — benötigt +set beim Start (CVAR_INIT!)" },
  { name: "developer",        def: "0",             sub: "Developer", desc: "Developer-Modus aktivieren" },
  { name: "logfile",          def: "2",             sub: "Developer", desc: "Log: 0=aus, 1=gepuffert, 2=Zeile für Zeile flushen" },
  { name: "g_log",            def: "games_mp.log",  sub: "Developer", desc: "Log-Dateiname" },
  { name: "g_logSync",        def: "0",             sub: "Developer", desc: "Synchrones Log-Flushen" },
];

const QUICK_PROMPTS = [
  "init()-Funktion für Custom-Gamemode schreiben",
  "Spieler-Callback mit waittill registrieren",
  "Custom HUD-Element per hud::createClientFontString",
  "Spieler eine spezifische Waffe per GSC geben",
  "thread vs. waittillframeend in CoD4 GSC erklären",
  "UAV bei 3 Kills Killstreak implementieren",
  "Alle Spieler spawnen und Teams balancieren",
  "setClientDvars: Werte an Client übertragen",
];

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  bg:         "#09090f",
  surface:    "#10121a",
  card:       "#161923",
  border:     "#1f2333",
  accent:     "#f59e0b",
  accentHov:  "#fbbf24",
  accentDim:  "rgba(245,158,11,0.12)",
  text:       "#dde3f0",
  muted:      "#52596f",
  danger:     "#ef4444",
  success:    "#22c55e",
  blue:       "#60a5fa",
  code:       "#0b0d16",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else { fallbackCopy(text); }
}
function fallbackCopy(text) {
  const el = document.createElement("textarea");
  el.value = text; el.style.position = "fixed"; el.style.opacity = "0";
  document.body.appendChild(el); el.select();
  document.execCommand("copy"); document.body.removeChild(el);
}

// ─── Small Components ─────────────────────────────────────────────────────────

function CopyBtn({ text, size = "sm" }) {
  const [copied, setCopied] = useState(false);
  const handle = (e) => { e.stopPropagation(); copyToClipboard(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <button onClick={handle} style={{
      background: copied ? "rgba(34,197,94,0.15)" : C.accentDim,
      border: `1px solid ${copied ? C.success : C.accent + "77"}`,
      color: copied ? C.success : C.accent,
      borderRadius: 4, padding: size === "sm" ? "2px 8px" : "5px 12px",
      fontSize: 11, cursor: "pointer", fontFamily: "monospace",
      whiteSpace: "nowrap", transition: "all 0.2s",
    }}>
      {copied ? "✓ kopiert" : "copy"}
    </button>
  );
}

function Tag({ children, color = C.muted }) {
  return (
    <span style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 4, padding: "1px 7px", fontSize: 10, color,
      whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function SectionHeader({ children, sub }) {
  return (
    <div style={{ borderLeft: `3px solid ${C.accent}`, paddingLeft: 12, marginBottom: 20 }}>
      <h2 style={{ margin: 0, color: C.text, fontSize: 17, fontWeight: 600 }}>{children}</h2>
      {sub && <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <label style={{ display: "block", color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  background: C.surface, border: `1px solid ${C.border}`,
  color: C.text, borderRadius: 6, padding: "7px 11px",
  fontSize: 13, fontFamily: "inherit", outline: "none",
};
const selectStyle = { ...inputStyle, appearance: "none", cursor: "pointer" };

// ─── Config Builder ───────────────────────────────────────────────────────────

const DEFAULT_CFG = {
  sv_hostname: "^1My ^7CoD4x Server", sv_maxclients: "18", sv_password: "",
  sv_pure: "1", sv_fps: "20", sv_maxrate: "25000", sv_floodprotect: "4",
  sv_allowdownload: "1", net_port: "28960", g_gametype: "war",
  g_allowvote: "1", g_friendlyfire: "2", g_inactivity: "0",
  logfile: "2", g_log: "games_mp.log", rcon_password: "",
  scr_game_killstreaks: "1", scr_game_perks: "1",
};

function ConfigBuilder() {
  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const [open, setOpen] = useState(false);
  const set = k => v => setCfg(c => ({ ...c, [k]: v }));

  const generated = `// server.cfg — generiert von COD4X CONTROL
// ${new Date().toLocaleDateString("de-DE")}

// ── Identity ─────────────────────────────────────────────────
set sv_hostname     "${cfg.sv_hostname}"
set sv_maxclients    ${cfg.sv_maxclients}
${cfg.sv_password ? `set sv_password      "${cfg.sv_password}"` : `// sv_password leer — öffentlicher Server`}

// ── RCON ─────────────────────────────────────────────────────
${cfg.rcon_password ? `set rcon_password    "${cfg.rcon_password}"` : `// rcon_password nicht gesetzt — RCON deaktiviert!`}

// ── Netzwerk ─────────────────────────────────────────────────
set net_port         ${cfg.net_port}
set sv_fps           ${cfg.sv_fps}
set sv_maxrate       ${cfg.sv_maxrate}
set sv_allowdownload ${cfg.sv_allowdownload}
set sv_floodprotect  ${cfg.sv_floodprotect}

// ── Sicherheit ───────────────────────────────────────────────
set sv_pure          ${cfg.sv_pure}

// ── Gameplay ─────────────────────────────────────────────────
set g_gametype       ${cfg.g_gametype}
set g_allowvote      ${cfg.g_allowvote}
set g_friendlyfire   ${cfg.g_friendlyfire}
set g_inactivity     ${cfg.g_inactivity}
set scr_game_killstreaks ${cfg.scr_game_killstreaks}
set scr_game_perks   ${cfg.scr_game_perks}

// ── Logging ──────────────────────────────────────────────────
set logfile          ${cfg.logfile}
set g_log            "${cfg.g_log}"
`;

  return (
    <div>
      <SectionHeader sub="Generiert eine valide server.cfg">Server Config Builder</SectionHeader>
      {!cfg.rcon_password && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: `1px solid ${C.danger}44`, borderRadius: 6, padding: "8px 12px", marginBottom: 16, fontSize: 12, color: C.danger }}>
          ⚠ rcon_password ist leer — RCON wird im laufenden Betrieb deaktiviert sein.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        <div>
          <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 12 }}>Server Identity</div>
          <Field label="sv_hostname (^N=Farbcodes)">
            <input style={inputStyle} value={cfg.sv_hostname} onChange={e => set("sv_hostname")(e.target.value)} />
          </Field>
          <Field label="sv_maxclients">
            <input style={inputStyle} type="number" min="1" max="64" value={cfg.sv_maxclients} onChange={e => set("sv_maxclients")(e.target.value)} />
          </Field>
          <Field label="sv_password (leer = öffentlich)">
            <input style={inputStyle} value={cfg.sv_password} onChange={e => set("sv_password")(e.target.value)} placeholder="kein Passwort" />
          </Field>
          <Field label="rcon_password">
            <input style={inputStyle} value={cfg.rcon_password} onChange={e => set("rcon_password")(e.target.value)} placeholder="Sicheres Passwort setzen!" />
          </Field>
          <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 12, marginTop: 18 }}>Netzwerk</div>
          <Field label="net_port"><input style={inputStyle} type="number" value={cfg.net_port} onChange={e => set("net_port")(e.target.value)} /></Field>
          <Field label="sv_fps (Tickrate)"><input style={inputStyle} type="number" value={cfg.sv_fps} onChange={e => set("sv_fps")(e.target.value)} /></Field>
          <Field label="sv_maxrate"><input style={inputStyle} type="number" value={cfg.sv_maxrate} onChange={e => set("sv_maxrate")(e.target.value)} /></Field>
        </div>
        <div>
          <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 12 }}>Gameplay</div>
          <Field label="g_gametype">
            <select style={selectStyle} value={cfg.g_gametype} onChange={e => set("g_gametype")(e.target.value)}>
              {MODES.map(m => <option key={m.id} value={m.id}>{m.id} — {m.name}</option>)}
            </select>
          </Field>
          <Field label="g_friendlyfire">
            <select style={selectStyle} value={cfg.g_friendlyfire} onChange={e => set("g_friendlyfire")(e.target.value)}>
              <option value="0">0 — Aus</option>
              <option value="1">1 — An</option>
              <option value="2">2 — Reflect (zurück zum Schützen)</option>
              <option value="3">3 — Shared (Teamschaden)</option>
            </select>
          </Field>
          <Field label="g_allowvote">
            <select style={selectStyle} value={cfg.g_allowvote} onChange={e => set("g_allowvote")(e.target.value)}>
              <option value="1">1 — Abstimmungen erlaubt</option>
              <option value="0">0 — Abstimmungen deaktiviert</option>
            </select>
          </Field>
          <Field label="sv_pure">
            <select style={selectStyle} value={cfg.sv_pure} onChange={e => set("sv_pure")(e.target.value)}>
              <option value="1">1 — An (empfohlen)</option>
              <option value="0">0 — Aus</option>
            </select>
          </Field>
          <Field label="scr_game_killstreaks">
            <select style={selectStyle} value={cfg.scr_game_killstreaks} onChange={e => set("scr_game_killstreaks")(e.target.value)}>
              <option value="1">1 — Aktiviert</option>
              <option value="0">0 — Deaktiviert</option>
            </select>
          </Field>
          <Field label="scr_game_perks">
            <select style={selectStyle} value={cfg.scr_game_perks} onChange={e => set("scr_game_perks")(e.target.value)}>
              <option value="1">1 — Aktiviert</option>
              <option value="0">0 — Deaktiviert</option>
            </select>
          </Field>
          <Field label="g_inactivity (Sek., 0=aus)">
            <input style={inputStyle} type="number" value={cfg.g_inactivity} onChange={e => set("g_inactivity")(e.target.value)} />
          </Field>
          <Field label="logfile">
            <select style={selectStyle} value={cfg.logfile} onChange={e => set("logfile")(e.target.value)}>
              <option value="0">0 — Aus</option>
              <option value="1">1 — Gepuffert</option>
              <option value="2">2 — Zeile für Zeile (empfohlen)</option>
            </select>
          </Field>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => setOpen(o => !o)} style={{
          background: C.accentDim, border: `1px solid ${C.accent}55`, color: C.accent,
          borderRadius: 6, padding: "8px 15px", cursor: "pointer", fontSize: 13,
        }}>
          {open ? "▲ Schließen" : "▼ server.cfg Preview"}
        </button>
        <CopyBtn text={generated} size="md" />
        <span style={{ color: C.muted, fontSize: 11 }}>→ in /main/server.cfg ablegen</span>
      </div>

      {open && (
        <pre style={{
          marginTop: 14, background: C.code, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: "14px 18px", overflow: "auto", fontSize: 12,
          color: "#8dafc8", fontFamily: "'Fira Code', monospace", lineHeight: 1.75,
          maxHeight: 380,
        }}>{generated}</pre>
      )}
    </div>
  );
}

// ─── Map Rotation ─────────────────────────────────────────────────────────────

function MapRotationBuilder() {
  const [rotation, setRotation] = useState([
    { map: "mp_crash", mode: "war" }, { map: "mp_crossfire", mode: "war" },
    { map: "mp_backlot", mode: "sd" }, { map: "mp_overgrown", mode: "dom" },
  ]);
  const [search, setSearch] = useState("");
  const [defMode, setDefMode] = useState("war");
  const [previewType, setPreviewType] = useState("inline");

  const filtered = MAPS.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) || m.id.includes(search.toLowerCase())
  );

  const addMap = m => setRotation(r => [...r, { map: m.id, mode: defMode }]);
  const remove = i => setRotation(r => r.filter((_, x) => x !== i));
  const moveUp = i => { if (i === 0) return; setRotation(r => { const n = [...r]; [n[i-1], n[i]] = [n[i], n[i-1]]; return n; }); };
  const moveDn = i => setRotation(r => { if (i === r.length - 1) return r; const n = [...r]; [n[i], n[i+1]] = [n[i+1], n[i]]; return n; });
  const setMode = (i, mode) => setRotation(r => r.map((e, x) => x === i ? { ...e, mode } : e));

  const inline = `set sv_maprotation "${rotation.map(e => `gametype ${e.mode} map ${e.map}`).join(" ")}"`;
  const fileOut = rotation.map((e, i) =>
    `// Slot ${i+1}: ${MAPS.find(m => m.id === e.map)?.name || e.map} — ${MODES.find(m => m.id === e.mode)?.name || e.mode}\ngametype ${e.mode}\nmap ${e.map}`
  ).join("\n\n");

  return (
    <div>
      <SectionHeader sub="Map-Rotation visuell zusammenstellen und als CFG exportieren">Map Rotation Builder</SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Map Browser */}
        <div>
          <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>Maps (klicken zum Hinzufügen)</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen…"
              style={{ ...inputStyle, flex: 1 }} />
            <select value={defMode} onChange={e => setDefMode(e.target.value)}
              style={{ ...selectStyle, width: 80, flexShrink: 0 }}>
              {MODES.map(m => <option key={m.id} value={m.id}>{m.id}</option>)}
            </select>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, maxHeight: 360, overflow: "auto" }}>
            {filtered.map(m => {
              const inRot = rotation.filter(e => e.map === m.id).length;
              return (
                <div key={m.id}
                  onClick={() => addMap(m)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div>
                    <div style={{ color: C.text, fontSize: 13 }}>{m.name}</div>
                    <div style={{ color: C.muted, fontSize: 10, fontFamily: "monospace" }}>{m.id}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {inRot > 0 && <Tag color={C.accent}>{inRot}×</Tag>}
                    <span style={{ color: C.accent, fontSize: 18, lineHeight: 1 }}>+</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rotation List */}
        <div>
          <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>
            Rotation — {rotation.length} Einträge
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, maxHeight: 400, overflow: "auto" }}>
            {rotation.length === 0 && (
              <div style={{ padding: 28, color: C.muted, textAlign: "center", fontSize: 13 }}>Keine Maps — links klicken zum Hinzufügen.</div>
            )}
            {rotation.map((e, i) => {
              const mapName = MAPS.find(m => m.id === e.map)?.name || e.map;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ color: C.muted, fontSize: 10, minWidth: 18, textAlign: "right" }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: C.text, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mapName}</div>
                    <div style={{ color: C.muted, fontSize: 10, fontFamily: "monospace" }}>{e.map}</div>
                  </div>
                  <select value={e.mode} onChange={ev => setMode(i, ev.target.value)}
                    style={{ background: C.card, border: `1px solid ${C.border}`, color: C.accent, borderRadius: 4, padding: "2px 6px", fontSize: 11, outline: "none" }}>
                    {MODES.map(m => <option key={m.id} value={m.id}>{m.id}</option>)}
                  </select>
                  <button onClick={() => moveUp(i)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: "0 1px", fontSize: 12 }}>▲</button>
                  <button onClick={() => moveDn(i)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: "0 1px", fontSize: 12 }}>▼</button>
                  <button onClick={() => remove(i)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", padding: "0 1px", fontSize: 14 }}>✕</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 0, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
            {["inline", "datei"].map(t => (
              <button key={t} onClick={() => setPreviewType(t)} style={{
                background: previewType === t ? C.accentDim : C.surface,
                border: "none", color: previewType === t ? C.accent : C.muted,
                padding: "5px 12px", cursor: "pointer", fontSize: 12,
              }}>{t === "inline" ? "sv_maprotation" : "rotation.cfg"}</button>
            ))}
          </div>
          <CopyBtn text={previewType === "inline" ? inline : fileOut} size="md" />
        </div>
        <pre style={{
          background: C.code, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: "12px 16px", fontSize: 11, color: "#8dafc8", fontFamily: "monospace",
          overflow: "auto", maxHeight: previewType === "inline" ? 60 : 180, lineHeight: 1.7,
        }}>{previewType === "inline" ? inline : fileOut}</pre>
      </div>
    </div>
  );
}

// ─── RCON Reference ───────────────────────────────────────────────────────────

function RCONCommands() {
  const [search, setSearch] = useState("");
  const filtered = RCON_CMDS.filter(c => c.cmd.includes(search) || c.desc.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <SectionHeader sub="RCON nutzt UDP/28960 — direkt per CLI-Tool oder Node.js-Proxy erreichbar">RCON Befehlsreferenz</SectionHeader>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Befehl oder Beschreibung suchen…"
        style={{ ...inputStyle, marginBottom: 14 }} />
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "140px 165px 1fr 76px", padding: "7px 12px", borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.09em" }}>
          <span>Befehl</span><span>Argumente</span><span>Beschreibung</span><span></span>
        </div>
        <div style={{ maxHeight: 490, overflow: "auto" }}>
          {filtered.map(c => (
            <div key={c.cmd}
              style={{ display: "grid", gridTemplateColumns: "140px 165px 1fr 76px", padding: "8px 12px", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontFamily: "monospace", color: C.accent, fontSize: 13 }}>{c.cmd}</span>
              <span style={{ fontFamily: "monospace", color: C.blue, fontSize: 12 }}>{c.args || "—"}</span>
              <span style={{ color: C.text, fontSize: 12 }}>{c.desc}</span>
              <CopyBtn text={c.cmd + (c.args ? " " + c.args : "")} />
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: 24, color: C.muted, textAlign: "center", fontSize: 13 }}>Keine Treffer</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Dvar Browser ─────────────────────────────────────────────────────────────

function DvarBrowser() {
  const [search, setSearch] = useState("");
  const [sub, setSub] = useState("Alle");
  const subs = ["Alle", ...new Set(DVARS.map(d => d.sub))];

  const filtered = DVARS.filter(d =>
    (sub === "Alle" || d.sub === sub) &&
    (d.name.includes(search) || d.desc.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <SectionHeader sub={`${DVARS.length} dokumentierte Dvars aus dem CoD4x 21.5 Engine-Dump`}>Dvar Browser</SectionHeader>
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Dvar-Name oder Beschreibung suchen…"
          style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {subs.map(s => (
          <button key={s} onClick={() => setSub(s)} style={{
            background: sub === s ? C.accentDim : C.surface,
            border: `1px solid ${sub === s ? C.accent : C.border}`,
            color: sub === s ? C.accent : C.muted,
            borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer",
          }}>{s}</button>
        ))}
      </div>
      <div style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>{filtered.length} Dvars</div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "210px 90px 100px 1fr", padding: "7px 12px", borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.09em" }}>
          <span>Name</span><span>Default</span><span>Subsystem</span><span>Beschreibung</span>
        </div>
        <div style={{ maxHeight: 480, overflow: "auto" }}>
          {filtered.map(d => (
            <div key={d.name}
              style={{ display: "grid", gridTemplateColumns: "210px 90px 100px 1fr", padding: "7px 12px", borderBottom: `1px solid ${C.border}`, alignItems: "start" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontFamily: "monospace", color: C.accent, fontSize: 12 }}>{d.name}</span>
              <span style={{ fontFamily: "monospace", color: C.blue, fontSize: 12 }}>{d.def !== "" ? d.def : '""'}</span>
              <div><Tag>{d.sub}</Tag></div>
              <span style={{ color: C.text, fontSize: 12 }}>{d.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── GSC Chat Rendering ───────────────────────────────────────────────────────

function MsgContent({ content }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const code = part.replace(/^```\w*\n?/, "").replace(/```$/, "");
          return (
            <div key={i} style={{ position: "relative", margin: "6px 0" }}>
              <pre style={{
                background: C.code, border: `1px solid ${C.border}`,
                borderRadius: 6, padding: "10px 12px", overflow: "auto",
                fontSize: 12, color: "#9fc5e8", margin: 0,
                fontFamily: "'Fira Code', 'Courier New', monospace", lineHeight: 1.65,
              }}>{code}</pre>
              <div style={{ position: "absolute", top: 6, right: 8 }}><CopyBtn text={code} /></div>
            </div>
          );
        }
        return <span key={i} style={{ whiteSpace: "pre-wrap" }}>{part}</span>;
      })}
    </>
  );
}

// ─── GSC Assistant ────────────────────────────────────────────────────────────

function GSCAssistant() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hallo! Ich bin dein CoD4x 21.5 GSC-Assistent mit Wissen über die Script-API, Engine-Internals, Threading-Modell und gängige Modding-Patterns.\n\nWas soll ich skripten oder erklären?",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (override) => {
    const text = (override || input).trim();
    if (!text || loading) return;
    setInput("");
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setLoading(true);

    const apiMessages = nextMessages.slice(1).map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: `Du bist ein Experte für CoD4x 21.5 GSC (Game Script C). Du kennst:
- GSC-Syntax, Built-ins (self, level, game[], getplayers(), etc.) und CoD4x-Extensions
- Threading: thread, endon, waittill, notify, waittillframeend, waittillmatch
- Entity-Funktionen: setModel, linkTo, delete, hide, show, moveTo, etc.
- Spieler-Callbacks: "spawned_player", "connected", "disconnect", "death" etc.
- HUD-System: createFontString, createServerFontString, hud::updateFontString
- Waffensystem: giveweapon, takeallweapons, switchToWeapon, getWeaponAmmoClip
- CoD4x-eigene Funktionen die im Vanilla-GSC nicht existieren
- Developer-Workflow: developer_script (CVAR_INIT, nur via +set beim Start!)
- Typische Modding-Patterns: custom Gamemodes, Killstreaks, Playerdata-Persistenz

Antworte technisch präzise und kompakt. Zeige funktionierende GSC-Code-Beispiele in \`\`\`gsc Blöcken\`\`\`. Antworte auf Deutsch wenn auf Deutsch gefragt.`,
          messages: apiMessages,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Keine Antwort erhalten.";
      setMessages(m => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages(m => [...m, { role: "assistant", content: `❌ API-Fehler: ${err.message}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 110px)" }}>
      <SectionHeader sub="KI-gestützte GSC-Scripting-Hilfe für CoD4x 21.5">GSC Script-Assistent</SectionHeader>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {QUICK_PROMPTS.map((p, i) => (
          <button key={i} onClick={() => send(p)} style={{
            background: C.surface, border: `1px solid ${C.border}`,
            color: C.muted, borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
          >
            {p.length > 45 ? p.slice(0, 45) + "…" : p}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "86%",
              background: m.role === "user" ? C.accentDim : C.card,
              border: `1px solid ${m.role === "user" ? C.accent + "33" : C.border}`,
              borderRadius: 8, padding: "9px 13px",
              color: C.text, fontSize: 13, lineHeight: 1.7,
            }}>
              <MsgContent content={m.content} />
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 13px", color: C.muted, fontSize: 13 }}>
              <LoadingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="GSC-Frage stellen, Code beschreiben oder Fehler einfügen…"
          style={{ ...inputStyle, flex: 1, padding: "10px 14px" }}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={{
          background: loading || !input.trim() ? C.surface : C.accent,
          border: `1px solid ${loading || !input.trim() ? C.border : C.accent}`,
          color: loading || !input.trim() ? C.muted : "#000",
          borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 700,
          cursor: loading || !input.trim() ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }}>
          Senden ↵
        </button>
      </div>
    </div>
  );
}

function LoadingDots() {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setDots(d => d < 3 ? d + 1 : 1), 400);
    return () => clearInterval(t);
  }, []);
  return <span style={{ fontFamily: "monospace" }}>analysiere{".".repeat(dots)}</span>;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: "config",    icon: "⚙", label: "Server Config" },
  { id: "rotation",  icon: "↻", label: "Map Rotation"  },
  { id: "rcon",      icon: "⌨", label: "RCON Referenz" },
  { id: "dvars",     icon: "≡", label: "Dvar Browser"  },
  { id: "gsc",       icon: "›_", label: "GSC Assistent" },
];

function Sidebar({ active, setActive }) {
  return (
    <div style={{ width: 200, minHeight: "100vh", background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "18px 16px 22px" }}>
        <div style={{ color: C.accent, fontWeight: 800, fontSize: 13, letterSpacing: "0.12em", fontFamily: "monospace" }}>COD4X CONTROL</div>
        <div style={{ color: C.muted, fontSize: 9, letterSpacing: "0.1em", marginTop: 3 }}>v21.5 ADMIN PANEL</div>
      </div>
      <div style={{ flex: 1 }}>
        {TABS.map(t => {
          const isActive = active === t.id;
          return (
            <div key={t.id} onClick={() => setActive(t.id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px 10px 13px", cursor: "pointer",
              background: isActive ? C.accentDim : "transparent",
              borderLeft: `3px solid ${isActive ? C.accent : "transparent"}`,
              color: isActive ? C.accent : C.muted, fontSize: 13,
              transition: "all 0.12s",
            }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontFamily: "monospace", fontSize: 15, minWidth: 20 }}>{t.icon}</span>
              <span>{t.label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ color: C.muted, fontSize: 9, lineHeight: 1.6 }}>
          CoD4x 21.5 · iw3mp<br />RCON: UDP/28960
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("config");

  return (
    <div style={{ display: "flex", background: C.bg, minHeight: "100vh", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: C.text }}>
      <Sidebar active={tab} setActive={setTab} />
      <main style={{ flex: 1, padding: "26px 30px", overflow: "auto", maxWidth: "calc(100vw - 200px)" }}>
        {tab === "config"   && <ConfigBuilder />}
        {tab === "rotation" && <MapRotationBuilder />}
        {tab === "rcon"     && <RCONCommands />}
        {tab === "dvars"    && <DvarBrowser />}
        {tab === "gsc"      && <GSCAssistant />}
      </main>
    </div>
  );
}
