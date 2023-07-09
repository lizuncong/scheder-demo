
const yieldInterval = 5;
let deadline = 0;
let isHostCallbackScheduled = false;
const channel = new MessageChannel();
let port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;
function performWorkUntilDeadline() {
    if (scheduledHostCallback) {
        // 当前宏任务事件开始执行
        let currentTime = new Date().getTime();
        // 计算当前宏任务事件结束时间
        deadline = currentTime + yieldInterval;
        const hasMoreWork = scheduledHostCallback(currentTime);
        if (!hasMoreWork) {
            scheduledHostCallback = null;
        } else {
            // 如果还有工作，则触发下一个宏任务事件
            port.postMessage(null);
        }
    }
}
function requestHostCallback(callback) {
    scheduledHostCallback = callback;
    port.postMessage(null);
}
let taskQueue = [];
let isHostCallbackSchedule = false;
function scheduleCallback(callback) {
    var newTask = {
        callback: callback,
    };
    taskQueue.push(newTask);
    if (!isHostCallbackScheduled) {
        isHostCallbackScheduled = true;
        requestHostCallback(flushWork);
    }
    return newTask;
}
let currentTask = null;
function flushWork(initialTime) {
    return workLoop(initialTime);
}

function workLoop(initialTime) {
    currentTask = taskQueue[0];

    while (currentTask) {
        if (new Date().getTime() >= deadline) {
            // 每执行一个任务，都需要判断当前的performWorkUntilDeadline执行时间是否超过了截止时间
            break;
        }
        var callback = currentTask.callback;
        callback();

        taskQueue.shift();
        currentTask = taskQueue[0];
    }
    if (currentTask) {
        // 如果taskQueue中还有剩余工作，则返回true
        return true;
    } else {
        return false;
    }
}