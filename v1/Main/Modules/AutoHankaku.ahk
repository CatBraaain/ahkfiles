AutoHankaku() {
    global HSHELL_WINDOWACTIVATED, HSHELL_RUDEAPPACTIVATED
    static hankakuHook
    if (hankakuHook = "") {
        hankakuHook := ShellHook([HSHELL_WINDOWACTIVATED, HSHELL_RUDEAPPACTIVATED], Func("SendImeOffWhenActive"))
        hankakuHook.Enables(true)
    }
}

; ShellHook announces the activated window before the activation completes.
; Sending right away can land the key on the old window and cancel the
; switch, so wait until the announced window is actually active first.
SendImeOffWhenActive(hwnd) {
    static latestHwnd
    latestHwnd := hwnd
    ; WinWaitActive returns as soon as the window activates (no fixed delay).
    ; The 1s timeout only cleans up switches that never complete.
    WinWaitActive, ahk_id %hwnd%,, 1
    if (ErrorLevel) {
        return
    }
    if (latestHwnd == hwnd) {    ; skip when a newer switch superseded this one
        Send, {vk1D}
    }
}
