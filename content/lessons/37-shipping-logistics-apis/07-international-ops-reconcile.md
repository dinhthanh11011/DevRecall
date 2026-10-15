---
title: "Quốc tế, đối soát chi phí và vận hành shipping"
summary: "Customs/HS code/Incoterms, quote vs label vs invoice, reconcile hoá đơn carrier, sự cố peak, observability và SLO, câu chuyện kinh nghiệm."
status: planned
questions: [shipping-apis-009, shipping-apis-018, shipping-apis-028, shipping-apis-031, shipping-apis-037, shipping-apis-042, shipping-apis-045, shipping-apis-046]
references: []
---

## Bối cảnh & vấn đề

- hoá đơn cao hơn 12%

## Khái niệm

- HS code, CN22/23, DDP/DAP, adjustment, SLO

## Cơ chế hoạt động

- reconcile pipeline (flowchart)

## Ví dụ thực tế

- reconcile SQL + output

## Trade-offs & lựa chọn thay thế

- DDP vs DAP; alert theo burn rate

## Edge cases & failure modes

- Black Friday carrier down, adjustment muộn

## Pitfalls

- khai gift, không lưu invoice

## Tóm tắt

- bullets
