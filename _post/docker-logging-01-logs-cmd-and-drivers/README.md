---
title: "[容器日志] 01. `docker logs` & logging driver" 
date: 2021-02-16
categories:
- architecture
tags: 
- docker
- logging
- microservices
---

监控和日志历来都是系统稳定运行和问题排查的关键。在微服务架构中，数量众多的容器以及快速变化的特性使得一套集中式的日志管理系统变成了生产环境不可或缺的部分。本文话题集中在日志管理方面，介绍 Docker 自带的 `logs` 子命令以及其 logging driver。

## `docker logs` 子命令
默认情况下，Docker 的日志会发送到容器的标准输出设备（stdout）和标准错误设备（stderr），其中 stdout 和 stderr 实际上就是容器的控制台终端。

可以通过 `logs` 子命令来查看具体某个容器的日志输出：

```bash
docker logs hello-world

## 输出如下
/hello-world # go run main.go 
-----------
hello-world
-----------
```

这时看到的日志是静态的，截止到目前为止的日志。如果想要持续看到新打印出的日志信息，那么可以加上 `-f` 参数，如：

```bash
docker logs -f edc-k8s-demo
```

## Docker logging driver
默认配置下，Docker 日志会发送到 stdout 和 stderr。但实际上，Docker 还提供其他的机制允许我们从运行的容器提取日志，这些机制统称为 logging driver。

对 Docker 而言，其默认的 logging driver 是 `json-file`。如果在启动时没有特别指定，都会使用这个默认的 logging driver。

```bash
docker info | grep 'Logging Driver'

Logging Driver: json-file
```

`json-file` 会将控制台通过 `docker logs` 命名看到的日志都保存在一个 json 文件，可以在服务器主机的容器目录找到这个 json 文件。

容器日志路径：`/var/lib/docker/containers/<container-id>/<container-id>-json.log`。

快速查看某个容器的日志文件路径的方法：

```bash
docker inspect -f {{.LogPath}}  hello-world

/var/lib/docker/containers/9e98f7ceb536831c4a98dfce5564c0798d7e8fdb1bca5bda3911f3495467c011/9e98f7ceb536831c4a98dfce5564c0798d7e8fdb1bca5bda3911f3495467c011-json.log
```

查到 `LogPath` 后，根据显示的日志路径找到并打开这个 json 文件就可以看到输出的容器日志了。

除了 json-file，[Docker 还支持以下多种 logging dirver][Configure logging drivers]。

Driver	| Description
-----:|:----
`none`	| No logs are available for the container and docker logs does not return any output.
`local`	| Logs are stored in a custom format designed for minimal overhead.
`json-file`	| The logs are formatted as JSON. The default logging driver for Docker.
`syslog`	| Writes logging messages to the syslog facility. The syslog daemon must be running on the host machine.
`journald` |	Writes log messages to journald. The journald daemon must be running on the host machine.
`gelf` |	Writes log messages to a Graylog Extended Log Format (GELF) endpoint such as Graylog or Logstash.
`fluentd` |	Writes log messages to fluentd (forward input). The fluentd daemon must be running on the host machine.
`awslogs` |	Writes log messages to Amazon CloudWatch Logs.
`splunk` |	Writes log messages to splunk using the HTTP Event Collector.
`etwlogs` |	Writes log messages as Event Tracing for Windows (ETW) events. Only available on Windows platforms.
`gcplogs`	| Writes log messages to Google Cloud Platform (GCP) Logging.
`logentries` |	Writes log messages to Rapid7 Logentries.

其中，`none` 代表禁用容器日志，不会输出任何容器日志。其他几个 logging driver 解释如下：
- `syslog` 与 `journald` 是 Linux 的两种日志管理服务
- `awslog`、`splunk` 与 `gcplogs` 是第三方日志托管服务
- `gelf` 与 `fluentd` 是两种开源的日志管理方案

在容器启动时加上 `--log-driver` 可指定使用哪个具体的 logging driver，例如：

```bash
docker run -d --log-driver=syslog ......
```

如果想要设置默认的 logging driver，则需要修改 Docker daemon 的启动脚本 `/etc/docker/daemonn.json`，例如：

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "labels": "production_status",
    "env": "os,customer"
  }
}
```

每个 logging driver 都有一些自己特定的 `log-opt`，使用时可以参考具体官方文档。

## 小结
本文介绍了 Docker 自带的 `logs` 子命令以及 logging driver。默认的 logging driver 是 `json-file`。当然 Docker 还支持多个不同机制的 logging dirver，可以根据自己的需要在使用时进行指定。

## 参考文献
- [你必须知道的容器日志 (1) Docker logs & logging driver](https://www.cnblogs.com/edisonchou/p/docker_logs_study_summary_part1.html)

[Configure logging drivers]: https://docs.docker.com/config/containers/logging/configure/
