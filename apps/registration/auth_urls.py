# -*- coding: utf-8 -*-
"""
URL patterns for the views included in ``django.contrib.auth``.

Including these URLs (via the ``include()`` directive) will set up the
following patterns based at whatever URL prefix they are included
under:

* User login at ``login/``.

* User logout at ``logout/``.

* The two-step password change at ``password/change/`` and
  ``password/change/done/``.

* The four-step password reset at ``password/reset/``,
  ``password/reset/confirm/``, ``password/reset/complete/`` and
  ``password/reset/done/``.

The default registration backend already has an ``include()`` for
these URLs, so under the default setup it is not necessary to manually
include these views. Other backends may or may not include them;
consult a specific backend's documentation for details.

"""

# from django.conf.urls import patterns
from django.conf.urls import url, include

from django.contrib.auth import views as auth_views

from profiles.views import LoginView
from registration.forms import ResetPasswordForm
from registration.views import ChangeMembersPassword, SwitchGuestView
from two_factor.urls import urlpatterns as two_factor_urls
import two_factor.views
from two_factor.gateways.twilio.urls import urlpatterns as two_factor_twilio_urls
from django.views.generic.base import RedirectView


class Frame2FALoginView(two_factor.views.LoginView):
    def get(self, *args, **kwargs):
        self.template_name = 'two_factor/core/login_frame.html'  # ¡(X_X)¡
        return super(Frame2FALoginView, self).get(*args, **kwargs)


urlpatterns = [

    # old login form (TODO: disable later after 2FA tested in production)
    url(r'^login.fallbak/$',
        LoginView.as_view(),
        {'template_name': 'registration/login.html'},
        name='auth_login_fallback'),

    # django-two-factor-auth
    url(r'^login/', include(two_factor_urls)),
    url(r'^login-frame/', Frame2FALoginView.as_view()),
    url(r'^login/', include(two_factor_twilio_urls)),
    url(r'^login/', RedirectView.as_view(url='/login/account/login/'), name='auth_login'),

    url(r'^logout/$',
        auth_views.logout,
        {'template_name': 'registration/logout.html'},
        name='auth_logout'),

    url(r'^password/change/$',
        auth_views.password_change,
        {'template_name': 'registration/password_changeform.html'},
        name='auth_password_change'),
    url(r'^password/change/done/$',
        auth_views.password_change_done,
        {'template_name': 'registration/password_changedone.html'},
        name='password_change_done'),
    url(r'^password/reset/$',
        auth_views.password_reset,
        {'template_name': 'registration/password_form.html',
         'password_reset_form': ResetPasswordForm},
        name='auth_password_reset'),
    url(r'^password/reset/confirm/(?P<uidb64>[0-9A-Za-z]+)-(?P<token>.+)/$',
        auth_views.password_reset_confirm,
        {
           'template_name': 'registration/password_reset_conf.html',
           'post_reset_redirect': '/password/reset/complete/',
        },
        name='auth_password_reset_confirm'),
    url(r'^password/reset/complete/$',
        auth_views.password_reset_complete,
        {'template_name': 'registration/password_reset_compl.html'},
        name='auth_password_reset_complete'),
    url(r'^password/reset/done/$',
        auth_views.password_reset_done,
        {'template_name': 'registration/password_resetdone.html'},
        name='password_reset_done'),
    url(r'^members/password/change/(?P<pk>\d+)/$',
        ChangeMembersPassword.as_view(),
        name='auth_members_password_change'),
    url(r'^members/switch_guest/(?P<pk>\d+)/$',
        SwitchGuestView.as_view(),
        name='members_switch_guest'),

    url(r'^login-frame.fallback/$',
        LoginView.as_view(),
        {'template_name': 'registration/login_frame.html'},
        name='auth_login_frame'),
    url(r'^logout-frame/$',
        auth_views.logout,
        {'template_name': 'registration/logout.html'},
        name='auth_logout_frame'),
    url(r'^password-frame/reset/$',
        auth_views.password_reset,
        {'template_name': 'registration/password_form.html',
         'password_reset_form': ResetPasswordForm},
        name='auth_password_reset_frame'),
    url(r'^password-frame/reset/complete/$',
        auth_views.password_reset_complete,
        {'template_name': 'registration/password_reset_compl.html'},
        name='password_reset_complete_frame'),
    url(r'^password-frame/reset/done/$',
        auth_views.password_reset_done,
        {'template_name': 'registration/password_resetdone.html'},
        name='password_reset_done_frame'),

    # url(r'^password/reset/confirm/(?P<uidb36>[0-9A-Za-z]+)-(?P<token>.+)/$',
    #     auth_views.password_reset_confirm,
    #     {'template_name': 'registration/password_reset_conf.html'},
    #     name='auth_password_reset_confirm'),
]
