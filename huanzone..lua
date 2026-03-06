-- Logitech G HUB Lua Script
-- G502 HERO – Anti-Recoil für CoD4x Promod 2.20 (Eigenrisiko)
-- Steuerung:
-- - Maustaste 7: Modus wechseln (OFF → SPRAY → BURST → …)
-- - Wirkt nur beim Zielen (rechte Maustaste) und Feuern (linke Maustaste).
-- Getestet mit 800 DPI, Sens 0.411337, FOV 90, fovScale 1.375.

-- ========= Einstellungen =========
local fire_button      = 1    -- LMB
local ads_button       = 2    -- RMB
local mode_button      = 7    -- Modus-Umschalter (deine Maustaste 7)
local hipfire_allowed  = false -- true = wirkt auch ohne ADS

-- Optional: Setze auf true, um Mausbutton-IDs im G HUB Log zu sehen (zum Gegencheck der 7)
local debug_button_log = false

-- ========= Profile (Promod 2.20 – AK47) =========
-- SPRAY: für längere Feuerstöße (sanfter Start, dann stärker)
-- BURST: für kurze Bursts/Tabbing
local profiles = {
    OFF = { enabled = false },

    SPRAY = {
        enabled     = true,
        interval_ms = 11,
        y_curve     = {2,2,2,2, 3,3,3,3, 4,4,4, 5,5,5, 6,6,6,6,6, 6,6,6,6},
        jitter_y    = 1,
        x_cycle     = {0,0,0,0,0,0} -- Promod hat wenig horizontalen Drift; bei Bedarf anpassen
    },

    BURST = {
        enabled     = true,
        interval_ms = 11,
        y_curve     = {2,2,2, 3,3, 4,4, 5,5, 5,5},
        jitter_y    = 1,
        x_cycle     = {0,0,0,0,0,0}
    }
}

-- ========= Modusverwaltung =========
local mode_list   = {"OFF", "SPRAY", "BURST"}
local mode_idx    = 2  -- Start: SPRAY
local current_mode = mode_list[mode_idx]

local function ActiveProfile()
    local p = profiles[current_mode]
    if p and p.enabled then return p end
    return nil
end

local function CycleMode()
    mode_idx = mode_idx + 1
    if mode_idx > #mode_list then mode_idx = 1 end
    current_mode = mode_list[mode_idx]
    OutputLogMessage("[Anti-Recoil] Modus: %s\n", current_mode)
end

-- ========= Anti-Recoil-Loop (Kurvenbasiert) =========
function AntiRecoilLoop(profile, mode_snapshot)
    local step = 0
    local x_index = 1

    while IsMouseButtonPressed(fire_button) do
        -- Abbruch, wenn Modus gewechselt wurde oder ADS losgelassen wird(falls erforderlich)
        if current_mode ~= mode_snapshot then break end
        if not hipfire_allowed and not IsMouseButtonPressed(ads_button) then break end

        step = step + 1

        -- Y aus Kurve (letzten Wert beibehalten, wenn Liste zu Ende)
        local y_move = 0
        if profile.y_curve and #profile.y_curve > 0 then
            y_move = profile.y_curve[step] or profile.y_curve[#profile.y_curve]
        end

        -- Leichter Jitter in Y
        if profile.jitter_y and profile.jitter_y > 0 then
            local j = math.floor((math.random() * 2 - 1) * profile.jitter_y)
            y_move = y_move + j
        end

        -- X-Drift aus Zyklus
        local x_move = 0
        if profile.x_cycle and #profile.x_cycle > 0 then
            x_move = profile.x_cycle[x_index] or 0
            x_index = x_index + 1
            if x_index > #profile.x_cycle then x_index = 1 end
        end

        -- Bewegung und Takt
        MoveMouseRelative(x_move, y_move)
        Sleep(profile.interval_ms or 11)
    end
end

-- ========= G HUB Event-Handler =========
function OnEvent(event, arg)
    if event == "PROFILE_ACTIVATED" then
        EnablePrimaryMouseButtonEvents(true)
        -- Zufall initialisieren (G HUB: GetRunningTime verfügbar)
        if type(GetRunningTime) == "function" then
            math.randomseed(GetRunningTime())
        elseif os and os.time then
            math.randomseed(os.time())
        end
        OutputLogMessage("[Anti-Recoil] Aktiv. Modus wechseln mit Taste %d. Start: %s\n", mode_button, current_mode)
    end

    -- Optionales Debug: Mausbutton-IDs loggen
    if debug_button_log and event == "MOUSE_BUTTON_PRESSED" then
        OutputLogMessage("[Debug] Button: %d\n", arg or -1)
    end

    -- Modus zyklisch umschalten: OFF → SPRAY → BURST → …
    if event == "MOUSE_BUTTON_PRESSED" and arg == mode_button then
        CycleMode()
    end

    -- Start Kompensation beim Feuern
    if event == "MOUSE_BUTTON_PRESSED" and arg == fire_button then
        local p = ActiveProfile()
        if p and (IsMouseButtonPressed(ads_button) or hipfire_allowed) then
            local mode_snapshot = current_mode
            AntiRecoilLoop(p, mode_snapshot)
        end
    end
end