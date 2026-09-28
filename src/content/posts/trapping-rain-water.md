---
title: 按列、查表、对撞：接雨水从暴力到 O(1) 空间
published: 2026-09-29
category: 算法
tags:
  - LeetCode
  - 双指针
  - Hot 100 刷题日记
description: 双指针专题的最后一题，也是我碰到的第一道困难题。三个解法的完整代码：按列求水的暴力、两个数组的查表、压成两个变量的对撞，中间被一个结算顺序的坑绊了一下。
---

柱子高度存在数组里，问凹凸之间能接多少雨水。整个图能接多少水，这个问题全局看无从下手。换个视角，一列一列地算：每根柱子上方是一条竖直的窄槽，把每条槽的水加起来就是答案。

每条槽能装多少水，靠一个灌水实验推出来。想象站在下标 i 的正上方往槽里灌水，水位一旦高过两侧任何一面能翻出去的墙，水就漫过去流走了。所以水位的平衡点在两侧最高墙中较矮的那面：水 = min(左侧最高, 右侧最高) − height[i]。为什么是 min 不是 max，灌到高墙那个水位之前，水早就从矮墙流走了。

拿 [3, 0, 2] 手推：左最大 [3, 3, 3]，右最大 [3, 2, 2]，中间列 min(3, 2) − 0 = 2，答案 2，和图上数出来的一致。

## 解法一：暴力

对每个 i 老老实实向两侧各扫一遍，找最大值，套公式加总：

```java
public int trap(int[] height) {
    int ans = 0;
    for (int i = 0; i < height.length; i++) {
        int leftMax = 0, rightMax = 0;
        for (int j = i; j >= 0; j--)
            leftMax = Math.max(leftMax, height[j]);
        for (int j = i; j < height.length; j++)
            rightMax = Math.max(rightMax, height[j]);
        ans += Math.max(0, Math.min(leftMax, rightMax) - height[i]);
    }
    return ans;
}
```

O(n²)。慢在重复劳动：算 i+1 的左侧最大时，算 i 时扫过的柱子又扫了一遍。

## 解法二：查表

左侧最大其实只依赖前一项，从左往右一趟就能递推出来：leftMax[i] = max(leftMax[i−1], height[i])，右边对称，从右往左。递推式翻译成循环有条机械规则：依赖前一项就从 1 往后扫，依赖后一项就从 n−2 往前扫，依赖不到的那一项是基底，循环开始前手动赋值。两个数组填完，主循环直接查表：

```java
public int trap(int[] height) {
    int n = height.length;
    int[] leftMax = new int[n], rightMax = new int[n];
    leftMax[0] = height[0];
    for (int i = 1; i < n; i++)
        leftMax[i] = Math.max(leftMax[i - 1], height[i]);
    rightMax[n - 1] = height[n - 1];
    for (int i = n - 2; i >= 0; i--)
        rightMax[i] = Math.max(rightMax[i + 1], height[i]);
    int ans = 0;
    for (int i = 0; i < n; i++)
        ans += Math.min(leftMax[i], rightMax[i]) - height[i];
    return ans;
}
```

O(n) 时间，O(n) 空间。两个数组的最大值都含自己，min 必然不小于 height[i]，差值出不了负数，暴力版那层 Math.max(0, ...) 在这里可以省掉。

## 解法三：双指针

查表版要两侧的完整最大值，其实不用。维护 l、r 两个指针和两个滚动最大 leftMax、rightMax，各覆盖已扫过的半边。假设此刻 leftMax < rightMax，看位置 l：它的真实左侧最大就是 leftMax，不多不少，左边全扫完了；真实右侧最大只知道一部分，但有铁的下界，至少是 rightMax，比 leftMax 大，min 被左边卡死。位置 l 的水当场敲定，结算完 l 走一步。另一侧对称。两个数组被压成了两个跟着指针走的变量。

```java
public int trap(int[] height) {
    int l = 0, r = height.length - 1;
    int leftMax = 0, rightMax = 0, ans = 0;
    while (l < r) {
        leftMax = Math.max(leftMax, height[l]);
        rightMax = Math.max(rightMax, height[r]);
        if (leftMax < rightMax) {
            ans += leftMax - height[l];
            l++;
        } else {
            ans += rightMax - height[r];
            r--;
        }
    }
    return ans;
}
```

O(n) 时间、O(1) 空间。这个论证和盛最多水是同一个：短板那侧的信息是完整的，命运已定，所以先结算它。

## 一个结算顺序的坑

我的第一版双指针把顺序写反了，先 l++ 再结算。走一步之后 height[l] 是新柱子，leftMax 还是旧柱子们的最大，新柱子没被纳入。拿 [4, 2, 0, 3, 2, 5] 验收，答案应该是 9，我的输出是 8：最后一步 l 落在场中最高的 5 上，结算 4 − 5 = −1，最高的柱子贡献了负一格水。正确次序是更新 max、结算当前、再移动，结算发生在 max 认识当前柱子的那一刻，leftMax ≥ height[l] 恒成立，差值天然非负。

这也解开了一个之前的疑问。公式外面那层 max(0, ...) 需不需要，取决于最大值含不含自己：含自己的写法差值出不了负数，不需要；不含自己的写法必须有它兜底，先移动再结算就是后一种。两种都能过，差别只在要不要那层兜底。

## 复杂度对比

| 解法 | 时间 | 空间 |
|---|---|---|
| 暴力 | O(n²) | O(1) |
| 查表 | O(n) | O(n) |
| 双指针 | O(n) | O(1) |
