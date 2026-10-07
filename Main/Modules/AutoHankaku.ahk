#Include "WinHook.ahk"

AutoHankaku() {
    ; ShellHook announces the activated window before the activation completes.
    ; Sending right away can land the key on the old window and cancel the
    ; switch, so wait until the announced window is actually active first.
    static hankakuHook := ShellHook(
        [
            HSHELL_WINDOWACTIVATED,
            HSHELL_RUDEAPPACTIVATED
        ],
        SendImeOffWhenActive
    )
    hankakuHook.Enables(true)
}

SendImeOffWhenActive(hwnd) {
    static latestHwnd
    latestHwnd := hwnd
    ; WinWaitActive returns as soon as the window activates (no fixed delay).
    ; The 1s timeout only cleans up switches that never complete.
    if !WinWaitActive("ahk_id " hwnd, , 1) {
        return
    }
    if (latestHwnd == hwnd) {    ; skip when a newer switch superseded this one
        Send("{vk1D}")
    }
}
