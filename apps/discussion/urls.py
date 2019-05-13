# -*- coding: utf-8 -*-
from django.conf.urls import url
from .views import DiscussionListView, DiscussionMessagesView, DiscussionFilesView, DiscussionOrganizationView, \
    DiscussionChannelView, DiscussionMembersView, DiscussionMessageRemoveView, DiscussionEditChannelView, \
    DiscussionMessagesEditView, DiscussionDeleteChannelView, DiscussionChannelSearchView

app_name = 'discussion'

urlpatterns = [
    url(r'^get/$', DiscussionMessagesView.as_view(), name='get'),
    url(r'^edit/(?P<pk>\d+)$', DiscussionMessagesEditView.as_view(), name='edit'),
    url(r'^delete/(?P<pk>\d+)$', DiscussionMessageRemoveView.as_view(), name='delete'),
    url(r'^get/files$', DiscussionFilesView.as_view(), name='get_files'),
    url(r'^get/members$', DiscussionMembersView.as_view(), name='get_members'),
    url(r'^add/$', DiscussionListView.as_view(), name='add'),
    url(r'^get/search$', DiscussionChannelSearchView.as_view(), name='search_channel'),
    url(r'^add/channel$', DiscussionChannelView.as_view(), name='add_channel'),
    url(r'^edit/channel/(?P<pk>\d+)$', DiscussionEditChannelView.as_view(), name='edit_channel'),
    url(r'^edit/delete/(?P<pk>\d+)$', DiscussionDeleteChannelView.as_view(), name='delete_channel'),
    url(r'^organization/$', DiscussionOrganizationView.as_view(), name='organization'),
    url(r'^$', DiscussionOrganizationView.as_view(), name='list')
]
