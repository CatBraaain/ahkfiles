#include ArrayExtension.ahk

HSHELL_WINDOWCREATED := 1
HSHELL_WINDOWDESTROYED := 2
HSHELL_ACTIVATESHELLWINDOW := 3
HSHELL_WINDOWACTIVATED := 4
HSHELL_GETMINRECT := 5
HSHELL_REDRAW := 6
HSHELL_TASKMAN := 7
HSHELL_LANGUAGE := 8
HSHELL_SYSMENU := 9
HSHELL_ENDTASK := 10
HSHELL_ACCESSIBILITYSTATE := 11
HSHELL_APPCOMMAND := 12
HSHELL_WINDOWREPLACED := 13
HSHELL_WINDOWREPLACING := 14
HSHELL_MONITORCHANGED := 16
HSHELL_HIGHBIT := 0x8000
HSHELL_FLASH := (HSHELL_REDRAW | HSHELL_HIGHBIT)
HSHELL_RUDEAPPACTIVATED := (HSHELL_WINDOWACTIVATED | HSHELL_HIGHBIT)

class ShellHook {
    static ShellHookMsgId := DllCall("RegisterWindowMessage", "Str", "SHELLHOOK")
    static ShellHookWindow := Gui()
    static _ := DllCall("RegisterShellHookWindow", "UInt", this.ShellHookWindow.Hwnd)

    __New(Events, Callback) {
        Events := Events is Array ? Events : [Events]
        CallbackWrapper(wParam, lParam, msg, hwnd) {
            try {
                winQuery := "ahk_id " lParam
                isAhkGui := WinGetTitle(winQuery) == A_ScriptName
            } catch {
                isAhkGui := false
            }
            isTargetReceiver := hwnd == ShellHook.ShellHookWindow.Hwnd
            isTargetEvent := Events.Includes(wParam)
            if (!isAhkGui && isTargetReceiver && isTargetEvent) {
                Callback()
            }
        }
        this.CallbackWrapper := CallbackWrapper

        OnExit((*) => this.Enables(false))
    }

    Enables(enable := true) {
        r := OnMessage(ShellHook.ShellHookMsgId, this.CallbackWrapper, enable ? 1 : 0)
    }
}
