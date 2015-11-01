$(function(){

    var dataBaseName = 'indexedDb-todo-list';
    var storeName = 'todolist';
    var dataBaseVersion = 1;
    var db;

    function initDb(callback) {
        var request = window.indexedDB.open(dataBaseName , dataBaseVersion);
        request.onsuccess = function(evt) {
            console.debug('init db success');
            db = evt.currentTarget.result;
            callback && callback();
        };
        request.onerror = function(evt) {
            console.debug('init db error : ' + evt.target.errorCode);
            $('#errormsg').html('database init error : ' + evt.target.errorCode);
        };
        request.onupgradeneeded = function(evt) {
            console.debug('onupgradeneeded');
            var store = evt.currentTarget.result.createObjectStore(
                storeName, { keyPath: 'id', autoIncrement: true });
            store.createIndex('todo', 'todo', { unique: false });
        };
    }

    function list() {
        var tx = db.transaction(storeName, 'readonly');
        var store = tx.objectStore(storeName);
        var request = store.openCursor();
        var listArr = [];

        function listTodos() {
            var html = '<ul>'
            for(var i = 0, len = listArr.length ; i < len ; i++) {
                html += '<li>' + listArr[i].value + '<a href="javascript:void(0)" data-action="delete" data-id="' + listArr[i].id + '">删除</a>' + '</li>';
            }
            html += '</ul>';

            $('#list').html(html);
        }

        request.onsuccess = function(evt) {
            var cursor = evt.target.result;
            if(cursor) {
                console.debug('find todo:' + JSON.stringify(cursor.value));
                listArr.push(cursor.value);
                cursor.continue();
            } else {
                console.debug('no more todo');
                listTodos();
            }
        };
        request.onerror = function(evt) {
            console.debug('openCursor error');
        };
    }

    initDb(function() {
        list();
    });

    function addTodo() {
        var val = $('#input').val();
        if(!val) {
            return;
        }
        var tx = db.transaction(storeName , "readwrite");
        var store = tx.objectStore(storeName);
        var request = store.add({value:val});
        request.onsuccess = function() {
            console.debug('add todo success');
            list();
        };
        request.onerror = function() {
            console.debug('add todo error');
        };
    }

    function deleteTodo() {
        var id = $(this).data("id");
        var tx = db.transaction(storeName , "readwrite");
        var store = tx.objectStore(storeName);
        var request = store.get(id);
        request.onsuccess = function(evt) {

            var result = evt.target.result;

            var request = store.delete(id);

            request.onsuccess = function() {
                console.debug('delete todo ' + result.value + ' success');
                list();
            };
            request.onerror = function() {
                console.debug('delete todo ' + result.value + ' error');
            };
        };
        request.onerror = function() {
            console.debug('read todo ' + id + ' error');
        };
    }

    function addEventListeners() {
        $('#add').on('click' , addTodo);
        $('#list').on('click' , '[data-action="delete"]' , deleteTodo);
    }

    addEventListeners();
});