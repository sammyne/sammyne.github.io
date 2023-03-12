(window.webpackJsonp=window.webpackJsonp||[]).push([[12],{382:function(s,a,t){s.exports=t.p+"assets/img/mpg-before-gc.a3690983.png"},383:function(s,a,t){s.exports=t.p+"assets/img/mpg-GC-start.370c4e9e.png"},384:function(s,a,t){s.exports=t.p+"assets/img/mpg-GC-mark-assist.9f16950f.png"},385:function(s,a,t){s.exports=t.p+"assets/img/mpg-mark-termination.428c0868.png"},552:function(s,a,t){s.exports=t.p+"assets/img/mpg-write-barrier-wating.810b1b32.png"},553:function(s,a,t){s.exports=t.p+"assets/img/partial-snapshot-of-gc-trace.ef938618.png"},554:function(s,a,t){s.exports=t.p+"assets/img/sweeping.5432da16.png"},555:function(s,a,t){s.exports=t.p+"assets/img/trace-sweeping.1564334a.png"},556:function(s,a,t){s.exports=t.p+"assets/img/2mb-in-use.8067dee0.png"},557:function(s,a,t){s.exports=t.p+"assets/img/2mb-more-in-use.98ab2898.png"},558:function(s,a,t){s.exports=t.p+"assets/img/gc-trace-1405.0837c8cc.png"},559:function(s,a,t){s.exports=t.p+"assets/img/gc-trace-1406.43d560b5.png"},560:function(s,a,t){s.exports=t.p+"assets/img/gc-percentage-vs-gc-start.4c2c02f4.png"},561:function(s,a,t){s.exports=t.p+"assets/img/optimized-vs-nonoptimized-app.a0ff616b.png"},718:function(s,a,t){"use strict";t.r(a);var e=t(2),r=Object(e.a)({},(function(){var s=this,a=s._self._c;return a("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[a("blockquote",[a("p",[s._v("原文："),a("a",{attrs:{href:"https://www.ardanlabs.com/blog/2018/12/garbage-collection-in-go-part1-semantics.html",target:"_blank",rel:"noopener noreferrer"}},[s._v("Garbage Collection In Go : Part I - Semantics"),a("OutboundLink")],1)])]),s._v(" "),a("h2",{attrs:{id:"序言"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#序言"}},[s._v("#")]),s._v(" 序言")]),s._v(" "),a("p",[s._v("这是讲解 Go 的垃圾回收背后的机制和语义的三部曲的第一部。本篇博文聚焦于回收器语义相关的基础知识。")]),s._v(" "),a("p",[s._v("三部曲的索引如下：")]),s._v(" "),a("ol",[a("li",[s._v("Go 的垃圾回收：第一节--语义")]),s._v(" "),a("li",[a("RouterLink",{attrs:{to:"/_post/garbage-collection-in-go/part2-gctraces/"}},[s._v("Go 的垃圾回收：第二节 -- GC 追溯")])],1),s._v(" "),a("li",[a("RouterLink",{attrs:{to:"/_post/garbage-collection-in-go/part3-gcpacing/"}},[s._v("Go 的垃圾回收：第三节 -- GC 的节奏控制")])],1)]),s._v(" "),a("h2",{attrs:{id:"简介"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#简介"}},[s._v("#")]),s._v(" 简介")]),s._v(" "),a("p",[s._v("垃圾回收器肩负着追踪堆的内存分配、释放不被占用的内存和保留正被占用的内存的责任。编程语言实现这些行为的方式是复杂的，但这不应该要求应用开发者理解这些细节才能开始编写软件。况且随着不同版本的语言虚拟机或运行时的发布，这些系统的实现总是一直不断更新和进化的。对应用开发者来说，重要的是对自己所用语言的垃圾回收器的行为方式和支持这些行为的方法有一个正确的使用姿势，而无须关心具体实现。")]),s._v(" "),a("p",[s._v("从 1.12 版开始，Go 语言采用了一种 non-generational 且并发的三色标志和清除回收器。想要可视化地理解标志然后清除回收器的工作原理的话，Ken Fox 写了篇优秀的"),a("a",{attrs:{href:"https://spin.atomicobject.com/2014/09/03/visualizing-garbage-collection-algorithms",target:"_blank",rel:"noopener noreferrer"}},[s._v("文章"),a("OutboundLink")],1),s._v("且有相应动画。Go 的回收器实现随着 Go 的每次新版本发布不断变更和进化。因此，任何实现细节方面的讨论都会因新版本的发布而变得不准确。")]),s._v(" "),a("p",[s._v("基于以上描述，本篇博文建立的模型不会着眼于真实的实现细节，模型聚焦于我们可以体验到的和接下来几年能够期望看到的行为。我会通过这篇博文分享回收器的行为方式，然后解释如何支持这种行为方式，不用担心当前实现或将来它会如何变化。这样做可以使你成长为更好的 Go 程序猿。")]),s._v(" "),a("blockquote",[a("p",[s._v("注：如果想要了解更多垃圾回收器和 Go 的具体实现的话，参见"),a("a",{attrs:{href:"https://github.com/ardanlabs/gotraining/tree/master/reading#garbage-collection",target:"_blank",rel:"noopener noreferrer"}},[s._v("这里"),a("OutboundLink")],1)])]),s._v(" "),a("h2",{attrs:{id:"堆不是一个容器"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#堆不是一个容器"}},[s._v("#")]),s._v(" 堆不是一个容器")]),s._v(" "),a("p",[s._v("我绝不会把堆看做用来存储或释放值的容器。切记内存空间没有明确定义“堆”这个概念的线性地址范围。我们可以这样认为：进程空间中所有预留给应用程序的内存都可以从堆上分配。我们的模型不关心这些堆上分配内存的虚拟或物理地址。这种思考方式有助于你更好地理解垃圾回收器的工作方式。")]),s._v(" "),a("h2",{attrs:{id:"回收器的行为方式"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#回收器的行为方式"}},[s._v("#")]),s._v(" 回收器的行为方式")]),s._v(" "),a("p",[s._v("回收工作开始后，回收器会依次进行 3 个不同阶段的工作。这 3 个阶段中的两个会带来 Stop The World (STW) 延时，而另一个则会产生降低应用吞吐量的延时。3 个阶段分别为：")]),s._v(" "),a("ul",[a("li",[s._v("标志前预准备 -- STW")]),s._v(" "),a("li",[s._v("标志 -- 并发执行")]),s._v(" "),a("li",[s._v("标志完成 -- STW")])]),s._v(" "),a("p",[s._v("各个阶段剖析如下")]),s._v(" "),a("h3",{attrs:{id:"标志前预准备-stw"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#标志前预准备-stw"}},[s._v("#")]),s._v(" 标志前预准备 -- STW")]),s._v(" "),a("p",[s._v("回收开始后，启动写屏障（Write Barrier）是必须执行的第一项工作。写屏障的作用是使得回收器在执行回收操作时能够维持堆上数据的完整性，因为回收器和应用程序是并发运行的。")]),s._v(" "),a("p",[s._v("为了启动写屏障，每个正在运行的应用协程都必须暂停。这项操作是很快的，平均耗时在 10 到 30 微妙之间。当然，取得这种效果的前提是应用协程工作正常。")]),s._v(" "),a("blockquote",[a("p",[s._v("注：为了更好地理解以下调度器图解，请务必读一下关于 "),a("a",{attrs:{href:"https://www.ardanlabs.com/blog/2018/08/scheduling-in-go-part1.html",target:"_blank",rel:"noopener noreferrer"}},[s._v("Go 调度器"),a("OutboundLink")],1),s._v("的系列文章。")])]),s._v(" "),a("p",[s._v("图 1\n"),a("img",{attrs:{src:t(382),alt:"mpg before gc"}})]),s._v(" "),a("p",[s._v("上图展示了回收开始前正在运行的 4 个应用协程。这 4 个协程都必须暂停。而暂停的唯一方式是回收器监听并等待每个协程执行函数调用。函数保证协程处于能够暂停的安全点。那如果其中一个协程没有执行函数调用而其他的都执行了呢？")]),s._v(" "),a("p",[s._v("图 2"),a("br"),s._v(" "),a("img",{attrs:{src:t(552),alt:"MPG for waiting for Write Barrier"}})]),s._v(" "),a("p",[s._v("上图描述一个真实的问题。回收工作在 P4 处理器运行的协程暂停前无法启动，而这个暂停由于协程正在执行一项繁重的数学计算而无法触发。")]),s._v(" "),a("p",[s._v("代码片段 1")]),s._v(" "),a("div",{staticClass:"language-go line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-go"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("func")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("add")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("numbers "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),a("span",{pre:!0,attrs:{class:"token builtin"}},[s._v("int")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token builtin"}},[s._v("int")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("var")]),s._v(" v "),a("span",{pre:!0,attrs:{class:"token builtin"}},[s._v("int")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("for")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[s._v("_")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" n "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("range")]),s._v(" numbers "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n        v "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("+=")]),s._v(" n\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("return")]),s._v(" v\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br")])]),a("p",[s._v("代码片段 1 是 P4 的协程所执行的代码。受不同切片大小的影响，这个协程可能会耗费大量时间甚至不会有暂停的机会。这是一种能够推迟回收操作的代码。更糟糕的是，回收器等待期间，其他 P 无法为任何协程提供服务。协程在合理时间片内执行函数调用是非常重要的。")]),s._v(" "),a("blockquote",[a("p",[s._v("注：语言开发团队预期在 1.14 版本通过为调度器引入"),a("a",{attrs:{href:"https://github.com/golang/go/issues/24543",target:"_blank",rel:"noopener noreferrer"}},[s._v("抢占式"),a("OutboundLink")],1),s._v("技巧来修正。")])]),s._v(" "),a("h3",{attrs:{id:"标志-并发执行"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#标志-并发执行"}},[s._v("#")]),s._v(" 标志 -- 并发执行")]),s._v(" "),a("p",[s._v("写屏障一旦启动，回收器即可开始标志阶段。第一项操作时回收器自己占用 25% CPU 容量。回收器借用协程来执行回收操作，依赖于和应用协程一样的 P 和 M。对于我们四协程的 Go 应用，这也就意味着一个完整的 P 会被分配专用于回收工作。")]),s._v(" "),a("p",[s._v("图 3"),a("br"),s._v(" "),a("img",{attrs:{src:t(383),alt:"MPG after GC starts"}})]),s._v(" "),a("p",[s._v("上图显示回收器是如何把 P1 据为己有用于回收工作。现在回收器就可以开始标记阶段了。标志阶段的主要工作是标识出堆内存中被占用的变量。操作伊始会搜寻现存所有协程的栈空间以找到堆内存的根指针。然后回收器必须从这些根指针开始遍历堆内存图。P1 执行标志工作时，应用任务可以并发地在 P2、P3 和 P4 上执行。这意味着回收器的影响已经被最小化到当前 CPU 容量的 25%。")]),s._v(" "),a("p",[s._v("我也想到此就结束了，但是故事还得继续。在回收过程中，P1 专用于 GC 的协程没能在堆内存使用量达到上限前完成标志工作的话，怎么办？如果是 3 个协程中某一个执行的的任务导致回收器没能按时完成操作呢？这种情况下，新的内存分配必须放慢且仅针对那个相关的协程。")]),s._v(" "),a("p",[s._v("如果回收器断定自己需要放慢分配速度，它会招募应用协程来协助标志工作。这个操作成为 Mark Assist。应用协程用于 Mark Assist 的时间长度和它开辟的堆内存大小成正相关关系。Mark Assist 操作的正向作用是加速了回收工作。")]),s._v(" "),a("p",[s._v("图 4"),a("br"),s._v(" "),a("img",{attrs:{src:t(384),alt:"MPG for Mark Assist"}})]),s._v(" "),a("p",[s._v("上图显示 P3 上的应用协程正在执行 Mark Assist 操作以协助回收工作。好在其他应用协程无须掺合进来。大量开辟内存的应用会发现多数正在运行的协程在回收过程中执行少许 Mark Assist 操作。")]),s._v(" "),a("p",[s._v("回收器的一项目标是消除 Mark Assist 的必要性。任何给定回收工作需要大量 Mark Assist 的话，回收器可以提前开始下一轮垃圾回收工作。这样做的目的是减少下次回收需要的 Mark Assist。")]),s._v(" "),a("h3",{attrs:{id:"标志结束-stw"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#标志结束-stw"}},[s._v("#")]),s._v(" 标志结束 -- STW")]),s._v(" "),a("p",[s._v("标志工作的下一阶段是标志结束阶段。这时写屏障被关闭，多项清理工作会执行，并且计算下次的回收目标。标志过程中一直执行密集循环的协程也会导致标志结束的 STW 延时加长。")]),s._v(" "),a("p",[s._v("图 5"),a("br"),s._v(" "),a("img",{attrs:{src:t(385),alt:"MPG while Mark Termination"}})]),s._v(" "),a("p",[s._v("图 5 显示了标志结束阶段所有协程都被暂停的现象。平均情况下，这项活动通常会持续 60 到 90 微妙。这个阶段可以不用 STW，但借助 STW的话，代码会更加简单，况且不用 STW 增加的复杂度不值得相应的小幅受益。")]),s._v(" "),a("p",[s._v("一旦回收结束，每个 P 都可以重新服务于应用协程，程序再次回到满状态运行。")]),s._v(" "),a("p",[s._v("图 6"),a("br"),s._v(" "),a("img",{attrs:{src:t(382),alt:"MPG after GC"}})]),s._v(" "),a("p",[s._v("图 6 显示回收结束后所有可用的 P 再次忙于处理应用任务的情形。应用恢复到回收工作开始前的满血状态。")]),s._v(" "),a("h3",{attrs:{id:"清理-并发执行"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#清理-并发执行"}},[s._v("#")]),s._v(" 清理 -- 并发执行")]),s._v(" "),a("p",[s._v("回收结束后还有一个称为清理的活动。清理操作会回收堆内存中没有被标志为占用的变量所关联的内存。这项活动在应用协程试图在堆上开辟新内存时触发。清理带来的延时算在堆内存的开辟操作上，而不在垃圾回收所产生的延时。")]),s._v(" "),a("p",[s._v("以下是个人机器上 12 个线程用于执行协程的一个分析样本。")]),s._v(" "),a("p",[s._v("图 7"),a("br"),s._v(" "),a("img",{attrs:{src:t(553),alt:"Partial snapshot of GC trace"}})]),s._v(" "),a("p",[s._v("图 7 展示了分析的局部快照。由图可知本次回收过程中（盯住最上面的蓝色 GC 线），12 个中的 3 个 P 专用于 GC。协程 2450、1978 和 2696 在这过程中部分时间执行了 Mark Assist 任务而不是应用任务。回收结束之际，只有一个 P 专用于 GC 且负责最后执行 STW （标记结束）的工作。")]),s._v(" "),a("p",[s._v("回收一旦结束，应用就回到了满状态运行。此外，我们还会可以看到这些协程下面有许多玫瑰色的线条。")]),s._v(" "),a("p",[s._v("图 8"),a("br"),s._v(" "),a("img",{attrs:{src:t(554),alt:"Sweeping"}})]),s._v(" "),a("p",[s._v("图 8 显示这些玫瑰色线条代表协程执行清理工作而不是应用任务的时间段。这些时间段里面协程试图在堆上开辟新内存。")]),s._v(" "),a("p",[s._v("图 9"),a("br"),s._v(" "),a("img",{attrs:{src:t(555),alt:"End of stack trace for goroutine"}})]),s._v(" "),a("p",[s._v("图 9 显示了某个协程清理活动最后的调用栈追踪记录。"),a("code",[s._v("runtime.mallocgc")]),s._v("的调用会请求在堆上开辟新内存。"),a("code",[s._v("runtime.(*mcache).nextFree")]),s._v("则会触发清理操作。一旦堆上没有可回收的内存，"),a("code",[s._v("nextFree")]),s._v("的调用就会消失了。")]),s._v(" "),a("p",[s._v("上述回收行为只会在垃圾回收已经开始且正在运行过程中出现。GC 百分比配置选项很大程度上决定着回收开始的时机。")]),s._v(" "),a("h2",{attrs:{id:"gc-百分比"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#gc-百分比"}},[s._v("#")]),s._v(" GC 百分比")]),s._v(" "),a("p",[s._v("运行时里面有一个称为 GC 百分比的配置选项，默认值是 100。这个值代表着下次回收开始前可以开辟的堆内存大小相对于当前的比例。GC 百分比设置为 100 意味着：参考回收结束后被标记为活跃的堆内存大小，下次回收必须在再有 100% 内存在堆上开辟之时或之前开始。")]),s._v(" "),a("p",[s._v("举个例子，假设现有回收工作以 2MB 被占用的堆内存收尾。")]),s._v(" "),a("blockquote",[a("p",[s._v("注：本篇博文的堆内存图解不反映使用 Go 时的真实情形。Go 的堆内存通常是碎片化且散乱的，我们看不到如图所示的清晰界限。这些图提供一个更加易于理解的方式将堆内存可视化，对我们期望的行为来说是准确的。")])]),s._v(" "),a("p",[s._v("图 10"),a("br"),s._v(" "),a("img",{attrs:{src:t(556),alt:"2MB of heap memory in-use after the last collection finished"}})]),s._v(" "),a("p",[s._v("图 10 显示上次回收结束时有 2MB 被占用的内存。由于 GC 百分比设为 100%，下次回收需要在多于 2MB 的堆内存被开辟之时或之前开始。")]),s._v(" "),a("p",[s._v("图 11"),a("br"),s._v(" "),a("img",{attrs:{src:t(557),alt:"2 more MB of heap memory is now in-use"}})]),s._v(" "),a("p",[s._v("图 11 表示现在有 2MB 多的堆内存被开辟出来了。这就会触发回收。快速查看这项行为的方式之一是为每个发生的回收生成相应的 GC 追踪记录。")]),s._v(" "),a("h2",{attrs:{id:"gc-追踪"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#gc-追踪"}},[s._v("#")]),s._v(" GC 追踪")]),s._v(" "),a("p",[s._v("运行 Go 应用过程中，我们可以设置 "),a("code",[s._v("GODEBUG")]),s._v(" 环境变量包含"),a("code",[s._v("gctrace=1")]),s._v(" 选项来生成 GC 追踪记录。每有一次回收发生，运行时都会把 GC 的追踪记录信息写到 "),a("code",[s._v("stderr")]),s._v("。")]),s._v(" "),a("p",[s._v("代码片段 2")]),s._v(" "),a("div",{staticClass:"language-bash line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-bash"}},[a("code",[a("span",{pre:!0,attrs:{class:"token assign-left variable"}},[s._v("GODEBUG")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("gctrace"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1")]),s._v(" ./app\n\ngc "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1405")]),s._v(" @6.068s "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("11")]),s._v("%: "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0.058")]),s._v("+1.2+0.083 ms clock, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0.70")]),s._v("+2.5/1.5/0+0.99 ms cpu, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("7")]),s._v("-"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("11")]),s._v("-"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("6")]),s._v(" MB, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("10")]),s._v(" MB goal, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("12")]),s._v(" P\n\ngc "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1406")]),s._v(" @6.070s "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("11")]),s._v("%: "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0.051")]),s._v("+1.8+0.076 ms clock, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0.61")]),s._v("+2.0/2.5/0+0.91 ms cpu, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("8")]),s._v("-"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("11")]),s._v("-"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("6")]),s._v(" MB, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("13")]),s._v(" MB goal, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("12")]),s._v(" P\n\ngc "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1407")]),s._v(" @6.073s "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("11")]),s._v("%: "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0.052")]),s._v("+1.8+0.20 ms clock, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0.62")]),s._v("+1.5/2.2/0+2.4 ms cpu, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("8")]),s._v("-"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("14")]),s._v("-"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("8")]),s._v(" MB, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("13")]),s._v(" MB goal, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("12")]),s._v(" P\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br")])]),a("p",[s._v("代码片段 2 展示了如何利用"),a("code",[s._v("GODEBUG")]),s._v("变量来生成 GC 追踪记录。片段也显示了运行的 Go 应用生成的 3 条记录。")]),s._v(" "),a("p",[s._v("以下通过对第一条 GC 追踪记录的拆解分析来理解一条 GC 追踪记录的含义。")]),s._v(" "),a("p",[s._v("代码片段 3")]),s._v(" "),a("div",{staticClass:"language-bash line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-bash"}},[a("code",[s._v("gc "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1405")]),s._v(" @6.068s "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("11")]),s._v("%: "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0.058")]),s._v("+1.2+0.083 ms clock, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0.70")]),s._v("+2.5/1.5/0+0.99 ms cpu, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("7")]),s._v("-"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("11")]),s._v("-"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("6")]),s._v(" MB, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("10")]),s._v(" MB goal, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("12")]),s._v(" P\n\n// General\ngc "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1404")]),s._v("     "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" The "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1404")]),s._v(" GC run since the program started\n@6.068s     "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Six seconds since the program started\n"),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("11")]),s._v("%         "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Eleven percent of the available CPU so far has been spent "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("in")]),s._v(" GC\n\n// Wall-Clock\n"),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0")]),s._v(".058ms     "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" STW        "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Mark Start       - Write Barrier on\n"),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1")]),s._v(".2ms       "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Concurrent "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Marking\n"),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0")]),s._v(".083ms     "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" STW        "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Mark Termination - Write Barrier off and clean up\n\n// CPU Time\n"),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0")]),s._v(".70ms      "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" STW        "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Mark Start\n"),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("2")]),s._v(".5ms       "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Concurrent "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Mark - Assist Time "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("GC performed "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("in")]),s._v(" line with allocation"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1")]),s._v(".5ms       "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Concurrent "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Mark - Background GC "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("time")]),s._v("\n0ms         "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Concurrent "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Mark - Idle GC "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("time")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0")]),s._v(".99ms      "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" STW        "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Mark Term\n\n// Memory\n7MB         "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Heap memory in-use before the Marking started\n11MB        "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Heap memory in-use after the Marking finished\n6MB         "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Heap memory marked as live after the Marking finished\n10MB        "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Collection goal "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("for")]),s._v(" heap memory in-use after Marking finished\n\n// Threads\n12P         "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Number of logical processors or threads used to run Goroutines\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br"),a("span",{staticClass:"line-number"},[s._v("19")]),a("br"),a("span",{staticClass:"line-number"},[s._v("20")]),a("br"),a("span",{staticClass:"line-number"},[s._v("21")]),a("br"),a("span",{staticClass:"line-number"},[s._v("22")]),a("br"),a("span",{staticClass:"line-number"},[s._v("23")]),a("br"),a("span",{staticClass:"line-number"},[s._v("24")]),a("br"),a("span",{staticClass:"line-number"},[s._v("25")]),a("br"),a("span",{staticClass:"line-number"},[s._v("26")]),a("br"),a("span",{staticClass:"line-number"},[s._v("27")]),a("br")])]),a("p",[s._v("代码片段 3 列举了第一条 GC 追踪记录分解所得的每个真实数字的含义。大部分这些值都会后续提及，但现在我们仅着眼于 GC 记录 1405 的内存部分。")]),s._v(" "),a("p",[s._v("图 12"),a("br"),s._v(" "),a("img",{attrs:{src:t(558),alt:"GC trace 1405"}})]),s._v(" "),a("p",[s._v("代码片段 4")]),s._v(" "),a("div",{staticClass:"language-bash line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-bash"}},[a("code",[s._v("// Memory\n7MB         "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Heap memory in-use before the Marking started\n11MB        "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Heap memory in-use after the Marking finished\n6MB         "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Heap memory marked as live after the Marking finished\n10MB        "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Collection goal "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("for")]),s._v(" heap memory in-use after Marking finished\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br")])]),a("p",[s._v("据代码片段 4 的 GC 追踪记录显示，标志操作开始前被占用的堆内存大小为 7MB。标志操作结束后，被占用的堆内存大小来到了 11MB。这意味着回收过程中，出现了额外 4MB 的内存分配。标志结束后被标记为活跃的堆内存大小为 6MB。这也就意味着下次回收开始前，应用可以把占用的堆内存大小提高到 12MB （6MB 当前活跃堆内存大小的100%）。")]),s._v(" "),a("p",[s._v("我们看到回收器离目标还差 1MB。标记阶段结束时被占用的堆内存大小为 11MB 而不是 10MB。这是正确的，因为目标是基于当前所占用堆内存的大小、标记为活跃的堆内存大小和回收过程中出现的额外内存分配的耗时计算而定。当前情况下，应用做了需要在标记结束后占用比期望更多堆内存的某些工作。")]),s._v(" "),a("p",[s._v("我们再看看下一条 GC 追踪记录（1406）的话，会发现情况在 2ms 内的变化。")]),s._v(" "),a("p",[s._v("图 13"),a("br"),s._v(" "),a("img",{attrs:{src:t(559),alt:"GC trace 1406"}})]),s._v(" "),a("p",[s._v("代码片段 5")]),s._v(" "),a("div",{staticClass:"language-bash line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-bash"}},[a("code",[s._v("gc "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1406")]),s._v(" @6.070s "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("11")]),s._v("%: "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0.051")]),s._v("+1.8+0.076 ms clock, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0.61")]),s._v("+2.0/2.5/0+0.91 ms cpu, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("8")]),s._v("-"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("11")]),s._v("-"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("6")]),s._v(" MB, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("13")]),s._v(" MB goal, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("12")]),s._v(" P\n\n// Memory\n8MB         "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Heap memory in-use before the Marking started\n11MB        "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Heap memory in-use after the Marking finished\n6MB         "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Heap memory marked as live after the Marking finished\n13MB        "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v(":")]),s._v(" Collection goal "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("for")]),s._v(" heap memory in-use after Marking finished\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br")])]),a("p",[s._v("如代码片段 5 所示，尽管堆内存大小达到 8MB，并未超过所允许的 12MB（译者注：不是 10MB 么），这次回收在前一次的 2ms （6.068s vs 6.070s）后就开始了。在此重大声明一下：如果回收器觉得提前开始回收效果更好的话，它会开始的。当前情形下，回收器提前开始工作可能是因为应用程序的内存分配繁重，使得回收器想要减少本次回收工作的 Mark Assist 的延时大小。")]),s._v(" "),a("p",[s._v("还有另外两个注意点：这次回收器一直在其目标范围内。标志结束后被占用的堆内存大小为 11MB 而不是 13MB，少了 2MB。标志结束后标志为活跃的堆内存大小为 6MB。")]),s._v(" "),a("p",[s._v("再来个温馨提示。我们可以通过添加"),a("code",[s._v("gcpacertrace=1")]),s._v("标识符来获取更多关于 GC 追踪的细节。它会使得回收器打印并发的追踪器内部的更多信息。")]),s._v(" "),a("p",[s._v("代码片段 6")]),s._v(" "),a("div",{staticClass:"language-bash line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-bash"}},[a("code",[s._v("$ "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v("export")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token assign-left variable"}},[s._v("GODEBUG")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("gctrace"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1")]),s._v(",gcpacertrace"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1")]),s._v(" ./app\n\nSample output:\ngc "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("5")]),s._v(" @0.071s "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0")]),s._v("%: "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0.018")]),s._v("+0.46+0.071 ms clock, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0.14")]),s._v("+0/0.38/0.14+0.56 ms cpu, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("29")]),s._v("-"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("29")]),s._v("-"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("29")]),s._v(" MB, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("30")]),s._v(" MB goal, "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("8")]),s._v(" P\n\npacer: sweep "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("done")]),s._v(" at heap size 29MB"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v(" allocated 0MB of spans"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v(" swept "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("3752")]),s._v(" pages at +6.183550e-004 pages/byte\n\npacer: assist "),a("span",{pre:!0,attrs:{class:"token assign-left variable"}},[s._v("ratio")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("+1.232155e+000 "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("scan "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1")]),s._v(" MB "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("in")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("70")]),s._v("-"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("71")]),s._v(" MB"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token assign-left variable"}},[s._v("workers")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("2")]),s._v("+0\n\npacer: "),a("span",{pre:!0,attrs:{class:"token assign-left variable"}},[s._v("H_m_prev")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("30488736")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token assign-left variable"}},[s._v("h_t")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("+2.334071e-001 "),a("span",{pre:!0,attrs:{class:"token assign-left variable"}},[s._v("H_T")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("37605024")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token assign-left variable"}},[s._v("h_a")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("+1.409842e+000 "),a("span",{pre:!0,attrs:{class:"token assign-left variable"}},[s._v("H_a")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("73473040")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token assign-left variable"}},[s._v("h_g")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("+1.000000e+000 "),a("span",{pre:!0,attrs:{class:"token assign-left variable"}},[s._v("H_g")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("60977472")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token assign-left variable"}},[s._v("u_a")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("+2.500000e-001 "),a("span",{pre:!0,attrs:{class:"token assign-left variable"}},[s._v("u_g")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("+2.500000e-001 "),a("span",{pre:!0,attrs:{class:"token assign-left variable"}},[s._v("W_a")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("308200")]),s._v(" goalΔ"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("+7.665929e-001 actualΔ"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("+1.176435e+000 u_a/u_g"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("+1.000000e+000\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br")])]),a("p",[s._v("追踪 GC 可以让我们了解很多关于应用程序健康状态和回收节奏的信息。回收器的执行速度在回收过程中扮演者重要角色。")]),s._v(" "),a("h2",{attrs:{id:"节奏调整"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#节奏调整"}},[s._v("#")]),s._v(" 节奏调整")]),s._v(" "),a("p",[s._v("回收器有一个用于决定回收开始时机的节奏调整算法。算法依赖一个反馈闭环。回收器用这个闭环来收集运行的应用信息和应用施加在堆上的压力。压力可以定义为给定时间内应用开辟堆内存的速度。正是这个压力决定着回收器需要运行的节奏。")]),s._v(" "),a("p",[s._v("开始回收工作前，回收器会计算自己觉得完成回收所需的时间。一旦回收开始，运行的应用会有附带的延时导致减缓应用任务的执行。每次回收都会增加应用程序的总体耗时。")]),s._v(" "),a("p",[s._v("一个误解是觉得减缓回收的节奏是提高性能的途径之一。事实上，推迟下次回收的开始时间只是推迟了附带延时的出现时间而已。支持回收器并不是减缓这个节奏。")]),s._v(" "),a("p",[s._v("我们可把 GC 百分比设置为某个大于 100% 的值。这样可以增加下次回收开始前可以开辟的堆内存大小，进而减缓回收节奏。千万不要这样做。")]),s._v(" "),a("p",[s._v("图 14"),a("br"),s._v(" "),a("img",{attrs:{src:t(560),alt:"different GC percentage results in different GC start"}})]),s._v(" "),a("p",[s._v("图 14 展示下一次回收开始前，不同 GC 百分比下所允许的新增堆内存大小。我们可以将由于等待更多堆内存被占用导致回收被减速的过程可视化。")]),s._v(" "),a("p",[s._v("试图直接干预回收节奏无法有效支持回收器。真正有用的是在回收操作之间或回收过程中完成更多工作。我们可以通过让所有工作在堆上减少开辟的内存大小或降低内存分配次数的方式达到想要的效果。")]),s._v(" "),a("blockquote",[a("p",[s._v("注：基本思想也即用尽可能小的堆来实现想要的吞吐量。记住咯：在云上环境运行时，最小化像堆内存这样的资源消耗是很重要的。")])]),s._v(" "),a("p",[s._v("图 15"),a("br"),s._v(" "),a("img",{attrs:{src:t(561),alt:"Optimized vs non-optimized app"}})]),s._v(" "),a("p",[s._v("代码片段 15 展示了本系列后续部分会用到的某个运行中的 Go 应用的一些数据。蓝色所示的版本表示没有任何优化的应用处理 10k 个请求的状况。绿色所示的版本表示发现并移除 4.48GB 无效内存分配后应用处理同样的 10k 个请求的状况。")]),s._v(" "),a("p",[s._v("观察两个版本平均回收节奏（2.08ms vs 1.96ms）。它们大致相等，差大约 2.0ms。两个版本的本质不同是回收之间所完成的工作量。应用每次回收的请求处理速度从 3.98 个涨到 7.13 个。同样回收节奏下，任务完成速度增长了 79.1%。由此可见，回收并没有因内存分配减少而减缓，而是保持了不变。收益源自两次回收之间工作量的提升。")]),s._v(" "),a("p",[s._v("调整回收速度来推迟延时代价并不能提高应用的性能。真正有效的是减少回收器需要运行的时间长度，进而降低附带的延时代价。回收器附带的延时代价解释完了，但容我明确地作个小结。")]),s._v(" "),a("h2",{attrs:{id:"回收器延时代价"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#回收器延时代价"}},[s._v("#")]),s._v(" 回收器延时代价")]),s._v(" "),a("p",[s._v("每次回收会给应用程序带来两种延时。第一个是窃取 CPU 容量。这个窃取导致应用无法在回收期间满血运行。应用协程此时和回收器协程共享 P 或协助回收工作（Mark Assist）。")]),s._v(" "),a("p",[s._v("图 16"),a("br"),s._v(" "),a("img",{attrs:{src:t(383),alt:"MPG for GC start"}})]),s._v(" "),a("p",[s._v("图 16 展示应用程序只能够利用 75% 的 CPU 容量来执行任务。因为回收器已经占用 P1。整个回收过程大部分时间都是这种状态。")]),s._v(" "),a("p",[s._v("图 17"),a("br"),s._v(" "),a("img",{attrs:{src:t(384),alt:"MPG for Mark Assist"}})]),s._v(" "),a("p",[s._v("图 17 展示了应用此时（通常只会持续仅几微妙）只能利用一般的 CPU 容量来执行应用任务。因为 P3 的协程正在执行 Mark Assist 而回收器则占用了 P1。")]),s._v(" "),a("blockquote",[a("p",[s._v("注：对于活跃的堆内存，标志 1MB 通常耗费 4 CPU-毫秒（例如，将活跃的堆内存大小换算为 MB，除以 （0.25 * CPU 数），即可估算标志阶段耗费的毫秒数）。标志事实上以 1MB/ms 的速度运行，但只占用全部 CPU 的 1/4。")])]),s._v(" "),a("p",[s._v("第二种延时来自回收过程中出现的 STW 延时。STW 时间区间内没有任何协程能够执行应用任务。应用本质处于暂停状态。")]),s._v(" "),a("p",[s._v("图 18"),a("br"),s._v(" "),a("img",{attrs:{src:t(385),alt:"STW"}})]),s._v(" "),a("p",[s._v("图 18 展示的是 STW 时所有协程暂停的状态。每次回收都会发生两次 STW 延时。如果应用程序是健康的话，回收器应该能够把大多数回收的总 STW 时间保持在 100 微妙以下。")]),s._v(" "),a("p",[s._v("至此，我们了解到回收的不同阶段、内存是如何算大小的、节奏调整的方式、回收器给运行的应用带来的不同延时。有了这些知识，我们如何助攻回收器的问题可以回答了。")]),s._v(" "),a("h2",{attrs:{id:"抱有怜悯之心"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#抱有怜悯之心"}},[s._v("#")]),s._v(" 抱有怜悯之心")]),s._v(" "),a("p",[s._v("对回收器抱有怜悯之心要求我们减少对堆内存的压力。还记得吧：压力定义为给定时间内应用程序开辟堆内存的速度。一旦压力减轻，回收器带来的延时就会降低。正是 GC 延时拖慢你的应用程序的。")]),s._v(" "),a("p",[s._v("降低 GC 延时的方式是挖掘并移除应用中不必要的内存分配。这样做能够在以下几个方面帮助回收器。")]),s._v(" "),a("p",[s._v("有助于回收器：")]),s._v(" "),a("ul",[a("li",[s._v("维持尽可能小的堆内存")]),s._v(" "),a("li",[s._v("找到一个最优的连贯节奏")]),s._v(" "),a("li",[s._v("保持完成每次回收目标")]),s._v(" "),a("li",[s._v("最小化每次回收、STW 和 Mark Assist 的时长")])]),s._v(" "),a("p",[s._v("上述所有都有助于减少回收器给应用程序增添的延时。这样做可以提高应用的性能和吞吐量。回收的节奏对此没有任何联系。以下是我们能够实施的，用来作出更好的工程决定以减轻堆压力的建议。")]),s._v(" "),a("p",[a("strong",[s._v("理解应用程序正在执行的任务本质")]),a("br"),s._v("\n理解任务要求我们确保自己使用合理数目的协程来完成手头的工作。 CPU 和 IO 限定的任务是不同的，需要采用不同的工程建议。")]),s._v(" "),a("p",[a("a",{attrs:{href:"https://www.ardanlabs.com/blog/2018/12/scheduling-in-go-part3.html",target:"_blank",rel:"noopener noreferrer"}},[s._v("Scheduling In Go : Part III - Concurrency"),a("OutboundLink")],1)]),s._v(" "),a("p",[a("strong",[s._v("理解定义的数据和他们在应用里的传递方式")]),a("br"),s._v("\n理解数据意味着了解手头正在解决的问题。数据语义一致性是维护数据完整性并允许我们知道（通过阅读源代码）何时应该倾向于选择堆内存分配而不是栈内存分配。")]),s._v(" "),a("p",[a("a",{attrs:{href:"https://www.ardanlabs.com/blog/2017/06/design-philosophy-on-data-and-semantics.html",target:"_blank",rel:"noopener noreferrer"}},[s._v("Design Philosophy On Data And Semantics"),a("OutboundLink")],1)]),s._v(" "),a("h2",{attrs:{id:"结论"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#结论"}},[s._v("#")]),s._v(" 结论")]),s._v(" "),a("p",[s._v("如果你花费时间聚焦于减少内存分配，你做得正是一个 Go 开发者能够帮助垃圾回收器的份内事。我们不可能写出不用分配内存的应用，因此，分辨出有效（能够帮助应用程序）的和无效（有损应用程序）的内存分配是非常重要的。然后，对垃圾回收器保持堆内存健康和程序稳定运行抱有信心和信任即可。")]),s._v(" "),a("p",[s._v("引入垃圾回收器是一个很漂亮的权衡。我会接受垃圾回收的代价，这样就不用困扰于内存管理的负担。Go 想要的是允许作为开发者的我们有效工作的同时写出足够快的程序。垃圾回收器是支撑这个现实的重要部分。"),a("RouterLink",{attrs:{to:"/_post/garbage-collection-in-go/part2-gctraces/"}},[s._v("下一篇博文")]),s._v(" 会演示一个示例网页应用以及实地使用工具来查看细节。")],1)])}),[],!1,null,null,null);a.default=r.exports}}]);