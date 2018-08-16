class Queue {
    constructor () {
        this.operations = [];
        this.paths = {}; //Quick look up for paths in queue
    }

    //Return & Empty the queue
    empty () {
        var operations = this.operations.splice(0);
        this.operations = [];
        this.paths = {};
        return operations;
    }

    //Add (file) operation to the Queue
    addOperation (path, operation) {
        this.operations.push({path, type: operation});
        this.paths[path] = true;
    }

    has (path) {
        return this.paths[path] ? true : false;
    }
}

module.exports = Queue;