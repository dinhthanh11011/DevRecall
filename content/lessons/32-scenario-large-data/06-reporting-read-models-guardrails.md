---
title: "Reporting, hai database và guardrail khi dữ liệu lớn dần"
summary: "Dashboard trên OLTP, replica vs MV vs summary table vs warehouse, query dữ liệu nằm ở hai DB, read model đồng bộ bằng outbox/CDC, facet search, và guardrail cho bảng tăng 5x/năm."
status: planned
questions: [scenario-data-047, scenario-data-048, scenario-data-049, scenario-data-050, scenario-data-051, scenario-data-056, scenario-data-058, scenario-data-060]
---

## Bối cảnh & vấn đề
## Khái niệm
## Cơ chế hoạt động
## Ví dụ thực tế
- REFRESH MV chặn reader; CONCURRENTLY cần unique index; summary table incremental
## Trade-offs & lựa chọn thay thế
## Edge cases & failure modes
## Pitfalls
## Tóm tắt
