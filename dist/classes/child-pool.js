"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const child_process_1 = tslib_1.__importDefault(require("child_process"));
const path_1 = tslib_1.__importDefault(require("path"));
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const get_port_1 = tslib_1.__importDefault(require("get-port"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const util_1 = require("util");
const stat = util_1.promisify(fs_1.default.stat);
const fork = child_process_1.default.fork;
const convertExecArgv = async (execArgv) => {
    const standard = [];
    const convertedArgs = [];
    lodash_1.default.forEach(execArgv, async (arg) => {
        if (arg.indexOf('--inspect') === -1) {
            standard.push(arg);
        }
        else {
            const argName = arg.split('=')[0];
            const port = await get_port_1.default();
            convertedArgs.push(`${argName}=${port}`);
        }
    });
    return standard.concat(convertedArgs);
};
const initChild = function (child, processFile) {
    return new Promise(resolve => {
        child.send({ cmd: 'init', value: processFile }, resolve);
    });
};
class ChildPool {
    constructor() {
        this.retained = {};
        this.free = {};
    }
    async retain(processFile) {
        const _this = this;
        let child = _this.getFree(processFile).pop();
        if (child) {
            _this.retained[child.pid] = child;
            return child;
        }
        const execArgv = await convertExecArgv(process.execArgv);
        let masterFile = path_1.default.join(__dirname, './master.js');
        try {
            await stat(masterFile); // would throw if file not exists
        }
        catch (_) {
            try {
                masterFile = path_1.default.join(process.cwd(), 'dist/classes/master.js');
                await stat(masterFile);
            }
            finally {
            }
        }
        child = fork(masterFile, execArgv);
        child.processFile = processFile;
        _this.retained[child.pid] = child;
        child.on('exit', _this.remove.bind(_this, child));
        await initChild(child, child.processFile);
        return child;
    }
    release(child) {
        delete this.retained[child.pid];
        this.getFree(child.processFile).push(child);
    }
    remove(child) {
        delete this.retained[child.pid];
        const free = this.getFree(child.processFile);
        const childIndex = free.indexOf(child);
        if (childIndex > -1) {
            free.splice(childIndex, 1);
        }
    }
    kill(child, signal) {
        child.kill(signal || 'SIGKILL');
        this.remove(child);
    }
    clean() {
        const children = lodash_1.default.values(this.retained).concat(this.getAllFree());
        children.forEach(child => {
            // TODO: We may want to use SIGKILL if the process does not die after some time.
            this.kill(child, 'SIGTERM');
        });
        this.retained = {};
        this.free = {};
    }
    getFree(id) {
        return (this.free[id] = this.free[id] || []);
    }
    getAllFree() {
        return lodash_1.default.flatten(lodash_1.default.values(this.free));
    }
}
exports.ChildPool = ChildPool;
exports.pool = new ChildPool();
//# sourceMappingURL=child-pool.js.map