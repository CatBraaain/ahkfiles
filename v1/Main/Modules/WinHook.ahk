#Include %A_ScriptDir%\Modules\ArrayExtension.ahk

ShellHookMsgId := DllCall("RegisterWindowMessage", "Str", "SHELLHOOK", "UInt")
DllCall("RegisterShellHookWindow", "UInt", A_ScriptHwnd)

class ShellHookCallback {
    __New(Events, Callback) {
        this.Events := Events
        this.Callback := Callback
        ; Bind the handler with ObjBindMethod (the documented v1.1 pattern) so
        ; that Enables() can unregister the exact same BoundFunc object.
        this.BoundProc := ObjBindMethod(this, "HandleMessage")
        OnExit(ObjBindMethod(this, "Shutdown"))
    }

    Shutdown(Reason) {
        this.Enables(false)
        return ""
    }

    HandleMessage(wParam, lParam, msg, hwnd) {
        winQuery := "ahk_id " . lParam
        WinGetTitle, winTitle, %winQuery%
        if (ErrorLevel) {
            return
        }
        if (winTitle = A_ScriptName) {
            return
        }
        if (hwnd != A_ScriptHwnd) {
            return
        }
        if (!Includes(this.Events, wParam)) {
            return
        }
        this.Callback.Call(lParam)
    }

    Enables(enable := true) {
        global ShellHookMsgId
        OnMessage(ShellHookMsgId, this.BoundProc, enable ? 1 : 0)
    }
}

ShellHook(Events, Callback) {
    return new ShellHookCallback(Events, Callback)
}

HSHELL_WINDOWACTIVATED := 4
HSHELL_MONITORCHANGED := 16
HSHELL_RUDEAPPACTIVATED := (HSHELL_WINDOWACTIVATED | 0x8000)
