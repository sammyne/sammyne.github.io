(window.webpackJsonp=window.webpackJsonp||[]).push([[41],{654:function(v,_,e){v.exports=e.p+"assets/img/workflow.74207fbd.png"},769:function(v,_,e){"use strict";e.r(_);var o=e(6),c=Object(o.a)({},(function(){var v=this,_=v.$createElement,o=v._self._c||_;return o("ContentSlotsDistributor",{attrs:{"slot-key":v.$parent.slotKey}},[o("h2",{attrs:{id:"_1-前提假定"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#_1-前提假定"}},[v._v("#")]),v._v(" 1. 前提假定")]),v._v(" "),o("h3",{attrs:{id:"_1-1-同步模型"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#_1-1-同步模型"}},[v._v("#")]),v._v(" 1.1 同步模型")]),v._v(" "),o("p",[v._v("在分布式系统中谈论共识，首先需要明确系统同步模型是"),o("strong",[v._v("完全同步")]),v._v("、"),o("strong",[v._v("异步")]),v._v("还是"),o("strong",[v._v("部分同步")]),v._v("?")]),v._v(" "),o("ul",[o("li",[v._v("完全同步：节点所发出的消息，在一个确定的时间内，肯定会到达目标节点；")]),v._v(" "),o("li",[v._v("异步：节点所发出的消息，不能确定一定会到达目标节点；")]),v._v(" "),o("li",[v._v("部分同步：节点发出的消息，虽然会有延迟，但是最终会到达目标节点。")])]),v._v(" "),o("p",[v._v('完全是十分理想的情况。如果假设分布式系统是一个同步系统，共识算法的设计可以简化很多。在同步系统中，只要超时没收到消息就可以认为节点除了问题。异步是更为贴近实际的模型，但是根据 FLP 不可能性原理，在异步假定下，共识算法不可能同时满足安全性（safety）和活跃性（liveness）。为了设计能够符合实际场景的共识算法，目前的 BFT 类共识算法多是基于部分同步假定，这在 PBFT 论文中被称为"weak synchrony"。')]),v._v(" "),o("p",[v._v("PBFT 假设系统是异步的，节点通过网络连接，消息会被延迟，但是不会被无限延迟。")]),v._v(" "),o("h3",{attrs:{id:"_1-2-容错类型"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#_1-2-容错类型"}},[v._v("#")]),v._v(" 1.2 容错类型")]),v._v(" "),o("p",[v._v("PBFT 假定错误可以是拜占庭类型的，也就是说可以是任意类型的错误，比如节点作恶、说谎等。这有别于节点崩溃类型的错误，RAFT、Paxos 这类共识算法只能允许节点崩溃类型错误，节点只能崩溃而不能产生假消息。")]),v._v(" "),o("p",[v._v("对于拜占庭类错误，给定总节点数为 "),o("code",[v._v("n")]),v._v("，系统可能存在 "),o("code",[v._v("f")]),v._v(" 个拜占庭节点，假如需要根据节点发送过来的消息做判断。为了共识正常进行，在收到 "),o("code",[v._v("n-f")]),v._v(" 个消息时，就应该进行处理，因为可能有 "),o("code",[v._v("f")]),v._v(" 个节点根本不发送消息。现在我们根据收到的 "),o("code",[v._v("n-f")]),v._v(" 个消息做判断，原则是至少有 "),o("code",[v._v("f+1")]),v._v(" 个相同结果。但在收到的 "),o("code",[v._v("n-f")]),v._v(" 个消息中，不能确定其中没有错误节点过来的消息，其中也可能存在 "),o("code",[v._v("f")]),v._v(" 个假消息，应该保证 "),o("code",[v._v("n-f-f>f")]),v._v("，即 "),o("code",[v._v("n>3f")]),v._v("。")]),v._v(" "),o("p",[v._v("另一种证明方式如下，假设 "),o("code",[v._v("n=3f")]),v._v("，当前共识由其中一个拜占庭节点主导，"),o("code",[v._v("f")]),v._v(" 个拜占庭节点合谋将其他 "),o("code",[v._v("n-f=2f")]),v._v(" 个节点均分为两组 A 和 B，分别给 A 和 B 发送不同的消息 M1 和 M2，最后汇总消息可得 "),o("code",[v._v("2f")]),v._v(" 个 M1 和 "),o("code",[v._v("2f")]),v._v(" 个 M2，无法达成共识= =。一旦 "),o("code",[v._v("n>3f")]),v._v("，则最后 M1 和 M2 的票数必定不等，以多数方的为准即可。")]),v._v(" "),o("h4",{attrs:{id:"系统模型"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#系统模型"}},[v._v("#")]),v._v(" 系统模型")]),v._v(" "),o("p",[v._v("一组节点构成状态机复制系统，一个节点作为主节点，其他节点作为副本节点。某个节点作为主节点时，这称为系统的一个视图（view）。当节点出了问题，就进行视图更新，切换到下一个节点担任主节点。主节点更替不需要选举过程，而是采用依序轮替的方式：以视图编号指定的节点为主节点。")]),v._v(" "),o("p",[v._v("系统的主节点接收客户端的请求，并产生预准备（pre-prepare）消息，进入共识流程。")]),v._v(" "),o("p",[v._v("系统需要满足如下两个条件")]),v._v(" "),o("ul",[o("li",[v._v("确定性：在一个给定状态上的操作，产生一样的执行结果")]),v._v(" "),o("li",[v._v("每个节点都有一样的起始状态")])]),v._v(" "),o("p",[v._v("要保证非故障节点（包括拜占庭节点和被拜占庭节点误导的节点）对于执行请求的全局顺序达成一致。")]),v._v(" "),o("h3",{attrs:{id:"_1-3-安全性和活跃性"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#_1-3-安全性和活跃性"}},[v._v("#")]),v._v(" 1.3 安全性和活跃性")]),v._v(" "),o("ul",[o("li",[v._v("安全性：坏的事情不会发生，即共识系统不能产生错误的结果，比如一部分节点说 yes，另一部分说 no。在区块链的语义下，指的是不会分叉。")]),v._v(" "),o("li",[v._v("活跃性：好的事情一定会发生，即系统一直有回应，在区块链的语义下，指的是共识会持续进行，不会卡住。假如一个区块链系统的共识卡在了某个高度，那么新的交易是没有回应的，也就是不满足活跃性。")])]),v._v(" "),o("h2",{attrs:{id:"_2-常规流程"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#_2-常规流程"}},[v._v("#")]),v._v(" 2. 常规流程")]),v._v(" "),o("p",[v._v("正常状态下的共识流程可以用论文的配图清晰表示如下")]),v._v(" "),o("p",[o("img",{attrs:{src:e(654),alt:"常规共识流程"}})]),v._v(" "),o("p",[v._v("共识过程由三个阶段构成，"),o("strong",[v._v("预准备")]),v._v("（pre-prepare）阶段和"),o("strong",[v._v("准备")]),v._v("（prepare）阶段确保了在同一个视图下，正常节点对于消息 "),o("code",[v._v("m")]),v._v(" 达成了全局一致的顺序，用"),o("code",[v._v("Order<v,m,n>")]),v._v(" 表示，在视图为 "),o("code",[v._v("v")]),v._v(" 下，正常节点都会将消息 "),o("code",[v._v("m")]),v._v(" 定序为 "),o("code",[v._v("n")]),v._v("。接下来的"),o("strong",[v._v("提交")]),v._v("（commit）阶段投票，再配合上"),o("strong",[v._v("视图切换")]),v._v("实现即使视图切换也可以保证对于 "),o("code",[v._v("m")]),v._v(" 的全局一致顺序，即 "),o("code",[v._v("Order<v+1,m,n>")]),v._v("，视图切换到 "),o("code",[v._v("v+1")]),v._v(", 依然会认定消息 "),o("code",[v._v("m")]),v._v(" 的序号为 "),o("code",[v._v("n")]),v._v("。")]),v._v(" "),o("h3",{attrs:{id:"预准备阶段"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#预准备阶段"}},[v._v("#")]),v._v(" 预准备阶段")]),v._v(" "),o("p",[v._v("主节点收到请求 "),o("code",[v._v("m")]),v._v(" 后，给请求 "),o("code",[v._v("m")]),v._v(" 分配一个序号 "),o("code",[v._v("n")]),v._v("，并广播给其他节点。副本节点收到后会将消息保存到本地日志。")]),v._v(" "),o("p",[v._v("预准备阶段的消息格式 "),o("code",[v._v("<<PRE-PREPARE,v,n,d>_p, m>")]),v._v("，其中")]),v._v(" "),o("ul",[o("li",[o("code",[v._v("v")]),v._v(" 表示当前编号")]),v._v(" "),o("li",[o("code",[v._v("n")]),v._v(" 是给 "),o("code",[v._v("m")]),v._v(" 分配的序号")]),v._v(" "),o("li",[o("code",[v._v("d")]),v._v(" 为 "),o("code",[v._v("m")]),v._v(" 的哈希")]),v._v(" "),o("li",[o("code",[v._v("m")]),v._v(" 为消息原文")]),v._v(" "),o("li",[o("code",[v._v("_p")]),v._v(" 表示被主节点签名")])]),v._v(" "),o("p",[v._v("其他副本节点收到预准备消息时，会依次做如下几步操作：")]),v._v(" "),o("ol",[o("li",[v._v("签名验证")]),v._v(" "),o("li",[v._v("消息是本节点当前视图的消息")]),v._v(" "),o("li",[v._v("本节点在 "),o("code",[v._v("v")]),v._v(" 视图下，还没有收到序号 `n 的其他消息")]),v._v(" "),o("li",[v._v("收到的消息序号 "),o("code",[v._v("n")]),v._v(" 在当前接收窗口内 "),o("code",[v._v("(h, H)")])])]),v._v(" "),o("p",[v._v("以上都通过则接受该消息，并广播准备消息进入准备阶段。\n一旦副本节点接受 "),o("code",[v._v("<<PRE-PREPARE,v,n,d>_p, m>")]),v._v("，则该节点进入到准备阶段，然后节点广播准备消息 "),o("code",[v._v("<<PREPARE,v,n,d,i>_i>")]),v._v(" 之后，节点将消息加入到本地的日志。")]),v._v(" "),o("h3",{attrs:{id:"准备阶段"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#准备阶段"}},[v._v("#")]),v._v(" 准备阶段")]),v._v(" "),o("p",[v._v("节点收到准备消息时，会验签并检查是否是当前视图的消息，同时检查消息序号 "),o("code",[v._v("n")]),v._v(" 是否在当前的接收窗口内，验证通过则接受该消息，保存到本地日志。")]),v._v(" "),o("p",[v._v("当节点达成以下 3 点时，则表明节点达成了准备完毕状态，记为 "),o("code",[v._v("prepared(m,v,n,i)")]),v._v("。")]),v._v(" "),o("ul",[o("li",[v._v("日志中存在消息 "),o("code",[v._v("m")])]),v._v(" "),o("li",[v._v("日志中存在 "),o("code",[v._v("m")]),v._v(" 的预准备消息 "),o("code",[v._v("pre-prepare(m,v,n)")])]),v._v(" "),o("li",[v._v("日志中存在 "),o("code",[v._v("2f")]),v._v(" 个来自其他节点的准备消息 "),o("code",[v._v("prepare(m,v,n,i)")])])]),v._v(" "),o("p",[v._v("至此，可以确保在视图不发生切换的情况下，为消息 "),o("code",[v._v("m")]),v._v(" 分配全局一致的序号。")]),v._v(" "),o("p",[v._v("也就是说，在视图不变的情况下:")]),v._v(" "),o("ol",[o("li",[v._v("一个正常节点 i，不能对两个及以上的不同消息，达成相同序号 "),o("code",[v._v("n")]),v._v(" 的准备完毕状态，即不能同时存在 "),o("code",[v._v("prepared(m,v,n,i)")]),v._v(" 和 "),o("code",[v._v("prepared(m',v,n,i)")]),v._v(" "),o("ul",[o("li",[v._v("简要证明：假如正常节点 i 对于消息 "),o("code",[v._v("m")]),v._v(" 达成了 "),o("code",[v._v("prepared(m,v,n,i)")]),v._v("，同时存在一个 "),o("code",[v._v("m'")]),v._v("，也达成了 "),o("code",[v._v("prepared(m',v,n,i)")]),v._v("。首先对于"),o("code",[v._v("prepared(m,v,n,i)")]),v._v("，肯定有 "),o("code",[v._v("2m+1")]),v._v(" 个节点发出了 "),o("code",[v._v("<prepare,m,v,n>")]),v._v(" 消息。对于 "),o("code",[v._v("prepared(m',v,n,i)")]),v._v("，肯定也有 "),o("code",[v._v("2f+1")]),v._v(" 个节点发出了"),o("code",[v._v("<prepare,m',v,n>")]),v._v("。"),o("code",[v._v("2*(2f+1) - (3f+1) = f+1")]),v._v("，所以至少有 "),o("code",[v._v("f+1")]),v._v(" 个节点，既发出了 "),o("code",[v._v("<prepare,m,v,n>")]),v._v("，又发出了 "),o("code",[v._v("<prepare,m',v,n>")]),v._v("，这明显是拜占庭行为。也就是说，至少有 "),o("code",[v._v("f+1")]),v._v(" 个拜占庭节点，而这与容错条件相矛盾。")])])]),v._v(" "),o("li",[v._v("两个正常节点 i 和 j 必须对相同的消息 "),o("code",[v._v("m")]),v._v(" 达成相同序号 "),o("code",[v._v("n")]),v._v(" 的准备完毕状态，即 "),o("code",[v._v("prepared(m,v,n,i) && prepared(m,v,n,j)")]),v._v(" "),o("ul",[o("li",[v._v("简要证明：假如两个正常节点 i 和 j 分别对不同的消息 "),o("code",[v._v("m")]),v._v(" 和 "),o("code",[v._v("m'")]),v._v("，达成序号 "),o("code",[v._v("n")]),v._v(" 的准备完毕状态。首先对于 "),o("code",[v._v("prepared(m,v,n,i)")]),v._v("，肯定有 "),o("code",[v._v("2f+1")]),v._v(" 个节点发出了 "),o("code",[v._v("<prepare,m,v,n>")]),v._v(" 消息。对于 "),o("code",[v._v("prepared(m',v,n,j)")]),v._v("，肯定也有 "),o("code",[v._v("2f+1")]),v._v(" 个节点发出了 "),o("code",[v._v("<prepare,m',v,n>")]),v._v("。"),o("code",[v._v("2*(2f+1) - (3f+1) = f+1")]),v._v("，所以至少有 "),o("code",[v._v("f+1")]),v._v(" 个节点，既发出了 "),o("code",[v._v("<prepare,m,v,n>")]),v._v("，又发出了 "),o("code",[v._v("<prepare,m',v,n>")]),v._v("，这明显是拜占庭行为。也就是说，至少有 "),o("code",[v._v("f+1")]),v._v(" 个拜占庭节点，而这与容错条件相矛盾。")])])])]),v._v(" "),o("p",[v._v("准备完毕状态是十分重要的，涉及到视图转换时，为了保证切换前后的安全特性，需要将上一轮视图的信息传递到新的视图，而 PBFT 就是通过将准备完毕状态的信息传递到新的视图来保证安全性的。可以这么理解：新视图需要在上一轮视图的准备完毕信息基础上，继续进行共识。")]),v._v(" "),o("p",[v._v("达成准备完毕状态以后，节点会广播提交消息 "),o("code",[v._v("<COMMIT,v,n,d,i>_i")]),v._v("。")]),v._v(" "),o("h3",{attrs:{id:"提交阶段"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#提交阶段"}},[v._v("#")]),v._v(" 提交阶段")]),v._v(" "),o("p",[v._v("节点接收提交消息后，会像收到准备消息一样进行几步验证已确定是否接受该消息。")]),v._v(" "),o("p",[v._v("当节点 i 达成了准备完毕状态，并且收到了 "),o("code",[v._v("2f+1")]),v._v(" 个 "),o("code",[v._v("commit(v,n,d,i)")]),v._v(" 消息，则该节点达成了 "),o("code",[v._v("commit-local(m,v,n,i)")]),v._v(" 状态。")]),v._v(" "),o("p",[v._v("达成 "),o("code",[v._v("commit-local")]),v._v(" 之后，节点对于消息 "),o("code",[v._v("m")]),v._v(" 就有了全局一致的序号，可以执行该消息并回复结果给客户端了。")]),v._v(" "),o("p",[o("code",[v._v("commit-local")]),v._v(" 状态说明有 "),o("code",[v._v("2f+1")]),v._v(" 个节点达成了准备完毕状态，即为固定了对 "),o("code",[v._v("m")]),v._v(" 的序号。")]),v._v(" "),o("h2",{attrs:{id:"_3-垃圾回收"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#_3-垃圾回收"}},[v._v("#")]),v._v(" 3. 垃圾回收")]),v._v(" "),o("p",[v._v("实际的消息日志不可能无限大，因此需要设定检查点（checkpoint），用于定期清理过时消息。")]),v._v(" "),o("p",[v._v("直观的做法就是，每隔一段时间（在序号 "),o("code",[v._v("n%100 == 0")]),v._v(" 时），确认每个节点都已经执行完第 "),o("code",[v._v("n")]),v._v(" 个消息了。这样就可以清除掉比 "),o("code",[v._v("n")]),v._v(" 还要早的消息了。")]),v._v(" "),o("p",[v._v("PBFT 论文也是通过投票实现的：当一个节点执行完第 "),o("code",[v._v("n")]),v._v(" 个消息后，就广播 "),o("code",[v._v("<CHECKPOINT,n,d,i>")]),v._v(" 消息。节点收集到 "),o("code",[v._v("2f+1")]),v._v(" 条 "),o("code",[v._v("CHECKPOINT")]),v._v(" 消息后，就产生一个本地的检查点，然后清除掉比 "),o("code",[v._v("n")]),v._v(" 小的消息，然后将接收消息的窗口调整为 "),o("code",[v._v("(n, n+100)")]),v._v("。")]),v._v(" "),o("h2",{attrs:{id:"_4-视图切换"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#_4-视图切换"}},[v._v("#")]),v._v(" 4. 视图切换")]),v._v(" "),o("p",[v._v("视图切换是 PBFT 最为关键的设计，保证了共识系统的安全性和活跃性。")]),v._v(" "),o("p",[v._v("当节点检测到超时时，会发送视图切换消息，进入视图切换流程，相关消息 "),o("code",[v._v("<VIEWCHANGE, n, C, P, i>")]),v._v(" 格式如下")]),v._v(" "),o("ul",[o("li",[o("code",[v._v("n")]),v._v(": 消息序号，本节点最近的一个检查点所确定的序号")]),v._v(" "),o("li",[o("code",[v._v("C")]),v._v(": 对应于 "),o("code",[v._v("n")]),v._v(" 的 "),o("code",[v._v("2f+1")]),v._v(" 个 "),o("code",[v._v("CHECKPOINT")]),v._v(" 消息集合")]),v._v(" "),o("li",[o("code",[v._v("P")]),v._v(": 准备消息 "),o("code",[v._v("Pm")]),v._v(" 组成的集合，"),o("code",[v._v("Pm")]),v._v(" 表示序号为 "),o("code",[v._v("m")]),v._v(" 的、达成准备完毕状态的消息集合。"),o("code",[v._v("Pm")]),v._v(" 的内容包含关于 "),o("code",[v._v("m")]),v._v(" 的 1 条预准备消息和 "),o("code",[v._v("2f")]),v._v(" 条准备消息组成的集合。")]),v._v(" "),o("li",[o("code",[v._v("i")]),v._v(": 节点 ID")])]),v._v(" "),o("p",[v._v("由消息结构可以看出，节点发出视图切换消息时，将本地的准备完毕状态的信息打包到了消息中，传递给后续的视图。")]),v._v(" "),o("p",[v._v("当 "),o("code",[v._v("view+1")]),v._v(" 所对应的主节点收到 "),o("code",[v._v("2f")]),v._v(" 个有效的视图切换消息，它就会广播 "),o("code",[v._v("<NEW-VIEW,v+1,V,O>")]),v._v(" 消息；")]),v._v(" "),o("ul",[o("li",[o("code",[v._v("V")]),v._v(" 是视图切换消息集合")]),v._v(" "),o("li",[o("code",[v._v("O")]),v._v(" 是预准备消息的集合，按照如下的过程计算：\n"),o("ul",[o("li",[v._v("主节点根据收到的视图切换消息判断，最新（其他文章都说是最低的，个人觉得不对）的检查点 "),o("code",[v._v("s")]),v._v(" 和 "),o("code",[v._v("Pm")]),v._v(" 里面最高的序列号 "),o("code",[v._v("t")])]),v._v(" "),o("li",[v._v("对介于 "),o("code",[v._v("s")]),v._v(" 和 "),o("code",[v._v("t")]),v._v(" 之间的每个序号 "),o("code",[v._v("n")]),v._v(" 创建预准备消息。这分两种情况：\n"),o("ol",[o("li",[v._v("P 集合存在至少一个序号为 "),o("code",[v._v("n")]),v._v(" 的 "),o("code",[v._v("Pm")]),v._v("：创建一个预准备消息 "),o("code",[v._v("<PRE-PREPARE, v+1, n, d>")])]),v._v(" "),o("li",[v._v("集合为空：创建新的 "),o("code",[v._v("<PRE-PREPARE, v+1, n, d_null>")])])])])])])]),v._v(" "),o("p",[v._v("可以这样理解，在新视图中，节点是在上一轮视图中各个节点的准备完毕状态基础上进行共识流程的。")]),v._v(" "),o("p",[v._v("发生视图转换时，需要的保证的是：如果视图转换之前的消息 "),o("code",[v._v("m")]),v._v(" 被分配了序号 "),o("code",[v._v("n")]),v._v(", 并且达到了已准备状态，那么在视图转换之后，该消息也必须被分配序号 "),o("code",[v._v("n")]),v._v("(安全性)。因为达到准备完毕状态以后，就有可能存在某个节点 "),o("code",[v._v("commit-local")]),v._v("。要保证对于 "),o("code",[v._v("m")]),v._v(" 的 "),o("code",[v._v("commit-local")]),v._v("，在视图转换之后，其他节点的 "),o("code",[v._v("commit-local")]),v._v(" 依然是一样的序号。")]),v._v(" "),o("h2",{attrs:{id:"_5-小结"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#_5-小结"}},[v._v("#")]),v._v(" 5. 小结")]),v._v(" "),o("ul",[o("li",[v._v("PBFT 是在previous轮次中的第一轮投票结果基础上继续共识流程。")]),v._v(" "),o("li",[v._v("BFT 类共识需要保证安全性和活跃性，安全性可以在异步假设下达成，活跃性需要弱同步假设")]),v._v(" "),o("li",[v._v("PBFT 的核心设计是视图切换，巧妙的在视图切换消息里面添加准备完毕信息，实现将之前视图状态传递到下一轮，但是这样导致消息太大了，有些冗余。")])]),v._v(" "),o("h2",{attrs:{id:"参考文献"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#参考文献"}},[v._v("#")]),v._v(" 参考文献")]),v._v(" "),o("ul",[o("li",[o("a",{attrs:{href:"http://www.pmg.lcs.mit.edu/~castro/osdi99_html/osdi99.html",target:"_blank",rel:"noopener noreferrer"}},[v._v('Castro, Miguel, and Barbara Liskov. "Practical Byzantine fault tolerance." OSDI. Vol. 99. 1999.'),o("OutboundLink")],1)]),v._v(" "),o("li",[o("a",{attrs:{href:"https://www.cnblogs.com/gexin/p/10242161.html",target:"_blank",rel:"noopener noreferrer"}},[v._v("对PBFT算法的理解"),o("OutboundLink")],1)])])])}),[],!1,null,null,null);_.default=c.exports}}]);