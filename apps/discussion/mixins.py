# -*- coding: utf-8 -*-
from accounts.account_helper import get_current_account
from django.http import JsonResponse
from stream_django.feed_manager import feed_manager
from profiles.models import Membership


class FormValidMessege(object):
    def form_invalid(self, form):
        response = super(FormValidMessege, self).form_invalid(form)
        if self.request.is_ajax():
            return JsonResponse(form.errors, status=400)
        else:
            return response

    def form_valid(self, form):
        print 111
        account = get_current_account(self.request)
        self.object = form.save(commit=False)
        self.object.actor = 'test'
        self.object.verb = 'tweet'
        if self.object.feed_name.find("{}_".format(account.id)) != 0:
            self.object.feed_name = "{}_{}".format(account.id, self.object.feed_name)
        self.object.member_send = self.request.user.get_membership(account)
        self.object.save()
        print 222
        response = super(FormValidMessege, self).form_valid(form)
        if self.request.is_ajax():
            data = {
                'pk': self.object.pk,
            }
            return JsonResponse(data)
        else:
            return response


class FormValidMessegeEdit(object):
    def form_invalid(self, form):
        print 111
        response = super(FormValidMessegeEdit, self).form_invalid(form)
        if self.request.is_ajax():
            return JsonResponse(form.errors, status=400)
        else:
            return response

    def form_valid(self, form):
        print 222
        self.object = form.save(commit=False)

        response = super(FormValidMessegeEdit, self).form_valid(form)
        if self.request.is_ajax():
            data = {
                'pk': self.object.pk,
            }
            return JsonResponse(data)
        else:
            return response


class FormValidDiscussion(object):
    def form_invalid(self, form):
        response = super(FormValidDiscussion, self).form_invalid(form)
        if self.request.is_ajax():
            return JsonResponse(form.errors, status=400)
        else:
            return response

    def form_valid(self, form):
        account = get_current_account(self.request)
        member = self.request.user.get_membership(account)

        if member not in form.cleaned_data.get('member_ids'):
            list_members = list(form.cleaned_data.get('member_ids'))
            list_members.append(member)
            form.cleaned_data['member_ids'] = list_members

        self.object = form.save(commit=False)

        self.object.creator = member
        self.object.account = account
        self.object.auto = False

        self.object.slug = "{}_{}_channel".format(account.id, 'private' if self.object.private else 'public')

        self.object.save()
        response = super(FormValidDiscussion, self).form_valid(form)
        if self.request.is_ajax():
            data = {
                'pk': self.object.pk,
                'feed_name': self.object.slug,
            }
            return JsonResponse(data)
        else:
            return response


class FormValidDiscussionEdit(object):
    def form_invalid(self, form):
        response = super(FormValidDiscussionEdit, self).form_invalid(form)
        if self.request.is_ajax():
            return JsonResponse(form.errors, status=400)
        else:
            return response

    def form_valid(self, form):
        self.object = form.save(commit=False)

        if not self.object.auto:
            self.object.member_ids.remove(*self.object.member_ids.exclude(pk__in=form.cleaned_data.get('member_ids')))
            self.object.member_ids.add(*Membership.objects.filter(pk__in=form.cleaned_data.get('member_ids')))

        response = super(FormValidDiscussionEdit, self).form_valid(form)
        if self.request.is_ajax():
            data = {
                'pk': self.object.pk,
                'feed_name': self.object.slug,
            }
            return JsonResponse(data)
        else:
            return response
