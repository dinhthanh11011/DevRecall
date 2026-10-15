---
title: "Carrier API vs aggregator, OAuth và vòng đời API"
summary: "Direct FedEx/UPS/USPS/DHL vs EasyPost/Shippo, OAuth client credentials và token cache, migrate khỏi legacy API, build vs buy, cách trả lời câu hỏi kinh nghiệm."
status: planned
questions: [shipping-apis-002, shipping-apis-005, shipping-apis-014, shipping-apis-032, shipping-apis-034, shipping-apis-040, shipping-apis-043, shipping-apis-047]
references: []
---

## Bối cảnh & vấn đề

- mỗi carrier một API; legacy bị khai tử

## Khái niệm

- carrier, aggregator, OAuth client credentials, token TTL, API key

## Cơ chế hoạt động

- token flow + single-flight refresh (sequence)

## Ví dụ thực tế

- token cache TS chạy được + output

## Trade-offs & lựa chọn thay thế

- direct vs aggregator vs hybrid (bảng chi phí)

## Edge cases & failure modes

- token race, 401 loop, secret rotation, deprecation

## Pitfalls

- token mỗi request, key theo carrier không theo account

## Tóm tắt

- bullets
