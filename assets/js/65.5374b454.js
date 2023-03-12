(window.webpackJsonp=window.webpackJsonp||[]).push([[65],{715:function(t,e,s){"use strict";s.r(e);var a=s(2),n=Object(a.a)({},(function(){var t=this,e=t._self._c;return e("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[e("p",[t._v("监控和日志历来都是系统稳定运行和问题排查的关键。在微服务架构中，数量众多的容器以及快速变化的特性使得一套集中式的日志管理系统变成了生产环境不可或缺的部分。本文话题集中在日志管理方面，介绍 Docker 自带的 "),e("code",[t._v("logs")]),t._v(" 子命令以及其 logging driver。")]),t._v(" "),e("h2",{attrs:{id:"docker-logs-子命令"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#docker-logs-子命令"}},[t._v("#")]),t._v(" "),e("code",[t._v("docker logs")]),t._v(" 子命令")]),t._v(" "),e("p",[t._v("默认情况下，Docker 的日志会发送到容器的标准输出设备（stdout）和标准错误设备（stderr），其中 stdout 和 stderr 实际上就是容器的控制台终端。")]),t._v(" "),e("p",[t._v("可以通过 "),e("code",[t._v("logs")]),t._v(" 子命令来查看具体某个容器的日志输出：")]),t._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[e("span",{pre:!0,attrs:{class:"token function"}},[t._v("docker")]),t._v(" logs hello-world\n\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("## 输出如下")]),t._v("\n/hello-world "),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("# go run main.go")]),t._v("\n-----------\nhello-world\n-----------\n")])]),t._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[t._v("1")]),e("br"),e("span",{staticClass:"line-number"},[t._v("2")]),e("br"),e("span",{staticClass:"line-number"},[t._v("3")]),e("br"),e("span",{staticClass:"line-number"},[t._v("4")]),e("br"),e("span",{staticClass:"line-number"},[t._v("5")]),e("br"),e("span",{staticClass:"line-number"},[t._v("6")]),e("br"),e("span",{staticClass:"line-number"},[t._v("7")]),e("br")])]),e("p",[t._v("这时看到的日志是静态的，截止到目前为止的日志。如果想要持续看到新打印出的日志信息，那么可以加上 "),e("code",[t._v("-f")]),t._v(" 参数，如：")]),t._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[e("span",{pre:!0,attrs:{class:"token function"}},[t._v("docker")]),t._v(" logs "),e("span",{pre:!0,attrs:{class:"token parameter variable"}},[t._v("-f")]),t._v(" hello-world\n")])]),t._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[t._v("1")]),e("br")])]),e("h2",{attrs:{id:"docker-logging-driver"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#docker-logging-driver"}},[t._v("#")]),t._v(" Docker logging driver")]),t._v(" "),e("p",[t._v("默认配置下，Docker 日志会发送到 stdout 和 stderr。但实际上，Docker 还提供其他的机制允许我们从运行的容器提取日志，这些机制统称为 logging driver。")]),t._v(" "),e("p",[t._v("对 Docker 而言，其默认的 logging driver 是 "),e("code",[t._v("json-file")]),t._v("。如果在启动时没有特别指定，都会使用这个默认的 logging driver。")]),t._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[e("span",{pre:!0,attrs:{class:"token function"}},[t._v("docker")]),t._v(" info "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("|")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("grep")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token string"}},[t._v("'Logging Driver'")]),t._v("\n\nLogging Driver: json-file\n")])]),t._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[t._v("1")]),e("br"),e("span",{staticClass:"line-number"},[t._v("2")]),e("br"),e("span",{staticClass:"line-number"},[t._v("3")]),e("br")])]),e("p",[e("code",[t._v("json-file")]),t._v(" 会将控制台通过 "),e("code",[t._v("docker logs")]),t._v(" 命名看到的日志都保存到一个 json 文件，可以在服务器主机的容器目录找到这个 json 文件。")]),t._v(" "),e("p",[t._v("容器日志路径："),e("code",[t._v("/var/lib/docker/containers/<container-id>/<container-id>-json.log")]),t._v("。")]),t._v(" "),e("p",[t._v("快速查看某个容器的日志文件路径的方法：")]),t._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[e("span",{pre:!0,attrs:{class:"token function"}},[t._v("docker")]),t._v(" inspect "),e("span",{pre:!0,attrs:{class:"token parameter variable"}},[t._v("-f")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(".LogPath"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("  hello-world\n\n/var/lib/docker/containers/9e98f7ceb536831c4a98dfce5564c0798d7e8fdb1bca5bda3911f3495467c011/9e98f7ceb536831c4a98dfce5564c0798d7e8fdb1bca5bda3911f3495467c011-json.log\n")])]),t._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[t._v("1")]),e("br"),e("span",{staticClass:"line-number"},[t._v("2")]),e("br"),e("span",{staticClass:"line-number"},[t._v("3")]),e("br")])]),e("p",[t._v("查到 "),e("code",[t._v("LogPath")]),t._v(" 后，根据显示的日志路径找到并打开这个 json 文件就可以看到输出的容器日志了。")]),t._v(" "),e("p",[t._v("除了 json-file，"),e("a",{attrs:{href:"https://docs.docker.com/config/containers/logging/configure/",target:"_blank",rel:"noopener noreferrer"}},[t._v("Docker 还支持以下多种 logging dirver"),e("OutboundLink")],1),t._v("。")]),t._v(" "),e("table",[e("thead",[e("tr",[e("th",{staticStyle:{"text-align":"right"}},[t._v("Driver")]),t._v(" "),e("th",{staticStyle:{"text-align":"left"}},[t._v("Description")])])]),t._v(" "),e("tbody",[e("tr",[e("td",{staticStyle:{"text-align":"right"}},[e("code",[t._v("none")])]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("No logs are available for the container and docker logs does not return any output.")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[e("code",[t._v("local")])]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("Logs are stored in a custom format designed for minimal overhead.")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[e("code",[t._v("json-file")])]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("The logs are formatted as JSON. The default logging driver for Docker.")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[e("code",[t._v("syslog")])]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("Writes logging messages to the syslog facility. The syslog daemon must be running on the host machine.")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[e("code",[t._v("journald")])]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("Writes log messages to journald. The journald daemon must be running on the host machine.")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[e("code",[t._v("gelf")])]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("Writes log messages to a Graylog Extended Log Format (GELF) endpoint such as Graylog or Logstash.")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[e("code",[t._v("fluentd")])]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("Writes log messages to fluentd (forward input). The fluentd daemon must be running on the host machine.")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[e("code",[t._v("awslogs")])]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("Writes log messages to Amazon CloudWatch Logs.")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[e("code",[t._v("splunk")])]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("Writes log messages to splunk using the HTTP Event Collector.")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[e("code",[t._v("etwlogs")])]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("Writes log messages as Event Tracing for Windows (ETW) events. Only available on Windows platforms.")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[e("code",[t._v("gcplogs")])]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("Writes log messages to Google Cloud Platform (GCP) Logging.")])]),t._v(" "),e("tr",[e("td",{staticStyle:{"text-align":"right"}},[e("code",[t._v("logentries")])]),t._v(" "),e("td",{staticStyle:{"text-align":"left"}},[t._v("Writes log messages to Rapid7 Logentries.")])])])]),t._v(" "),e("p",[t._v("其中，"),e("code",[t._v("none")]),t._v(" 代表禁用容器日志，不会输出任何容器日志。其他几个 logging driver 解释如下：")]),t._v(" "),e("ul",[e("li",[e("code",[t._v("syslog")]),t._v(" 与 "),e("code",[t._v("journald")]),t._v(" 是 Linux 的两种日志管理服务")]),t._v(" "),e("li",[e("code",[t._v("awslog")]),t._v("、"),e("code",[t._v("splunk")]),t._v(" 与 "),e("code",[t._v("gcplogs")]),t._v(" 是第三方日志托管服务")]),t._v(" "),e("li",[e("code",[t._v("gelf")]),t._v(" 与 "),e("code",[t._v("fluentd")]),t._v(" 是两种开源的日志管理方案")])]),t._v(" "),e("p",[t._v("在容器启动时加上 "),e("code",[t._v("--log-driver")]),t._v(" 可指定使用哪个具体的 logging driver，例如：")]),t._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[e("span",{pre:!0,attrs:{class:"token function"}},[t._v("docker")]),t._v(" run "),e("span",{pre:!0,attrs:{class:"token parameter variable"}},[t._v("-d")]),t._v(" --log-driver"),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v("syslog "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("..")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("..")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("..")]),t._v("\n")])]),t._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[t._v("1")]),e("br")])]),e("p",[t._v("如果想要设置默认的 logging driver，则需要修改 Docker daemon 的启动脚本 "),e("code",[t._v("/etc/docker/daemonn.json")]),t._v("，例如：")]),t._v(" "),e("div",{staticClass:"language-json line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-json"}},[e("code",[e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),e("span",{pre:!0,attrs:{class:"token property"}},[t._v('"log-driver"')]),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token string"}},[t._v('"json-file"')]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  "),e("span",{pre:!0,attrs:{class:"token property"}},[t._v('"log-opts"')]),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),e("span",{pre:!0,attrs:{class:"token property"}},[t._v('"labels"')]),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token string"}},[t._v('"production_status"')]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n    "),e("span",{pre:!0,attrs:{class:"token property"}},[t._v('"env"')]),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token string"}},[t._v('"os,customer"')]),t._v("\n  "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])]),t._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[t._v("1")]),e("br"),e("span",{staticClass:"line-number"},[t._v("2")]),e("br"),e("span",{staticClass:"line-number"},[t._v("3")]),e("br"),e("span",{staticClass:"line-number"},[t._v("4")]),e("br"),e("span",{staticClass:"line-number"},[t._v("5")]),e("br"),e("span",{staticClass:"line-number"},[t._v("6")]),e("br"),e("span",{staticClass:"line-number"},[t._v("7")]),e("br")])]),e("p",[t._v("每个 logging driver 都有一些自己特定的 "),e("code",[t._v("log-opt")]),t._v("，使用时可以参考具体官方文档。")]),t._v(" "),e("h2",{attrs:{id:"小结"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#小结"}},[t._v("#")]),t._v(" 小结")]),t._v(" "),e("p",[t._v("本文介绍了 Docker 自带的 "),e("code",[t._v("logs")]),t._v(" 子命令以及 logging driver。默认的 logging driver 是 "),e("code",[t._v("json-file")]),t._v("。当然 Docker 还支持多个不同机制的 logging dirver，可以根据自己的需要在使用时进行指定。")]),t._v(" "),e("h2",{attrs:{id:"参考文献"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#参考文献"}},[t._v("#")]),t._v(" 参考文献")]),t._v(" "),e("ul",[e("li",[e("a",{attrs:{href:"https://www.cnblogs.com/edisonchou/p/docker_logs_study_summary_part1.html",target:"_blank",rel:"noopener noreferrer"}},[t._v("你必须知道的容器日志 (1) Docker logs & logging driver"),e("OutboundLink")],1)])])])}),[],!1,null,null,null);e.default=n.exports}}]);