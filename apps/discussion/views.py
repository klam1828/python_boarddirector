# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import datetime
import json
from django.shortcuts import get_object_or_404, redirect, resolve_url
from django.http import HttpResponse
from django.views.generic import CreateView, DetailView, DeleteView, UpdateView
from django.views.generic.edit import View
from stream_django.feed_manager import feed_manager

from documents.forms import DocumentAddForm
from forms import MessageForm, ChannelForm, EditChannelForm, MessageEditForm
from mixins import FormValidMessege, FormValidDiscussion, FormValidDiscussionEdit, FormValidMessegeEdit
from models import Messages, Discussions
from committees.models import Committee
from accounts.account_helper import get_current_account
from accounts.mixins import MembershipQuerysetMixin
from news.views import NewsQuerysetMixin
from committees.views import CommitteeQuerysetMixin
from news.models import News
from profiles.models import Membership
from documents.models import Folder, Document
from common.mixins import SelectBoardRequiredMixin, ActiveTabMixin, CurrentAccountMixin, AjaxableResponseMixin
from django.urls.base import reverse
from permissions import PERMISSIONS
from permissions.mixins import PermissionMixin

from settings.base import STREAM_API_KEY
from settings.base import STREAM_APP_ID


class MessagesQuerysetMixin(object):
    def get_queryset(self):
        account = get_current_account(self.request)
        queryset = Messages.objects.filter(member_send__account=account)
        return queryset

    def get_object(self):
        return self.get_queryset().get(pk=self.kwargs['pk'])


class DiscussionListView(SelectBoardRequiredMixin, MembershipQuerysetMixin, ActiveTabMixin, FormValidMessege,
                         CreateView):
    template_name = 'discussion/discussion_list.html'
    active_tab = 'discussion'
    model = Messages
    form_class = MessageForm

    def get_context_data(self, *args, **kwargs):
        context = super(DiscussionListView, self).get_context_data(*args, **kwargs)
        account = get_current_account(self.request)
        membership = self.request.user.get_membership(account)
        context['active_members'] = self.get_queryset().filter(is_active=True).order_by('last_name')
        context['active_committee'] = Committee.objects.for_membership(membership=membership)
        context['active_news_rooms'] = News.objects.filter(account=account)
        context['getstream_key'] = STREAM_API_KEY
        context['getstream_app_id'] = STREAM_APP_ID
        return context


class DiscussionChannelView(FormValidDiscussion, CreateView, CurrentAccountMixin):
    template_name = 'discussion/discussion_list.html'
    model = Discussions
    form_class = ChannelForm

    def get_initial(self):
        initial = super(DiscussionChannelView, self).get_initial()
        initial['account'] = get_current_account(self.request)
        return initial


class DiscussionEditChannelView(FormValidDiscussionEdit, UpdateView, CurrentAccountMixin, PermissionMixin):
    template_name = 'discussion/discussion_list.html'
    model = Discussions
    form_class = EditChannelForm

    def get_initial(self):
        initial = super(DiscussionEditChannelView, self).get_initial()
        initial['account'] = get_current_account(self.request)
        return initial

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()

        account = get_current_account(request)
        membership = request.user.get_membership(account)

        if self.object.account != account:
            return False
        if not self.object.auto and self.object.creator != membership:
            return False
        if self.object.auto and not membership.is_admin:
            return False

        return super(DiscussionEditChannelView, self).post(request, *args, **kwargs)



class DiscussionDeleteChannelView(AjaxableResponseMixin, DeleteView):
    model = Discussions

    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()

        account = get_current_account(request)
        membership = request.user.get_membership(account)

        if self.object.creator != membership:
            return self.render_to_json_response({'success': False})
        super(DiscussionDeleteChannelView, self).delete(request, *args, **kwargs)
        return self.render_to_json_response({'success': True})

    def get_success_url(self):
        return False


class DiscussionMessagesEditView(FormValidMessegeEdit, UpdateView, CurrentAccountMixin):
    template_name = 'discussion/discussion_list.html'
    model = Messages
    form_class = MessageEditForm


class DiscussionOrganizationView(SelectBoardRequiredMixin, MembershipQuerysetMixin, ActiveTabMixin, DetailView,
                                 CurrentAccountMixin):
    template_name = 'discussion/discussion_organization.html'
    model = Membership
    active_tab = 'discussion'

    def get_context_data(self, *args, **kwargs):
        context = super(DiscussionOrganizationView, self).get_context_data(*args, **kwargs)
        account = get_current_account(self.request)
        membership = self.request.user.get_membership(account)
        discussion_slug = '{}_organization'.format(account.id)
        feed_discussion = Discussions.objects.get(slug=discussion_slug, account=account)

        all_members_objects = Membership.objects.filter(account=account, is_active=True).order_by('last_name')
        all_members = {
            member.id: {'full_name': member.get_full_name(), 'avatar_url': member.avatar_url(
                geometry='50x50') if member.avatar else '/static/images/default_avatar_sq.svg'} for
            member in all_members_objects}
        feed_channels = feed_manager.get_feed('timeline', '{}_channels_events'.format(account.id))

        context['not_auto_feed_discussion_public'] = Discussions.objects.filter(private=False, auto=False,
                                                                                account=account)
        context['not_auto_feed_discussion_private'] = Discussions.objects.filter(private=True, auto=False,
                                                                                 account=account, member_ids=membership)
        context['feed_discussion'] = feed_discussion.slug
        context['folder'] = Folder.objects.get_discussion_folder(account)
        context['folder_add_form'] = DocumentAddForm()
        context['channel_add_form'] = ChannelForm({'account': account})
        context['channel_edit_form'] = EditChannelForm({'account': account})
        context['message_edit_form'] = MessageEditForm()
        context['getstream_key'] = STREAM_API_KEY
        context['getstream_app_id'] = STREAM_APP_ID
        context['active_member'] = self.get_queryset().filter(is_active=True)
        context['all_members_objects'] = all_members_objects
        context['active_news_rooms'] = News.objects.filter(account=account)
        context['active_committee'] = Committee.objects.for_membership(membership=membership)
        context['all_members'] = json.dumps(all_members)
        context['feed_channels_token'] = feed_channels.get_readonly_token()
        return context

    def get_object(self, queryset=None):
        account = get_current_account(self.request)

        discussion_slug = '{}_organization'.format(account.id)
        check_discussion = Discussions.objects.filter(slug=discussion_slug, account=account)
        if not check_discussion:
            new_discussion = Discussions()
            new_discussion.slug = discussion_slug
            new_discussion.account = account
            new_discussion.save()

        return account


class DiscussionMessagesView(View):
    def get(self, request, *args, **kwargs):
        account = get_current_account(self.request)
        feed_name = request.GET['feed_name']

        check_discussion = Discussions.objects.get_or_create(slug=feed_name, account=account)
        if not check_discussion:
            return HttpResponse(json.dumps({'error': 'Not found'}))
        if 'to_id' in request.GET:
            to_id = request.GET['to_id']
            messages = Messages.objects.filter(verb='reply', feed_name=feed_name, to=to_id,
                                               getstream_info__isnull=False)
        else:
            messages = Messages.objects.filter(verb='tweet', feed_name=feed_name, getstream_info__isnull=False)
        feed = feed_manager.get_feed('user', feed_name)
        messages_getstream = [{'data': json.loads(d.getstream_info), 'count_reply': d.get_count_reply()} for d in
                              messages]
        kwargs['content_type'] = 'application/json'

        return HttpResponse(
            json.dumps({
                'token': feed.get_readonly_token(),
                'items': messages_getstream,
                'feed_name': feed_name,
                'creator_id': check_discussion[0].creator_id,
                'auto': check_discussion[0].auto,
                'private': check_discussion[0].private,
                'discussion_details': check_discussion[0].details,
                'url_edit_channel': reverse('discussion:edit_channel',
                                            kwargs={'pk': check_discussion[0].id, 'url': account.url})
            }, default=self.myconverter), kwargs)

    def myconverter(self, o):
        if isinstance(o, datetime.datetime):
            return o.__str__()


class DiscussionChannelSearchView(View):
    def get(self, request, *args, **kwargs):
        account = get_current_account(self.request)
        text_search = request.GET['search']

        search_discussions = Discussions.objects.filter(messages__message__search=text_search, account=account)

        array_discussions = [{'id': d.id, 'feed_name': d.slug} for d in search_discussions]
        kwargs['content_type'] = 'application/json'

        return HttpResponse(json.dumps({'items': array_discussions}), kwargs)


class DiscussionMessageRemoveView(AjaxableResponseMixin, SelectBoardRequiredMixin, MessagesQuerysetMixin,
                                  PermissionMixin, DeleteView):
    permission = (Messages, PERMISSIONS.delete)

    def delete(self, request, *args, **kwargs):
        super(DiscussionMessageRemoveView, self).delete(request, *args, **kwargs)
        return self.render_to_json_response({'success': True})

    def get_success_url(self):
        return False


class DiscussionFilesView(View):
    def get(self, request, *args, **kwargs):
        account = get_current_account(self.request)
        feed_name = request.GET['feed_name']

        check_discussion = Discussions.objects.get(slug=feed_name, account=account)
        if not check_discussion:
            return HttpResponse(json.dumps({'error': 'Not found'}))

        messages = Messages.objects.filter(feed_name=feed_name)
        array_ids = []
        for message in messages:
            if message.file_ids:
                array_ids += message.file_ids

        documents = Document.objects.filter(id__in=array_ids)
        documents_data = [
            {'id': d.id, 'name': d.name, 'url': reverse('documents:download', kwargs={'document_id': d.id})} for d in
            documents]

        kwargs['content_type'] = 'application/json'
        return HttpResponse(json.dumps({'items': documents_data, 'feed_name': feed_name}), kwargs)


class DiscussionMembersView(View):
    def get(self, request, *args, **kwargs):
        account = get_current_account(self.request)
        feed_name = request.GET['feed_name']

        check_discussion = Discussions.objects.get(slug=feed_name, account=account)
        if not check_discussion:
            return HttpResponse(json.dumps({'error': 'Not found'}))

        response_data = []
        if check_discussion.slug.find("{}_committees_".format(account.id)) == 0:
            committee_id = int(check_discussion.slug.replace("{}_committees_".format(account.id), ''))
            committee_find = Committee.objects.get(pk=committee_id)
            response_data = [
                {'id': member.id, 'full_name': member.get_full_name(), 'avatar': member.avatar_url(
                    geometry='140x140') if member.avatar else '/static/images/default_avatar_sq.svg'}
                for member in committee_find.members()]
        elif not check_discussion.private:
            all_members = Membership.objects.filter(account=account, is_active=True).order_by('last_name')
            response_data = [
                {'id': member.id, 'full_name': member.get_full_name(), 'avatar': member.avatar_url(
                    geometry='140x140') if member.avatar else '/static/images/default_avatar_sq.svg'}
                for member in all_members]
        elif check_discussion.private:
            response_data = [
                {'id': member.id, 'full_name': member.get_full_name(), 'avatar': member.avatar_url(
                    geometry='140x140') if member.avatar else '/static/images/default_avatar_sq.svg'}
                for member in check_discussion.member_ids.all()]

        kwargs['content_type'] = 'application/json'
        return HttpResponse(json.dumps({'items': response_data}), kwargs)
