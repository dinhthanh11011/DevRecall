---
title: "PID 1, signal và graceful shutdown"
summary: "Vì sao docker stop mất 10 giây, PID 1 và default signal action, exec vs shell form, npm làm PID 1, tini/--init, graceful shutdown trong Node, PM2/cluster trong container."
status: planned
questions: [devops-cicd-011, devops-cicd-030, devops-cicd-009, devops-cicd-026]
references: []
notionRefs: []
---

## Bối cảnh & vấn đề

- request bị cắt mỗi lần deploy

## Khái niệm

- signal, PID 1, exec form, tini, zombie, server.close

## Cơ chế hoạt động

- sequence stop

## Ví dụ thực tế

- đo thật docker stop các biến thể

## Trade-offs & lựa chọn thay thế

- tini vs dumb-init vs handler

## Edge cases & failure modes

- keep-alive, child process

## Pitfalls

- CMD npm start

## Tóm tắt

- bullets

