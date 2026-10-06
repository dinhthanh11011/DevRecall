---
title: "Multi-stage build, base image và non-root"
summary: "Multi-stage cho TypeScript/Next.js standalone, chọn alpine/slim/distroless, non-root và securityContext, secret lúc build (ARG/ENV vs secret mount), review một Dockerfile production."
status: planned
questions: [devops-cicd-001, devops-cicd-003, devops-cicd-010, devops-cicd-045]
references: []
notionRefs: []
---

## Bối cảnh & vấn đề

- image 1.2 GB lộ token

## Khái niệm

- stage, artifact, base image, USER, secret mount

## Cơ chế hoạt động

- flowchart build stage → runtime

## Ví dụ thực tế

- đo thật size so sánh, docker history lộ token

## Trade-offs & lựa chọn thay thế

- alpine vs slim vs distroless

## Edge cases & failure modes

- musl, readOnlyRootFilesystem

## Pitfalls

- secret trong ENV

## Tóm tắt

- bullets

