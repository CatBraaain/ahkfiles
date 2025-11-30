#Requires AutoHotkey >=2.0 <3.0

Array.Prototype.DefineProp('Includes', { Call: ArrayIncludes })
ArrayIncludes(Arr, Value) {
    for (i, v in Arr) {
        if (v == Value) {
            return true
        }
    }
    return false
}
