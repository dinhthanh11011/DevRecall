---
title: "Tracking: normalize status, webhook và polling"
summary: "State machine chuẩn cho tracking, webhook at-least-once (verify HMAC, dedupe, ack nhanh), out-of-order, poller cho kiện im lặng."
status: planned
questions: [shipping-apis-007, shipping-apis-015, shipping-apis-016, shipping-apis-029, shipping-apis-030, shipping-apis-038]
references: []
---

## Bối cảnh & vấn đề

- delivered quay về in_transit

## Khái niệm

- tracking event, normalized status, webhook, HMAC, dedupe

## Cơ chế hoạt động

- webhook ingest → queue → state machine (sequence + state)

## Ví dụ thực tế

- HMAC verify + conditional update SQL + output

## Trade-offs & lựa chọn thay thế

- webhook vs polling vs hybrid

## Edge cases & failure modes

- secret rotation, mapping thiếu, lost update

## Pitfalls

- stringify body, xử lý nặng trước khi ack

## Tóm tắt

- bullets
