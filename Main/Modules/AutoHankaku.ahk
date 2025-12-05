#Include "WinHook.ahk"

AutoHankaku() {
    ; Sending Send() on EVENT_SYSTEM_FOREGROUND(WinEventHook) can block new window focus.
    ; Use ShellHook events to send keys after the window is fully active.
    static hankakuHook := ShellHook(
        [
            HSHELL_WINDOWACTIVATED,
            HSHELL_RUDEAPPACTIVATED
        ],
        () => Send("{vk1A}")
    )
    hankakuHook.Enables(true)
}
