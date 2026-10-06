---
title: "Memory leak trong production: chứng minh, cầm máu và tìm retainer"
summary: "RSS cao chưa phải leak; đọc memoryUsage theo thời gian, 3-snapshot technique an toàn trên production, các leak kinh điển (Map, listener, timer, fetch body, AsyncLocalStorage) và sizing heap theo container."
status: planned
questions: [scenario-scale-043, scenario-scale-044, scenario-scale-045, scenario-scale-046, scenario-scale-047, scenario-scale-048, scenario-scale-049, scenario-scale-050, scenario-scale-060]
references: []
notionRefs: []
---

## Bối cảnh & vấn đề
- leak vs load; snapshot; Map cache; listener; fetch body; max-old-space-size; mitigation; ALS
## Khái niệm
## Cơ chế hoạt động
## Ví dụ thực tế
## Trade-offs & lựa chọn thay thế
## Edge cases & failure modes
## Pitfalls
## Tóm tắt
