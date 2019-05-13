$(document).ready(function() {
    var stylesheets = [];
    $('link[rel="stylesheet"]').each(function (style) {
        var href = $(this).attr('href');
        if (href) {
            stylesheets.push(href);
        }
    });

    var editor = $(".kendo_editor").kendoEditor({
        encoded: false,
        stylesheets: stylesheets
    }).data('kendoEditor');
    console.log(editor.body);
    $(editor.body).addClass('committee-description');

    $( ".multiple" ).each(function( index ) {
        $(this).selectize({
            plugins: ['remove_button'],
            dropdownParent: 'body'
        });
    });
});
