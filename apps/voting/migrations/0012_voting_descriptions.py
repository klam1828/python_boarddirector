# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-06-26 19:03
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('voting', '0011_merge_20170620_0707'),
    ]

    operations = [
        migrations.AddField(
            model_name='voting',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='votingquestion',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
    ]
