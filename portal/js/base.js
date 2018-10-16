window.basedir = '';

window.$$ = (function () {
    /**
     * 判断是否是layer iframe
     * @return {Boolean}
     */
    function isLayerIframe() {
        return window.name.substr(0, 18) == 'layui-layer-iframe';
    }

    /**
     * 消息提示
     * @param  {[type]} content [description]
     * @param  {[type]} end     [description]
     * @return {[type]}         [description]
     */
    function msg(content, end) {
        if (isLayerIframe) {
            parent.layer.msg(content, {}, end);
        } else {
            layer.msg(content, {}, end);
        }
    }

    function error(content, end) {
        if (isLayerIframe) {
            parent.layer.msg(content, {
                icon: 2
            }, end);
        } else {
            layer.msg(content, {
                icon: 2
            }, end);
        }
    }


    function confirm(content, yes, cancel) {
        layer.confirm(content, {icon: 3, title: '提示'}, function (index) {
            yes && yes();
            layer.close(index);
        }, function (index) {
            cancel && cancel();
        });
    }

    function parseOptions(target) {
        var $target = $(target);
        if ($target.length) return $.parser.parseOptions($(target)[0]);
        return {};
    }

    //包裹url,解决根目录问题
    function wrapUrl(url) {
        return window.basedir ? window.basedir + url : url;
    }

    //获取错误代码
    function getErrcode(data) {
        return data.errcode;
    }

    //获取错误原因
    function getErrmsg(data) {
        return data.errmsg;
    }

    //解析查询字符串
    function parseQuery(queryString) {
        var query = {};
        if (queryString.length > 0) {
            var pairs = queryString.split('&');
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split('=');
                if (pair.length < 2) {
                    pair[1] = '';
                }
                query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1].replace(/\+/g, ' '));
            }
        }
        return query;
    }

    //解析当前页面查询字符串
    function parseQueryString() {
        var queryString = window.location.search.substr(1);
        return parseQuery(queryString);
    }

    //组装url
    function serializeUrl(url, params) {
        var split = url.split('?');
        var key = split.shift();
        var args = split.join('?');
        var query = parseQuery(args);
        var queryString = $.param($.extend(query, params || {}));

        if (queryString.length) {
            url = key + '?' + queryString;
        }

        return url;
    }

    function close() {
        if (isLayerIframe) {
            if (parent.reload) parent.reload();
            var index = parent.layer.getFrameIndex(window.name);
            parent.layer.close(index);
        } else {
            if (window.top.closeTab) {
                window.top.closeTab();
            }
        }
    }

     //打开tab
     function open(url, title) {
         if (window.top.addTab) {
             url = 'pages/' + url;
             window.top.addTab(title, url, true);
         }
     }


    //请求
    function request(url, data, success, error, options, loading) {
        var isBundle = $.isArray(url);
        if (isBundle) {
            url = serializeUrl('/action/bundle', {
                action: url.join(',')
            });
        }

        // error
        if (typeof error !== 'function') {
            loading = options
            options = error;
            error = function (result) {
                $$.msg($$.errmsg(result));
            };
        }

        // options
        if (typeof options === 'boolean') {
            loading = options
            options = null;
        }

        options = options || {};
        options = $.extend(options, {
            url: $$.wrapUrl(url),
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
			timeout: 3*60*1000,
            data: $.toJSON(data),
            success: function (result) {
                if (isBundle) {
                    for (var i = 0; i < result.length; i++) {
                        if ($$.errcode(result[i]) != 0) {
                            error(result[i]);
                            return;
                        }
                    }
                    success(result);
                } else {
                    if ($$.errcode(result) == 0) {
                        success(result)
                    } else {
                        error(result);
                    }
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                error({
                    errcode: -1,
                    errmsg: textStatus + ', ' + errorThrown
                });
            },
            complete: function () {
                if (loading != false) layer.close(index);
            }
        });

        if (loading != false) var index = layer.load(2);
        return $.ajax(options);
    }

    //格式化日期
    function formatDate(date, format) {
        var o = {
            "M+": date.getMonth() + 1, //month
            "d+": date.getDate(), //day
            "h+": date.getHours(), //hour
            "m+": date.getMinutes(), //minute
            "s+": date.getSeconds(), //second
            "q+": Math.floor((date.getMonth() + 3) / 3), //quarter
            "S": date.getMilliseconds() //millisecond
        }
        if (/(y+)/.test(format))
            format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(format))
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
        return format;
    }

    //解析日期
    function parseDate(s, format) {
        var date = new Date(1970, 0, 1, 0, 0, 0, 0);
        var o = {
            "y+": 'setFullYear', //year
            "M+": 'setMonth', //month
            "d+": 'setDate', //day
            "h+": 'setHours', //hour
            "m+": 'setMinutes', //minute
            "s+": 'setSeconds', //second
            "S": 'setMilliseconds' //millisecond
        }

        for (var k in o) {
            var result;
            if ((result = new RegExp("(" + k + ")").exec(format)) != null) {
                date[o[k]](s.substr(result.index, result[0].length));
            }
        }

        return date;
    }

    function serializeForm(target) {
        var $form = $(target);
        var $disabled = $form.find('[disabled]').removeAttr('disabled');
        var data = $form.serializeObject();
        $form.each(function (i, element) {
            var opts = parseOptions(element);
            if (opts.onSerialize) {
                opts.onSerialize.call(element, data);
            }
        });
        $disabled.attr('disabled', 'disabled');
        return data;
    }

    function loadForm(target, url, params) {
        var $form = $(target);

        if (typeof url === 'string') {
            $$.request(url, params, function (data) {
                _load(data.data, data)
            });
        } else {
            _load(url, params)
        }

        function _load(data, context) {
            if (context == undefined) context = data;

            $form.each(function (i, element) {
                var opts = parseOptions(element);
                if (opts.onLoad) {
                    opts.onLoad.call(element, context);
                }
                $(element).form('load', data);
            });
        }
    }

    function validateForm(target) {
        var $form = $(target);
        $form.form('enableValidation').find('.validatebox-text:hidden').validatebox('disableValidation');
        return $form.form('validate');
    }

    function resetForm(target) {
        var $form = $(target).closest('form');
        $form.form('disableValidation').form('reset');
    }

    function search(target) {
        var opts = parseOptions(target);
        var f = $(target).closest('form');
        var url = opts.url || f.attr('action');
        var params = $$.serializeForm(f);

        if (opts.onBefore && opts.onBefore.call(target, params) == false) {
            return false;
        }

        if ($$.validateForm(f) != true) {
            return false;
        }

        var index = layer.load(2);
        $(opts.datagrid).datagrid('clearSelections').datagrid({
            url: $$.wrapUrl(url),
            pageNumber: 1,
            queryParams: params,
            loadMsg: null,
            onLoadSuccess: function (data) {
                layer.close(index);
                opts.onSuccess && opts.onSuccess.call(target, data);

                $(opts.datagrid).datagrid('clearChecked');
                //解决滚动条引起的panel宽度问题
                $(opts.datagrid).datagrid('getPanel').panel('resize');
            },
            onLoadError: function (data) {
                layer.close(index);
                //$$.msg('error');
				$$.msg(data.errmsg);
            }
        });
    }


    function exportData(target) {
        var opts = parseOptions(target);
        var f = $(target).closest('form');
        var url = opts.url;
        var params = $$.serializeForm(f);

        if (opts.onBefore && opts.onBefore.call(target, params) == false) {
            return false;
        }

        if ($$.validateForm(f) != true) {
            return false;
        }

        $$.request(url, params, function (data) {
            var iframe = $('<iframe src="' + $$.wrapUrl(data.url) + '" style="display:none;"></iframe>').appendTo('body');
            setTimeout(function () {
                iframe.remove();
            }, 1000);
        });
    }

    function submit(target) {
        var $form = $(target).closest('form');
        var options = $.extend({
            onBefore: $.noop,
            onSuccess: function () {
                $$.transform($form, 'view');
                $$.msg('操作成功');
                $$.close();
            }
        }, parseOptions(target));

        var data = $$.serializeForm($form);

        if (options.onBefore.call(target, data) == false) return false;

        if ($$.validateForm($form) != true) return false;

        $$.request(options.url, data, function (result) {
            options.onSuccess.call(target, data, result);
        });
    }

    function loadSelect(selector, rows, options) {
        options = $.extend({
            valueField: 'value',
            textField: 'text'
        }, parseOptions(selector), options || {});
        var $select = $(selector);
        $select.children().slice(1).remove();

        if (rows) {
            var html = [],
                row;
            for (var i = 0; i < rows.length; i++) {
                row = rows[i]
                html.push('<option value="' + row[options['valueField']] + '">' + row[options['textField']] + '</option>')
            }
            $(selector).append(html);
        }
    }

    function getKeys(row, keys) {
        var data = {};
        //string支持
        if (typeof keys == 'string') {
            keys = keys.split(',');
        }

        if (row) {
            for (var i = 0; i < keys.length; i++) {
                data[keys[i]] = row[keys[i]];
            }
        }
        return data;
    }

    //批量提交
    function batchSubmit(target) {
        var $dg = $(target).closest('.datagrid-toolbar').next('.datagrid-view').children('.datagrid-f');
        var dgOpts = $dg.datagrid('options');
        var rows = $dg.datagrid('getChecked');
		var tOpts = parseOptions(target);

        var opts = $.extend({
            onBefore: function (data, callback) {
                $$.confirm('确认要将选中的记录' + tOpts.msg + '？', function () {
                    callback();
                });
            },
            onSuccess: function () {
                $$.msg('操作成功');
                $dg.datagrid('reload');
            }
        }, parseOptions(target));

        if (rows.length) {
            var keyRows = [];
            for (var i = 0; i < rows.length; i++) {
                keyRows.push(getKeys(rows[i], dgOpts.idField));
            }

            var data = {
                rows: keyRows
            };

            var callback = function () {
                $$.request(opts.url, data, function (result) {
                    opts.onSuccess.call(target, data, result);
                });
            };

            opts.onBefore.call(target, data, callback);
        } else {
            $$.msg('请勾选记录！');
            return false;
        }
    }


    //界面显示转换
    function transformDisplay(selector, display) {
        var $target = $(selector);
        $target.find('.tf').addClass('hide').filter('.tfd-' + display).removeClass('hide');
    };

    //表单状态转换
    function transform(selector, action, config) {
        var $target = $(selector);
        if (action == 'view') {
            $target.find('.tf:not(button)').removeClass('hide');
            $target.find('input,textarea,select').each(readonly);
            $target.find('button.tf:not(.tf-view)').addClass('hide');
        } else {
            $target.find('.tf').addClass('hide');

            var dependencies = config[action];
            if (dependencies) {
                for (var i = 0; i < dependencies.length; i++) {
                    var daction = dependencies[i];
                    $target.find('.tf-' + daction + ':not(button,.tf-' + action + ')').removeClass('hide').find('input,textarea,select').each(readonly);
                }
            }

            $target.find('.tf-' + action).removeClass('hide').each(removereadonly);
        }

        function readonly(index, element) {
            var $tmp = $(element);

            if ($tmp.hasClass('textbox-f')) {
                $tmp.textbox('textbox').css('background-color', '#ebebe4');
            }

            if ($tmp.hasClass('combobox-f')) {
                $tmp.combobox('readonly');
            } else if ($tmp.hasClass('combotree-f')) {
                $tmp.combotree('readonly');
            } else if (element.tagName == 'SELECT' || (element.tagName == 'INPUT' && $.inArray(element.type, ['checkbox', 'file']) >= 0) || $tmp.hasClass('Wdate')) {
                $tmp.attr('disabled', 'disabled');
            } else {
                $tmp.attr('readonly', 'readonly');
            }
        }
		
		function removereadonly(index, element) {
            var $tmp = $(element);

            if ($tmp.hasClass('textbox-f')) {
                $tmp.textbox('textbox').css('background-color', '');
            }

            if ($tmp.hasClass('combobox-f')) {
                $tmp.combobox('readonly', false);
            } else if ($tmp.hasClass('combotree-f')) {
                $tmp.combotree('readonly', false);
            } else if (element.tagName == 'SELECT' || (element.tagName == 'INPUT' && $.inArray(element.type, ['checkbox', 'file']) >= 0) || $tmp.hasClass('Wdate')) {
                $tmp.attr('disabled', false);
            } else {
                $tmp.attr('readonly', false);
            }
        }
    };


    function formatField(rows, value, valueField, textField) {
        valueField = valueField || 'value';
        textField = textField || 'text';
        for (var i = 0; i < rows.length; i++) {
            if (rows[i][valueField] == value) {
                return rows[i][textField];
            }
        }
        return null;
    }

    function hasNextStatus(rows, oper_in, proc_st, action) {
        oper_in = oper_in || '0';
        proc_st = proc_st || '0';

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            if (row[0] == oper_in && row[1] == proc_st && row[2] == action) {
                return true;
            }
        }

        return false;
    }

    function openIframe(url) {
        var iframe = layer.open({
            type: 2,
            content: url,
            area: ['100%', '100%'],
            title: null
        });
        layer.full(iframe);
    }

    function getToolbarDatagrid(target) {
        return $(target).closest('.datagrid-toolbar').next('.datagrid-view').children('.datagrid-f');
    }

    function clickToolbar(target, toggleOptions) {
        var toggle = $(target).attr('data-toggle');
        var toggleOpts = $.extend({
            url: toggleOptions.url,
            open: toggleOptions.open
        }, toggleOptions['options'] && toggleOptions['options'][toggle] || {});
        var toggleParams = toggleOptions['params'] && toggleOptions['params'][toggle] || {}
        var params = {};

        var opts = parseOptions(target);
        var $dg = getToolbarDatagrid(target);
        var dgOpts = $dg.datagrid('options');
        var row = $dg.datagrid('getSelected');
        if (row === null) {
            if (toggleOpts.selected !== false) {
                $$.msg('请选择记录！');
                return false;
            }
        } else {
            if (!dgOpts.idField) {
                $$.msg('没有记录ID！');
                return false;
            }
			
			if($.isArray(dgOpts.idField)) {
				$.each(dgOpts.idField, function(index,value){
					params[value] = row[value];
			    });
			}
            else {
				params[dgOpts.idField] = row[dgOpts.idField];
			}
        }

        if (opts.onBefore && opts.onBefore.call(target, row, params) == false) {
            return false;
        }

        var url = serializeUrl(toggleOpts.url, $.extend({}, toggleParams, params));
        var open = toggleOpts.open || openIframe;
        open(url);
    }

    /**
     * 同步输入
     * @param src 源ID
     * @param dest 目的ID
     */
    function syncInput(src, dest) {
        $(src).on('change', function () {
            var srcValue = $(this).val();
            var destValue = $(dest).val();
            if (srcValue.substr(0, destValue.length) == destValue) {
                $(dest).val(srcValue);
            }
        });
    }

    var $$ = {
        msg: msg,
        error: error,
        confirm: confirm,
        wrapUrl: wrapUrl,
        errcode: getErrcode,
        errmsg: getErrmsg,
        parseQueryString: parseQueryString,
        search: search,
		exportData: exportData,
        reset: resetForm,
        serializeForm: serializeForm,
        validateForm: validateForm,
        loadForm: loadForm,
        loadSelect: loadSelect,
        clickToolbar: clickToolbar,
        transform: transform,
        submit: submit,
        batchSubmit: batchSubmit,
        close: close,
        request: request,
        formatField: formatField,
        formatDate: formatDate,
        syncInput: syncInput,
		serializeUrl: serializeUrl,
		open: open
    };

    return $$;
})();

//
// $$.generateTreeData = function (rows, options) {
//     var treeDataMap = {};
//     var treeData = [];
//     var i, row, p, node;
//
//     for (i = 0; i < rows.length; i++) {
//         row = rows[i];
//         treeDataMap[row[options.id]] = generateTreeNode(row, options);
//     }
//
//     //组装树
//     for (i = 0; i < rows.length; i++) {
//         row = rows[i];
//         node = treeDataMap[row[options.id]];
//         p = treeDataMap[row[options.pid]];
//         if (!p) { //没有找到parent
//             treeData.push(node);
//         } else { //找到parent
//             p.children = p.children || [];
//             p.children.push(node);
//         }
//     }
//
//     return treeData;
//
//     function generateTreeNode(row, options) {
//         var node = {
//             id: row[options.id],
//             text: row[options.text]
//         };
//
//         if (options.icon && row[options.icon]) {
//             node.iconCls = row[options.icon];
//         }
//
//         var i, name;
//         if (options.attributes) {
//             for (i = 0; i < options.attributes.length; i++) {
//                 name = options.attributes[i];
//                 if (row[name]) {
//                     node.attributes = node.attributes || {};
//                     node.attributes[name] = row[name];
//                 }
//             }
//         }
//
//         return node;
//     }
// }