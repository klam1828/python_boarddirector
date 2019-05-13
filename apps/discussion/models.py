# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import datetime
import json
from django.db import models
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _
from django.db.models.signals import post_save, post_delete
from django.contrib.postgres.fields import ArrayField
from django.dispatch import receiver
from stream_django.feed_manager import feed_manager
from profiles.models import Membership
from news.models import News
from accounts.models import Account
from documents.models import Document
from permissions import PERMISSIONS
from permissions.models import ObjectPermission
from permissions.utils import get_contenttype
import logging

logger = logging.getLogger(__name__)


# Create your models here.

class Discussions(models.Model):
    slug = models.CharField(_('slug'), max_length=255)
    name = models.CharField(verbose_name=_('name'), max_length=255, null=True)
    details = models.TextField(verbose_name=_('details'), null=True)
    created_at = models.DateTimeField(_('date created'), auto_now_add=True)
    account = models.ForeignKey(Account, verbose_name=_('account'))
    creator = models.ForeignKey(Membership, verbose_name=_('creator'), null=True, related_name='creator_id_member')
    private = models.BooleanField(default=False, help_text='Private channel', verbose_name='private')
    auto = models.BooleanField(default=True, help_text='Auto channel', verbose_name='auto')
    member_ids = models.ManyToManyField('profiles.Membership', verbose_name=_('member_ids'),
                                        related_name='member_ids_in_channel')

    class Meta:
        ordering = ('-created_at',)

    def __unicode__(self):
        return self.slug

    def get_absolute_url(self):
        return False

    def get_url(self):
        return reverse('discussion:delete_channel', kwargs={'pk': self.pk, 'url': self.account.url})


class ListRequestsChannels(models.Model):
    discussion = models.IntegerField(_('discussion id history'))
    created_at = models.DateTimeField(_('date created'), auto_now_add=True)
    getstream_info = models.TextField(_('getstream info'), null=True)

    class Meta:
        ordering = ('-created_at',)


class Messages(models.Model):
    actor = models.CharField(_('actor'), max_length=255)
    verb = models.CharField(_('verb'), max_length=255)
    feed_name = models.CharField(_('feed name'), max_length=255, default='')
    message = models.TextField(_('message'))
    created_at = models.DateTimeField(_('date created'), auto_now_add=True)
    discussions = models.ForeignKey(Discussions, verbose_name=_('Discussions id'), null=True, on_delete=models.SET_NULL)
    member_send = models.ForeignKey(Membership, verbose_name=_('member send'), related_name='member_send')
    member_receive = models.ForeignKey(Membership, verbose_name=_('member receive'), related_name='member_receive',
                                       null=True)
    activity_id = models.CharField(_('activity'), max_length=255, null=True)
    to = models.CharField(_('to_activity'), max_length=255, null=True)
    getstream_info = models.TextField(_('getstream info'), null=True)
    file_ids = ArrayField(
        models.IntegerField(blank=True), null=True
    )

    class Meta:
        ordering = ('-created_at',)

    def __unicode__(self):
        return self.message

    def get_absolute_url(self):
        return False

    def get_count_reply(self):
        return Messages.objects.filter(to=self.id).count()

    def get_files(self):
        return Document.objects.filter(pk__in=self.file_ids)


@receiver(post_save, sender=Messages)
def create_messege_profile(sender, instance, created, **kwargs):
    if hasattr(instance, '_dirty'):
        return

    if created:
        feed = feed_manager.get_feed('user', instance.feed_name)

        data_files = {}
        for file_id in instance.get_files():
            data_files[file_id.id] = file_id.name

        if instance.to:
            instance.verb = 'reply'
            t = feed.add_activity(
                {'actor': instance.member_send.id, 'verb': 'reply', 'object': instance.id, 'message': instance.message,
                 'foreign_id': 'tweet:{}'.format(instance.to), 'file_ids': data_files})
        else:
            instance.verb = 'tweet'
            t = feed.add_activity(
                {'actor': instance.member_send.id, 'verb': 'tweet', 'object': instance.id, 'message': instance.message,
                 'file_ids': data_files})
        # t = feed.add_activity(
        #     {'actor': instance.member_send.id, 'verb': 'tweet', 'object': instance.id, 'message': instance.message})
        instance.getstream_info = json.dumps(t, default=myconverter)
        instance.activity_id = t['id']

        for perm in (PERMISSIONS.view, PERMISSIONS.add, PERMISSIONS.edit, PERMISSIONS.delete):
            ObjectPermission.objects.create(
                membership=instance.member_send,
                content_type=get_contenttype(instance),
                object_id=instance.id,
                permission=perm,
            )

        discussion = Discussions.objects.get(slug=instance.feed_name)
        try:
            if discussion:
                instance.discussions = discussion
            instance._dirty = True
            instance.save()
        finally:
            if hasattr(instance, '_dirty'):
                del instance._dirty
    else:
        feed = feed_manager.get_feed('user', instance.feed_name)
        json_getstream = json.loads(instance.getstream_info)
        old_foreign_id = json_getstream['foreign_id']

        if json_getstream['message'] == instance.message:
            return

        # json_getstream['foreign_id'] = 'tweet:{}'.format(instance.id)
        print 'instance.created_at', instance.created_at
        json_getstream["time"] = instance.created_at
        json_getstream["message"] = instance.message

        t = feed.add_activity(json_getstream)

        # json_getstream['foreign_id'] = old_foreign_id
        print 'json_getstream', json_getstream
        Messages.objects.filter(pk=instance.pk).update(getstream_info=json.dumps(t, default=myconverter),
                                                       activity_id=t['id'])


@receiver(post_delete, sender=Messages)
def delete_messege_profile(sender, instance, **kwargs):
    feed = feed_manager.get_feed('user', instance.feed_name)
    feed.remove_activity(instance.activity_id)


@receiver(post_save, sender=Discussions)
def create_discussions(sender, instance, created, **kwargs):
    if created:
        if instance.auto == False:
            instance.slug = "{}_{}".format(instance.slug, instance.id)
        instance.save()
    else:
        request = ListRequestsChannels.objects.create(discussion=instance.id)

        member_ids_data = []
        for member in instance.member_ids.all():
            member_ids_data.append(member.id)

        feed = feed_manager.get_feed('timeline', '{}_channels_events'.format(instance.account.id))
        t = feed.add_activity(
            {'actor': instance.slug, 'verb': 'edit', 'object': request.id,
             'message': instance.__dict__, 'member_ids': member_ids_data})

        request.getstream_info = json.dumps(t, default=myconverter)
        request.save()


@receiver(post_delete, sender=Discussions)
def delete_discussions(sender, instance, **kwargs):
    request = ListRequestsChannels.objects.create(discussion=instance.id)
    feed = feed_manager.get_feed('timeline', '{}_channels_events'.format(instance.account.id))
    t = feed.add_activity(
        {'actor': instance.slug, 'verb': 'delete', 'object': request.id,
         'message': instance.__dict__, 'member_ids': []})

    request.getstream_info = json.dumps(t, default=myconverter)
    request.save()


def myconverter(o):
    if isinstance(o, datetime.datetime):
        return o.__str__()
