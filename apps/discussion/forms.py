# -*- coding: utf-8 -*-
from django import forms
from django.utils.translation import ugettext_lazy as _

from discussion.models import Messages, Discussions
from profiles.models import Membership


class MessageForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        # first call parent's constructor
        super(MessageForm, self).__init__(*args, **kwargs)
        # there's a `fields` property now
        self.fields['to'].required = False
        self.fields['file_ids'].required = False

    class Meta:
        model = Messages
        fields = ('message', 'to', 'feed_name', 'file_ids')


class MessageEditForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        # first call parent's constructor
        super(MessageEditForm, self).__init__(*args, **kwargs)

        self.fields['message'] = forms.CharField(
            widget=forms.Textarea(attrs={'class': 'txt', 'style': 'width: 100%;', 'id': 'id_edit_message'}))

    class Meta:
        model = Messages
        fields = ('message',)


class ChannelForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        # first call parent's constructor
        super(ChannelForm, self).__init__(*args, **kwargs)
        # there's a `fields` property now

        account = args[0]['account'] if args else self.initial.get('account')

        account_users = Membership.objects.filter(account=account, is_active=True).exclude(
            role=Membership.ROLES.assistant)
        self.fields['member_ids'] = forms.ModelMultipleChoiceField(queryset=account_users,
                                                                   widget=forms.SelectMultiple(
                                                                       attrs={'class': 'multiple selectize'}),
                                                                   # initial=initial,
                                                                   required=True,
                                                                   label=_('Add Members'))
        self.fields['name'] = forms.CharField(
            widget=forms.TextInput(attrs={'placeholder': 'Name discussion', 'class': 'txt'}), max_length=250,
            required=True)
        self.fields['private'] = forms.BooleanField(widget=forms.HiddenInput(), required=False)
        self.fields['details'] = forms.CharField(widget=forms.Textarea(attrs={'class': 'txt', 'style': 'width: 100%;'}))

    class Meta:
        model = Discussions
        fields = ('name', 'member_ids', 'private', 'details')


class EditChannelForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        # first call parent's constructor
        super(EditChannelForm, self).__init__(*args, **kwargs)
        # there's a `fields` property now

        self.fields['name'] = forms.CharField(
            widget=forms.TextInput(attrs={'placeholder': 'Name discussion', 'class': 'txt', 'id': 'id_edit_name'}),
            max_length=250,
            required=True)

        account = args[0]['account'] if args else self.initial.get('account')
        account_users = Membership.objects.filter(account=account, is_active=True).exclude(
            role=Membership.ROLES.assistant)
        self.fields['member_ids'] = forms.ModelMultipleChoiceField(
            queryset=account_users,
            widget=forms.SelectMultiple(
                attrs={
                    'class': 'multiple selectize',
                    'id': 'id_edit_member_ids'
                }),
            # initial=initial,
            required=False,
            label=_('Add Members')
        )

        self.fields['details'] = forms.CharField(
            widget=forms.Textarea(attrs={'class': 'txt', 'style': 'width: 100%;', 'id': 'id_edit_details'}))

    class Meta:
        model = Discussions
        fields = ('name', 'details', 'member_ids')
