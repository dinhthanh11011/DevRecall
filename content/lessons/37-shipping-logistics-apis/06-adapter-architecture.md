---
title: "Kiến trúc multi-carrier: canonical model, adapter, multi-tenant"
summary: "Canonical model + adapter (anti-corruption layer), unit/money, error mapping, capability matrix, BYOA credentials, testing, thiết kế 100k shipment/ngày."
status: planned
questions: [shipping-apis-010, shipping-apis-017, shipping-apis-021, shipping-apis-025, shipping-apis-026, shipping-apis-035, shipping-apis-036, shipping-apis-039]
references: []
---

## Bối cảnh & vấn đề

- if carrier === ... khắp nơi

## Khái niệm

- canonical model, adapter, capability, canonical error, envelope encryption

## Cơ chế hoạt động

- kiến trúc service + registry (flowchart)

## Ví dụ thực tế

- adapter interface + unit convert test + output

## Trade-offs & lựa chọn thay thế

- monolith adapter vs service riêng; sync vs async

## Edge cases & failure modes

- noisy neighbor, carrier thiếu tính năng, sandbox khác prod

## Pitfalls

- float money, unit trộn, lỗi 200-with-error

## Tóm tắt

- bullets
