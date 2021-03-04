---
title: "Awesome SGX"
date: 2020-10-09
categories:
- tee
tags:
- sgx
---

## 博客

- Overview of Intel SGX  
  - [Part 1, SGX Internals][Overview of Intel SGX - Part 1, SGX Internals]  
    文章概述了 Intel SGX 技术。这是两篇文章中的第一篇，探寻 Intel 平台为了支持 SGX 引入的额外组件，主要集中在处理器和内存。文章还讲解了 enclave 的管理和生命周期，最后仔细描述了其两个关键特征：秘密封存和验证。
  - [Part 2, SGX Externals][Overview of Intel SGX - Part 2, SGX Externals]  
    文章承接[上一篇][Overview of Intel SGX - Part 1, SGX Internals]，介绍应用与 enclave 的交互方式，并描述了官方 SDK 和 PSW 包含的软件，最后总结对此项技术的已知攻击和担心之处。

### TODO
- [Quarkslab]
- [awesome-sgx]
- [SGXfail]

[Overview of Intel SGX - Part 1, SGX Internals]: https://blog.quarkslab.com/overview-of-intel-sgx-part-1-sgx-internals.html
[Overview of Intel SGX - Part 2, SGX Externals]: https://blog.quarkslab.com/overview-of-intel-sgx-part-2-sgx-externals.html
[Quarkslab]: https://blog.quarkslab.com/category/reverseengineering.html
[awesome-sgx]: https://github.com/Liaojinghui/awesome-sgx
[SGXfail]: https://github.com/dingelish/SGXfail
