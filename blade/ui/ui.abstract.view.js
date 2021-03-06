﻿define([], function () {

  //闭包保存所有UI共用的信息，比如z-index
  var getBiggerzIndex = (function () {
    var index = 3000;
    return function (level) {
      return level + (++index);
    }
  })();

  var UIContainerUtil = (function () {
    //一个闭包对象存放所有实例化的ui实例
    var UIContainer = {};

    return {
      addItem: function (id, ui) {
        UIContainer[id] = ui;
      },

      removeItem: function (id) {
        if (UIContainer[id]) delete UIContainer[id];
      },

      getItem: function (id) {
        if (id) return UIContainer[id];
        return UIContainer;
      }
    }
  })();


  return _.inherit({

    //默认属性
    propertys: function () {
      //模板状态
      this.template = '';
      this.datamodel = {};
      this.events = {};
      this.wrapper = $('body');
      this.id = _.uniqueId('ui-view-');

      //自定义事件
      //此处需要注意mask 绑定事件前后问题，考虑scroll.radio插件类型的mask应用，考虑组件通信
      this.eventArr = {};

      //初始状态为实例化
      this.status = 'init';

      //      this.availableFn = function () { }

    },

    //绑定事件，这里应该提供一个方法，表明是insert 或者 push
    on: function (type, fn, insert) {
      if (!this.eventArr[type]) this.eventArr[type] = [];

      //头部插入
      if (insert) {
        this.eventArr[type].splice(0, 0, fn);
      } else {
        this.eventArr[type].push(fn);
      }
    },

    off: function (type, fn) {
      if (!this.eventArr[type]) return;
      if (fn) {
        this.eventArr[type] = _.without(this.eventArr[type], fn);
      } else {
        this.eventArr[type] = [];
      }
    },

    trigger: function (type) {
      var _slice = Array.prototype.slice;
      var args = _slice.call(arguments, 1);
      var events = this.eventArr;
      var results = [], i, l;

      if (events[type]) {
        for (i = 0, l = events[type].length; i < l; i++) {
          results[results.length] = events[type][i].apply(this, args);
        }
      }
      return results;
    },

    createRoot: function () {
      this.$el = $('<div class="view" style="display: none; " id="' + this.id + '"></div>');
    },

    setOption: function (options) {
      for (var k in options) {
        if (k == 'datamodel') {
          _.extend(this.datamodel, options[k]);
          continue;
        }
        this[k] = options[k]
      }
      //      _.extend(this, options);
    },

    initialize: function (opts) {
      this.propertys();
      this.setOption(opts);
      this.resetPropery();
      this.createRoot();
      //添加系统级别事件
      this.addSysEvents();
      this.addEvent();

      //开始创建dom
      this.create();
      this.initElement();

      //将当前的ui实例装入容器
      UIContainerUtil.addItem(this.id, this);

    },

    //返回所有实例化的UI组件集合
    getUIContainer: function () {
      return UIContainerUtil.getItem();
    },

    //内部重置event，加入全局控制类事件
    addSysEvents: function () {
      if (typeof this.availableFn != 'function') return;
      this.removeSysEvents();
      this.$el.on('click.system' + this.id, $.proxy(function (e) {
        if (!this.availableFn()) {
          e.preventDefault();
          e.stopImmediatePropagation && e.stopImmediatePropagation();
        }
      }, this));
    },

    removeSysEvents: function () {
      this.$el.off('.system' + this.id);
    },

    $: function (selector) {
      return this.$el.find(selector);
    },

    //提供属性重置功能，对属性做检查
    resetPropery: function () {
    },

    //各事件注册点，用于被继承
    addEvent: function () {
    },

    create: function () {
      this.trigger('onPreCreate');
      //      this.$el.html(this.render(this.getViewModel()));
      this.render();
      this.status = 'create';
      this.trigger('onCreate');
    },

    //实例化需要用到到dom元素
    initElement: function () { },

    render: function (data, callback) {
      data = this.getViewModel() || {};
      var html = this.template;
      if (!this.template) return '';
      if (data) {
        html = _.template(this.template)(data);
      }
      typeof callback == 'function' && callback.call(this);
      this.$el.html(html);
      return html;
    },

    //刷新根据传入参数判断是否走onCreate事件
    //这里原来的dom会被移除，事件会全部丢失 需要修复*****************************
    refresh: function (needEvent) {
      this.resetPropery();
      if (needEvent) {
        this.create();
      } else {
        this.render();
      }
      this.initElement();
      if (this.status == 'show') this.show();
    },

    show: function () {
      this.wrapper.append(this.$el);
      this.trigger('onPreShow');
      this.$el.show();
      this.status = 'show';
      this.bindEvents();
      this.trigger('onShow');
    },

    hide: function () {
      this.trigger('onPreHide');
      this.$el.hide();
      this.status = 'hide';
      this.unBindEvents();
      this.removeSysEvents();
      this.trigger('onHide');
    },

    destroy: function () {
      this.unBindEvents();
      this.removeSysEvents();
      UIContainerUtil.removeItem(this.id);
      this.$el.remove();
      delete this;
    },

    getViewModel: function () {
      return this.datamodel;
    },

    setzIndexTop: function (el, level) {
      if (!el) el = this.$el;
      if (!level || level > 10) level = 0;
      level = level * 1000;
      el.css('z-index', getBiggerzIndex(level));

    },

    /**
    * 解析events，根据events的设置在dom上设置事件
    */
    bindEvents: function () {
      var events = this.events;

      if (!(events || (events = _.result(this, 'events')))) return this;
      this.unBindEvents();

      // 解析event参数的正则
      var delegateEventSplitter = /^(\S+)\s*(.*)$/;
      var key, method, match, eventName, selector;

      // 做简单的字符串数据解析
      for (key in events) {
        method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;

        match = key.match(delegateEventSplitter);
        eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateUIEvents' + this.id;

        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }

      return this;
    },

    /**
    * 冻结dom上所有元素的所有事件
    *
    * @return {object} 执行作用域
    */
    unBindEvents: function () {
      this.$el.off('.delegateUIEvents' + this.id);
      return this;
    }

  });

});
