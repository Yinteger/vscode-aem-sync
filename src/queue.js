class Queue {
    constructor () {
        this.items = [];
    }

    //Return & Empty the queue
    emptyQueue () {
        var items = this.items.splice(0);
        this.items = [];
        return items;
    }

    //Add Item to the Queue
    addItem (item) {
        this.items.push(item);
    }
}

module.exports = new Queue();