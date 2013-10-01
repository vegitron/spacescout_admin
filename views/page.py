from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.template import RequestContext
from django.shortcuts import render_to_response
from django.utils.safestring import SafeString
import simplejson as json


# Create your views here.
@login_required
def home(request):
   return render_to_response('home.html',
                             {
                                  'remote_user': request.user,
                                  'STATIC_URL': settings.STATIC_URL,
                                  'APP_URL_ROOT': settings.APP_URL_ROOT
                              },
                             context_instance=RequestContext(request))

@login_required
def space(request, space_id):
   return render_to_response('space.html',
                             {
                                  'remote_user': request.user,
                                  'SPACE_ID': space_id,
                                  'STATIC_URL': settings.STATIC_URL,
                                  'APP_URL_ROOT': settings.APP_URL_ROOT
                             },
                             context_instance=RequestContext(request))

@login_required
def edit(request, space_id):
   return render_to_response('edit.html',
                             {
                                  'remote_user': request.user,
                                  'SPACE_ID': space_id,
                                  'IS_MOBILE': request.MOBILE,
                                  'STATIC_URL': settings.STATIC_URL,
                                  'APP_URL_ROOT': settings.APP_URL_ROOT
                             },
                             context_instance=RequestContext(request))

@login_required
def add(request):
   return render_to_response('add.html',
                             {
                                  'remote_user': request.user,
                                  'SPACE_FIELDS': SafeString(json.dumps(settings.SS_SPACE_CREATION_FIELDS)),
                                  'STATIC_URL': settings.STATIC_URL,
                                  'APP_URL_ROOT': settings.APP_URL_ROOT
                             },
                             context_instance=RequestContext(request))
