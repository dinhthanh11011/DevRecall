---
title: "Supavisor, pooler mode và state trên serverless"
summary: "Vì sao serverless làm cạn connection, direct vs session vs transaction mode, prepared statement và SET trong transaction mode (PgBouncer chạy thật), state module-scope trên Fluid compute, cache theo tenant, job dài."
status: planned
questions: [mock-internal-platform-013, mock-internal-platform-023, mock-internal-platform-040, mock-internal-platform-025]
references: []
---

## Bối cảnh & vấn đề

- too many connections

## Khái niệm

- max_connections; pooler modes; Fluid

## Cơ chế hoạt động

- transaction mode multiplexing

## Ví dụ thực tế

- PgBouncer 1.26 + node-postgres

## Trade-offs & lựa chọn thay thế

- pool choices

## Edge cases & failure modes

- prepared statement errors

## Pitfalls

- ❌/✅

## Tóm tắt

- bullets

