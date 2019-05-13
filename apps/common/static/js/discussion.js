var data_mention_discussion = [];
var user_feed = null;
var user_subscribe = null;
var getstream_client;

$(document).ready(function () {
    var delete_channel_popup = $("#window-delete-channel");
    delete_channel_popup.kendoWindow({
      width: "600px",
      title: "Delete channel",
      resizable: false,
      modal: true,
      visible: false
    }).data("kendoWindow").center();

    $("#discussion-left").on('click', '.discussion-left-list-item-discussion-close', function(e) {
        e.stopPropagation();

        var $this = $(this),
            delete_url = $this.data('delete_url');

        console.log('close,')
        delete_channel_popup.data("kendoWindow").open();


        delete_channel_popup
            .find(".delete-confirm,.delete-cancel")
            .click(function(e) {
                e.preventDefault();
                if ($(this).hasClass("delete-confirm")) {
                console.log('confirm',  confirm)
                    var request = $.ajax({
                        url: delete_url,
                        type: "DELETE",
                        success: function(response) {
                            console.log(' DELETE location.reload();')
                        }
                    });
                }
                delete_channel_popup.data("kendoWindow").close();
            })
            .end();
    })


    var direct_discussions = false;

    // Initializes and creates emoji set from sprite sheet
    $(".discussion-main-info-section").on('click', function (e) {
        var $this = $(this),
        $title = $this.children('.discussion-main-info-section-title'),
        $inner = $this.children('.discussion-main-info-section-inner'),
        active = $title.hasClass('active'),
        load = $this.data('load');

        if ($(e.target).closest('.discussion-main-info-section-inner').length) {
            return true;
        }
        if (!$inner.hasClass('static')) {
            $inner.empty();
        }
        if (active) {
            $title.removeClass('active');
        } else {
            $title.addClass('active');

            if (load == 'files'){
                $.ajax({
                    url: api_discussion_get + "files?feed_name=" + feed_name,
                    type: 'GET',
                    success: function (resp) {
                        for (item in resp.items) {
                            $inner.append('<div class="file_discussion_show"><a href="' + resp.items[item].url + '?view=1" target="_blank" class="file_attach-message"><i class="fa fa-file"></i> ' + resp.items[item].name + '</a></div>')
                        }
                    },
                    error: function (resp) {
                       show_alert(FAIL, 'Something was wrong !');
                    }
                });
            } else if (load == 'members') {
                if (!direct_discussions) {
                    $.ajax({
                        url: api_discussion_get + "members?feed_name=" + feed_name,
                        type: 'GET',
                        success: function (resp) {
                            for (item in resp.items) {
                                $inner.append(`<div class="file_discussion_show members_discussion_show" data-member_id="${resp.items[item].id}"><div class="photo" title="${resp.items[item].full_name}" style="background-image: url(${resp.items[item].avatar});"></div> ${resp.items[item].full_name}</div>`)
                            }
                        },
                        error: function (resp) {
                           show_alert(FAIL, 'Something was wrong !');
                        }
                    });
                } else {
                    $inner.append(`<div class="file_discussion_show">${direct_discussions}</div>`)
                }
            }
        }
    })

    $("body").on('click', ".action_delete_message", function () {
        var $this = $(this),
            id_object = $this.data('id');


        $.ajax({
            url: api_discussion_main + "delete/" + id_object,
            type: 'POST',
            success: function (resp) {
            },
            error: function (resp) {
               show_alert(FAIL, 'Something was wrong !');
            }
        });

        console.log('delete action', id_object)
    });

    $("body").on('click', ".discussion-left-list-item-discussion", function () {
        var $this = $(this),
            feed_name_select = $this.data('name'),
            feed_name_private = $this.data('private'),
            title = $this.data('title');
        direct_discussions = $this.hasClass('direct-discussions')?$this.html():false;

        load_discussion(feed_name_select);
        feed_name = feed_name_select;
        $('.type_discussion').html(" (" + (feed_name_private?"Private":"Open") + " Forum)")
        $('#discussion-main .holder h2').html(title)
        $('.discussion-left-list-item-discussion.active').removeClass('active')
        $this.addClass('active')

        $('.discussion-main-info-section-inner:not(.static)').empty();
        $('.discussion-main-info-section-title.active').removeClass('active');
    });


    var timeout_search = null;
    $("#search_discussion").on('keyup', function() {
        var $this = $(this),
            val = $this.val();

        if (timeout_search) {
            clearTimeout(timeout_search);
            timeout_search = null;
        }

        if (val) {
            $(".discussion-left-list-item-discussion").each(function(id, el) {
                var html = $(el).html().toLowerCase()
                if (html.indexOf(val.toLowerCase()) >= 0) {
                    $(el).show();
                } else {
                    $(el).hide();
                }
            });

            if (val.length > 3) {
                timeout_search = setTimeout(function(){
                    $.ajax({
                        url: `${api_discussion_search_channel}?search=${val}`,
                        type: 'GET',
                        success: function (resp) {
                            var array_channels_search = []
                            for (var i in resp.items) {
                                array_channels_search.push(resp.items[i].feed_name);
                            }

                            $(".discussion-left-list-item-discussion").each(function(id, el) {
                                if (array_channels_search.indexOf($(el).data('name')) >= 0) {
                                    $(el).show();
                                } else {
                                    $(el).hide();
                                }
                            });
                        },
                        error: function (resp) {
                           show_alert(FAIL, 'Something was wrong !');
                        }
                    });
                }, 1000)
            }
        } else {
            $(".discussion-left-list-item-discussion").show();
        }
    })

    $('.discussion-main-info-toggle').click(function () {
        $('#discussion-main-info').animate({
            width: 'toggle'
        }, "fast")
    });

    $('#id_message').emojiPicker({
        width: '300px',
        height: '400px',
        button: false,
        position: 'left'
    });
    $('.emojis_for_message').click(function(e) {
        e.preventDefault();
        $('#id_message').emojiPicker('toggle');
    });

    $("#select_type_view_discussions").on('change', function(){
        var $this = $(this),
        val = $this.val();

        $('.show-discussion-block').hide()

          switch(val) {
            case 'users-block':
              $('.show-discussion-block.users-block').show()
                break;
            case 'news-block':
              $('.show-discussion-block.news-block').show()
            break;
            case 'committees-block':
              $('.show-discussion-block.committees-block').show()
            break;
            case 'organization-block':
              $('.show-discussion-block.organization-block').show()
            break;
            default:
              $('.show-discussion-block').show()
          }
    });

    $(".discussion_type_rooms").on('click', function(event){
      var $this = $(this),
          show_list = $this.data('show');
      $('.discussion_type_rooms.active').removeClass('active')
      $this.addClass('active')
      $('.discussion_list_rooms').hide()
      $('#' + show_list).show()
    })
    $("body").on('submit', ".create-channel-form", function(event) {
      event.preventDefault();
      var $this = $(this),
          action = $this.attr('action'),
          $button = $this.find('button'),
          formData = new FormData($this[0]);

        $.ajax({
            url: action,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function () {
                $button.prop('disabled', true)
            },
            success: function (resp) {
                $button.prop('disabled', false)
                var name_discussion = formData.get('name');
                var private_discussion = formData.get('private');

                if (private_discussion == 'true') {
                    $(".discussion-left-list-item-private").append($('<div class="discussion-left-list-item-discussion" data-name="' + resp.feed_name + '" data-private="1" data-title="' + name_discussion + '">' + name_discussion + '</div>'));
                } else {
                    $(".discussion-left-list-item-open").append($('<div class="discussion-left-list-item-discussion" data-name="' + resp.feed_name + '" data-title="' + name_discussion + '">' + name_discussion + '</div>'));
                }

                $this[0].reset()
                add_channel_popup.data("kendoWindow").close();
            },
            error: function (resp) {
                $button.prop('disabled', false)
            }
        });
        return false;
    })

    $("body").on('submit', ".create-document-form", function(event) {
      event.preventDefault();
      var $this = $(this),
          action = $this.attr('action'),
          $button = $this.find('button'),
          formData = new FormData($this[0]);

          formData.set('new_document', '1')
        $.ajax({
            url: action,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function () {
                $button.prop('disabled', true)
            },
            success: function (resp) {
                $button.prop('disabled', false)
                $this[0].reset()
                attach_files_popup.data("kendoWindow").close();
                $("#id_uploaded_file").val('')
            },
            error: function (resp) {
                $button.prop('disabled', false)
            }

        });
        return false;
    })

    $("body").on('submit', "#discussion-form, .replay-form", function(event) {
      event.preventDefault();
      var $this = $(this),
          action = $this.attr('action'),
          $button = $this.find('button'),
          formData = new FormData($this[0]);

        $this.find('textarea').mentionsInput('val', function(text) {
          formData.set('message', text)
        });

        if (file_ids) {
          formData.set('file_ids', file_ids)
        }


        $.ajax({
            url: action,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function () {
                $button.prop('disabled', true)
            },
            success: function (resp) {
                $button.prop('disabled', false)
                $this[0].reset()
                $this.find('textarea').mentionsInput('reset');
                file_ids = null;
                if (form_upload) {
                    form_upload.find(".count_upload").html('');
                }
            },
            error: function (resp) {
                $button.prop('disabled', false)
            }

        });
        return false;
    })



    $('select[multiple="multiple"]').selectize({
        plugins: ['remove_button'],
        dropdownParent: 'body'
    });


    var add_channel_popup = $("#window-add-channel");

//    $(".create-channel-form #id_name").selectize({});
    $(".discussion_channel_plus").on('click', function () {
        var $this = $(this),
            private = $(this).data('private')? true: false;

        add_channel_popup.data("kendoWindow").open();

        $('#id_member_ids')[0].selectize.setValue("0")

        $(".create-channel-form #id_private").val(private);
    })
    add_channel_popup.find('.back').on('click', function() {
       add_channel_popup.data("kendoWindow").close();
       $(".create-channel-form")[0].reset()
    })
    add_channel_popup.kendoWindow({
      width: "600px",
      title: "Create channel",
      resizable: false,
      modal: true,
      visible: false
    }).data("kendoWindow").center();


    var edit_channel_popup = $("#window-edit-channel");
    edit_channel_popup.kendoWindow({
      width: "600px",
      title: "Edit channel",
      resizable: false,
      modal: true,
      visible: false
    }).data("kendoWindow").center();

    $('.editChannelInfo').on('click', function(e) {
        e.stopPropagation();

        var check_static = $(".discussion-left-list-item-discussion.active").data('static')
        if (check_static) {
            $("#id_edit_name").prop('readonly', true)
        } else {
            $("#id_edit_name").prop('readonly', false)
        }

        edit_channel_popup.data("kendoWindow").open();


        var array_list_members = [];
        $('#id_edit_member_ids')[0].selectize.setValue("0")
        $.ajax({
            url: api_discussion_get + "members?feed_name=" + feed_name,
            type: 'GET',
            success: function (resp) {
                for (item in resp.items) {
                    array_list_members.push(resp.items[item].id)
                }
                $('#id_edit_member_ids')[0].selectize.setValue(array_list_members)
            },
            error: function (resp) {
               show_alert(FAIL, 'Something was wrong !');
            }
        });

    })
    $("body").on('submit', ".edit-channel-form", function(event) {
      event.preventDefault();
      var $this = $(this),
          action = $this.attr('action'),
          $button = $this.find('button'),
          formData = new FormData($this[0]);

        $.ajax({
            url: action,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function () {
                $button.prop('disabled', true)
            },
            success: function (resp) {
                $button.prop('disabled', false)

                edit_channel_popup.data("kendoWindow").close();
            },
            error: function (resp) {
                $button.prop('disabled', false);
               show_alert(FAIL, 'Something was wrong !');
            }
        });
        return false;
    })


    var edit_message_popup = $("#window-edit-message");
    edit_message_popup.kendoWindow({
      width: "600px",
      title: "Edit message",
      resizable: false,
      modal: true,
      visible: false
    }).data("kendoWindow").center();



    var action_edit_message_edit = null;
    $("body").on('click', ".action_edit_message", function () {
        var $this = $(this),
            id_object = $this.data('id');

        var check_message = $this.closest('.preview-activity-general')
        if (check_message.length) {
            $("#id_edit_message").val(check_message.find('.message_discussion > p').html().replace(/<br\s*[\/]?>/gi, ""))
        } else {
            $("#id_edit_message").val($this.closest('.preview-activity-reply').find('.message_discussion > p').html().replace(/<br\s*[\/]?>/gi, ""))
        }
        action_edit_message_edit = id_object;

        edit_message_popup.data("kendoWindow").open();
    });


    $("body").on('submit', ".edit-message-form", function(event) {
      event.preventDefault();
      var $this = $(this),
          action = "/" + account_url + "/discussions/edit/" + action_edit_message_edit,
          $button = $this.find('button'),
          formData = new FormData($this[0]);

        $.ajax({
            url: action,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function () {
                $button.prop('disabled', true)
            },
            success: function (resp) {
                $button.prop('disabled', false)

                edit_message_popup.data("kendoWindow").close();
            },
            error: function (resp) {
                $button.prop('disabled', false)
            }
        });
        return false;
    })



    var attach_files_popup = $("#window-attach-files");
    var form_upload = null;
    var file_ids = null;
    $("#discussion-page").on('click', ".upload_images_for_message", function(event) {
        attach_files_popup.data("kendoWindow").open();
        form_upload = $(this).closest('form');
        file_ids = null;
        form_upload.find(".count_upload").html('');
    });
    attach_files_popup.find('.back').on('click', function() {
       attach_files_popup.data("kendoWindow").close();
       file_ids = null;
       if (form_upload) {
         form_upload.find(".count_upload").html('');
       }
       $(".create-document-form")[0].reset()
    })

    attach_files_popup.kendoWindow({
      width: "600px",
      title: "Attach files",
      resizable: false,
      modal: true,
      visible: false
    }).data("kendoWindow").center();

    $("#id_file").kendoUpload({
        localization: {
            "select": "Select file from your computer...",
            "dropFilesHere": "or drag & drop here to attach"
        },
        multiple: true,
        async: {
            saveUrl: "/documents/create/",
            autoUpload: true
        },
        success: function(e) {
            var uploaded = $("#id_uploaded_file");
            var value = uploaded.val();
            if (value) value += ',';
            uploaded.val(value + e.response.pk);
            file_ids = value + e.response.pk;
            form_upload.find(".count_upload").html((form_upload.find(".count_upload").html()?parseInt(form_upload.find(".count_upload").html()):0) + 1)
        },
        upload: function(e) {
          var item_temp = $('#id_file');
          e.data = {'csrfmiddlewaretoken': csrftoken, 'type': item_temp.attr('name')};
        }
    });

    $("body").on('click', ".load_reply_more_button", function(event) {
        var $this = $(this),
         load_id = $(this).data('id');
        $.ajax({
            url: api_discussion_get + "?feed_name=" + feed_name + "&to_id=" + load_id,
            type: 'GET',
            beforeSend: function(){
                $this.parent().parent().empty();
            },
            success: function (resp) {
              if (resp.items.length) {
                  for (var item_id in resp.items.reverse()) {
                      add_reply(resp.items[item_id]);
                  }
              }
            },
            error: function (resp) {
               show_alert(FAIL, 'Something was wrong !');
            }
        });
    })



    getstream_client = stream.connect(getstream_key, null, getstream_app_id);

    if (typeof feed_name != 'undefined') {

        _.each(all_members, function(member, member_id){
            data_mention_discussion.push({id:member_id, name:member.full_name, 'avatar':member.avatar_url, 'type':'contact'})
        })

        setMentionInput($('textarea.feed-mention'))

        load_discussion(feed_name);
    }

    if (feed_channels_token) {
      channels_feed = getstream_client.feed('timeline', account_id + '_channels_events', feed_channels_token);
      channel_subscribe = channels_feed.subscribe(callbackChannels);
      channel_subscribe.then(successCallback, failCallback);
    }
});

function callbackChannels(data) {
    if (typeof data['new'][0] != 'undefined') {
        if (data['new'][0]['verb'] == 'edit') {
            $(".discussion-left-list-item-discussion[data-name=" + data['new'][0]['actor'] + "] .discussion-left-list-item-discussion-name").html(data['new'][0]['message']['name'])
            if ($(".discussion-left-list-item-discussion.active").data('name') == data['new'][0]['actor']) {
                $('#discussion-main .holder h2').html(data['new'][0]['message']['name'])
                $(".discussion-main-info-section-inner-details").html(data['new'][0]['message']['details'])

                if (data['new'][0]['member_ids'].indexOf(parseInt(current_member_id)) === (-1) && !data['new'][0]['message']['auto']) {
                    $(".discussion-left-list-item-discussion:first").click();
                }
            }

            if (data['new'][0]['member_ids'].indexOf(parseInt(current_member_id)) === (-1) && !data['new'][0]['message']['auto']) {
                $(".discussion-left-list-item-discussion[data-name=" + data['new'][0]['actor'] + "]").remove();
            }
        } else if (data['new'][0]['verb'] == 'delete') {
            if ($(".discussion-left-list-item-discussion.active").data('name') == data['new'][0]['actor']) {
                $(".discussion-left-list-item-discussion:first").click();
            }
            $(".discussion-left-list-item-discussion[data-name=" + data['new'][0]['actor'] + "]").remove();
        }
    }

    return true;
}

function load_discussion (feed_name) {
    $.ajax({
        url: api_discussion_get + "?feed_name=" + feed_name,
        type: 'GET',
        beforeSend: function () {
            $(".discussion-box-window").empty()
        },
        success: function (resp) {
          $("#feed_name").val(feed_name)

          if (resp.items.length) {
              for (var item_id in resp.items.reverse()) {
                  add_message(resp.items[item_id]);
              }
          }
          $(".discussion-main-info-section-inner-details").html(resp.discussion_details)

          if (resp.auto) {
            $("#id_edit_member_ids").prop('disabled', true);
            $("#id_edit_member_ids").closest('li').hide();
          } else {
            $("#id_edit_member_ids").prop('disabled', false);
            $("#id_edit_member_ids").closest('li').show();
          }

          if (resp.creator_id == current_member_id || (resp.auto && current_member_is_admin)) {
            $(".editChannelInfo").show();
          } else {
            $(".editChannelInfo").hide();
          }

          $("#id_edit_name").val($('.discussion-left-list-item-discussion[data-name=' + feed_name + ']').data('title'))
          $("#id_edit_details").val(resp.discussion_details)
          $("#window-edit-channel form").attr('action', resp.url_edit_channel)

          if (user_subscribe) {
            user_subscribe.cancel();
          }
          user_feed = getstream_client.feed('user', feed_name, resp.token);
          user_subscribe = user_feed.subscribe(callback);
          user_subscribe.then(successCallback, failCallback);
        },
        error: function (resp) {
           show_alert(FAIL, 'Something was wrong !');
        }
    });
}

function setMentionInput($input) {
  $input.mentionsInput({
    onDataRequest:function (mode, query, callback) {

      data_mention_show = _.filter(data_mention_discussion, function(item) { return item.name.toLowerCase().indexOf(query.toLowerCase()) > -1 });
      callback.call(this, data_mention_show);
    },
    elastic: false
  });
}

function callback(data) {
    if (typeof data['new'][0] != 'undefined') {
    console.log("data['new'][0]", data['new'][0])
      if (data['new'][0].foreign_id) {
        add_reply({data:data['new'][0]});
      } else {
        add_message({data:data['new'][0]});
      }
    }

    if (typeof data['deleted'][0] != 'undefined') {
        delete_message(data['deleted'][0]);
    }
    return true;
}

function successCallback() {
    console.log('now listening to changes in realtime');
}

function failCallback(data) {
    console.log(data, 'something went wrong, check the console logs');
}

function add_message(item) {
  if ($(".preview-activity[data-object=" + item.data.object + "]").length) {
    $(".preview-activity[data-object=" + item.data.object + "]").find('.preview-activity-general .message_discussion p').html(item.data.message);
    $(".preview-activity[data-object=" + item.data.object + "]").attr('data-activity_id', item.data.id);
    return true;
  }
  var fullname_member_from_list = all_members[item.data.actor].full_name,
   avatar_member_from_list = all_members[item.data.actor].avatar_url,
   action_url = $("#discussion-form").attr('action'),
   csrfmiddlewaretoken_val = $("#discussion-form").children('input').val(),
   file_html = '';

   if (item.data.file_ids) {
       for (var file_id in item.data.file_ids){
        file_html += "<a href='/documents/download/" + file_id + "/?view=1' target='_blank' class='file_attach-message'><i class='fa fa-file'></i> " + item.data.file_ids[file_id] + "</a> <br>"
       }
   }

   var new_message = $('<article class="preview-activity" data-activity_id="' + item.data.id + '" data-object="' + item.data.object + '">' +
    '<div class="preview-activity-general">' +
        '<a class="photo" href="/profile/' + item.data.actor + '/" target="_blank">' +
            '<div title="' + fullname_member_from_list + '" style="' +
            '    background-image: url(' + avatar_member_from_list + ');' +
            '" class="photo_member_feed"></div>' +
        '</a>' +
        '<div class="preview-activity-inner">' +
          '<div class="preview-activity-inner-head">' +
            '<a href="/profile/' + item.data.actor + '/" target="_blank" class="name">' + (current_member_id == item.data.actor?current_member_fullname: fullname_member_from_list) + '</a><br/>' +
            '<time>' + moment(item.data.time).format('MMM DD, YYYY h:mm a') + '</time>' +
            (current_member_id == item.data.actor ?'<i class="fa fa-angle-down"></i>' +
            '<div class="preview-activity-inner-actions"><ul><li class="action_edit_message" data-id="' + item.data.object + '">Edit message</li><li class="action_delete_message" data-id="' + item.data.object + '">Delete this message</li></ul></div>':'') +
          '</div>' +
        '</div>' +
        '<div class="message_discussion"><p>' + parseMention(urlify(item.data.message.replace(/\n/g,"<br>"))) + '</p></div>' +
        file_html +
    '</div>' +
    '<div class="preview-activity-replay-box">' +
        '<div class="preview-activity-replay-list" id="tweet_' + item.data.object + '">'+
          (item.count_reply ? '<div class="load_reply_more"><button type="button" class="btn btn-edit load_reply_more_button" data-id="' + item.data.object + '">Load ' + item.count_reply + ' reply</button></div>' : '') +
        '</div>' +
        '<div class="preview-activity-replay-form">' +
            '<a class="photo" href="/profile/' + item.data.actor + '/" target="_blank">' +
                '<div title="' + all_members[current_member_id].full_name + '" style="' +
                '    background-image: url(' + all_members[current_member_id].avatar_url + ');' +
                '" class="photo_member_feed_form_reply"></div>' +
            '</a>' +
          '<form action="' + action_url + '" class="replay-form">'+
            '<input type="hidden" name="csrfmiddlewaretoken" value="' + csrfmiddlewaretoken_val + '">' +
            '<div class="fields" style="position: relative;">'+
              '<input type="hidden" name="to" value="' + item.data.object + '"/>' +
              '<input type="hidden" name="feed_name" id="feed_name" value="' + feed_name + '">' +
              '<div><textarea class="txt default k-textbox feed-mention" placeholder=" add a comment" name="message"></textarea></div>' +
              '<div class="btns">'+
                  '<button type="submit" class="btn btn-edit">Share</button>' +
                  '<div class="upload_images_for_message"><span class="count_upload"></span> <i class="fa fa-paperclip" aria-hidden="true"></i> Attach a file</div>' +
              '</div>' +
            '</div>' +
          '</form>'+
        '</div>' +
    '</div>' +
  '</article>');

   if ($(".discussion-box-window > .preview-activity:first").length) {
      new_message.insertBefore(".discussion-box-window > .preview-activity:first");
   } else {
      $(".discussion-box-window").append(new_message);
   }

   setMentionInput($(".discussion-box-window .preview-activity:first .feed-mention"))


    $(".discussion-box-window").scrollTop($(".discussion-box-window")[0].scrollHeight);
}

function add_reply(item) {
  if ($(".preview-activity-reply[data-object=" + item.data.object + "]").length) {
    $(".preview-activity-reply[data-object=" + item.data.object + "]").find('.message_discussion p').html(item.data.message);
    $(".preview-activity-reply[data-object=" + item.data.object + "]").attr('data-activity_id', item.data.id);
    return true;
  }
  var fullname_member_from_list = all_members[item.data.actor].full_name,
   avatar_member_from_list = all_members[item.data.actor].avatar_url,
   obj_id = item.data.foreign_id.replace(':',"_"),
   obj_check = $("#" + obj_id),
   file_html = '';

   if (item.data.file_ids) {
       for (var file_id in item.data.file_ids){
        file_html += "<a href='/documents/download/" + file_id + "/?view=1' target='_blank' class='file_attach-message'><i class='fa fa-file'></i> " + item.data.file_ids[file_id] + "</a> <br>"
       }
   }
   if (obj_check.length) {
       new_message = $('<article class="preview-activity-reply" data-activity_id="' + item.data.id + '" data-object="' + item.data.object + '">' +
        '<a class="photo" href="/profile/' + item.data.actor + '/" target="_blank">' +
            '<div title="' + fullname_member_from_list + '" style="' +
            '    background-image: url(' + avatar_member_from_list + ');' +
            '" class="photo_member_feed_reply"></div>' +
        '</a>' +
        '<div class="preview-activity-inner">' +
          '<div class="preview-activity-inner-head">' +
            '<a href="#" class="name">' + (current_member_id == item.data.actor?current_member_fullname: fullname_member_from_list) + '</a><br/>' +
            '<time>' + moment(item.data.time).format('MMM DD, YYYY h:mm a') + '</time>' +
            (current_member_id == item.data.actor?'<i class="fa fa-angle-down"></i>' +
            '<div class="preview-activity-inner-actions"><ul><li class="action_edit_message" data-id="' + item.data.object + '">Edit message</li><li class="action_delete_message" data-id="' + item.data.object + '">Delete this message</li></ul></div>':'') +
          '</div>' +
          '<div class="message_discussion"><p>' + parseMention(urlify(item.data.message.replace(/\n/g,"<br>"))) + '</p></div>' +
          file_html +
        '</div>' +
      '</article>');

      obj_check.append(new_message);
   }
}

function delete_message(item) {
    $(".preview-activity[data-activity_id=" + item + "], .preview-activity-reply[data-activity_id=" + item + "]").remove()
}

function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return '<a href="' + url + '" target="_blank">' + url + '</a>';
    })
}

function parseMention(text) {
    text = text.replace(/@\[([^\]]+)\]\(contact:(\d+)\)/ig, function(str, username, id, offset, s) {
        return '<a href="/profile/' + id + '/" target="_blank">@' + username + '</a>';
    });

    return text
}