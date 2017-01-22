//index.js

import {
  listData
} from './data.js'

var app = getApp()
Page({
  data: {
    scrollH: 0,
    cols: []
  },

  imgWidth: 0,
  cols: [{
    height: 0,
    data: []
  }, {
    height: 0,
    data: []
  }],

  onLoad: function(option) {
    this.configSceen();
    this.loadData();
  },

  configSceen: function() {
    wx.getSystemInfo({
      success: (res) => {
        this.imgWidth = (res.windowWidth - 12) / 2;
        this.setData({
          scrollH: res.windowHeight
        });
      }
    });
  },

  loadData: function() {
    wx.showToast({
      title: "正在加载请稍后",
      icon: "loading"
    });

    this.loadImages(listData.loadData());
  },

  loadImages: function(moduleList) {
    wx.hideToast();
    if (moduleList.length == 0)
      return;

    for (let index in moduleList) {
      let model = moduleList[index];

      model.show = true;
      model.iconWidth = this.imgWidth;
      model.iconHeight = this.calIconHeight(model.Width, model.Height);
      let col1 = this.cols[0];
      let col2 = this.cols[1];
      if (col1.height <= col2.height) {
        this.addModelToCol(model, col1);
      } else {
        this.addModelToCol(model, col2);
      }
    }
    this.reloadList();
  },

  addModelToCol: function(model, col) {
    model.top = col.height;
    col.height = model.top + model.iconHeight;
    col.data.push(model);
  },

  reloadList: function() {
    let data = {
      cols: this.cols
    }
    this.setData(data);
  },

  calIconHeight: function(width, height) {
    let iconHeight = height * this.imgWidth / width;
    return iconHeight;
  },

  itemAtPosition: function(colindex, rowindex) {
    if (colindex >= 0 && colindex < this.cols.length) {
      let col = this.cols[colindex];
      if (rowindex >= 0 && rowindex < col.length) {
        return col[rowindex];
      }
    }
    return null;
  },

  onScroll: function(e) {
    let minTop = e.detail.scrollTop - this.data.scrollH;
    let maxTop = e.detail.scrollTop + this.data.scrollH * 2;
    this.cols.forEach((col) => {
      col.data.forEach((model) => {
        model.show = (model.top >= minTop && model.top <= maxTop);
      });
    });
    this.reloadList();
  }
})