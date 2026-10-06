---
title: "Playbook query chậm: tự nhiên chậm, index vẫn chậm"
summary: "Cây quyết định khi SQL không đổi mà chậm: pool, lock queue, idle in transaction, stats cũ, generic plan, đọc EXPLAIN, leftmost prefix, sargable, heap fetches và cột tương quan."
status: planned
questions: [scenario-data-035, scenario-data-036, scenario-data-037, scenario-data-038, scenario-data-039, scenario-data-040, scenario-data-041, scenario-data-042, scenario-data-043, scenario-data-044, scenario-data-045, scenario-data-046]
---

## Bối cảnh & vấn đề
## Khái niệm
## Cơ chế hoạt động
## Ví dụ thực tế
- generic plan sau 5 lần; lock queue; idle in transaction giữ vacuum; leftmost prefix; function trên cột; heap fetches; extended stats
## Trade-offs & lựa chọn thay thế
## Edge cases & failure modes
## Pitfalls
## Tóm tắt
