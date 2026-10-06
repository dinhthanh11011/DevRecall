---
title: "P1: tenant isolation từ token đến SQL, test cross-tenant và noisy neighbor"
summary: "Trả lời chuỗi câu hỏi về claim 'tenant-aware data access & authorization': tenant đi từ token qua middleware tới query, chỗ nào enforce, cái gì bắt được một raw query quên filter trước và sau production (RLS chạy thật trên Postgres 17: query quên WHERE vẫn chỉ thấy dữ liệu của tenant, INSERT sai tenant bị chặn, context không leak qua connection tái sử dụng), cách test cross-tenant bằng node:test, và cách xử lý một tenant lớn làm chậm mọi tenant khác."
status: drafted
questions: [project-deep-dive-008, project-deep-dive-025, project-deep-dive-026, project-deep-dive-049]
references:
  - { title: "PostgreSQL docs: Row Security Policies", url: "https://www.postgresql.org/docs/current/ddl-rowsecurity.html" }
  - { title: "Microsoft Learn: Row-level security (SQL Server)", url: "https://learn.microsoft.com/en-us/sql/relational-databases/security/row-level-security" }
  - { title: "Microsoft Learn: SESSION_CONTEXT", url: "https://learn.microsoft.com/en-us/sql/t-sql/functions/session-context-transact-sql" }
  - { title: "AWS SaaS Lens: Tenant isolation", url: "https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/tenant-isolation.html" }
  - { title: "OWASP API Security Top 10: API1 Broken Object Level Authorization", url: "https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/" }
notionRefs: []
verify: true
---

## Bối cảnh & vấn đề

Claim "tenant-aware data access and authorization so users only access resources in their tenant" là claim nguy hiểm nhất trên CV của P1, vì nó là claim về **bảo mật**: nếu sai, một retailer thấy đơn hàng, khách hàng hoặc giá của retailer khác. Interviewer biết điều đó, nên họ sẽ hỏi theo bốn hướng: tenant ID đi từ đâu tới SQL (câu 008), cái gì xảy ra nếu một developer quên filter (câu 025), bạn đã test thế nào và có từng suýt leak không (câu 049), và một tenant lớn làm chậm tenant khác thì sao (câu 026).

Câu chuyện thất bại điển hình: một developer thêm endpoint báo cáo doanh thu bằng raw SQL cho nhanh, quên `WHERE tenant_id = @tenantId`. Code review không để ý vì diff chỉ có một câu SQL. Test chỉ seed một tenant nên kết quả "đúng". Lên production, manager của Retailer A mở báo cáo và thấy doanh thu của toàn nền tảng. Mọi lớp phòng thủ dựa vào trí nhớ của con người đều đã thất bại cùng lúc.

Bài này đi qua luồng tenant end-to-end, các lớp phòng thủ trước và sau production, một demo RLS chạy thật cho thấy lớp phòng thủ ở tầng database bắt được đúng bug trên, cách test cross-tenant, và cách xử lý noisy neighbor. Lý thuyết đầy đủ ở track [Multi-tenancy](/tracks/multi-tenancy/learn/tenancy-models); bài này tập trung vào cách **trả lời về dự án của bạn**. Nói đúng cái dự án thật đã làm, và tách rõ phần nào là "đã có", phần nào là "tôi đề xuất".

## Khái niệm

### Tenant resolution và membership

**Tenant resolution** là bước xác định request thuộc tenant nào. Nguồn có thể là claim trong JWT, subdomain/host (`retailer-a.example.com`), path, hoặc header. Nguyên tắc: nguồn nào đến từ client thì **không được tin** nếu chưa kiểm tra **membership**, tức là user đã xác thực có thật sự thuộc tenant đó không (là nhân viên có role, hoặc là khách có profile ở tenant đó). Thiếu bước membership là lỗi BOLA/IDOR kinh điển: đổi header `X-Tenant-Id` là sang được tenant khác. Chi tiết ở [Tenant resolution, membership và authorization](/tracks/multi-tenancy/learn/tenant-resolution-authz).

### Tenant context

**Tenant context** là nơi lưu `{ userId, tenantId, roles }` của request hiện tại sau khi middleware xác thực xong, để mọi tầng phía sau (service, repository, cache, job) dùng chung mà không phải truyền tay. Trong Node thường là `req.context` hoặc `AsyncLocalStorage`. Điểm quan trọng: context được đặt **một lần** ở một chỗ, và tầng data access **đọc từ context**, không nhận `tenantId` từ tham số mà caller có thể truyền sai. Xem [Tenant context với AsyncLocalStorage](/tracks/multi-tenancy/learn/tenant-context).

### Tenant-aware data access layer

**Tenant-aware repository** là lớp truy cập dữ liệu tự thêm điều kiện tenant vào mọi query, ví dụ `findById(id)` thực chất chạy `WHERE id = @id AND tenant_id = @ctxTenant`. Nó biến "nhớ thêm filter" thành "không thể quên filter" **cho những query đi qua repository**. Điểm yếu: raw query, query builder dùng trực tiếp, job nền, script admin, và báo cáo thường đi vòng qua repository. Đó chính là kịch bản câu 025.

### Row-Level Security

**Row-Level Security (RLS)** là cơ chế của database lọc dòng theo policy cho **mọi** query của một role, kể cả raw query. Postgres dùng `CREATE POLICY ... USING (tenant_id = current_setting('app.tenant_id'))`; SQL Server dùng **security policy** với một inline table-valued function làm predicate và `SESSION_CONTEXT` để truyền tenant. RLS là lớp phòng thủ thứ hai: nếu application quên filter, database vẫn lọc. Chi phí: phải đặt context đúng trên mỗi connection (và **xoá** khi trả connection về pool), predicate phải dùng được index, migration và job admin cần role bypass có kiểm soát. Chi tiết ở [Row-Level Security trong PostgreSQL](/tracks/multi-tenancy/learn/postgres-rls) và [RLS ở production và SQL Server](/tracks/multi-tenancy/learn/rls-production).

**Interview angle:** follow-up của 025 là "Would you add RLS? What does it cost?". Trả lời có hai mặt: lợi ích (bắt được lỗi mà review không thấy) và chi phí cụ thể (context trên connection pool, predicate ảnh hưởng plan, debug khó hơn vì query "trả về rỗng" thay vì lỗi).

### Kênh phụ: cache, search, file, job

Tenant phải có ở **mọi** nơi dữ liệu đi qua, không chỉ SQL: cache key (`{env}:{tenantId}:...`), filter bắt buộc trong Elasticsearch, đường dẫn file storage, payload của background job (job chạy ngoài request nên không có context tự động), log và metric. Leak qua cache là loại khó phát hiện nhất: query đúng, nhưng key cache thiếu tenant nên tenant B nhận kết quả tenant A đã cache. Xem [Kênh phụ: cache, search và file storage](/tracks/multi-tenancy/learn/cache-search-files).

### Noisy neighbor

**Noisy neighbor** là khi một tenant tiêu thụ tài nguyên chung (CPU database, connection, worker, Elasticsearch) tới mức làm chậm tenant khác. Trong pooled model, đây là hệ quả tự nhiên của việc dùng chung. Xử lý theo ba tầng thời gian: ngắn hạn (rate limit/quota theo tenant, đưa việc nặng sang queue với concurrency theo tenant), trung hạn (tách workload đọc sang replica/Elasticsearch, cache), dài hạn (tiering: tenant lớn sang silo). Điều kiện tiên quyết: **observability có tenant dimension**, nếu không bạn không biết ai đang ồn. Xem [Noisy neighbor, fairness và cost attribution](/tracks/multi-tenancy/learn/noisy-neighbor).

## Cơ chế hoạt động

### Tenant từ token tới SQL

```mermaid
sequenceDiagram
  participant C as Client
  participant MW as Auth + tenant middleware
  participant SV as Service
  participant RP as Tenant-aware repo
  participant DB as Database (RLS)
  C->>MW: request + JWT (sub) + host retailer-a
  MW->>MW: verify JWT signature, iss, aud, exp
  MW->>MW: resolve tenant from host, check membership(sub, tenant)
  MW->>SV: ctx = userId, tenantId, roles
  SV->>SV: permission check (order read) + ownership
  SV->>RP: findOrder(id)
  RP->>DB: BEGIN, set tenant in session (transaction-local)
  RP->>DB: SELECT ... WHERE id = $1 AND tenant_id = ctx.tenantId
  DB-->>RP: rows (also filtered by policy)
  RP->>DB: COMMIT (setting cleared)
  RP-->>SV: order or null
  SV-->>C: 200 or 404
```

Đọc từ trên xuống: tenant được **xác định** ở middleware (từ host hoặc claim) và **kiểm** bằng membership; context mang tenant đi tiếp; service kiểm permission và ownership; repository thêm filter tenant (lớp 1) và đặt tenant vào session database trong transaction (lớp 2, nếu có RLS). Trả 404 thay vì 403 khi resource thuộc tenant khác để không tiết lộ sự tồn tại của nó. Khi kể dự án thật, nói rõ bạn có những lớp nào; nếu chỉ có lớp 1, nói thật và nói lớp 2 là đề xuất.

### Các lớp phòng thủ trước và sau production

```mermaid
flowchart TB
  subgraph Before["Trước production"]
    A1["Data access layer<br/>không cho raw query thiếu tenant"] --> A2["Lint / grep rule<br/>raw SQL phải qua helper"]
    A2 --> A3["Review checklist<br/>mục tenant + code owner"]
    A3 --> A4["Test cross-tenant bắt buộc<br/>seed ≥ 2 tenant"]
  end
  subgraph After["Sau production"]
    B1["DB guard: RLS / security policy"] --> B2["Response sampling:<br/>tenant_id khác ctx → alert"]
    B2 --> B3["Audit log truy cập"]
    B3 --> B4["Pentest / bug bounty"]
  end
  Before --> After
  B2 --> I["Leak → incident:<br/>chặn endpoint, xác định phạm vi,<br/>thông báo theo hợp đồng/luật"]
```

Câu 025 hỏi đúng hai nhóm này. Nhóm "trước production" ngăn bug vào code; nhóm "sau production" giới hạn thiệt hại khi bug đã lọt. Một câu trả lời senior nêu cái dự án **thật** có, cái **nên** có, và thứ tự ưu tiên nếu được thêm: thường là test cross-tenant (rẻ, bắt được nhiều) trước, RLS (đắt hơn, bắt được phần còn lại) sau.

## Ví dụ thực tế

### RLS bắt raw query quên filter (Postgres 17, chạy thật)

Setup: bảng `orders` có `tenant_id`, RLS bật, policy đọc tenant từ setting `app.tenant_id`. App kết nối bằng role `app` (không phải owner, không phải superuser). Dùng `nullif(..., '')` vì `current_setting(..., true)` trả chuỗi rỗng (không phải NULL) trên connection đã từng đặt setting rồi reset.

```sql
CREATE ROLE app LOGIN PASSWORD 'app';
CREATE TABLE orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL,
  total_minor bigint NOT NULL
);
INSERT INTO orders (tenant_id, total_minor) VALUES
 ('11111111-1111-1111-1111-111111111111', 1000),
 ('11111111-1111-1111-1111-111111111111', 2500),
 ('22222222-2222-2222-2222-222222222222', 99900);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO app;
```

Chạy "endpoint báo cáo" quên filter với role `app`:

```sql
SELECT count(*) AS visible_rows FROM orders;                        -- 1) quên SET context
BEGIN;
SET LOCAL app.tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT tenant_id, sum(total_minor) AS revenue FROM orders GROUP BY tenant_id;  -- 2) quên WHERE tenant_id
INSERT INTO orders (tenant_id, total_minor) VALUES ('22222222-2222-2222-2222-222222222222', 1);  -- 3) ghi sai tenant
ROLLBACK;
SELECT current_setting('app.tenant_id', true) AS leftover, count(*) FROM orders;  -- 4) sau transaction
```

```text
--- 1) no tenant context: forgotten SET
 visible_rows
--------------
            0
--- 2) tenant A context, raw reporting query WITHOUT where tenant_id
              tenant_id               | revenue
--------------------------------------+---------
 11111111-1111-1111-1111-111111111111 |    3500
--- 3) tenant A tries to insert a row for tenant B
ERROR:  new row violates row-level security policy for table "orders"
--- 4) after COMMIT/ROLLBACK the SET LOCAL is gone (pooled connection reuse)
 leftover | count
----------+-------
          |     0
```

Bốn kết quả, bốn bài học. (1) Quên đặt context thì thấy **0 dòng**, không phải tất cả: RLS fail closed. (2) Query báo cáo quên `WHERE` vẫn chỉ trả doanh thu của tenant A (3500), không phải toàn nền tảng. (3) `WITH CHECK` chặn ghi dữ liệu vào tenant khác. (4) `SET LOCAL` hết hiệu lực khi transaction kết thúc, nên connection trả về pool không mang tenant cũ sang request sau; `leftover` là chuỗi rỗng, đó là lý do cần `nullif`. Cùng bảng đó, kết nối bằng superuser `postgres` thấy cả 3 dòng: superuser luôn bypass RLS, và table owner cũng bypass trừ khi `ALTER TABLE ... FORCE ROW LEVEL SECURITY`. App không bao giờ được chạy bằng owner hay superuser.

Với SQL Server (P1 dùng SQL Server), tương đương là `CREATE SECURITY POLICY` với predicate function đọc `SESSION_CONTEXT(N'tenant_id')`, đặt bằng `sp_set_session_context`. Lưu ý quan trọng khi dùng connection pool trong Node: session context không tự reset khi connection được trả về pool, nên phải đặt lại ở **mỗi** request hoặc dùng `@read_only` và xoá chủ động (verify với driver bạn dùng; xem [RLS ở production và SQL Server](/tracks/multi-tenancy/learn/rls-production)).

### Test cross-tenant bằng node:test (chạy thật)

Câu 049 hỏi "bạn test thế nào". Test dưới đây seed hai tenant, gọi với context tenant A vào resource của tenant B qua một query cố tình quên filter, và kiểm tra context không leak sang connection tái sử dụng.

```ts
// cross-tenant.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgres://app:app@localhost:55432/postgres', max: 2 });
const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';

async function withTenant<T>(tenantId: string, fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);   // true = transaction-local
    const out = await fn(c);
    await c.query('COMMIT');
    return out;
  } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
}

const forgottenFilter = (c: pg.PoolClient, id: number) =>
  c.query('SELECT id, tenant_id FROM orders WHERE id = $1', [id]).then(r => r.rows[0] ?? null);

test('tenant A cannot read tenant B order even when the filter is forgotten', async () => {
  const bOrder = await withTenant(B, c => c.query('SELECT id FROM orders LIMIT 1').then(r => r.rows[0].id));
  assert.equal(await withTenant(A, c => forgottenFilter(c, bOrder)), null);
});
test('tenant B sees its own order', async () => {
  const n = await withTenant(B, c => c.query('SELECT count(*)::int AS n FROM orders').then(r => r.rows[0].n));
  assert.equal(n, 1);
});
test('context does not leak to the next request on a reused connection', async () => {
  await withTenant(A, async () => {});
  const c = await pool.connect();
  try {
    const r = await c.query("SELECT current_setting('app.tenant_id', true) AS t, (SELECT count(*)::int FROM orders) AS n");
    assert.deepEqual(r.rows[0], { t: '', n: 0 });
  } finally { c.release(); }
});
test.after(() => pool.end());
```

```text
✔ tenant A cannot read tenant B order even when the filter is forgotten (33.493833ms)
✔ tenant B sees its own order (2.74075ms)
✔ context does not leak to the next request on a reused connection (3.20125ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

Ở tầng API, cùng ý tưởng mở rộng thành một test **quét mọi route**: với mỗi route có tham số id, tạo resource ở tenant A, gọi bằng token tenant B, kỳ vọng 404/403. Test này bắt được endpoint mới mà không ai nhớ viết test riêng. Khung trả lời câu 049: "Chúng tôi có `<test cross-tenant thật của bạn hoặc: chưa có test hệ thống>`; số endpoint được cover `<số liệu thật của bạn>`; một near miss là `<câu chuyện thật>`, sau đó chúng tôi thêm `<thay đổi>`." Nếu chưa từng có test như vậy, nói thật và trình bày test trên như đề xuất. Follow-up về job nền và admin tool: job phải mang `tenantId` trong payload và đặt context khi chạy; admin tool xuyên tenant dùng role riêng có audit log, không dùng chung role của app.

### Câu 026: noisy neighbor trên nền tảng của bạn

Khung trả lời theo thời gian:

1. **Xác định**: metric theo tenant (latency, số query, CPU time của query theo tenant, QPS). Nếu chưa có tenant dimension, bước đầu tiên là thêm `tenant_id` vào log/trace và query tag.
2. **Ngắn hạn**: rate limit/quota theo tenant ở API; đưa thao tác nặng (export, import, báo cáo lớn) sang queue với concurrency giới hạn theo tenant; tối ưu đúng query nặng của tenant đó (thường là query mà plan tốt cho tenant nhỏ nhưng tệ cho tenant lớn).
3. **Trung hạn**: báo cáo đọc từ read replica hoặc Elasticsearch; cache theo tenant; fair scheduling cho job (round-robin giữa tenant thay vì FIFO toàn cục).
4. **Dài hạn**: tiering, chuyển tenant lớn sang database riêng (silo) với routing theo tenant.

Follow-up "di chuyển một tenant sang database riêng không downtime": copy dữ liệu tenant đó (snapshot + replication có filter theo `tenant_id`, hoặc dual-write), verify bằng count/checksum theo tenant, bật **read-only ngắn** hoặc dual-write cho tenant đó, chuyển routing, giữ đường quay lại. Chi tiết ở [Vận hành per-tenant](/tracks/multi-tenancy/learn/per-tenant-operations).

## Trade-offs & lựa chọn thay thế

| Lớp enforce | Bắt được | Không bắt được | Chi phí |
|---|---|---|---|
| Filter thủ công trong từng query | Khi dev nhớ | Mọi lần quên | Không có, cho tới khi leak |
| Tenant-aware repository | Query đi qua repo | Raw SQL, job, script | Thấp; cần quy ước |
| Lint/grep rule cho raw SQL | Raw SQL mới trong PR | Query động, ORM escape hatch | Thấp; có false positive |
| Test cross-tenant (seed ≥ 2 tenant) | Endpoint có test | Endpoint không có test (trừ khi quét route) | Trung bình |
| RLS / security policy | Mọi query của role app | Kênh phụ (cache, ES, file); role bypass | Context trên pool, ảnh hưởng plan, debug khó hơn |
| Silo (DB riêng) | Gần như mọi leak dữ liệu DB | Leak ở tầng app (cache, log) | Cao: vận hành, migration, chi phí |

Chọn thế nào: với pooled model, tối thiểu là repository + test cross-tenant; RLS đáng thêm khi số developer và số endpoint lớn tới mức review không còn đáng tin, hoặc khi hợp đồng yêu cầu isolation mạnh. Silo dành cho tenant lớn hoặc có yêu cầu pháp lý, không phải mặc định.

## Edge cases & failure modes

- **Connection pool giữ context cũ**: dùng setting cấp session (không phải transaction-local) thì request sau có thể chạy với tenant của request trước. Dùng transaction-local (`SET LOCAL`, `set_config(..., true)`) hoặc reset khi release.
- **Connection pooler ở chế độ transaction** (PgBouncer): setting cấp session không tồn tại qua các transaction; chỉ transaction-local là đáng tin.
- **Job nền không có context**: job đọc dữ liệu bằng role không có RLS hoặc không đặt tenant thì đọc nhầm/không thấy gì. Payload job phải có `tenantId`.
- **Admin/support tool xuyên tenant**: cần role riêng, quyền tối thiểu, audit log; không dùng "bypass RLS" cho tiện.
- **Predicate RLS làm hỏng plan**: hàm trong predicate không inline được hoặc thiếu index có `tenant_id` đứng đầu; kiểm tra `EXPLAIN` sau khi bật RLS.
- **Trả 403 thay vì 404**: tiết lộ resource tồn tại ở tenant khác (enumeration).
- **Tenant lớn và plan cache**: SQL Server có thể cache plan tối ưu cho tenant nhỏ rồi dùng cho tenant lớn (parameter sniffing); triệu chứng là chỉ tenant lớn chậm (verify với workload thật).

## Pitfalls

- ❌ Tin `X-Tenant-Id` từ client → ✅ resolve tenant rồi kiểm membership của user với tenant đó.
- ❌ Repository nhận `tenantId` từ tham số caller → ✅ đọc từ request context đã xác thực.
- ❌ Test chỉ seed một tenant → ✅ luôn seed ≥ 2 tenant và có test negative (B gọi resource của A).
- ❌ RLS với app chạy bằng owner/superuser → ✅ role app riêng; `FORCE ROW LEVEL SECURITY` nếu cần.
- ❌ Setting tenant cấp session trên connection pool → ✅ transaction-local, hoặc reset khi trả connection.
- ❌ Chỉ nghĩ tới SQL → ✅ tenant trong cache key, ES filter, file path, job payload, log.
- ❌ Xử lý noisy neighbor bằng cách nâng cấp database → ✅ đo theo tenant trước, rồi quota, queue, tách workload, tiering.

## Tóm tắt

- Tenant đi: token/host → middleware (verify + membership) → context → permission/ownership → repository filter → (RLS) → database.
- Không tin tenant từ client nếu chưa kiểm membership; trả 404 cho resource tenant khác.
- Trước production: repository, lint rule, review checklist, test cross-tenant seed ≥ 2 tenant (quét route).
- Sau production: RLS/security policy, response sampling, audit log; leak là incident có nghĩa vụ thông báo.
- Demo thật: RLS trả 0 dòng khi thiếu context, lọc đúng tenant khi quên WHERE, chặn INSERT sai tenant; `SET LOCAL` không leak qua pool.
- SQL Server: security policy + `SESSION_CONTEXT`, phải đặt lại mỗi request trên pool (verify).
- Noisy neighbor: đo theo tenant → quota/queue → replica/cache → silo cho tenant lớn.
