export const ObjectEqual = (obj1: any, obj2: any) => {
    let equal = true;

    if (Object.keys(obj1).length !== Object.keys(obj2).length) return false;

    Object.keys(obj1).map(k => {
        if (!obj2.hasOwnProperty(k) || obj1[k] !== obj2[k]) equal = false;
    })

    Object.keys(obj2).map(k => {
        if (!obj1.hasOwnProperty(k) || obj1[k] !== obj2[k]) equal = false;
    })
    return equal;
}