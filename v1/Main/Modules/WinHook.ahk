ShellHookMsgId := DllCall("RegisterWindowMessage", "Str", "SHELLHOOK", "UInt")
DllCall("RegisterShellHookWindow", "UInt", A_ScriptHwnd)

class ShellHookCallback {
    __New(Events, Callback) {
        this.Events := Events
        this.Callback := Callback
        OnExit(this.Shutdown.Bind(this))
    }

    Shutdown(self) {
        self.Enables(false)
        return ""
    }

    Call(wParam, lParam, msg, hwnd) {
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
        OnMessage(ShellHookMsgId, this, enable ? 1 : 0)
    }
}

ShellHook(Events, Callback) {
    return new ShellHookCallback(Events, Callback)
}

HSHELL_WINDOWACTIVATED := 4
HSHELL_MONITORCHANGED := 16
HSHELL_RUDEAPPACTIVATED := (HSHELL_WINDOWACTIVATED | 0x8000)
