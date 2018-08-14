class Queue {
    constructor () {
        this.items = [];
    }

    //Return & Empty the queue
    empty () {
        var items = this.items.splice(0);
        this.items = [];
        return items;
    }

    //Add Item to the Queue
    addItem (item) {
        this.items.push(item);
    }

    has (item) {
        return this.items.indexOf(item) > -1;
    }
}

module.exports = Queue;