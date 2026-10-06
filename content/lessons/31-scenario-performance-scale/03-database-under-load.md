---
title: "Database dưới tải: pool exhaustion, N+1, max_connections và ghi theo batch"
summary: "Các kịch bản DB là tài nguyên cạn trước: pool leak và transaction bọc HTTP call, too many clients khi scale pod, N+1, concurrency không giới hạn, và ghi 5k event/s bằng batch/COPY an toàn."
status: planned
questions: [scenario-scale-006, scenario-scale-007, scenario-scale-008, scenario-scale-019, scenario-scale-020, scenario-scale-021, scenario-scale-029, scenario-scale-030, scenario-scale-031]
references: []
notionRefs: []
---

## Bối cảnh & vấn đề
- pool; too many clients; N+1; Promise.all; bounded concurrency; batch insert; in-memory buffer
## Khái niệm
## Cơ chế hoạt động
## Ví dụ thực tế
## Trade-offs & lựa chọn thay thế
## Edge cases & failure modes
## Pitfalls
## Tóm tắt
