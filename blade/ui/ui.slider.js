﻿define(['UIView', getAppUITemplatePath('ui.slider'), 'UIScroll'], function (UIView, template, UIScroll) {


  return _.inherit(UIView, {
    propertys: function ($super) {
      $super();
      this.template = template;

      this.datamodel = {
        curClass: 'current',
        data: [],
        index: 0
      };

      this.itemNum = 0;
      this.displayNum = 3;
      this.animatTime = 100;

      //该组件一定要设置宽高
      this.itemWidth = 0;
      this.itemHeight = 0;
      this.scrollWidth = 0;


      //选择时候的偏移量
      this.scrollOffset = 0;

      //滚动对象
      this.scroll = null;

      this.changed = function (item) {
        console.log(item);
      };

    },

    initialize: function ($super, opts) {
      $super(opts);
    },

    resetPropery: function () {
      this._resetNum();
      this._resetIndex();
    },

    //这里差一个index值判断**************************
    _resetIndex: function () {
      if (!this.datamodel.id) return;
      for (var i = 0, len = this.datamodel.data.length; i < len; i++) {
        if (this.datamodel.id == this.datamodel.data[i].id) {
          this.datamodel.index = i;
          break;
        }
      }
    },

    _resetNum: function () {
      this.displayNum = this.displayNum % 2 == 0 ? this.displayNum + 1 : this.displayNum;
      this.itemNum = this.datamodel.data.length;
    },

    initElement: function () {

      //几个容器的高度必须统一
      this.swrapper = this.$el;
      this.scroller = this.$('.ul-list');
    },

    //处理存在图片的情况
    _initImgSize: function () {
      var item = this.scroller.find('img').eq(0);
      if (!item[0]) return;
      item.on('load', $.proxy(function () {
        var h = item.height();
        if (this.itemHeight < h) {
          this.itemHeight = h;
          this.swrapper.css({
            height: this.itemHeight + 'px'
          });
          this.scroller.find('li').height(this.itemHeight);

        }
        var s = '';
      }, this));

    },

    initSize: function () {
      var item = this.scroller.find('li').eq(0);
      var itemOffset = item.offset();
      var parent = this.$el.parent();
      var ph = parent.height();

      this.wrapeWidth = this.swrapper.width();

      this.itemWidth = parseInt(this.wrapeWidth / this.displayNum);

      this.scroller.find('li').width(this.itemWidth);

      this.scroller.width(this.itemWidth * this.itemNum);

      this.itemHeight = this.scroller.height();

      if (ph > this.itemHeight) this.itemHeight = ph;

      this.scroller.find('li').height(this.itemHeight);

      //样式还需调整
      this.swrapper.css({
        'background': '#f5f5f5',
        height: this.itemHeight + 'px'
      });

      this.scrollOffset = ((this.displayNum - 1) / 2) * (this.itemWidth);
      this._initImgSize();
    },

    reload: function (datamodel) {
      _.extend(this.datamodel, datamodel);
      if (this.scroll) {
        this.scroll.destroy();
        this.scroll = null;
      }
      this.refresh();
    },

    _initScroll: function () {
      if (this.scroll) {
        this.scroll.refresh();
        return;
      }

      this.scroll = new UIScroll({
        scrollbars: false,
        //        scrollOffset: this.scrollOffset,
        scrollType: 'x',
        step: this.itemWidth,
        wrapper: this.swrapper,
        bounceTime: 200,
        scroller: this.scroller

      });

      this.scroll.on('scrollEnd', $.proxy(function () {
        this.setIndex(this.getIndexByPosition(), true)
      }, this));

      //为了解决鼠标离屏幕时导致的问题
      this.scroll.on('beforeScrollStart', $.proxy(function () {
        this.setIndex(this.getIndexByPosition(), true)
      }, this));

    },

    adjustPosition: function (hasAnimate) {
      if (!this.scroll) return;
      var index = this.datamodel.index, _dis, time = 0;
      _dis = (this.itemWidth * index) * (-1) + this.scrollOffset;
      if (hasAnimate) time = this.animatTime;
      this.scroll.scrollTo(_dis, 0, time);
    },

    resetCss: function () {
      this.$('li').removeClass('current');
      this.$('li[data-index="' + this.datamodel.index + '"]').addClass('current');
    },

    resetIndex: function () {
      this.setIndex(this.datamodel.index, true, true);
    },

    //根据位置信息重新设置当前选项
    getIndexByPosition: function () {
      var pos = this.scroll.x - this.scrollOffset;
      var index = Math.abs(pos) / this.itemWidth;
      return index;
    },

    getIndex: function () {
      return this.datamodel.index;
    },

    setIndex: function (i, noPosition, noEvent) {
      if (typeof noPosition == 'undefined' && i == this.datamodel.index) noPosition = true;

      //index值是否改变
      var isChange = this.datamodel.index != i;
      this.datamodel.index = i;

      if (!noPosition) this.adjustPosition(true);
      this.resetCss();
      if (noEvent !== true && isChange) this.changed && this.changed.call(this, this.getSelected());
    },

    setId: function (id) {
      if (!id) return;
      var index = -1, i, len;
      for (i = 0, len = this.datamodel.data.length; i < len; i++) {
        if (this.datamodel.data[i].id == id) { index = i; break; }
      }
      if (index == -1) return;
      this.datamodel.index = index;
      this.setIndex(index, false);
    },

    getId: function () {
      return this.getSelected().id;
    },

    getSelected: function () {
      return this.datamodel.data[this.datamodel.index];
    },

    addEvent: function ($super) {
      $super();

      this.on('onCreate', function () {
        this.$el.addClass('cui-roller-bd');
        this.$el.addClass('cui-roller');

      });

      //这个要在第一位，因为后面会执行父类的position方法居中，尺寸没有就不行
      this.on('onShow', function () {
        this.initSize();
        this._initScroll();
        this.adjustPosition();
        this.resetCss();
        this.resetIndex();

      }, 1);

      this.on('onHide', function () {
        if (this.scroll) {
          this.scroll.destroy();
          this.scroll = null;
        }
      });

    }

  });


});
