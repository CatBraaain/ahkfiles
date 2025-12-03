#Include "WinHook.ahk"

HankakuOnFocus() {
    static hankakuHook := WinEventHook([EVENT_OBJECT_FOCUS], () => (
        !WinActive("ahk_class XamlExplorerHostIslandWindow") ; AltTabWindow
            ? Send("{vk1A}")
            : ""
    ))
    hankakuHook.Enables(true)
}
