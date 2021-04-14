(window.webpackJsonp=window.webpackJsonp||[]).push([[5],{457:function(t,s,a){t.exports=a.p+"assets/img/socket-waitq.cc727dfc.jpg"},613:function(t,s,a){t.exports=a.p+"assets/img/arch.00623858.jpg"},614:function(t,s,a){t.exports=a.p+"assets/img/data-recv-workflow.84c61f7e.jpg"},615:function(t,s,a){t.exports=a.p+"assets/img/interrupt-handling.2859fb1e.png"},616:function(t,s,a){t.exports=a.p+"assets/img/cpu-interrupt.6f4d9668.jpg"},617:function(t,s,a){t.exports=a.p+"assets/img/runq-in-kernel.2a8e4b68.jpg"},618:function(t,s,a){t.exports=a.p+"assets/img/kernel-recv-data.b3f48b08.jpg"},619:function(t,s,a){t.exports=a.p+"assets/img/wake-up-process.67c7bb5a.jpg"},620:function(t,s,a){t.exports=a.p+"assets/img/put-process-to-waitq.ac75824c.jpg"},621:function(t,s,a){t.exports=a.p+"assets/img/wake-up-process-upon-recv.0d6ebb7a.jpg"},622:function(t,s,a){t.exports=a.p+"assets/img/put-process-into-runq.32bcb021.jpg"},623:function(t,s,a){t.exports=a.p+"assets/img/select-vs-epoll.8a43d9b0.jpg"},624:function(t,s,a){t.exports=a.p+"assets/img/epoll_create.876c189e.jpg"},625:function(t,s,a){t.exports=a.p+"assets/img/epoll_ctl.94b026e4.jpg"},626:function(t,s,a){t.exports=a.p+"assets/img/add-to-rdlist.368ca6ff.jpg"},627:function(t,s,a){t.exports=a.p+"assets/img/epoll_wait.0654739d.jpg"},628:function(t,s,a){t.exports=a.p+"assets/img/epoll-wakeup.ac189eb6.jpg"},629:function(t,s,a){t.exports=a.p+"assets/img/epoll-demo.6bd7a317.jpg"},788:function(t,s,a){"use strict";a.r(s);var e=a(6),n=Object(e.a)({},(function(){var t=this,s=t.$createElement,e=t._self._c||s;return e("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[e("h1",{attrs:{id:"学点-epoll"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#学点-epoll"}},[t._v("#")]),t._v(" 学点 epoll")]),t._v(" "),e("p",[t._v("从事服务端开发，少不了要接触网络编程。epoll 作为 linux 下高性能网络服务器的必备技术至关重要，nginx、redis、skynet 和大部分游戏服务器都使用到这一多路复用技术。")]),t._v(" "),e("p",[t._v("网上虽然也有不少讲解 epoll 的文章，但要不是过于浅显，就是陷入源码解析，很少能有通俗易懂的。本文希望帮助缺乏专业背景知识的读者理清 epoll 的原理。")]),t._v(" "),e("h2",{attrs:{id:"epoll-为什么性能好"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#epoll-为什么性能好"}},[t._v("#")]),t._v(" epoll 为什么性能好")]),t._v(" "),e("p",[t._v("本文会从网卡接收数据的流程讲起，串联起 CPU 中断、操作系统进程调度等知识，再一步步分析阻塞接收数据、select 到 epoll 的进化过程，最后探究 epoll 的实现细节。主要分为以下几个部分")]),t._v(" "),e("ol",[e("li",[t._v("从网卡接收数据说起")]),t._v(" "),e("li",[t._v("如何知道接收了数据？")]),t._v(" "),e("li",[t._v("进程阻塞为什么不占用 CPU 资源？")]),t._v(" "),e("li",[t._v("内核接收网络数据全过程")]),t._v(" "),e("li",[t._v("同时监视多个 socket 的简单方法")]),t._v(" "),e("li",[t._v("epoll 的设计思路")]),t._v(" "),e("li",[t._v("epoll 的原理和流程")]),t._v(" "),e("li",[t._v("epoll 的实现细节")]),t._v(" "),e("li",[t._v("结论")])]),t._v(" "),e("h2",{attrs:{id:"_1-从网卡接收数据说起"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#_1-从网卡接收数据说起"}},[t._v("#")]),t._v(" 1. 从网卡接收数据说起")]),t._v(" "),e("p",[t._v("下图是一个典型的计算机结构图，计算机由 CPU、存储器（内存）、网络接口等部件组成。了解 epoll 本质的第一步，要从硬件的角度看计算机怎样接收网络数据。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(613),alt:"微型计算机组成结构"}})]),t._v(" "),e("p",[t._v("下图展示了网卡接收数据的过程。① 阶段，网卡收到网线传来的数据；经过 ② 阶段的硬件电路的传输；最终将数据写入到内存中的某个地址上（③ 阶段）。这个过程涉及到 DMA 传输、IO 通路选择等硬件有关的知识，但这里只需知道：网卡会把接收到的数据写入内存。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(614),alt:"网卡接收数据的过程"}})]),t._v(" "),e("p",[t._v("通过硬件传输，网卡接收的数据存放到内存。操作系统就可以去读取它们。")]),t._v(" "),e("h2",{attrs:{id:"_2-如何知道接收了数据"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#_2-如何知道接收了数据"}},[t._v("#")]),t._v(" 2. 如何知道接收了数据？")]),t._v(" "),e("p",[t._v("了解 epoll 本质的第二步，要从 CPU 的角度来看数据接收。要理解这个问题，要先了解一个概念--中断。")]),t._v(" "),e("p",[t._v("计算机执行的程序会有不同的优先级。比如，当计算机收到断电信号时（电容可以保存少许电量，供 CPU 运行很短的一小段时间），它应立即去保存数据，保存数据的程序具有较高的优先级。")]),t._v(" "),e("p",[t._v("一般而言，由硬件产生的信号需要 CPU 立马做出回应（不然数据可能就丢失），所以它的优先级很高。CPU 理应中断掉正在执行的程序，去做出响应；当 CPU 完成对硬件的响应后，再重新执行用户程序。中断的过程如下图，和函数调用差不多。只不过函数调用是事先定好位置，而中断的位置由“信号”决定。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(615),alt:"中断程序调用"}})]),t._v(" "),e("p",[t._v("以键盘为例。用户按下某个按键时，键盘会给 CPU 的中断引脚发出一个高电平。CPU 能够捕获这个信号，然后执行键盘中断程序。下图展示了各种硬件通过中断与 CPU 交互。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(616),alt:"CPU 中断"}})]),t._v(" "),e("p",[t._v("现在可以回答本节提出的问题了：当网卡把数据写入到内存后，网卡向 CPU 发出一个中断信号，操作系统便能得知有新数据到来，再通过网卡中断程序去处理数据。")]),t._v(" "),e("h2",{attrs:{id:"_3-进程阻塞为什么不占用-cpu-资源"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#_3-进程阻塞为什么不占用-cpu-资源"}},[t._v("#")]),t._v(" 3. 进程阻塞为什么不占用 CPU 资源？")]),t._v(" "),e("p",[t._v("了解 epoll 本质的第三步，要从操作系统进程调度的角度来看数据接收。阻塞是进程调度的关键一环，指的是进程在等待某事件（如接收到网络数据）发生之前的等待状态，"),e("code",[t._v("recv")]),t._v("、"),e("code",[t._v("select")]),t._v(" 和 "),e("code",[t._v("epoll")]),t._v(" 都是阻塞方法。了解进程阻塞不占用CPU资源的原因，也就能够了解这一步。")]),t._v(" "),e("p",[t._v("为简单起见，我们从普通的 "),e("code",[t._v("recv")]),t._v(" 接收开始分析，先看看下面代码：")]),t._v(" "),e("div",{staticClass:"language-c line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-c"}},[e("code",[e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("//创建socket")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" s "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("socket")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("AF_INET"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" SOCK_STREAM"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("   \n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("//绑定")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("bind")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("s"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("//监听")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("listen")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("s"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("//接受客户端连接")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" c "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("accept")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("s"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("//接收客户端数据")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("recv")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("c"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("//将数据打印出来")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("printf")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[t._v("1")]),e("br"),e("span",{staticClass:"line-number"},[t._v("2")]),e("br"),e("span",{staticClass:"line-number"},[t._v("3")]),e("br"),e("span",{staticClass:"line-number"},[t._v("4")]),e("br"),e("span",{staticClass:"line-number"},[t._v("5")]),e("br"),e("span",{staticClass:"line-number"},[t._v("6")]),e("br"),e("span",{staticClass:"line-number"},[t._v("7")]),e("br"),e("span",{staticClass:"line-number"},[t._v("8")]),e("br"),e("span",{staticClass:"line-number"},[t._v("9")]),e("br"),e("span",{staticClass:"line-number"},[t._v("10")]),e("br"),e("span",{staticClass:"line-number"},[t._v("11")]),e("br"),e("span",{staticClass:"line-number"},[t._v("12")]),e("br")])]),e("p",[t._v("这是一段最基础的网络编程代码，先新建 socket 对象，依次调用 "),e("code",[t._v("bind")]),t._v("、"),e("code",[t._v("listen")]),t._v("、"),e("code",[t._v("accept")]),t._v("，最后调用 "),e("code",[t._v("recv")]),t._v(" 接收数据。"),e("code",[t._v("recv")]),t._v(" 是个阻塞方法。当程序运行到 "),e("code",[t._v("recv")]),t._v(" 时，它会一直等待直到接收到数据才往下执行。")]),t._v(" "),e("p",[t._v("那么阻塞的原理是什么呢？")]),t._v(" "),e("h3",{attrs:{id:"工作队列"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#工作队列"}},[t._v("#")]),t._v(" 工作队列")]),t._v(" "),e("p",[t._v("操作系统为了支持多任务，实现了进程调度的功能，会把进程分为"),e("strong",[t._v("运行")]),t._v("和"),e("strong",[t._v("等待")]),t._v("等几种状态。运行状态是进程获得 CPU 使用权，正在执行代码的状态；等待状态是阻塞状态，比如上述程序运行到 "),e("code",[t._v("recv")]),t._v(" 时，程序会从运行状态变为等待状态，接收到数据后又变回运行状态。操作系统会分时执行各个运行状态的进程。由于速度很快，看上去就像是同时执行多个任务。")]),t._v(" "),e("p",[t._v("下图的计算机中运行着 A、B、C 三个进程，其中进程 A 执行着上述基础网络程序。一开始这 3 个进程都被操作系统的工作队列所引用，处于运行状态，会分时执行。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(617),alt:"工作队列有 A、B 和 C 三个进程"}})]),t._v(" "),e("h3",{attrs:{id:"等待队列"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#等待队列"}},[t._v("#")]),t._v(" 等待队列")]),t._v(" "),e("p",[t._v("当进程 A 执行到创建 socket 的语句时，操作系统会创建一个由文件系统管理的 socket 对象（如下图）。这个 socket 对象包含了发送缓冲区、接收缓冲区、等待队列等成员。等待队列是个非常重要的结构，它指向所有需要等待该 socket 事件的进程。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(457),alt:"创建 socket"}})]),t._v(" "),e("p",[t._v("当程序执行到 "),e("code",[t._v("recv")]),t._v(" 时，操作系统会将进程 A 从工作队列移动到该 socket 的等待队列（如下图）。由于工作队列只剩下了进程 B 和 C，依据进程调度，CPU 会轮流执行这两个进程的程序，不会执行进程A的程序。所以进程A被阻塞，不会往下执行代码，也不会占用CPU资源。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(457),alt:"socket 的等待队列"}})]),t._v(" "),e("blockquote",[e("p",[t._v("PS：操作系统添加等待队列只是添加了对这个“等待中”进程的引用，以便在接收到数据时获取进程对象将其唤醒，而非直接将进程管理纳入自己之下。上图为了方便说明，直接将进程挂到等待队列之下。")])]),t._v(" "),e("h3",{attrs:{id:"唤醒进程"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#唤醒进程"}},[t._v("#")]),t._v(" 唤醒进程")]),t._v(" "),e("p",[t._v("当 socket 接收到数据后，操作系统将该 socket 等待队列的进程重新放回到工作队列，该进程变成运行状态，继续执行代码。也由于 socket 的接收缓冲区已经有了数据，"),e("code",[t._v("recv")]),t._v(" 可以返回接收到的数据。")]),t._v(" "),e("h2",{attrs:{id:"_4-内核接收网络数据全过程"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#_4-内核接收网络数据全过程"}},[t._v("#")]),t._v(" 4. 内核接收网络数据全过程")]),t._v(" "),e("p",[e("strong",[t._v("这一步涉及网卡、中断、进程调度的知识，叙述阻塞 "),e("code",[t._v("recv")]),t._v(" 情况下，内核接收数据全过程。")])]),t._v(" "),e("p",[t._v("如下图所示，进程在 "),e("code",[t._v("recv")]),t._v(" 阻塞期间，计算机收到了对端传送的数据（步骤 ①）。数据经由网卡传送到内存（步骤 ②），然后网卡通过中断信号通知 CPU 有数据到达，CPU 执行中断程序（步骤 ③）。此处的中断程序主要有两项功能，先将网络数据写入到对应 socket 的接收缓冲区里面（步骤 ④），再唤醒进程 A（步骤 ⑤），重新将进程 A 放入工作队列中。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(618),alt:"内核接收数据全过程"}})]),t._v(" "),e("p",[t._v("唤醒进程的过程如下图所示。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(619),alt:"唤醒进程"}})]),t._v(" "),e("p",[t._v("以上是内核接收数据全过程")]),t._v(" "),e("p",[t._v("这里留有两个思考题，大家先想一想。")]),t._v(" "),e("ol",[e("li",[t._v("操作系统如何知道网络数据对应于哪个 socket？")]),t._v(" "),e("li",[t._v("如何同时监视多个 socket 的数据？")])]),t._v(" "),e("p",[t._v("问题 1：因为一个 socket 对应着一个端口号，而网络数据包包含 IP 和端口的信息，内核可以通过端口号找到对应的 socket。当然，为了提高处理速度，操作系统会维护端口号到 socket 的索引结构，以快速读取。")]),t._v(" "),e("p",[t._v("问题 2 是多路复用的重中之重，是本文后半部分的重点！")]),t._v(" "),e("h2",{attrs:{id:"_5-同时监视多个-socket-的简单方法"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#_5-同时监视多个-socket-的简单方法"}},[t._v("#")]),t._v(" 5. 同时监视多个 socket 的简单方法")]),t._v(" "),e("p",[t._v("服务端需要管理多个客户端连接，而 "),e("code",[t._v("recv")]),t._v(" 只能监视单个 socket。这种矛盾下，人们开始寻找监视多个 socket 的方法。epoll 的要义是高效地监视多个 socket。从历史发展角度看，必然先出现一种不太高效的方法，人们再加以改进。只有先理解了不太高效的方法，才能够理解 epoll 的本质。")]),t._v(" "),e("p",[t._v("假如能够预先传入一个 socket 列表，且列表中的 socket 都没有数据，挂起进程直到有一个 socket 收到数据，唤醒进程。这种方法很直接，也是 select 的设计思想。")]),t._v(" "),e("p",[t._v("为方便理解，我们先复习 select 的用法。在如下的代码中，先准备一个数组 "),e("code",[t._v("fds")]),t._v("，让 "),e("code",[t._v("fds")]),t._v(" 存放所有需要监视的 socket。然后调用 select，如果 "),e("code",[t._v("fds")]),t._v(" 的所有 socket 都没有数据，"),e("code",[t._v("select")]),t._v(" 会阻塞，直到有一个 socket 接收到数据，"),e("code",[t._v("select")]),t._v(" 返回，唤醒进程。用户可以遍历 "),e("code",[t._v("fds")]),t._v("，通过 "),e("code",[t._v("FD_ISSET")]),t._v(" 判断具体哪个 socket 收到数据，然后做出处理。")]),t._v(" "),e("div",{staticClass:"language-c line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-c"}},[e("code",[e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" s "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("socket")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("AF_INET"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" SOCK_STREAM"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("  \n"),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("bind")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("s"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("listen")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("s"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n\n"),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" fds"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v("  存放需要监听的socket\n\n"),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("while")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" n "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("select")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" fds"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n    "),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("for")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" i"),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" i "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("<")]),t._v(" fds"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("count"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" i"),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("++")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n        "),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("if")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("FD_ISSET")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("fds"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("[")]),t._v("i"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("]")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n            "),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("//fds[i]的数据处理")]),t._v("\n        "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n    "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])]),t._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[t._v("1")]),e("br"),e("span",{staticClass:"line-number"},[t._v("2")]),e("br"),e("span",{staticClass:"line-number"},[t._v("3")]),e("br"),e("span",{staticClass:"line-number"},[t._v("4")]),e("br"),e("span",{staticClass:"line-number"},[t._v("5")]),e("br"),e("span",{staticClass:"line-number"},[t._v("6")]),e("br"),e("span",{staticClass:"line-number"},[t._v("7")]),e("br"),e("span",{staticClass:"line-number"},[t._v("8")]),e("br"),e("span",{staticClass:"line-number"},[t._v("9")]),e("br"),e("span",{staticClass:"line-number"},[t._v("10")]),e("br"),e("span",{staticClass:"line-number"},[t._v("11")]),e("br"),e("span",{staticClass:"line-number"},[t._v("12")]),e("br"),e("span",{staticClass:"line-number"},[t._v("13")]),e("br"),e("span",{staticClass:"line-number"},[t._v("14")]),e("br")])]),e("h3",{attrs:{id:"select-的流程"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#select-的流程"}},[t._v("#")]),t._v(" select 的流程")]),t._v(" "),e("p",[t._v("select 的实现思路很直接。假如程序同时监视如下图的 sock1、sock2 和 sock3 三个 socket，那么在调用 "),e("code",[t._v("select")]),t._v(" 之后，操作系统把进程 A 分别加入这三个 socket 的等待队列。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(620),alt:"操作系统把进程 A 分别加入这三个 socket 的等待队列"}})]),t._v(" "),e("p",[t._v("任何一个 socket 收到数据后，中断程序将唤起进程。下图展示了 sock2 接收到数据的处理流程。")]),t._v(" "),e("blockquote",[e("p",[t._v("PS："),e("code",[t._v("recv")]),t._v(" 和 "),e("code",[t._v("select")]),t._v(" 的中断回调可以设置成不同的内容。")])]),t._v(" "),e("p",[e("img",{attrs:{src:a(621),alt:"sock2 接收到了数据，中断程序唤起进程 A"}})]),t._v(" "),e("p",[t._v("所谓唤起进程，就是将进程从所有的等待队列移除，加入到工作队列里面，如下图所示。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(622),alt:"将进程 A 从所有等待队列移除，再加入到工作队列里面"}})]),t._v(" "),e("p",[t._v("经由这些步骤，唤醒进程 A 后，它知道至少有一个 socket 接收了数据。程序只需遍历一遍 socket 列表，就可以得到就绪的 socket。")]),t._v(" "),e("p",[t._v("这种简单方式行之有效，在几乎所有操作系统都有对应的实现。")]),t._v(" "),e("p",[e("strong",[t._v("但是简单的方法往往有缺点")]),t._v("，主要是：")]),t._v(" "),e("ol",[e("li",[t._v("每次调用 "),e("code",[t._v("select")]),t._v(" 都需要将进程加入到所有监视 socket 的等待队列，每次唤醒都需要从每个队列移除。这里涉及了"),e("strong",[t._v("两次遍历")]),t._v("，而且每次都要将整个 "),e("code",[t._v("fds")]),t._v(" 列表传递给内核，有一定的开销。正是因为遍历操作开销大，出于效率的考量，才会规定 "),e("code",[t._v("select")]),t._v(" 的最大监视数量，默认只能监视 1024 个 socket。")]),t._v(" "),e("li",[t._v("进程被唤醒后，程序并不知道哪些 socket 收到数据，还需要遍历一次。")])]),t._v(" "),e("p",[t._v("那么，有没有减少遍历的方法？有没有保存就绪 socket 的方法？这两个问题便是 epoll 技术要解决的。")]),t._v(" "),e("blockquote",[e("p",[t._v("补充说明： 本节只解释了 "),e("code",[t._v("select")]),t._v(" 的一种情形。当程序调用 "),e("code",[t._v("select")]),t._v(" 时，内核会先遍历一遍 socket。如果有一个以上的 socket 接收缓冲区有数据，那么 select 直接返回，不会阻塞。这也是为什么 "),e("code",[t._v("select")]),t._v(" 的返回值有可能大于 1 的原因之一。如果没有 socket 有数据，进程才会阻塞。")])]),t._v(" "),e("h2",{attrs:{id:"_6-epoll-的设计思路"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#_6-epoll-的设计思路"}},[t._v("#")]),t._v(" 6. epoll 的设计思路")]),t._v(" "),e("p",[t._v("epoll 是在 select 出现 N 多年后才被发明的，是 select 和 poll 的增强版本。epoll 通过以下一些措施来改进效率。")]),t._v(" "),e("h3",{attrs:{id:"措施-1-功能分离"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#措施-1-功能分离"}},[t._v("#")]),t._v(" 措施 1：功能分离")]),t._v(" "),e("p",[t._v("select 低效的原因之一是将"),e("strong",[t._v("维护等待队列")]),t._v("和"),e("strong",[t._v("阻塞进程")]),t._v("两个步骤合二为一。如下图所示，每次调用 select 都需要这两步操作。然而大多数应用场景中，需要监视的 socket 相对固定，并不需要每次都修改。epoll 将这两个操作分开，先用 "),e("code",[t._v("epoll_ctl")]),t._v(" 维护等待队列，再调用 "),e("code",[t._v("epoll_wait")]),t._v(" 阻塞进程。显而易见的，效率就能得到提升。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(623),alt:"相比 select，epoll 拆分了功能"}})]),t._v(" "),e("p",[t._v("为方便理解后续的内容，我们先复习下 epoll 的用法。如下的代码先用 "),e("code",[t._v("epoll_create")]),t._v(" 创建一个 epoll 对象 "),e("code",[t._v("epfd")]),t._v("，再通过 "),e("code",[t._v("epoll_ctl")]),t._v(" 将需要监视的 socket 添加到 "),e("code",[t._v("epfd")]),t._v("，最后调用 "),e("code",[t._v("epoll_wait")]),t._v(" 等待数据。")]),t._v(" "),e("div",{staticClass:"language-c line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-c"}},[e("code",[e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" s "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("socket")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("AF_INET"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" SOCK_STREAM"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("0")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("   \n"),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("bind")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("s"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("listen")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("s"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n\n"),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" epfd "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("epoll_create")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("epoll_ctl")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("epfd"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("//将所有需要监听的socket添加到epfd中")]),t._v("\n\n"),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("while")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("int")]),t._v(" n "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("epoll_wait")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n    "),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("for")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("接收到数据的socket"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n        "),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("//处理")]),t._v("\n    "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])]),t._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[t._v("1")]),e("br"),e("span",{staticClass:"line-number"},[t._v("2")]),e("br"),e("span",{staticClass:"line-number"},[t._v("3")]),e("br"),e("span",{staticClass:"line-number"},[t._v("4")]),e("br"),e("span",{staticClass:"line-number"},[t._v("5")]),e("br"),e("span",{staticClass:"line-number"},[t._v("6")]),e("br"),e("span",{staticClass:"line-number"},[t._v("7")]),e("br"),e("span",{staticClass:"line-number"},[t._v("8")]),e("br"),e("span",{staticClass:"line-number"},[t._v("9")]),e("br"),e("span",{staticClass:"line-number"},[t._v("10")]),e("br"),e("span",{staticClass:"line-number"},[t._v("11")]),e("br"),e("span",{staticClass:"line-number"},[t._v("12")]),e("br"),e("span",{staticClass:"line-number"},[t._v("13")]),e("br")])]),e("p",[t._v("功能分离，使得 epoll 有了优化的可能。")]),t._v(" "),e("h3",{attrs:{id:"措施2-就绪列表"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#措施2-就绪列表"}},[t._v("#")]),t._v(" 措施2：就绪列表")]),t._v(" "),e("p",[t._v("select 低效的另一个原因在于程序不知道哪些 socket 收到数据，只能一个个遍历。如果内核维护一个"),e("strong",[t._v("就绪列表")]),t._v("，引用收到数据的 socket，就能避免遍历。如下图所示，计算机共有三个 socket，收到数据的 sock2 和 sock3 被 "),e("code",[t._v("rdlist")]),t._v("（就绪列表）所引用。当进程被唤醒后，只要获取 "),e("code",[t._v("rdlist")]),t._v(" 的内容，就能够知道哪些 socket 收到数据。")]),t._v(" "),e("h2",{attrs:{id:"_7-epoll-的原理和流程"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#_7-epoll-的原理和流程"}},[t._v("#")]),t._v(" 7. epoll 的原理和流程")]),t._v(" "),e("p",[t._v("本节会以示例和图表来讲解 epoll 的原理和流程。")]),t._v(" "),e("h3",{attrs:{id:"创建-epoll-对象"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#创建-epoll-对象"}},[t._v("#")]),t._v(" 创建 epoll 对象")]),t._v(" "),e("p",[t._v("如下图所示，某个进程调用 "),e("code",[t._v("epoll_create")]),t._v(" 方法时，内核会创建一个 "),e("code",[t._v("eventpoll")]),t._v(" 对象（也就是程序中 "),e("code",[t._v("epfd")]),t._v(" 所代表的对象）。"),e("code",[t._v("eventpoll")]),t._v(" 对象也是文件系统的一员，和 socket 一样，它也会有等待队列。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(624),alt:"内核创建 eventpoll 对象"}})]),t._v(" "),e("p",[t._v("创建一个代表该 epoll 的 "),e("code",[t._v("eventpoll")]),t._v(" 对象是必须的，因为内核要维护“就绪列表”等数据，“就绪列表”可以作为 "),e("code",[t._v("eventpoll")]),t._v(" 的成员。")]),t._v(" "),e("h3",{attrs:{id:"维护监视列表"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#维护监视列表"}},[t._v("#")]),t._v(" 维护监视列表")]),t._v(" "),e("p",[t._v("创建 epoll 对象后，可以用 "),e("code",[t._v("epoll_ctl")]),t._v(" 添加或删除所要监听的 socket。以下图添加 socket 为例，如果通过 "),e("code",[t._v("epoll_ctl")]),t._v(" 添加 sock1、sock2 和 sock3 的监视，内核会将 "),e("code",[t._v("eventpoll")]),t._v(" 添加到这三个 socket 的等待队列。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(625),alt:"添加所要监听的 socket"}})]),t._v(" "),e("p",[t._v("socket 收到数据后，中断程序会操作 "),e("code",[t._v("eventpoll")]),t._v(" 对象，而不是直接操作进程。")]),t._v(" "),e("h3",{attrs:{id:"接收数据"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#接收数据"}},[t._v("#")]),t._v(" 接收数据")]),t._v(" "),e("p",[t._v("socket 收到数据后，中断程序会给 "),e("code",[t._v("eventpoll")]),t._v(" 的“就绪列表”添加 socket 引用。如下图展示的是 sock2 和 sock3 收到数据后，中断程序让 "),e("code",[t._v("rdlist")]),t._v(" 引用这两个 socket。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(626),alt:"给就绪列表添加引用"}})]),t._v(" "),e("p",[e("code",[t._v("eventpoll")]),t._v(" 对象相当于 socket 和进程之间的中介，socket 的数据接收并不直接影响进程，而是通过改变 "),e("code",[t._v("eventpoll")]),t._v(" 的就绪列表来改变进程状态。")]),t._v(" "),e("p",[t._v("程序执行到 "),e("code",[t._v("epoll_wait")]),t._v(" 时，如果 "),e("code",[t._v("rdlist")]),t._v(" 已经引用了 socket，那么 "),e("code",[t._v("epoll_wait")]),t._v(" 直接返回。如果 "),e("code",[t._v("rdlist")]),t._v(" 为空，阻塞进程。")]),t._v(" "),e("h3",{attrs:{id:"阻塞和唤醒进程"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#阻塞和唤醒进程"}},[t._v("#")]),t._v(" 阻塞和唤醒进程")]),t._v(" "),e("p",[t._v("假设计算机正在运行进程 A 和进程 B，某时刻进程 A 运行到了 "),e("code",[t._v("epoll_wait")]),t._v(" 语句。如下图所示，内核会将进程 A 放入 "),e("code",[t._v("eventpoll")]),t._v(" 的等待队列，阻塞进程。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(627),alt:"epoll_wait 阻塞进程"}})]),t._v(" "),e("p",[t._v("socket 接收到数据后，中断程序一方面修改 "),e("code",[t._v("rdlist")]),t._v("，另一方面唤醒 "),e("code",[t._v("eventpoll")]),t._v(" 等待队列中的进程，进程 A 再次进入运行状态（如下图）。也因为 "),e("code",[t._v("rdlist")]),t._v(" 的存在，进程 A 可以知道哪些 socket 发生了变化。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(628),alt:"epoll 唤醒进程"}})]),t._v(" "),e("h2",{attrs:{id:"_8-epoll-的实现细节"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#_8-epoll-的实现细节"}},[t._v("#")]),t._v(" 8. epoll 的实现细节")]),t._v(" "),e("p",[t._v("至此，相信读者对 epoll 的本质已经有一定了解。但我们还留有一个问题："),e("code",[t._v("eventpoll")]),t._v(" 的数据结构是什么样子？")]),t._v(" "),e("p",[t._v("再留两个问题")]),t._v(" "),e("ul",[e("li",[t._v("就绪队列应该应使用什么数据结构？")]),t._v(" "),e("li",[e("code",[t._v("eventpoll")]),t._v(" 应使用什么数据结构来管理通过 "),e("code",[t._v("epoll_ctl")]),t._v(" 添加或删除的 socket？")])]),t._v(" "),e("p",[t._v("如下图所示，"),e("code",[t._v("eventpoll")]),t._v(" 包含了 "),e("code",[t._v("lock")]),t._v("、"),e("code",[t._v("mtx")]),t._v("、"),e("code",[t._v("wq")]),t._v("（等待队列）、"),e("code",[t._v("rdlist")]),t._v(" 等成员。"),e("code",[t._v("rdlist")]),t._v(" 和 "),e("code",[t._v("rbr")]),t._v(" 是我们所关心的。")]),t._v(" "),e("p",[e("img",{attrs:{src:a(629),alt:"epoll原理示意图"}})]),t._v(" "),e("h3",{attrs:{id:"就绪列表的数据结构"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#就绪列表的数据结构"}},[t._v("#")]),t._v(" 就绪列表的数据结构")]),t._v(" "),e("p",[t._v("就绪列表引用着就绪的 socket，所以它应能够快速地插入数据。")]),t._v(" "),e("p",[t._v("程序可能随时调用 "),e("code",[t._v("epoll_ctl")]),t._v(" 添加监视 socket，也可能随时删除。删除时，若该 socket 已经存放在就绪列表，它也应该被移除。")]),t._v(" "),e("p",[t._v("所以就绪列表应是一种能够快速插入和删除的数据结构。双向链表就是这样一种数据结构，epoll 使用双向链表来实现就绪队列（对应上图的 "),e("code",[t._v("rdllist")]),t._v("）。")]),t._v(" "),e("h3",{attrs:{id:"索引结构"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#索引结构"}},[t._v("#")]),t._v(" 索引结构")]),t._v(" "),e("p",[t._v("既然 epoll 将“维护监视队列”和“进程阻塞”分离，也意味着需要有个数据结构来保存监视的 socket。至少要方便地添加和移除，还要便于搜索，以避免重复添加。红黑树是一种自平衡二叉查找树，搜索、插入和删除时间复杂度都是 "),e("code",[t._v("O(log(N))")]),t._v("，效率较好。epoll 使用了红黑树作为索引结构（对应上图的 "),e("code",[t._v("rbr")]),t._v("）。")]),t._v(" "),e("blockquote",[e("p",[t._v("PS：因为操作系统要兼顾多种功能，以及由更多需要保存的数据，"),e("code",[t._v("rdlist")]),t._v(" 并非直接引用 socket，而是通过 "),e("code",[t._v("epitem")]),t._v(" 间接引用，红黑树的节点也是 "),e("code",[t._v("epitem")]),t._v(" 对象。同样，文件系统也并非直接引用着 socket。为方便理解，本文中省略了一些间接结构。")])]),t._v(" "),e("h2",{attrs:{id:"_9-结论"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#_9-结论"}},[t._v("#")]),t._v(" 9. 结论")]),t._v(" "),e("p",[t._v("epoll 在 select 和 poll（poll 和 select 基本一样，有少量改进）的基础引入了 "),e("code",[t._v("eventpoll")]),t._v(" 作为中间层，使用了先进的数据结构，是一种高效的多路复用技术。")]),t._v(" "),e("p",[t._v("下表是个很常见的表，描述了 select、poll 和 epoll 的区别。读完本文，读者能否解释 select 和 epoll 的时间复杂度为什么是 "),e("code",[t._v("O(n)")]),t._v(" 和 "),e("code",[t._v("O(1)")]),t._v("？")]),t._v(" "),e("table",[e("thead",[e("tr",[e("th",[t._v("系统调用")]),t._v(" "),e("th",[t._v("select")]),t._v(" "),e("th",[t._v("poll")]),t._v(" "),e("th",[t._v("epoll")])])]),t._v(" "),e("tbody",[e("tr",[e("td",[t._v("事件集合")]),t._v(" "),e("td",[t._v("用户通过 3 个参数分别传入感兴趣的可读、可写及异常等事件，内核通过对这些参数的在线修改来反馈其中的就绪事件。这使得用户每次调用 "),e("code",[t._v("select")]),t._v(" 都要重置这 3 个参数")]),t._v(" "),e("td",[t._v("统一处理所有事件类型，因此只需要一个事件集参数。用户通过 "),e("code",[t._v("pollfd.events")]),t._v(" 传入感兴趣的事件，内核通过修改 "),e("code",[t._v("pollfd.events")]),t._v(" 反馈其中就绪的事件")]),t._v(" "),e("td",[t._v("内核通过一个事件表直接管理用户感兴趣的所有事件。因此每次调用 "),e("code",[t._v("epoll_wait")]),t._v(" 时，无需反复传入用户感兴趣的事件。"),e("code",[t._v("epoll_wait")]),t._v(" 系统调用的参数 "),e("code",[t._v("events")]),t._v(" 仅用来反馈就绪事件")])]),t._v(" "),e("tr",[e("td",[t._v("应用程序索引就绪文件描述符的时间复杂度")]),t._v(" "),e("td",[e("code",[t._v("O(n)")])]),t._v(" "),e("td",[e("code",[t._v("O(n)")])]),t._v(" "),e("td",[e("code",[t._v("O(1)")])])]),t._v(" "),e("tr",[e("td",[t._v("最大支持文件描述符数")]),t._v(" "),e("td",[t._v("一般有最大值限制")]),t._v(" "),e("td",[t._v("65535")]),t._v(" "),e("td",[t._v("65535")])]),t._v(" "),e("tr",[e("td",[t._v("工作模式")]),t._v(" "),e("td",[t._v("LT")]),t._v(" "),e("td",[t._v("LT")]),t._v(" "),e("td",[t._v("支持 ET 高效模式")])]),t._v(" "),e("tr",[e("td",[t._v("内核实现和工作效率")]),t._v(" "),e("td",[t._v("采用轮询的方式来检测就绪事件，算法复杂度为 "),e("code",[t._v("O(n)")])]),t._v(" "),e("td",[t._v("采用轮询的方式来检测就绪事件，算法复杂度为 "),e("code",[t._v("O(n)")])]),t._v(" "),e("td",[t._v("采用回调方式来检测就绪事件，算法复杂度为 "),e("code",[t._v("O(1)")])])])])]),t._v(" "),e("h2",{attrs:{id:"参考文献"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#参考文献"}},[t._v("#")]),t._v(" 参考文献")]),t._v(" "),e("ul",[e("li",[e("a",{attrs:{href:"https://zhuanlan.zhihu.com/p/63179839",target:"_blank",rel:"noopener noreferrer"}},[t._v("如果这篇文章说不清epoll的本质，那就过来掐死我吧！ （1）"),e("OutboundLink")],1)]),t._v(" "),e("li",[e("a",{attrs:{href:"https://zhuanlan.zhihu.com/p/64138532",target:"_blank",rel:"noopener noreferrer"}},[t._v("如果这篇文章说不清epoll的本质，那就过来掐死我吧！ （2）"),e("OutboundLink")],1)]),t._v(" "),e("li",[e("a",{attrs:{href:"https://zhuanlan.zhihu.com/p/64746509",target:"_blank",rel:"noopener noreferrer"}},[t._v("如果这篇文章说不清epoll的本质，那就过来掐死我吧！ （3）"),e("OutboundLink")],1)])])])}),[],!1,null,null,null);s.default=n.exports}}]);