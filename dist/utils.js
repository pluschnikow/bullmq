'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorObject = { value: null };
function tryCatch(fn, ctx, args) {
    try {
        return fn.apply(ctx, args);
    }
    catch (e) {
        exports.errorObject.value = e;
        return exports.errorObject;
    }
}
exports.tryCatch = tryCatch;
function isEmpty(obj) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}
exports.isEmpty = isEmpty;
function array2obj(arr) {
    const obj = {};
    for (let i = 0; i < arr.length; i += 2) {
        obj[arr[i]] = arr[i + 1];
    }
    return obj;
}
exports.array2obj = array2obj;
function delay(ms) {
    return new Promise(resolve => {
        setTimeout(() => resolve(), ms);
    });
}
exports.delay = delay;
//# sourceMappingURL=utils.js.map