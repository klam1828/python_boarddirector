# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-06-06 19:47
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
#        ('accounts', '0003_auto_20170518_0822'),
        ('meetings', '0002_meeting_next_repetition'),
    ]

    operations = [
        migrations.CreateModel(
            name='CalendarConnection',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('provider', models.CharField(choices=[(b'office', b'Office 365'), (b'google', b'Google'), (b'ical', b'iCloud')], max_length=20)),
                ('email', models.CharField(max_length=255, verbose_name='email')),
                ('access_token', models.TextField(blank=True, help_text='"oauth_token" (OAuth1) or access token (OAuth2)', verbose_name='access token')),
                ('refresh_token', models.TextField(blank=True, help_text='"oauth_token_secret" (OAuth1) or refresh token (OAuth2)', verbose_name='refresh token')),
                ('expires_in', models.IntegerField(blank=True, null=True)),
                ('account', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='calendar_connection', to='accounts.Account', verbose_name='account')),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='calendarconnection',
            unique_together=set([('account', 'provider')]),
        ),
    ]
