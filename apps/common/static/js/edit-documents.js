function onBoardBookUpload(e) {
    var item_temp = $('#id_board_book');
    upload(e, item_temp)
}

function onAgendaUpload(e) {
    var item_temp = $('#id_agenda');
    upload(e, item_temp)
}

function onMinutesUpload(e) {
    var item_temp = $('#id_minutes');
    upload(e, item_temp)
}

function onDocsUpload(e) {
    var item_temp = $('#id_other');
    upload(e, item_temp)
}

function onSuccess(e) {
    console.log("Status: " + e.response.status);
    console.log("Object pk: " + e.response.pk);
    add_to_uploaded(e.response.pk);
    if (e.response.html) {
        var html = e.response.html;
        var pk = e.response.pk;
        var type = e.response.type;
        var closest_li = $('#id_' + type).closest('li');

        if (closest_li.length)
        {
            closest_li.html(html);

            var checkbox = document.getElementById('repeat-checkbox-' + pk);
            if (checkbox) {
                var label = checkbox.nextElementSibling;
                checkboxes.push(checkbox);
                checkboxLabels.push(label);
                reloadCheckboxes();
                handleChangeDownloadable();
            }

            initDropdowns(closest_li);
            handleEditInPopup(closest_li);
            handleRenameInPopup(closest_li);
            handleDeleteDoc(closest_li);
        }
    }
}

function upload(e, item_temp) {
    var closest_li = item_temp.closest('li');
    var meeting_id = closest_li.find('[name=data-doc-meeting]').attr('data-doc-meeting');

    e.data = {
        'csrfmiddlewaretoken': csrftoken,
        'type': item_temp.attr('name'),
        'action': 'update',
        'meeting': meeting_id
    };
    window.eOnDocsUpdate = e;
}

function changeDownloadable() {
    var parent = $(this).closest('.document-item');
    var item_temp = $(this).parent().find('[type=checkbox]');
    var document_id = item_temp.attr('data-doc-id');
    var checked = item_temp.prop('checked');
    var request = $.ajax({
        url: DOC_RENAME_URL,
        type: "POST",
        data: {
            document_id: document_id,
            downloadable: checked
        },
        success: function(response) {
            if (checked) {
                parent.find('.download').show();
                parent.find('.view').show();
            }
            else {
                parent.find('.download').hide();
                parent.find('.view').hide();
            }
        }
    });
}

function handleChangeDownloadable(t) {
    var target = $('.document-item-downloadable input');
    var target_wrapper = $('.document-item-downloadable .checkboxArea');
    var target_wrapper_c = $('.document-item-downloadable .checkboxAreaChecked');

    if (t !== undefined) {
        target = t.find('.document-item-downloadable input');
        target_wrapper = t.find('.document-item-downloadable .checkboxArea');
        target_wrapper_c = t.find('.document-item-downloadable .checkboxAreaChecked');
    }

    target.each(function() {
        var checked = $(this).prop('checked');
        if (!checked) {
            $(this).closest('.document-item').find('.download').hide();
            $(this).closest('.document-item').find('.view').hide();
        }
    });

    target.on('change', changeDownloadable);
    target_wrapper.on('click', changeDownloadable);
    target_wrapper_c.on('click', changeDownloadable);
}

jQuery(document).ready(function($) {
    handleChangeDownloadable();
});
