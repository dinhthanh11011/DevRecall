---
title: "Address validation, rate shopping và EDD ở checkout"
summary: "Validate địa chỉ và residential flag, rate shopping song song có timeout/fallback, cache rate, lời hứa ngày giao."
status: planned
questions: [shipping-apis-006, shipping-apis-011, shipping-apis-012, shipping-apis-023, shipping-apis-024, shipping-apis-041, shipping-apis-044]
references: []
---

## Bối cảnh & vấn đề

- checkout treo vì một carrier

## Khái niệm

- address normalize, DPV, residential, rate quote, service level, EDD

## Cơ chế hoạt động

- rate shopping allSettled + timeout (flowchart)

## Ví dụ thực tế

- rate shopping TS với fake carriers + output

## Trade-offs & lựa chọn thay thế

- realtime vs table vs cache; block vs suggest

## Edge cases & failure modes

- carrier chậm, cache leak giữa tenant, PO box

## Pitfalls

- Promise.all, chặn cứng địa chỉ

## Tóm tắt

- bullets
