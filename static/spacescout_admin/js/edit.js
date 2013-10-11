$(document).ready(function() {

    var weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    // prep for api post/put
    $.ajaxSetup({
        headers: { "X-CSRFToken": window.spacescout_admin.csrf_token }
    });

    // fetch spot data
    (function () {
        $.ajax({
            url: window.spacescout_admin.app_url_root + 'api/v1/schema',
            dataType: 'json',
            success: function (data) {
                window.spacescout_admin.spot_schema = data;
                loadSpaceDetails();
            },
            error: function (xhr, textStatus, errorThrown) {
                XHRError(xhr);
            }
        });
    }());

    var loadSpaceDetails = function () {
        $.ajax({
            url: window.spacescout_admin.app_url_root + 'api/v1/space/' + window.spacescout_admin.space_id,
            dataType: 'json',
            success: function (data) {
                $('.space-content-loading').hide();
                editSpaceDetails(data);
            },
            error: function (xhr, textStatus, errorThrown) {
                XHRError(xhr);
            }
        });
    };


    var editSpaceDetails = function (space) {
        var hash = decodeURIComponent(window.location.hash.substr(1)),
            editor = $('#space-editor'),
            section = null,
            node, i;

        $('#space-name').html(space.name);

        for (i = 0; i < space.sections.length; i += 1) {
            section = space.sections[i];
            if (hash == section.section) {
                switch(hash) {
                case 'hours_access' :
                    editHoursDetails(section, editor);
                    break;
                case 'images' :
                    editImageDetails(section, editor);
                    break;
                default:
                    editSectionDetails(section, editor);
                    wireBuildingSelect(section);
                    wireLatLongPicker(section);
                    break;
                }

                editor.append(Handlebars.compile($('#space-edit-save').html())({}));

                validate();

                $('input, textarea').change(validate);
                $('input').keydown(window.spacescout_admin.validateInput);
                $('input[class*="required-limit-"]').click(limitChoiceCount);
                $('a.btn').click(modifySpace);

                return;
            }
        }

        editor.append(Handlebars.compile($('#no-section').html())({}));
    };

    var validate = function () {
        window.spacescout_admin.validateFields();
    };

    var limitChoiceCount = function (e) {
        var m = $(e.target).prop('class').match(/required-limit-(\d+)/);

        if (m && $('input[name="' + $(e.target).prop('name') + '"]:checked').length > m[1]
            && $(e.target).is(':checked')) {
            e.preventDefault();
        }
    };

    var modifySpace = function (event) {
        event.preventDefault();

        $.ajax({
            url: window.spacescout_admin.app_url_root + "api/v1/space/" + window.spacescout_admin.space_id + '/',
            dataType: 'json',
            contentType: "application/json",
            data: JSON.stringify(window.spacescout_admin.collectInput()),
            type: "PUT",
            success: function (data) {
                window.location.href = window.spacescout_admin.app_url_root + 'space/' + window.spacescout_admin.space_id;
            },
            error: XHRError
        });
    };

    var editHoursDetails = function (section, editor_node) {
        var section_node = newSectionEditor(section.section),
            anchor_node, hours_node = null, key, days, hours, i, j;

        section_node.append($(Handlebars.compile($('#space-edit-hours').html())({})));

        anchor_node = section_node.find('a').parent();
        if (section.hasOwnProperty('available_hours')
            && typeof section.available_hours === 'object'
            && $.isArray(section.available_hours)) {
            days = section.available_hours;
            hours = {};
            for (i = 0; i < days.length; i += 1) {
                if (days[i].hasOwnProperty('hours')) {
                    for (j = 0; j < days[i].hours.length; j++) {
                        if (days[i].hours[j].length == 2) {
                            key = days[i].hours[j][0] + '-' + days[i].hours[j][1];
                            if (hours.hasOwnProperty(key)) {
                                hours[key].days.push(days[i].day);
                            } else {
                                hours[key] = {
                                    days: [ days[i].day ],
                                    hours: days[i].hours[j]
                                };
                            }
                        }
                    }
                }
            }

            for (i in hours) {
                hours_node = hoursNode(hours[i]);
                anchor_node.before(hours_node);
            }
        }

        if (!hours_node) {
            anchor_node.before(hoursNode());
        }

        appendSectionFields(section.fields, section_node);

        editor_node.append(section_node);

        $('#space-editor #add-hours').click(function (e) {
            hoursNode().insertBefore($(e.target).parent());
        });
    };

    var hoursNode = function (t) {
        var tpl = Handlebars.compile($('#hours-editor').html()),
            edit_node = $(tpl()),
            select_days = edit_node.find('select#days'),
            i, option,
            h_open, m_open,
            h_close, m_close,
            leadingZero = function (n) {
                return (n < 10) ? '0' + n : String(n);
            },
            displayTime = function (m2h) {
                return (m2h.h24 == '12:00')
                         ? gettext('noon')
                         : (m2h.h24 == '24:00' || m2h.h24 == '23:59' || m2h.h24 == '00:00')
                             ? gettext('midnight')
                             : (m2h.h24 == '00:30') ? '12:30' + gettext('am') : m2h.h12;
            },
            min2hour = function (t) {
                var h = t / 60,
                    hv = Math.floor(h),
                    m = Math.floor((h - hv) * 60),
                    pm = (h >= 12);

                return {
                    h24: leadingZero(hv) + ':' + leadingZero(m),
                    h12: ((hv > 12) ? hv - 12 : hv)
                          + ':' + leadingZero(m)
                          + gettext(pm ? 'pm' : 'am')
                };
            },
            hours2min = function (t) {
                var hm = t.split(':');

                return (parseInt(hm[0]) * 60) + parseInt(hm[1]);
            };
        m_open = (t) ? hours2min(t.hours[0]) : 480;
        h_open = min2hour(m_open);
        m_close = (t) ? hours2min(t.hours[1]) : 1020;
        h_close = min2hour(m_close);

        $('#hours-open', edit_node).val(h_open.h24);
        $('#hours-close', edit_node).val(h_close.h24);
        $("span#opening-time", edit_node).text(displayTime(h_open));
        $("span#closing-time", edit_node).text(displayTime(h_close));
        $(".hours-slider", edit_node).noUiSlider({
            range: [0, 1440],
            start: [m_open, m_close],
            step: 30,
            connect: true,
            slide: function () {
                var values = $(this).val(),
                    open = min2hour(values[0]),
                    close =  min2hour(values[1]);

                $(this).parent().siblings('#hours-open').val(open.h24);
                $(this).parent().siblings('#hours-close').val(close.h24);
                $(this).parent().parent().find('span#opening-time').text(displayTime(open));
                $(this).parent().parent().find('span#closing-time').text(displayTime(close));
            }
        });

        for (i = 0; i < weekdays.length; i += 1) {
            option = $('<option></option>').val(weekdays[i]).html(gettext(weekdays[i])).addClass('hours-value');
            if (t && t.hasOwnProperty('days') && $.inArray(weekdays[i], t.days) > -1) {
                option.attr('selected', 'selected');
            }

            select_days.append(option);
        }

        if (window.spacescout_admin.is_mobile) {
            // MOBILE: handle multi-day selection and display
            select_days.addClass('form-control day-select');
            select_days.change(function(){
                var selected = $(this).val(),
                    list;

                if (selected) {
                    list = $.map(selected, function(value) {
                        return(gettext(value));
                    });
            
                    $(this).siblings(".show-days").html(list.join(", "));
                }
            });
            
            select_days.trigger('change');
            
        } else {
            // DESKTOP: make the multi-day selector usable
            select_days.selectpicker();
        }

        return edit_node;
    };

    var editImageDetails = function (section, editor_node) {
        var section_node = newSectionEditor(section.section),
            tpl = Handlebars.compile($('#space-edit-images').html()),
            context = {};

        context['images'] = section['images'];
        if (context['images'].length) {
            if (context['images'].length > 0) {
                context['images'][0]['active'] = 'active';
                context['images'][0]['description'] = gettext('defaultimage');
            }
        }

        section_node.append($(tpl(context)));

        editor_node.append(section_node);

        $('#upload_form').ajaxForm({
            type: 'POST',
            url : window.spacescout_admin.app_url_root + 'api/v1/space/' + window.spacescout_admin.space_id + '/image/',
            dataType: 'json',
            beforeSubmit: function (formData) {
                var i;

                for (i = 0; i < formData.length; i += 1) {
                    if (formData[i].name == 'image' && !formData[i].value) {
                        return false;
                    }
                }

                return true;
            },
            success: function (responseJSON) {
                window.location.reload();
            },
            error: function () {
                console.log('ERROR');
            }
        });

        $('#delete_button').click(function (e) {
            var img_src = $('#image-carousel .active img').prop('src'),
                id = img_src.match(/\/(\d+)$/)[1];

            $.ajax({
                url: img_src,
                type: "DELETE",
                success: function (data) {
                    window.location.reload();
                },
                error: function () {
                    console.log('ERROR');
                }
            });
        });
    };

    var editSectionDetails = function (section, editor_node) {
        var section_node = newSectionEditor(section.section);

        appendSectionFields(section.fields, section_node);
        editor_node.append(section_node);
    };

    var newSectionEditor = function (title) {
        return $(Handlebars.compile($('#editor-container').html())({
            section: gettext(title)
        }));
    };

    var appendSectionFields = function (fields, section) {
        var i;

        for (i = 0; i < fields.length; i += 1) {
            if (typeof fields[i].value === 'object') {
                if ($.isArray(fields[i].value)) {
                    window.spacescout_admin.appendFieldList(fields[i], getFieldValue, section);
                } else {
                    window.spacescout_admin.appendFieldValue(fields[i], getFieldValue, section);
                }
            }
        }
    };

    var wireLatLongPicker = function (section) {
        var latlng_input = $('input[name="location.latitude|location.longitude"]'),
            node = $("#latlong-picker"),
            map,
            parseLatLongValue = function (s) {
                return s.match(/^([-]?[\d\.]+)\s*,\s*([-]?[\d\.]+)$/);
            },
            getLatLongValue = function () {
                var m = parseLatLongValue(latlng_input.val()),
                    latlng = new google.maps.LatLng(47.653787, -122.307808);

                if (m && m.length) {
                    latlng = new google.maps.LatLng(m[1],m[2]);
                } else if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function (position) {
                        latlng = new google.maps.LatLng(position.coords.latitude,
                                                        position.coords.longitude);
                    }, function () {
                        console.log('problem getting lat/long');
                    });
                } else {
                    console.log('browser does not support lat/long');
                }

                return latlng;
            },
            setLatLongValue = function(latLng) {
                latlng_input.val([latLng.lat(), latLng.lng()].join(', '));
            };

        if (node.length) {
            map = new google.maps.Map(node.get(0), {
			    mapTypeId: google.maps.MapTypeId.ROADMAP,
			    mapTypeControl: false,
                panControl: true,
                draggableCursor: 'crosshair',
			    disableDoubleClickZoom: true,
			    zoomControlOptions: true,
			    streetViewControl: false,
                center: getLatLongValue(),
                zoom: 18
            });

            node.append($('<img />').prop('src', window.spacescout_admin.static_url + 'spacescout_admin/img/cross-hairs.gif').addClass('cross-hair'));

            google.maps.event.addListener(map, 'dblclick', function(e) {
                setLatLongValue(e.latLng);
                map.panTo(e.latLng);
                map.setZoom(map.getZoom() + 1);
            });  

            google.maps.event.addListener(map, 'click', function(e) {
                setLatLongValue(e.latLng);
                map.panTo(e.latLng);
            });  

            google.maps.event.addListener(map, 'drag', function(e) {
                setLatLongValue(map.getCenter());
            });

            latlng_input.prev().bind('displayed', function () {
                var ctr = map.getCenter();

                google.maps.event.trigger(map, 'resize');
                map.setCenter(ctr);
            });

            latlng_input.change(function () {
                var m = parseLatLongValue($(this).val());

                if (m && m.length) {
                    map.setCenter(new google.maps.LatLng(m[1],m[2]));

                }
            });
        }
    };

    var wireBuildingSelect = function (section) {
        var selector = '.campus-buildings',
            select = $(selector),
            building,
            loadBuildings = function (depend_node) {
                var val, campus = null;

                if (depend_node) {
                    campus = $(":selected", depend_node).val();
                }
                
                $.ajax({
                    url: window.spacescout_admin.app_url_root
                        + 'api/v1/buildings/'
                        + ((campus && campus.length) ? '?campus=' + campus : ''),
                    dataType: 'json',
                    success: function (data) {
                        var option;

                        select.find('option').remove();

                        if (typeof data === 'object' && $.isArray(data)) {
                            for (i = 0; i < data.length; i += 1) {
                                option = $('<option></option>').html(data[i]);

                                if (building == data[i]) {
                                    option.attr('selected', 'selected');
                                }

                                select.append(option);
                            }
                        }
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        XHRError(xhr);
                    }
                });
            },
            i;

        if (select.length) {
            for (i = 0; i < section.fields.length; i += 1) {
                if (section.fields[i].hasOwnProperty('value')
                    && section.fields[i].value.hasOwnProperty('key')
                    && section.fields[i].value.key == 'location.building_name') {
                    var depend_node = null;

                    building = section.fields[i].value.value;

                    if (section.fields[i].value.hasOwnProperty('edit')
                        && section.fields[i].value.edit.hasOwnProperty('dependency')
                        && section.fields[i].value.edit.dependency.hasOwnProperty('key')){
                        depend_node = $('select[name="' + section.fields[i].value.edit.dependency.key + '"]');

                        if (depend_node.length && depend_node.prop('tagName') == 'SELECT') {
                            depend_node.change(function (e) {
                                loadBuildings(depend_node);
                            });
                        } else {
                            depend_node = null;
                        }
                    }


                    loadBuildings(depend_node);
                }
            }
        }
    };

    var XHRError = function (xhr) {
        var json;

        try {
            json = $.parseJSON(xhr.responseText);
            console.log('space query service error:' + json.error);
        } catch (e) {
            console.log('Unknown space service error: ' + xhr.responseText);
        }
    };

    var getFieldValue = function (v) {
        return window.spacescout_admin.getFieldValue(v);
    };
});
