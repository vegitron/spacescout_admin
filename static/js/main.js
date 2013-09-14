$(document).ready(function() {

    var required_class = 'required-field';
    var dependent_prefix = 'required-key-';

    $('.fileupload').fileupload();

    window.spacescout_admin = window.spacescout_admin || {};

    // general space functions
    window.spacescout_admin.getFieldValue = function (fv) {
        var i, v, fmt,
            t = [],
            value = function (vo) {
                var rv = '', i, v;

                switch (typeof vo.value) {
                case 'string':
                    rv = gettext(vo.value);
                    break;

                case 'number':
                    rv = String(vo.value);
                    break;

                case 'boolean':
                    rv = (vo.value) ? gettext(vo.key) : null;
                    break;

                case 'object':
                    if ($.isArray(vo.value)) {
                        v = [];
                        for (i = 0; i < vo.value.length; i += 1) {
                            v.push(gettext(vo.value[i]));
                        }

                        rv = v.join(',');
                    }
                    break;

                default:
                    rv = null;
                    break;
                };

                return rv;
            };

        if (fv && typeof fv === 'object') {
            if ($.isArray(fv)) {
                for (i = 0; i < fv.length; i += 1) {
                    if (fv[i].hasOwnProperty('value')) {
                        v = value(fv[i]);
                        if (v) {
                            t.push(v);
                        }
                    }
                }

                return t.join(', ');
            } else if (fv.hasOwnProperty('value')) {
                v = value(fv);
                if (v) {
                    return v;
                }
            }
        }

        return '';
    };

    window.spacescout_admin.modifiedTime = function (date) {
        return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear()
            + ' ' + window.spacescout_admin.prettyHours(date.getHours()
                                                        + ':' + date.getMinutes());
    };

    window.spacescout_admin.prettyHours = function (hours) {
        var t = hours.match(/^(([01]?\d)|2[0123]):([012345]?\d)$/),
            h, m;

        if (t) {
            h = parseInt(t[1]);
            m = parseInt(t[3]);

            if (m == 0) {
                if (h == 0 || h == 23) {
                    return gettext('midnight');
                } else if (h == 12) {
                    return gettext('noon');
                }
            }

            return ((h > 12) ? (h - 12) : h)
                + ':' + ((m < 10) ? ('0' + m) : m)
                + gettext((h > 11) ? 'pm' : 'am');
        }

        return hours;
    };

    var schemaVal = function (key) {
        var schema = window.spacescout_admin.spot_schema,
            keys = key.split('.'),
            val = '',
            i;

        val = schema[keys[0]];
        for (i = 1; i < keys.length; i += 1) {
            val = val[keys[i]];
        }

        return val;
    };

    var appendFieldHeader = function (name, help, is_required, section) {
        var tpl = Handlebars.compile($('#space-edit-field-header').html()),
            node = $(tpl({
                name: name
            }));
        
        section.append(node);

        if (is_required) {
            tpl = Handlebars.compile($('#space-edit-field-required').html());
            node.append(tpl());
        }

        if (help && help.length) {
            tpl = Handlebars.compile($('#space-edit-field-help').html());
            node.append(tpl({
                help: help
            }));
        }
    };

    window.spacescout_admin.appendFieldValue = function (field, getval, section) {
        var required = (field.hasOwnProperty('required') && field.required),
            context = {},
            choice, has_choice = false,
            input_class, tpl, vartype, varedit, data, i, node, src,  group;

        appendFieldHeader(gettext(field.name),
                          (field.hasOwnProperty('help')) ? gettext(field.help) : '',
                          required,
                          section);

        // fields we know about
        switch (field.value.key) {
        case 'location.building_name':
            tpl = Handlebars.compile($('#space-edit-select').html());
            context.options = [];
            section.append(tpl(context));
            node = section.find('select').last();

            $.ajax({
                url: '/api/v1/buildings/',
                dataType: 'json',
                success: function (data) {
                    var building = getval(field.value),
                        option;

                    if (typeof data === 'object' && $.isArray(data)) {
                        for (i = 0; i < data.length; i += 1) {
                            option = $('<option></option>').val(field.value.key).html(data[i]);

                            if (building == data[i]) {
                                option.attr('selected', 'selected');
                            }

                            node.append(option);
                        }
                    }
                },
                error: function (xhr, textStatus, errorThrown) {
                    XHRError(xhr);
                }
            });
            break;
        default:
            vartype = schemaVal(field.value.key);
            varedit = (field.value.hasOwnProperty('edit')) ? field.value.edit: null;

            if (vartype == undefined) {
                vartype = 'unicode'; //default
            }

            switch (typeof vartype) {
            case 'string':
                switch (vartype.toLowerCase()) {
                case 'int':
                case 'decimal':
                    context.inputs = [{
                        key: field.value.key,
                        value: getval(field.value),
                        class: required ? required_class : ''
                    }];
                    tpl = Handlebars.compile($('#space-edit-number').html());
                    node = $(tpl(context));
                    section.append(node);
                    break;
                case 'unicode':
                    if (varedit && varedit.hasOwnProperty('tag') && varedit.tag == 'textarea') {
                        if (varedit.hasOwnProperty('placeholder')) {
                            context.placeholder = gettext(varedit.placeholder);
                        }

                        context.key = field.value.key;
                        context.value = getval(field.value);
                        context.class = required ? required_class : '';
                        tpl = Handlebars.compile($('#space-edit-textarea').html());
                    } else {
                        context.inputs = [{
                            key: field.value.key,
                            value: getval(field.value),
                            placeholder: gettext((varedit && varedit.hasOwnProperty('placeholder')) ? varedit.placeholder : 'text_input'),
                            class: required ? required_class : ''
                        }];
                        tpl = Handlebars.compile($('#space-edit-input').html());
                    }

                    section.append(tpl(context));
                    break;
                default:
                    break;
                }
                break;
            case 'object':
                if ($.isArray(vartype)) {
                    data = [];
                    if (vartype.length == 1 && vartype[0].toLowerCase() == 'true') {
                        src = '#space-edit-checkboxes';
                        data.push(booleanEditStruct(field.value));
                    } else {
                        if (field.value.hasOwnProperty('edit')
                              && field.value.edit.hasOwnProperty('tag')
                               && field.value.edit.tag == 'select') {
                            src = '#space-edit-select';
                            choice = 'selected';
                            group = null;
                        } else if (field.value.hasOwnProperty('edit')
                              && field.value.edit.hasOwnProperty('multi_select')) {
                            src = '#space-edit-checkboxes';
                            choice = 'checked';
                            group = null;
                        } else {
                            src = '#space-edit-radio';
                            choice = 'checked';
                            group = field.name;
                            if (field.value.hasOwnProperty('edit')
                                && field.value.edit.hasOwnProperty('allow_none')) {
                                data.push({
                                    name: gettext('unset'),
                                    key: field.value.key + ':',
                                    value: field.value.key + ':',
                                    group: group
                                });
                            }
                        }

                        if (field.value.hasOwnProperty('map')) {
                            for (i in field.value.map) {
                                if (!has_choice && (field.value.value == i)) {
                                    has_choice = true;
                                }

                                input_class = required ? required_class : '';
                                if (field.value.hasOwnProperty('edit')
                                    && field.value.edit.hasOwnProperty('requires')) {
                                    input_class = dependent_prefix + field.value.edit.requires + ' ' + input_class;
                                }

                                data.push({
                                    name: gettext(field.value.map[i]),
                                    key: field.value.key + ':' + i,
                                    value: field.value.key + ':' + i,
                                    choice: (field.value.value == i) ? choice : '',
                                    class: input_class,
                                    group: group
                                });
                            }
                        } else {
                            for (i = 0; i < vartype.length; i += 1) {
                                if (!has_choice && (String(field.value.value).toLowerCase() == vartype[i])) {
                                    has_choice = true;
                                }

                                input_class = required ? required_class : '';
                                if (field.value.hasOwnProperty('edit')
                                    && field.value.edit.hasOwnProperty('requires')) {
                                    input_class = dependent_prefix + field.value.edit.requires + ' ' + input_class;
                                }

                                data.push({
                                    name: gettext(vartype[i]),
                                    key: field.value.key + ':' + vartype[i],
                                    value: field.value.key + ':' + vartype[i],
                                    choice: (String(field.value.value).toLowerCase() == vartype[i]) ? choice : '',
                                    class: input_class,
                                    has_help: true,
                                    help: gettext(vartype[i] + '_help'),
                                    group: group
                                });
                            }
                        }

                        if (!has_choice && (field.value.hasOwnProperty('edit')
                                            && field.value.edit.hasOwnProperty('allow_none'))) {
                            data[0].choice = choice;
                        }
                    }

                    context.inputs = data;

                    tpl = Handlebars.compile($(src).html());
                    section.append(tpl(context));
                } else {
                    if (typeof field.value.value === 'boolean') {
                        src = '#space-edit-checkboxes';
                        data = [ booleanEditStruct(field.value) ];
                    } else if (vartype == 'int' || vartype == 'decimal') {
                        src = '#space-edit-number';
                        data = [ {
                            key: field.value.key,
                            value: getval(field.value)
                        }];
                    } else if (typeof vartype === 'string'
                               || (vartype == 'unicode')) {
                        src = '#space-edit-input';
                        data = [ {
                            key: field.value.key,
                            value: (field.value)
                        }];
                    }

                    context.inputs = data;
                    context.class = required ? required_class : '';
                    tpl = Handlebars.compile($(src).html());
                    section.append(tpl(context));
                }
                break;
            default:
                break;
            }
        }
    };

    window.spacescout_admin.appendFieldList = function(field, getval, section) {
        var vartype, i,
            values = [],
            keys = [],
            placeholder = [],
            bool = false,
            context = {},
            src_selector,
            required = (field.hasOwnProperty('required') && field.required);

        appendFieldHeader(gettext(field.name),
                          (field.hasOwnProperty('help')) ? gettext(field.help) : '',
                          required,
                          section);

        for (i = 0; i < field.value.length; i += 1) {
            if (i == 0 && typeof field.value[i].value === 'boolean') {
                bool = true;
            } else if (typeof field.value[i].value === 'boolean') {
                if (!bool) {
                    values = [];
                    break;
                }
            } else if (bool) {
                values = [];
                break;
            }

            keys.push(field.value[i].key);

            if (field.value[i].hasOwnProperty('edit')
                && field.value[i].edit.hasOwnProperty('placeholder')) {
                placeholder.push(field.value[i].edit.placeholder);
            }

            if (bool) {
                values.push(booleanEditStruct(field.value[i]));
            } else {
                vartype = schemaVal(field.value[i].key);
                if (typeof vartype === 'string'
                    && (vartype == 'unicode'
                        || vartype == 'int'
                        || vartype == 'decimal')) {
                    values.push(getval(field.value[i]));
                }
            }
        }

        if (bool) {
            src_selector = "#space-edit-checkboxes";
            context.inputs = values;
        } else {
            src_selector = "#space-edit-input";
            context.inputs = [{
                key: keys.join('|'),
                placeholder: placeholder.join(', '),
                class: (required) ? required_class : '',
                value: values.join(', ')
            }];
        }

        section.append(Handlebars.compile($(src_selector).html())(context));
    };

    var booleanEditStruct = function (v) {
        return {
            choice: v.value ? 'checked' : '',
            name: gettext(v.key),
            key: v.key,
            value: v.key
        };
    };

    window.spacescout_admin.validateInput = function (event) {
        var el = $(event.target),
            key = event.keyCode,
            v = el.val(),
            multi = ($.inArray('|') >= 0);

        switch (el.prop('type')) {
        case 'number':
            if (key == 8 || key == 9 || key == 27 || key == 13 || key == 16 || key == 17 || key == 18 || key == 91) {
                return;
            }

            if (!(!event.shiftKey && ((key > 47 && key < 58) || (key > 95 && key < 106)))) {
                event.preventDefault();
            }

        case 'text':
            setInterval(window.spacescout_admin.validateFields, 100);
            break;
        default:
            break;
        }
    };

    window.spacescout_admin.validateFields = function () {
        var show_cue = function (n, s) {
                var req_node = n.children('.' + required_class);

                if (!req_node.length) {
                    var tpl = Handlebars.compile($('#space-edit-field-required').html());
                    req_node = $(tpl());
                    n.prepend(req_node);
                }

                if (s) {
                    req_node.show();
                } else {
                    req_node.hide();
                }
            },
            set_cue = function (node, show) {
                var i, n;

                if (node.prev().hasClass('field-header')) {
                    show_cue(node.prev(), show);
                } else { 
                    for (i = 0; i < 8; i += 1) {
                        n = node.parents().eq(i).prev();
                        if (n.hasClass('field-header')) {
                            show_cue(n, show);
                            break;
                        }
                    }
                }
            };

        $('.' + required_class).each(function () {
            var el = $(this);

            switch (el.prop('tagName').toLowerCase()) {
            case 'input':
                switch (el.attr('type')) {
                case 'radio':
                    set_cue(el, ($('input[name="' + el.attr('name') + '"]:checked').length <= 0));
                    break;
                case 'checkbox':
                    set_cue(el, (el.closest('div.panel').find('input:checked').length <= 0));
                    break;
                case 'number':
                case 'text':
                    if (el.attr('name').indexOf('|') >= 0) {
                        set_cue(el, (multiValueInput(el) == null));
                        break;
                    }

                    set_cue(el, (el.val().trim().length == 0));
                    break;
                };
                break;
            case 'textarea':
                set_cue(el, (el.val().trim().length == 0));
                break;
            case 'select':
                break;
            default :
                break;
            };
        });

        $('input[class^="' + dependent_prefix + '"]:checked').each(function () {
            var el = $(this),
                p = keyValuePair(el.val()),
                m = el.prop('class').slice(dependent_prefix.length).match(/([^\s]+)(\s|$)/),
                target_el;

            if (m) {
                target_el = $('*[name="' + m[1] + '"]');
                if (p) {
                    if (p.value == 'null' || p.value.toLowerCase() == 'false') {
                        set_cue(target_el, false);
                        if (target_el.hasClass(required_class)) {
                            target_el.removeClass(required_class);
                        }
                    } else if (target_el.val().trim().length == 0) {
                        set_cue(target_el, true);
                        if (!target_el.hasClass(required_class)) {
                            target_el.addClass(required_class);
                        }
                    }
                } else {
                    set_cue(target_el, true);
                }
            }
        });
    };

    window.spacescout_admin.collectInput = function () {
        var data = {};

        $('input, textarea').each(function () {
            var v = $(this).val().trim(),
                checked = $(this).is(':checked'),
                p, i;

            switch ($(this).prop('type')) {
            case 'checkbox':
                p = keyValuePair(v);

                if (p) {
                    if (checked) {
                        data[p.key] = p.value;
                    }
                } else {
                    data[v] = checked;
                }

                break;
            case 'radio':
                if (checked) {
                    p = keyValuePair(v);

                    if (p) {
                        data[p.key] = p.value;
                    } else {
                        data[v] = checked;
                    }
                }

                break;
            case 'text':
                p = multiValueInput($(this));
                if (p) {
                    for (i in p) {
                        data[i] = p[i];
                    }

                    break;
                }

            default:
                data[$(this).attr('name')] = v;
                break;
            }
        });

        $('select').each(function () {
            var s = $(this).children('option:selected'),
                v = s.val().trim(),
                p = keyValuePair(v);

            if (p) {
                data[p.key] = p.value;
            } else {
                data[v] = s.text();
            }
        });

        return data;
    };

    var keyValuePair = function (s) {
        var m = s.match(/^([^:]+):(.*)$/);
        return m ? { key: m[1], value: m[2] } : null;
    };

    var multiValueInput = function (input) {
        var v = input.val().trim(),
            name = input.attr('name'),
            data = {},
            ka, va, i;

        ka = name.match(/(([^|]+)(|$))/g);
        if (ka && ka.length > 1) {
            va = v.match(/(([^,'"]+)(,\s*|$))/g);
            if (va && va.length == ka.length) {
                for (i = 0; i < ka.length; i += 1) {
                    data[ka[i]] = va[i];
                }

                return data;
            }
        }

        return null;
    };

});
