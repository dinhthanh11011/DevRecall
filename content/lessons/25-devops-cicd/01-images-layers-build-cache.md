---
title: "Image, layer và build cache cho Node"
summary: "Image là gì, layer và cache key, thứ tự Dockerfile, .dockerignore, npm ci vs npm install, BuildKit cache mount và cache trong CI, 12-factor build/release/run."
status: planned
questions: [devops-cicd-002, devops-cicd-024, devops-cicd-009, devops-cicd-010]
references: []
notionRefs: []
---

## Bối cảnh & vấn đề

- rebuild 4 phút mỗi lần sửa 1 dòng code

## Khái niệm

- image, layer, cache key, .dockerignore, npm ci, lockfile, 12-factor

## Cơ chế hoạt động

- flowchart cache invalidation

## Ví dụ thực tế

- đo thật: bad vs good order, npm ci fail khi lockfile lệch

## Trade-offs & lựa chọn thay thế

- npm/pnpm/yarn, cache mount vs registry cache

## Edge cases & failure modes

- cache miss trong CI, postinstall

## Pitfalls

- COPY . . trước install

## Tóm tắt

- bullets

