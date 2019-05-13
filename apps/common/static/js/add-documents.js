function onBoardBookUpload(e) {
    var item_temp = $('#id_board_book');
    e.data = {'csrfmiddlewaretoken': csrftoken, 'type': item_temp.attr('name')};
}

function onAgendaUpload(e) {
    var item_temp = $('#id_agenda');
    e.data = {'csrfmiddlewaretoken': csrftoken, 'type': item_temp.attr('name')};
}

function onMinutesUpload(e) {
    var item_temp = $('#id_minutes');
    e.data = {'csrfmiddlewaretoken': csrftoken, 'type': item_temp.attr('name')};
}

function onDocsUpload(e) {
    var item_temp = $('#id_other');
    e.data = {'csrfmiddlewaretoken': csrftoken, 'type': item_temp.attr('name')};
}

function onSuccess(e) {
    console.log("Status: " + e.response.status);
    console.log("Object pk: " + e.response.pk);
    add_to_uploaded(e.response.pk);
}
