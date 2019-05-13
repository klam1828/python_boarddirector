function add_to_uploaded_modal(pk) {
    var uploaded = $("#id_uploaded_file");
    var value = uploaded.val();
    if (value) value += ',';
    uploaded.val(value + pk);
}

function upload_from_popup_modal(e, item_temp){
    var document_id = item_temp.attr('data-doc-id');
    e.data['meeting'] = item_temp.attr('data-doc-meeting');
    var request = $.ajax({
        url: DOC_DELETE_URL,
        type: "POST",
        data: {
            document_id: document_id,
            action: 'update'
        },
        success: function(response) {
            location.reload();
        }
    });
}

function rename_from_popup_modal(e, item_temp){
    var document_id = item_temp.attr('data-doc-id');
    var filename = item_temp.val();
    var request = $.ajax({
        url: DOC_RENAME_URL,
        type: "POST",
        data: {
            document_id: document_id,
            filename: filename
        },
        success: function(response) {
            location.reload();
        }
    });
}

function handleEditInPopup(t) {
    var target = $('.edit-in-popup');

    if (t !== undefined) {
        target = t.find('.edit-in-popup');
    }

    target.on('click', function (event) {
        event.preventDefault();
        var doc_id = $(this).attr('data-doc-id');
        var doc_type = $(this).attr('data-doc-type');
        var doc_meeting_id = $(this).attr('data-doc-meeting');
        var filename = $(this).attr('data-doc-filename');
        init_update_modal(doc_id, doc_type, doc_meeting_id, filename);
    });
}

function handleRenameInPopup(t) {
    var target = $('.rename-in-popup');

    if (t !== undefined) {
        target = t.find('.rename-in-popup');
    }

    target.on('click', function (event) {
        event.preventDefault();
        var doc_id = $(this).attr('data-doc-id');
        init_rename_modal(doc_id);
    });
}

function handleDeleteDoc(t) {
    var target = $('.delete-doc-link');

    if (t !== undefined) {
        target = t.find('.delete-doc-link');
    }

    target.on('click', function (event) {
        event.preventDefault();
        var document_id = $(this).attr('data-doc-id');

        var kendoWindow = $("<div />").kendoWindow({
            title: gettext('Confirm'),
            resizable: false,
            modal: true,
            height: "110px",
            width: "220px",
            visible: false
        });

        kendoWindow.data("kendoWindow")
            .content($("#delete-document-confirmation").html())
            .center().open();

        kendoWindow
            .find(".delete-confirm,.delete-cancel")
            .click(function(e) {
                e.preventDefault();
                if ($(this).hasClass("delete-confirm")) {
                    var request = $.ajax({
                        url: DOC_DELETE_URL,
                        type: "POST",
                        data: {
                            document_id: document_id
                        },
                        success: function(response) {
                            location.reload();
                        }
                    });
                }
                kendoWindow.data("kendoWindow").close();
            })
            .end();
    });
}

jQuery(document).ready(function($) {
    handleEditInPopup();
    handleRenameInPopup();
    handleDeleteDoc();
});

function onProgress_modal(e) {
    // console.log("Upload progress :: " + e.percentComplete + "% :: " + getFileInfo_modal(e));
    $('.create-committee').attr("disabled", "disabled");
}

function onError_modal(e) {
    // console.log("Error (" + e.operation + ") :: " + getFileInfo_modal(e));
    var http_request = jQuery.parseJSON(e.XMLHttpRequest.response);
    if (e.XMLHttpRequest.status == '403' && http_request.status == 'error') {

        var kendoWindow = $("<div />").kendoWindow({
            title: gettext('Warning!'),
            resizable: false,
            modal: true,
            height: "100px",
            width: "270px",
            visible: false
        });
        var message = '<p>' + http_request.message +
            '</p>' + '<div class="warning-buttons">' +
            '<button class="warning-confirm k-button">' + gettext("Ok") + '</button>' +
            '</div>';
        kendoWindow.data("kendoWindow").content(message).center().open();

        kendoWindow
            .find(".warning-confirm")
            .click(function(e) {
                e.preventDefault();
                kendoWindow.data("kendoWindow").close();
            })
            .end();
    }
}

function onComplete_modal(e) {
    $('.create-committee').removeAttr("disabled");
}

function getFileInfo_modal(e) {
    return $.map(e.files, function(file) {
        var info = file.name;

        // File size is not available in all browsers
        if (file.size > 0) {
            info  += " (" + Math.ceil(file.size / 1024) + " KB)";
        }
        return info;
    }).join(", ");
}

function onSelect_modal(e) {
    var allowed_ext = [".pdf", ".xls", ".xlsx", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".ppt", ".pptx", ".gif", ".zip", ".mp3"];
    var warning = false;
    $.each(e.files, function(index, value) {
        if(jQuery.inArray(value.extension, allowed_ext) == '-1') {
            e.preventDefault();
            warning = true;
        }
    });
    getWarning_modal(warning, '');
}

function getWarning_modal(warning, message){
    if (warning) {
        var kendoWindow = $("<div />").kendoWindow({
            title: gettext('Warning!'),
            resizable: false,
            modal: true,
            height: "120px",
            width: "300px",
            visible: false
        });
        if (!message){
            message = '<p>' + gettext('You can only upload following files: ' +
                'pdf, doc, docx, xls, xlsx, png, jpg, jpeg, tif, tiff, ppt, pptx, gif, zip, mp3".</p><p>Try to upload the correct file type.') +
                '</p>' + '<div class="warning-buttons">' +
                '<button class="warning-confirm k-button">' + gettext("Ok") + '</button>' +
                '</div>';
        }
        kendoWindow.data("kendoWindow").content(message).center().open();
        kendoWindow
            .find(".warning-confirm")
            .click(function(e) {
                e.preventDefault();
                kendoWindow.data("kendoWindow").close();
            })
            .end();
    }
}

function init_update_modal(doc_id, doc_type, doc_meeting_id, filename){
    var $modal = $("#update-archive-dialog");
    $modal.dialog('open');
    $('.popup-overlay').show();
    var doc_meeting = '';
    if (doc_meeting_id) {
        doc_meeting = 'data-doc-meeting="' + doc_meeting_id + '"';
    }
    var name = 'file';
    if (doc_type) {
      if (doc_type == 1) {
          name = 'agenda';
      }
      else if (doc_type == 2) {
          name = 'minutes';
      }
      else if (doc_type == 3) {
          name = 'other';
      }
      else if (doc_type == 4) {
          name = 'board_book';
      }
    }
    var $wrapper = $("#update-archive-file-wrapper");
    var temp_doc = '<input id="id_temp_doc_' + doc_id + '" name="' + name + '" type="file" data-doc-id="' + doc_id + '" ' + doc_meeting + '>';
    $('#doc-filename').html(filename);
    $wrapper.append(temp_doc);
    temp_doc_update_kendo_init("#id_temp_doc_" + doc_id);
}

function init_rename_modal(doc_id){
    var $modal = $("#rename-archive-dialog");
    $modal.dialog('open');
    $('.popup-overlay').show();
    var $wrapper = $("#rename-archive-file-wrapper");
    var temp_doc = '<div class="filename-form"><div class="form-group"><label>File Name:</label><input name="filename" type="text" data-doc-id="' + doc_id + '" /></div></div>';
    $wrapper.append(temp_doc);
}

function onSuccessUpdated(e) {
    window.eOnSuccess = e;
    if (e.response.html) {
        var html = e.response.html;
        var pk = e.response.pk;
        var id = $(this.element).attr('data-doc-id');
        var closest_li = $('#item_' + id).closest('.archives .items');

        if (closest_li.length)
        {
            closest_li.html(html);

            var checkbox = document.getElementById('repeat-checkbox-' + pk);
            if (checkbox) {
                var label = checkbox.nextElementSibling;
                checkboxes.push(checkbox);
                checkboxLabels.push(label);
                reloadCheckboxes();
            }

            initDropdowns(closest_li);
            handleEditInPopup(closest_li);
            handleRenameInPopup(closest_li);
            handleDeleteDoc(closest_li);
        }
    }
}

function onTempDocsUpdateUpload(e) {
    var item_temp = $(this.element);
    var document_id = item_temp.attr('data-doc-id');
    e.data = {
        'csrfmiddlewaretoken': csrftoken,
        'action': 'update',
        'type': item_temp.attr('name'),
        'old_document': document_id
    };
    if (item_temp.attr('data-doc-meeting')) {
        e.data.meeting = item_temp.attr('data-doc-meeting');
    }
    window.eOnDocsUpdate = e;
    $(".form-send-button").prop("disabled", false).removeClass("ui-state-disabled");
}

function temp_doc_update_kendo_init(id, doc_id) {
    var el = id || "#id_temp_doc";
    $(el).kendoUpload({
        localization: {
            "select": "Select file...",
            "dropFilesHere": "Drop file here or click"
        },
        multiple: false,
        async: {
            saveUrl: "/documents/create/",
            autoUpload: true
        },
        complete: onComplete_modal,
        error: onError_modal,
        progress: onProgress_modal,
        success: onSuccessUpdated,
        upload: onTempDocsUpdateUpload,
        select: onSelect_modal
    });
}

function initUploadPopup() {

    var updDialog = $('#update-archive-dialog');
    updDialog.dialog({
        autoOpen: false,
        width: 696,
        resizable: false,
        buttons: [
        {
            text: updDialog.attr('data-cancel-button-text'),
            click: function() {
                $( this ).dialog( "close" );
                $('.popup-overlay').hide();
            },
            class: 'cancel-button'
        },
        {
            text: updDialog.attr('data-send-button-text'),
            click: function() {
                var el = $("#update-archive-file-wrapper input");
                $("#id_notify_group").val($("#browse-by option:selected").val());
                $("#id_notify_me").val($("#notify_me").prop('checked'));
                upload_from_popup_modal(window.eOnDocsUpdate, el);
                add_to_uploaded_modal(window.eOnSuccess.response.pk);
                $( this ).dialog( "close" );
                $('.popup-overlay').hide();
            },
            class: 'form-send-button'
        }
        ],
        beforeClose: function( event, ui ) {
            $('.popup-overlay').hide();
            $('#update-archive-file-wrapper').empty();
        }
    });

    $(".form-send-button").prop("disabled", true).addClass("ui-state-disabled");

    $( "#browse-by" ).change(function () {
            $("#email-recipient").text($("#browse-by option:selected").text());
        })
        .change();
}

function initRenamePopup() {

    var updDialog = $('#rename-archive-dialog');
    updDialog.dialog({
        autoOpen: false,
        width: 696,
        resizable: false,
        buttons: [
        {
            text: updDialog.attr('data-cancel-button-text'),
            click: function() {
                $( this ).dialog( "close" );
                $('.popup-overlay').hide();
            },
            class: 'cancel-button'
        },
        {
            text: updDialog.attr('data-send-button-text'),
            click: function() {
                var el = $("#rename-archive-file-wrapper input");
                rename_from_popup_modal(window.eOnDocsUpdate, el);
                $( this ).dialog( "close" );
                $('.popup-overlay').hide();
            },
            class: 'form-send-button'
        }
        ],
        beforeClose: function( event, ui ) {
            $('.popup-overlay').hide();
            $('#rename-archive-file-wrapper').empty();
        }
    });
}

$(document).ready(function() {

    initUploadPopup();

    initRenamePopup();

    $( "li .items" ).hover(function() {
        $('.functional-btn').css("visibility", "hidden");
        $(this).find('.functional-btn').css("visibility", "visible");
    });
});
