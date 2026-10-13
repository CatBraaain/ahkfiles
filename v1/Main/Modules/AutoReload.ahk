AutoReload() {
    global AutoReloadKnownFiles
    AutoReloadKnownFiles := SnapshotScriptTimes()
    SetTimer, ReloadIfScriptChanged, 1000
}

SnapshotScriptTimes() {
    files := {}
    Loop, %A_ScriptDir%\*.ahk,, 1
    {
        files[A_LoopFileLongPath] := A_LoopFileTimeModified
    }
    return files
}

ReloadIfScriptChanged() {
    global AutoReloadKnownFiles
    currentFiles := SnapshotScriptTimes()
    if (currentFiles.Count() != AutoReloadKnownFiles.Count()) {
        Reload
        return
    }
    for path, mtime in currentFiles
    {
        if (!AutoReloadKnownFiles.HasKey(path) || AutoReloadKnownFiles[path] != mtime) {
            Reload
            return
        }
    }
}
