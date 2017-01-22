# wx-waterfall

实现微信小程序瀑布流

![](./screenshot/1.jpg)

## 要点

1. 将列表数据拆成 N 个列表
2. 解决加载长列表导致内存溢出/程序卡顿问题

## 拆列表

这部分没有什么技术含量，就是将列表数据根据图片的宽高分成 N 组（Demo分成了2组）。

```
      ...
      let col1 = this.cols[0];
      let col2 = this.cols[1];
      if (col1.height <= col2.height) {
        this.addModelToCol(model, col1);
      } else {
        this.addModelToCol(model, col2);
      }
      ...

  addModelToCol: function(model, col) {
    model.top = col.height;
    col.height = model.top + model.iconHeight;
    col.data.push(model);
  },
```

*模型列表里最好能有图片的 size 信息，否则就要预加载图片获取图片的真实尺寸，实现起来吃力不讨好。*

将 N 列模型列表绑定到模板上，渲染视图：

```
<!--index.wxml-->
<scroll-view scroll-y="true" class="waterfall_container" style="height:{{scrollH}}px" bindscrolltolower="loadData">
    <template wx:for="{{cols}}" wx:key="col_{{index}}" is="column" data="{{col_list: item, col_index: index}}" />
</scroll-view>
<template name="column">
    <view class="img_column">
        <image wx:for="{{col_list.data}}" wx:for-index="row_index" wx:key="{{item.id}}" id="{{item.id}}" 
          src="item.Icon" class="img_cell"
          style="width:{{item.iconWidth}}px; height:{{item.iconHeight}}px"></image>
    </view>
</template>
```

其中 scroll-view 需要指定高度，才能触发加载更多的方法 loadData。

样式文件：

```
/**index.wxss**/

.waterfall_container {
    float: left;
    padding: 4px;
}

.img_column {
    float: left;
    padding-right: 4px;
}

.img_column: last {
    padding-right: 0px;
}

.img_cell {
    display: block;
    margin-bottom: 4px; 
}
```

## 长列表优化

上面的代码可以实现基本的瀑布流效果，但是如果列表很长，需要加载很多图片（特别是动图），就会导致滑动 scroll-view 卡顿，动图的动画播放也会很卡。

针对于这个问题的几种解决方案：

* 视图懒渲染
* 图片懒加载
* 视图复用

### 视图懒渲染

```
<image wx:for="{{col_list.data}}" wx:for-index="row_index" wx:if="{{item.show}}" 
  wx:key="{{item.id}}" id="{{item.id}}" 
  src="item.Icon" class="img_cell"
  style="width:{{item.iconWidth}}px; height:{{item.iconHeight}}px"></image>
```

视图懒渲染就是不渲染不可见区域的视图，其中 item.show 是脚本部分在 scroll-view 滑动时动态计算的：

```
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
```

这个方案可以在一定程度上解决内存的问题，但是它会带来一些新的问题：

1. scroll-view 的滑块区域不准
2. 快速滑动 scroll-view 时会有大量空白区域，如果 cell 的背景和 scroll-view 的背景色一致，cell 又没有边框的话，看起来问题不会很明显，但一般只有 Demo 是这样的 ~

### 图片懒加载

图片懒加载类似于视图懒渲染，区别在于视图是有渲染的，不过图片在有需要的时候才加载：

```
<image wx:for="{{col_list.data}}" wx:for-index="row_index" 
  wx:key="{{item.id}}" id="{{item.id}}" 
  src="{{item.show ? item.Icon : ''}}" class="img_cell"
  style="width:{{item.iconWidth}}px; height:{{item.iconHeight}}px"></image>
```

这样处理的优点：

1. scroll-view 的 content height 是准确的，表现到 UI 就是滑块区域准确
2. 快速滑动 scroll-view 时可以看到占位视图，滑动停止时逐个加载图片资源
3. 不在显示/待显示区域的视图不保留图片信息，微信有机会释放这部分内存

缺点：

1. 如果用户大量浏览图片，因为创建了大量的视图，程序还是会导致卡顿

### 视图复用

此方案仅表述思路，不提供实现，因为麻烦。



