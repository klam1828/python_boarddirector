function check_add_state(initial) {
    var checked = false;
    if (initial !== undefined && initial !== $('#downloadable-checkbox').prop('checked')) {
        checked = true;
    }

    var not_empty = $('#id_share-role').val() !== '0' || $('#id_share-memberships').val();
    $('#share-folder-dialog').closest('.ui-dialog').find('.form-send-button').attr('disabled', not_empty || checked ? null : 'disabled');
}

function init_delete_permissions() {
    $('.delete-permission').click(function(e) {
        e.preventDefault();
        var delete_url = $(this).attr('href');
        var object_permission_id = $(this).data('perm-id');
        $.post(delete_url, {'object_permission_id': object_permission_id})
            .done(function(data) {
                refresh_share_folder_content();
        });
    });
}

function handleChangeDownloadable(initial) {
    var target = $('#downloadable-checkbox');
    var target_wrapper = $('.document-item-downloadable .checkboxArea');
    var target_wrapper_c = $('.document-item-downloadable .checkboxAreaChecked');

    target.on('change', function() {
        check_add_state(initial);
    });
    target_wrapper.on('click', function() {
        check_add_state(initial);
    });
    target_wrapper_c.on('click', function() {
        check_add_state(initial);
    });
}

function refresh_share_folder_content() {
    var $target = $('#share-folder-target');
    var dialog_url = $target.data('dialog-url');
    $.ajax({
        url: dialog_url,
        type: 'GET',
        success: function(response) {
            $target.html(response);
            $('#id_share-role, #id_share-permission').selectize();
            $('#id_share-role, #id_share-memberships').change(check_add_state);
            $('#id_share-memberships').selectize({
                plugins: ['remove_button']
            });
            $("#share-folder-dialog").dialog("option", "position", {my: "center", at: "center", of: window});
            init_delete_permissions();
            var checkbox = document.getElementById('downloadable-checkbox');
            if (checkbox) {
                var label = checkbox.nextElementSibling;
                checkboxes.push(checkbox);
                checkboxLabels.push(label);
                reloadCheckboxes();
                handleChangeDownloadable($('#downloadable-checkbox').prop('checked'));
            }
            check_add_state();
        }
    });
}

function init_share_folder_modal(dialog_url) {
    $('.popup-overlay').show();
    var $modal = $('#share-folder-dialog');
    $modal.dialog('open');
    $('#share-folder-target').data('dialog-url', dialog_url);
    $('#share-folder-target').empty();
    refresh_share_folder_content();
}

function share_folder($dialog) {

    var downbox = $('#downloadable-checkbox')

    var not_empty = $('#id_share-role').val() !== '0' || $('#id_share-memberships').val() || downbox;
    if (not_empty) {
        var $form = $('#share-folder-form');
        $.post($form.attr('action'), $form.serialize())
            .done(function(data) {
                refresh_share_folder_content();
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                var error_text = $form.data('error-text');
                var message = $('.message.error');
                if(message.length) {
                    message.text(error_text);
                }
                $dialog.dialog('close');
                $('.popup-overlay').hide();
        });
    }
}

$(document).ready(function() {
    // Share Folder
    $('a.share-folder-link').live('click', function (event) {
        event.preventDefault();
        var dialog_url = $(this).data('dialog-url');
        init_share_folder_modal(dialog_url);
    });
    var updDialog = $('#share-folder-dialog');
    updDialog.dialog({
        autoOpen: false,
        width: 696,
        resizable: false,
        buttons: [
        {
            text: updDialog.attr('data-cancel-button-text'),
            click: function() {
                $(this).dialog('close');
                $('.popup-overlay').hide();
            },
            class: 'cancel-button'
        },
        {
            text: updDialog.attr('data-send-button-text'),
            click: function() {
                share_folder($(this));
            },
            class: 'form-send-button'
        }
        ],
        beforeClose: function( event, ui ) {
            $('.popup-overlay').hide();
            window.location.reload(true);
        }
    });
});
