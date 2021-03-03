// add.s
TEXT ·add(SB), $0-24  // add 栈空间为 0，入参+返回值大小=24字节
  MOVQ a+0(FP), AX    // 从 main 取参数：2
  ADDQ b+8(FP), AX    // 从 main 取参数：3

  MOVQ AX, ret+16(FP) // 保存结果到返回值

  RET
