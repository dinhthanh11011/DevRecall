---
title: "Requests, limits, OOMKilled và HPA"
summary: "Request dùng để schedule, limit là trần; memory vượt thì OOMKilled 137, CPU vượt thì throttle; V8 heap so với container limit; QoS; HPA tính replica thế nào và scale Node API theo metric gì; PM2 và CPU."
status: planned
questions: [devops-cicd-012, devops-cicd-013, devops-cicd-014, devops-cicd-030]
references: []
notionRefs: []
---

## Bối cảnh & vấn đề

- OOMKilled dưới tải

## Khái niệm

- requests, limits, QoS, CFS, HPA

## Cơ chế hoạt động

- flowchart HPA

## Ví dụ thực tế

- đo thật OOM, throttle

## Trade-offs & lựa chọn thay thế

- CPU limit hay không

## Edge cases & failure modes

- connection storm

## Pitfalls

- heap > limit

## Tóm tắt

- bullets

