#Include WinHook.ahk

HankakuOnFocus() {
    static hankakuHook := WinEventHook([EVENT_OBJECT_FOCUS], () => Send("{vk1A}"))
    hankakuHook.Enables(true)
}
