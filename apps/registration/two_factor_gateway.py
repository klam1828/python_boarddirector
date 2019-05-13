# -*- coding: utf-8 -*-

import two_factor.gateways.twilio.gateway
from django.conf import settings
from django.utils.translation import ugettext


class Twilio(two_factor.gateways.twilio.gateway.Twilio):

    """ small extention for Twilio gateway with custom message (settings.TWILIO_MESSAGE_STRING) """

    def __init__(self):
        super(Twilio, self).__init__()
        self.message_template = getattr(settings,
                                        'TWILIO_MESSAGE_STRING',
                                        'Your authentication token is %s')

    def send_sms(self, device, token):
        body = ugettext(self.message_template) % token
        self.client.messages.create(
            to=device.number.as_e164,
            from_=getattr(settings, 'TWILIO_CALLER_ID'),
            body=body)
