#Requires AutoHotkey >=2.0 <3.0

Array.Prototype.DefineProp("Includes", { Call: ArrayIncludes })
ArrayIncludes(Arr, Value) {
    for (i, v in Arr) {
        if (v == Value) {
            return true
        }
    }
    return false
}

Array.Prototype.DefineProp("ForEach", { Call: ArrayForEach })
ArrayForEach(Arr, Callback) {
    for (i, item in Arr) {
        Callback(item, i, Arr)
    }
}

Array.Prototype.DefineProp("Map", { Call: ArrayMap })
ArrayMap(Arr, Callback) {
    result := []
    for (i, item in Arr) {
        result.push(Callback(item, i, Arr))
    }
    return result
}
