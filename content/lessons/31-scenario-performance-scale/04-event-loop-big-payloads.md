---
title: "Event loop và payload lớn: JSON 3MB, stream, worker, nén và CPU 100%"
summary: "Vì sao một JSON.stringify chặn mọi request, đo nó thế nào, và thứ tự fix: làm ít hơn, pre-serialize, ETag đúng, nén ở proxy, stream/NDJSON, worker có giới hạn, và săn CPU 100%."
status: planned
questions: [scenario-scale-032, scenario-scale-033, scenario-scale-034, scenario-scale-035, scenario-scale-036, scenario-scale-037, scenario-scale-038, scenario-scale-039, scenario-scale-040, scenario-scale-041, scenario-scale-042, scenario-scale-051, scenario-scale-052]
references: []
notionRefs: []
---

## Bối cảnh & vấn đề
- stringify; lag; ETag; pre-serialize; compression; stream; worker clone; fast-json-stringify; cpu-prof; O(n^2)
## Khái niệm
## Cơ chế hoạt động
## Ví dụ thực tế
## Trade-offs & lựa chọn thay thế
## Edge cases & failure modes
## Pitfalls
## Tóm tắt
