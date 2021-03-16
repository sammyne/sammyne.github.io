(window.webpackJsonp=window.webpackJsonp||[]).push([[39],{683:function(e,s,n){e.exports=n.p+"assets/img/boot-overview.50bb1b1d.png"},684:function(e,s,n){e.exports=n.p+"assets/img/ARMv8.a64720fb.png"},806:function(e,s,n){"use strict";n.r(s);var t=n(6),a=Object(t.a)({},(function(){var e=this,s=e.$createElement,t=e._self._c||s;return t("ContentSlotsDistributor",{attrs:{"slot-key":e.$parent.slotKey}},[t("p",[e._v("ATF 全称为 ARM Trusted Firmware。")]),e._v(" "),t("p",[e._v("ATF 将系统启动从最底层进行了完整的统一划分，将 secure monitor 的功能放到了 bl31。当系统完全启动之后，CA 或者 TEE OS 触发了 SMC（Secure Monitor Call）或者其他中断之后，首先遍历注册到 bl31 的对应的 service 来选择具体的 handle，这样可以统一管理和分配系统所有的关键 SMC 或者中断操作。ATF 的 code boot 整个启动过程框图如下：")]),e._v(" "),t("p",[t("img",{attrs:{src:n(683),alt:""}})]),e._v(" "),t("p",[e._v("上述启动过程中，每个 image 跳转到下一个 image 的方式各不相同。下面介绍启动过程中每个 image 跳转到下一个 image 的过程。")]),e._v(" "),t("ol",[t("li",[e._v("bl1 跳转到 bl2\n"),t("ul",[t("li",[e._v("bl1 加载 bl2 image 到 RAM、设定中断向量表以及完成其他 CPU 相关设定之后，"),t("code",[e._v("bl1_main")]),e._v(" 函数解析出 bl2 image 的描述信息，获取入口地址，并设定下一个阶段的 CPU 上下文。完成之后，调用 "),t("code",[e._v("el3_exit")]),e._v(" 函数实现 bl1 到 bl2 的跳转，进入到 bl2 阶段。")])])]),e._v(" "),t("li",[e._v("bl2 跳转到 bl31\n"),t("ul",[t("li",[e._v("bl2 将会加载 bl31、bl32、bl33 的 image 到对应权限的 RAM，并将该三个 image 的描述信息组成一个链表保存起来，以用于 bl31 启动 bl32 和 bl33。在 AACH64 中，bl31 为 EL3 runtime firmware。这个运行时的主要功能是处理 SMC 指令和中断，以 secure monitor 状态运行。")]),e._v(" "),t("li",[e._v("bl32 一般为 TEE OS image，例如 OP-TEE")]),e._v(" "),t("li",[e._v("bl33 为非安全 image，例如 uboot，linux 内核等。当前该部分先加载 bootloader 的 image，再由 bootloader 来启动 linux 内核。")]),e._v(" "),t("li",[e._v("bl2 跳转到 bl31 是通过传入 bl31 的 entry point info 调用 SMC 指令，触发在 bl1 设定的 SMC 异常，从而使得 CPU 将控制权交给 bl31，并跳转到 bl31 执行。")])])]),e._v(" "),t("li",[e._v("bl31 跳转到 bl32\n"),t("ul",[t("li",[e._v("bl31 会执行 "),t("code",[e._v("runtime_service_init")]),e._v(" 操作，该函数会调用注册到 EL3 所有 service 的 "),t("code",[e._v("init")]),e._v(" 函数，其中有一个 service 就是为 TEE 服务的。该 service 的 "),t("code",[e._v("init")]),e._v(" 函数会将 TEE OS 的初始化函数赋值给 "),t("code",[e._v("bl32_init")]),e._v(" 变量。当所有的 service 执行完 "),t("code",[e._v("init")]),e._v(" 后，bl31 会调用 "),t("code",[e._v("bl32_init")]),e._v(" 跳转到 TEE OS 的执行。")])])]),e._v(" "),t("li",[e._v("bl31 跳转到 bl33\n"),t("ul",[t("li",[e._v("当 TEE_OS image 启动完成之后会触发一个 ID 为 "),t("code",[e._v("TEESMC_OPTEED_RETURN_ENTRY_DONE")]),e._v(" 的 SMC 调用来告知 EL3 TEE OS image 已经完成了初始化，然后将 CPU 状态恢复到 "),t("code",[e._v("bl31_init")]),e._v(" 的位置继续执行。")]),e._v(" "),t("li",[e._v("bl31 通过遍历在 bl2 记录的 image 链表来找到需要执行的 bl33 的 image。然后通过获取到 bl33 image 的镜像信息，设定下一个阶段的 CPU 上下文，退出 EL3 然后进入到 bl33 image 的执行。")])])])]),e._v(" "),t("p",[e._v("ATF 是一针对 ARM 芯片给出的底层开源固件代码。固件将整个系统分成四种运行等级，分别为：EL0、EL1、EL2 和 EL3，并规定了每个安全等级运行的 image 名字。后续部分以 ARCH64 为示例，介绍冷启动模式下 ATF 的运行过程。ATF 的源代码可以从 "),t("a",{attrs:{href:"https://github.com/ARM-software/arm-trusted-firmware/tree/v2.3",target:"_blank",rel:"noopener noreferrer"}},[e._v("github"),t("OutboundLink")],1),e._v(" 上获取。")]),e._v(" "),t("p",[t("img",{attrs:{src:n(684),alt:""}})]),e._v(" "),t("p",[e._v("系统上电之后首先会运行 SCP boot ROM，之后会跳转到 ATF 的 bl1 继续执行。bl1 主要初始化 CPU，设定异常向量，将 bl2 的 image 加载到安全 RAM，然后跳转到 bl2 继续执行。")]),e._v(" "),t("blockquote",[t("p",[e._v("Q：如果需要通过 ATF 来实现安全启动的话，如何实现 ATF 的 TBB（"),t("code",[e._v("TURSTED_BOARD_BOOT")]),e._v("），如何来保证 BL1 固件的安全性呢？"),t("br"),e._v("\nA：bl1 是由 chiprom 验证，从而保障 bl1 的固件安全。这一块需要特定的芯片厂商来实现。如果芯片厂商不按照 TBB 的方式对 bl1 的 image 进行验证，那么芯片厂商则会实现自有的一套 image 验证策略。")])]),e._v(" "),t("p",[e._v("bl2 将会去加载 bl31、bl32 和 bl33，其中涉及的 CPU 状态切换以及跳转具体介绍如下。")]),e._v(" "),t("h2",{attrs:{id:"bl1"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#bl1"}},[e._v("#")]),e._v(" bl1")]),e._v(" "),t("p",[e._v("bl1 的主要代码存放在 "),t("a",{attrs:{href:"https://github.com/ARM-software/arm-trusted-firmware/tree/v2.3/bl1",target:"_blank",rel:"noopener noreferrer"}},[e._v("bl1"),t("OutboundLink")],1),e._v(" 目录，bl1 的连接脚本是 bl1/bl1.ld.S 文件，其中可以看到 bl1 的入口函数是 "),t("a",{attrs:{href:"https://github.com/ARM-software/arm-trusted-firmware/blob/v2.3/bl1/bl1.ld.S#L12",target:"_blank",rel:"noopener noreferrer"}},[e._v("bl1_entrypoint"),t("OutboundLink")],1),e._v(" 基本结构如下")]),e._v(" "),t("div",{staticClass:"language- line-numbers-mode"},[t("pre",{pre:!0,attrs:{class:"language-text"}},[t("code",[e._v("|-bl1_entrypoint // 初始化 EL3 环境，设定向量表，加载 bl2 image 并跳转到 bl2 等操作\n  |-el3_entrypoint_common // 完成el3基本设置和向量表注册\n  |                       // 部分参数说明如下\n  |                       //  - _set_endian：设定大小端\n  |                       //  - _warm_boot_mailbox：检查当前是属于冷启动还是热启动(power on or reset)\n  |                       //  - _secondary_cold_boot: 确定当前的CPU是主CPU还是从属CPU\n  |                       //  - _init_memory：是否需要初始化memory\n  |                       //  - _init_c_runtime: 是否需要初始化C语言的执行环境\n  |                       //  - _exception_vectors: 异常向量表地址\n  |-bl1_setup\n    |-bl1_early_platform_setup // 完成早期的初始化操作，主要包括内存、页表、所需外围设备的初始化以及相关状态设定等；\n  |-bl1_main // 加载 bl2 image 并设置运行环境，如果开启了 trusted boot，则需要验证 image\n    |-bl1_prepare_next_image // 获取 bl2 image 的描述信息，读取 bl2 的入口地址，准备下阶段的 CPU 上下文，\n                             // 以备执行从 bl1 跳转到 bl2 的操作使用\n  |-el3_exit\n")])]),e._v(" "),t("div",{staticClass:"line-numbers-wrapper"},[t("span",{staticClass:"line-number"},[e._v("1")]),t("br"),t("span",{staticClass:"line-number"},[e._v("2")]),t("br"),t("span",{staticClass:"line-number"},[e._v("3")]),t("br"),t("span",{staticClass:"line-number"},[e._v("4")]),t("br"),t("span",{staticClass:"line-number"},[e._v("5")]),t("br"),t("span",{staticClass:"line-number"},[e._v("6")]),t("br"),t("span",{staticClass:"line-number"},[e._v("7")]),t("br"),t("span",{staticClass:"line-number"},[e._v("8")]),t("br"),t("span",{staticClass:"line-number"},[e._v("9")]),t("br"),t("span",{staticClass:"line-number"},[e._v("10")]),t("br"),t("span",{staticClass:"line-number"},[e._v("11")]),t("br"),t("span",{staticClass:"line-number"},[e._v("12")]),t("br"),t("span",{staticClass:"line-number"},[e._v("13")]),t("br"),t("span",{staticClass:"line-number"},[e._v("14")]),t("br"),t("span",{staticClass:"line-number"},[e._v("15")]),t("br")])]),t("h2",{attrs:{id:"bl2"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#bl2"}},[e._v("#")]),e._v(" bl2")]),e._v(" "),t("p",[e._v("bl2 image 将会为后续 image 的加载执行相关的初始化操作，主要涉及内存、MMU、串口以及 EL3 软件运行环境的设置，并且加载 bl3x 的 image 到 RAM。相关文件主要集中在 "),t("a",{attrs:{href:"https://github.com/ARM-software/arm-trusted-firmware/tree/v2.3/bl2",target:"_blank",rel:"noopener noreferrer"}},[e._v("bl2"),t("OutboundLink")],1),e._v(" 目录，查看 bl2.ld.S 文件可知 bl2 image 的入口函数是"),t("a",{attrs:{href:"https://github.com/ARM-software/arm-trusted-firmware/blob/v2.3/bl2/bl2.ld.S#L12",target:"_blank",rel:"noopener noreferrer"}},[e._v("bl2_entrypoint"),t("OutboundLink")],1),e._v("。")]),e._v(" "),t("p",[e._v("关键函数结构如下")]),e._v(" "),t("div",{staticClass:"language- line-numbers-mode"},[t("pre",{pre:!0,attrs:{class:"language-text"}},[t("code",[e._v("|-bl2_entrypoint  // bl2/aarch64/bl2_entrypoint.S\n| |               // 该函数最终会出发 SMC 操作，将 CPU 的控制权从 bl1 转交给 bl31\n| |-bl2_main      // bl2/bl2_main.c\n|   |             // 将 bl3x 的 image 加载 RAM，并通过 SMC 调用执行 bl1 指定的 SMC handle 将 CPU 的控制权交给 bl31。\n|   |-bl2_load_images // bl2/bl2_image_load_v2.c\n|   |                 // 加载 bl3x 的 image 到 RAM，返回一个具有 image 入口信息的变量。SMC handle根据该变量跳转到 bl31 执行\n|   |-smc             // bl2/bl2_main.c#123\n|     |               // 该函数触发 SMC 操作，而 SMC 的 handle 在 bl1 阶段已被指定，调用该函数的时候传入 \n|     |               // command ID=BL1_SMC_RUN_IMAGE，故执行该函数之后，系统将跳转到中断处理函数：smc_handler64 继续执行\n|     |-smc_handler64 // bl1/aarch64/bl1_exceptions.S\n|-REGISTER_BL_IMAGE_DESCS(bl2_mem_params_descs) // plat/arm/common/aarch64/arm_bl2_mem_params_desc.c\n                                                // 初始化组成 bl2 加载 bl3x image 的列表使用到的重要全局变量 bl2_mem_params_descs\n                                                // 该变量规定了 SCP_BL2、EL3_payload、bl32、bl33 image 的相关信息，例如： \n                                                //  - ep_info：image 的入口地址信息\n                                                //  - image_base：image 在 RAM 的基地址\n                                                //  - image_info：image 的基本信息\n                                                //  - image_id：image 的 ID 值\n")])]),e._v(" "),t("div",{staticClass:"line-numbers-wrapper"},[t("span",{staticClass:"line-number"},[e._v("1")]),t("br"),t("span",{staticClass:"line-number"},[e._v("2")]),t("br"),t("span",{staticClass:"line-number"},[e._v("3")]),t("br"),t("span",{staticClass:"line-number"},[e._v("4")]),t("br"),t("span",{staticClass:"line-number"},[e._v("5")]),t("br"),t("span",{staticClass:"line-number"},[e._v("6")]),t("br"),t("span",{staticClass:"line-number"},[e._v("7")]),t("br"),t("span",{staticClass:"line-number"},[e._v("8")]),t("br"),t("span",{staticClass:"line-number"},[e._v("9")]),t("br"),t("span",{staticClass:"line-number"},[e._v("10")]),t("br"),t("span",{staticClass:"line-number"},[e._v("11")]),t("br"),t("span",{staticClass:"line-number"},[e._v("12")]),t("br"),t("span",{staticClass:"line-number"},[e._v("13")]),t("br"),t("span",{staticClass:"line-number"},[e._v("14")]),t("br"),t("span",{staticClass:"line-number"},[e._v("15")]),t("br"),t("span",{staticClass:"line-number"},[e._v("16")]),t("br"),t("span",{staticClass:"line-number"},[e._v("17")]),t("br")])]),t("h2",{attrs:{id:"bl3"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#bl3"}},[e._v("#")]),e._v(" bl3")]),e._v(" "),t("h3",{attrs:{id:"bl31"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#bl31"}},[e._v("#")]),e._v(" bl31")]),e._v(" "),t("p",[e._v("bl2 通过调用 SMC 指令跳转到 bl31 执行。bl31 最终主要的作用是建立 EL3 runtime software，在该阶段会建立各种类型的 SMC 调用注册并完成对应的 cortex 状态切换。该阶段主要执行在 monitor。")]),e._v(" "),t("p",[e._v("相关文件主要集中在 [bl3] 目录，查看 bl31.ld.S 文件可知 bl31 image 的入口函数是"),t("a",{attrs:{href:"https://github.com/ARM-software/arm-trusted-firmware/blob/v2.3/bl31/bl31.ld.S#L12",target:"_blank",rel:"noopener noreferrer"}},[e._v("bl31_entrypoint"),t("OutboundLink")],1),e._v("。")]),e._v(" "),t("div",{staticClass:"language- line-numbers-mode"},[t("pre",{pre:!0,attrs:{class:"language-text"}},[t("code",[e._v("|-bl31_entrypoint // bl31/aarch64/bl31_entrypoint.S#25\n| |-bl31_main     // bl31/bl31_main.c#96\n|   |             // 完成必要初始化操作，配置 EL3 的各种 SMC 操作，以便在后续顺利响应在 CA 和 TA 触发的 SMC 操作\n|   |-runtime_svc_init  // common/runtime_svc.c#90\n|                       // 建立 SMC 索引表并执行 EL3 提供的 service 初始化操作\n|-DECLARE_RT_SVC  // include/common/runtime_svc.h#73\n                  // 在编译的时候将 EL3 的 service 编译进 rt_svc_descs 段，相关参数说明如下\n                  //  - start_oen：该 service 的起始内部 number\n                  //  - end.oen: 该 service 的末尾 number\n                  //  - call_type: 调用的 SMC 类型\n                  //  - name: service 名字\n                  //  - init: service 在执行之前需要被执行的初始化操作\n                  //  - handle: 当触发了 call type 的调用时的回调函数\n")])]),e._v(" "),t("div",{staticClass:"line-numbers-wrapper"},[t("span",{staticClass:"line-number"},[e._v("1")]),t("br"),t("span",{staticClass:"line-number"},[e._v("2")]),t("br"),t("span",{staticClass:"line-number"},[e._v("3")]),t("br"),t("span",{staticClass:"line-number"},[e._v("4")]),t("br"),t("span",{staticClass:"line-number"},[e._v("5")]),t("br"),t("span",{staticClass:"line-number"},[e._v("6")]),t("br"),t("span",{staticClass:"line-number"},[e._v("7")]),t("br"),t("span",{staticClass:"line-number"},[e._v("8")]),t("br"),t("span",{staticClass:"line-number"},[e._v("9")]),t("br"),t("span",{staticClass:"line-number"},[e._v("10")]),t("br"),t("span",{staticClass:"line-number"},[e._v("11")]),t("br"),t("span",{staticClass:"line-number"},[e._v("12")]),t("br"),t("span",{staticClass:"line-number"},[e._v("13")]),t("br")])]),t("h4",{attrs:{id:"以-op-tee-为例演示从-bl31-跳转到-op-tee"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#以-op-tee-为例演示从-bl31-跳转到-op-tee"}},[e._v("#")]),e._v(" 以 OP-TEE 为例演示从 bl31 跳转到 OP-TEE")]),e._v(" "),t("p",[e._v("bl31 到 OP-TEE 的跳转是通过 "),t("code",[e._v("opteed_setup")]),e._v(" 函数来实现的，具体是执行 "),t("code",[e._v("runtime_svc_init")]),e._v(" 时调用 "),t("code",[e._v("service->init()")]),e._v("，而 OP-TEE 这个 service 就是通过 "),t("code",[e._v("DECALARE_RT_SVC")]),e._v(" 被注册到 "),t("code",[e._v("tr_svc_descs")]),e._v(" 段的，内容如下：")]),e._v(" "),t("div",{staticClass:"language-c line-numbers-mode"},[t("pre",{pre:!0,attrs:{class:"language-c"}},[t("code",[t("span",{pre:!0,attrs:{class:"token comment"}},[e._v("// service/spd/opteed/opteed_main.c#400")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token comment"}},[e._v("/* Define an OPTEED runtime service descriptor for fast SMC calls */")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token function"}},[e._v("DECLARE_RT_SVC")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),e._v("\n\topteed_fast"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v("\n\n\tOEN_TOS_START"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v("\n\tOEN_TOS_END"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v("\n\tSMC_TYPE_FAST"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v("\n\topteed_setup"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v("\n\topteed_smc_handler\n"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(";")]),e._v("\n")])]),e._v(" "),t("div",{staticClass:"line-numbers-wrapper"},[t("span",{staticClass:"line-number"},[e._v("1")]),t("br"),t("span",{staticClass:"line-number"},[e._v("2")]),t("br"),t("span",{staticClass:"line-number"},[e._v("3")]),t("br"),t("span",{staticClass:"line-number"},[e._v("4")]),t("br"),t("span",{staticClass:"line-number"},[e._v("5")]),t("br"),t("span",{staticClass:"line-number"},[e._v("6")]),t("br"),t("span",{staticClass:"line-number"},[e._v("7")]),t("br"),t("span",{staticClass:"line-number"},[e._v("8")]),t("br"),t("span",{staticClass:"line-number"},[e._v("9")]),t("br"),t("span",{staticClass:"line-number"},[e._v("10")]),t("br"),t("span",{staticClass:"line-number"},[e._v("11")]),t("br")])]),t("h3",{attrs:{id:"bl32-op-tee"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#bl32-op-tee"}},[e._v("#")]),e._v(" bl32（OP-TEE）")]),e._v(" "),t("p",[e._v("bl31 的 "),t("code",[e._v("runtime_svc_init")]),e._v(" 函数会初始化 OP-TEE 对应的 service，通过调用该 service 的 "),t("code",[e._v("init")]),e._v(" 函数启动 OP-TEE。")]),e._v(" "),t("div",{staticClass:"language- line-numbers-mode"},[t("pre",{pre:!0,attrs:{class:"language-text"}},[t("code",[e._v("|-runtime_svc_init  // common/runtime_svc.c#90\n|                   // 建立 SMC 索引表并执行 EL3 提供的 service 初始化操作\n  |-service->init   // common/runtime_svc.c#131\n    |-opteed_setup  // service/spd/opteed/opteed_main.c#94\n      |-bl31_register_bl32_init // service/spd/opteed/opteed_main.c#142\n        |-opteed_init           // service/spd/opteed/opteed_main.c#156\n          |                     // 该函数将会在 bl31 的所有 service 执行完 init 操作之后，执行存放在 bl32_init 变量的函数指针来调用。\n          |                     // 该函数调用之后会进入到 OP-TEE OS 的初始化阶段。\n          |-opteed_synchronous_sp_entry // // service/spd/opteed/opteed_common.c#70\n            |-opteed_enter_sp   // opteed_helpers.S#21\n                                // 完成跳转到 OP-TEE image 执行的操作，该函数将会保存一些列的寄存器值，设定好堆栈信息，然后通过调用\n                                // el3_eixt 函数实现跳转操作\n")])]),e._v(" "),t("div",{staticClass:"line-numbers-wrapper"},[t("span",{staticClass:"line-number"},[e._v("1")]),t("br"),t("span",{staticClass:"line-number"},[e._v("2")]),t("br"),t("span",{staticClass:"line-number"},[e._v("3")]),t("br"),t("span",{staticClass:"line-number"},[e._v("4")]),t("br"),t("span",{staticClass:"line-number"},[e._v("5")]),t("br"),t("span",{staticClass:"line-number"},[e._v("6")]),t("br"),t("span",{staticClass:"line-number"},[e._v("7")]),t("br"),t("span",{staticClass:"line-number"},[e._v("8")]),t("br"),t("span",{staticClass:"line-number"},[e._v("9")]),t("br"),t("span",{staticClass:"line-number"},[e._v("10")]),t("br"),t("span",{staticClass:"line-number"},[e._v("11")]),t("br"),t("span",{staticClass:"line-number"},[e._v("12")]),t("br")])]),t("h2",{attrs:{id:"参考文献"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#参考文献"}},[e._v("#")]),e._v(" 参考文献")]),e._v(" "),t("ul",[t("li",[t("a",{attrs:{href:"https://icyshuai.blog.csdn.net/article/details/72468109",target:"_blank",rel:"noopener noreferrer"}},[e._v("1. ATF（ARM Trusted firmware）完成启动流程"),t("OutboundLink")],1)]),e._v(" "),t("li",[t("a",{attrs:{href:"https://icyshuai.blog.csdn.net/article/details/72468962",target:"_blank",rel:"noopener noreferrer"}},[e._v("2. ATF（ARM Trusted firmware）启动---bl1"),t("OutboundLink")],1)]),e._v(" "),t("li",[t("a",{attrs:{href:"https://icyshuai.blog.csdn.net/article/details/72470044",target:"_blank",rel:"noopener noreferrer"}},[e._v("3. ATF（ARM Trusted firmware）启动---bl2"),t("OutboundLink")],1)]),e._v(" "),t("li",[t("a",{attrs:{href:"https://icyshuai.blog.csdn.net/article/details/72470715",target:"_blank",rel:"noopener noreferrer"}},[e._v("4. ATF（ARM Trusted firmware）启动---bl2到bl31的跳转"),t("OutboundLink")],1)]),e._v(" "),t("li",[t("a",{attrs:{href:"https://icyshuai.blog.csdn.net/article/details/72471290",target:"_blank",rel:"noopener noreferrer"}},[e._v("5. ATF（ARM Trusted firmware）启动---bl31"),t("OutboundLink")],1)]),e._v(" "),t("li",[t("a",{attrs:{href:"https://icyshuai.blog.csdn.net/article/details/72472028",target:"_blank",rel:"noopener noreferrer"}},[e._v("6. ATF（ARM Trusted firmware）启动---bl32（OP-TEE）"),t("OutboundLink")],1)])])])}),[],!1,null,null,null);s.default=a.exports}}]);