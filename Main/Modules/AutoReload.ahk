AutoReload() {
    knownFiles := SnapshotScriptTimes()
    SetTimer(() => ReloadIfScriptChanged(knownFiles), 1000)
}

SnapshotScriptTimes() {
    files := Map()
    Loop Files, A_ScriptDir "\*.ahk", "R"
    files[A_LoopFilePath] := A_LoopFileTimeModified
    return files
}

ReloadIfScriptChanged(knownFiles) {
    currentFiles := SnapshotScriptTimes()
    if (currentFiles.Count != knownFiles.Count) {
        Reload()
        return
    }
    for path, mtime in currentFiles {
        if (!knownFiles.Has(path) || knownFiles[path] != mtime) {
            Reload()
            return
        }
    }
}
