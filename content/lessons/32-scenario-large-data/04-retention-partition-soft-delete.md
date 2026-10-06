---
title: "Retention: partition, bloat, soft delete và erasure"
summary: "Xoá cả năm dữ liệu bằng DETACH/DROP, vì sao disk không giảm sau DELETE, copy-keepers + swap, chọn partition key, pruning, soft delete với partial unique index và GDPR erasure."
status: planned
questions: [scenario-data-030, scenario-data-031, scenario-data-032, scenario-data-052, scenario-data-053, scenario-data-054, scenario-data-055]
---

## Bối cảnh & vấn đề
## Khái niệm
## Cơ chế hoạt động
## Ví dụ thực tế
- đo size trước/sau DELETE + VACUUM; DETACH CONCURRENTLY; pruning; partial unique index
## Trade-offs & lựa chọn thay thế
## Edge cases & failure modes
## Pitfalls
## Tóm tắt
