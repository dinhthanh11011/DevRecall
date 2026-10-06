---
title: "Probes và vòng đời Pod khi rolling update"
summary: "Readiness, liveness, startup probe làm gì; vì sao liveness gọi DB gây outage; 502 khi rolling update do endpoint removal song song SIGTERM; preStop, terminationGracePeriodSeconds, maxSurge/maxUnavailable, PDB."
status: planned
questions: [devops-cicd-005, devops-cicd-027, devops-cicd-026, devops-cicd-045]
references: []
notionRefs: []
---

## Bối cảnh & vấn đề

- outage do liveness

## Khái niệm

- probes

## Cơ chế hoạt động

- sequence termination

## Ví dụ thực tế

- kind thật

## Trade-offs & lựa chọn thay thế

- probe designs

## Edge cases & failure modes

- DB down cho mọi pod

## Pitfalls

- liveness gọi DB

## Tóm tắt

- bullets

