---
title: "Hashing, encryption, envelope encryption và secrets management"
summary: "Encoding vs hashing vs HMAC vs encryption, AES-256-GCM với AAD và vì sao IV không được lặp (đo thật khôi phục plaintext), envelope encryption KEK/DEK và key rotation, blind index để tra cứu dữ liệu mã hoá, secrets manager/OIDC/IRSA thay env file, và vì sao xoá .env khỏi commit không giải quyết gì (đo thật git history)."
status: drafted
questions: [web-security-006, web-security-012, web-security-021, web-security-024, web-security-039, web-security-050, web-security-055]
references:
  - { title: "OWASP: Cryptographic Storage Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html" }
  - { title: "OWASP: Secrets Management Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html" }
  - { title: "Node.js crypto: createCipheriv / timingSafeEqual", url: "https://nodejs.org/api/crypto.html" }
  - { title: "AWS KMS: Envelope encryption & GenerateDataKey", url: "https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html#enveloping" }
  - { title: "AWS: IAM Roles for Service Accounts (IRSA) / EKS Pod Identity", url: "https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html" }
notionRefs:
  - { title: "Questions (Lưu thông tin nhạy cảm CCCD/card)", url: "https://app.notion.com/p/2cfef77f8ab280069f3edd0c76a3349f" }
  - { title: "HTTP / HTTPS - SSL/TLS", url: "https://app.notion.com/p/172ef77f8ab280daa821ead1180ac5df" }
verify: true
---

## Bối cảnh & vấn đề

Một dev commit nhầm file `.env` chứa password database production, nhận ra sau 5 phút, và commit tiếp để xoá file. "Đã xử lý xong". Thực tế chưa xử lý gì: secret vẫn nằm trong **git history** — trong mọi clone, fork, CI cache, bản mirror — và bot quét GitHub tìm thấy key trong vài phút. Xoá file ở commit sau chỉ làm nó biến mất khỏi *bản làm việc*, không khỏi *lịch sử*. Việc đúng là coi như **đã lộ**: rotate secret ngay, kiểm tra log truy cập, rồi mới dọn history nếu cần.

Mật mã học và quản lý secret là nơi "trông thì đúng" rất dễ sai: encrypt bằng chế độ không xác thực (AES-CBC) để lộ khả năng bị sửa ciphertext; dùng lại IV trong GCM làm lộ plaintext; hash một thứ cần đọc lại; hoặc lưu key ngay cạnh dữ liệu đã mã hoá. Bài này phân biệt bốn công cụ (encoding/hashing/HMAC/encryption), chỉ ra dùng cái nào khi nào, chạy thật AES-GCM và envelope encryption, rồi sang secrets management hiện đại (không có secret nếu có thể — dùng IAM role).

**Interview angle:** "Tra một user theo số điện thoại đã mã hoá thế nào?" Đáp: không query được trên ciphertext ngẫu nhiên; dùng **blind index** (HMAC xác định của giá trị đã chuẩn hoá) để tìm exact match.

## Khái niệm

### Encoding vs hashing vs HMAC vs encryption

Bốn thứ hay bị gọi lẫn là "mã hoá":

- **Encoding** (base64, URL-encoding): chỉ đổi **định dạng**, **không có bí mật**, ai cũng decode được. JWT payload chỉ là base64url — đọc được ngay. Đừng bao giờ coi base64 là bảo mật.
- **Hashing**: một chiều, không khôi phục được. Dùng cho integrity (checksum), password (slow hash + salt, xem [bài 9](/tracks/web-security/learn/passwords-login-abuse)).
- **HMAC**: hash **có key**, để xác thực message (webhook signature, CSRF token, blind index). Chứng minh "ai có key mới tạo được giá trị này".
- **Encryption**: hai chiều, có key. **Symmetric** (AES-256-GCM) cho dữ liệu; **asymmetric** (RSA/ECDH) cho trao đổi key và chữ ký.

Quy tắc chọn: cần đọc lại không? Không (password) → hash. Có (số điện thoại, CCCD) → encrypt. Cần chứng minh nguồn gốc message → HMAC/chữ ký. Chỉ đổi định dạng → encoding.

### AEAD, AES-GCM và AAD

Dữ liệu cần giải mã lại phải dùng **AEAD** (Authenticated Encryption with Associated Data) như **AES-256-GCM**, không phải AES-CBC trần. AEAD vừa mã hoá (confidentiality) vừa tạo một **authentication tag** (integrity): nếu ciphertext bị sửa một bit, giải mã **thất bại** thay vì trả về rác. AES-CBC không có tag, nên attacker sửa ciphertext mà không bị phát hiện (padding oracle, bit-flipping). GCM còn nhận **AAD** (Associated Data) — dữ liệu được xác thực nhưng không mã hoá, ví dụ gắn `tenant_id` + `record_id` vào tag để một ciphertext **không thể bị tráo** sang bản ghi khác.

### IV/nonce không bao giờ lặp

GCM cần một **IV (nonce) 96-bit** cho mỗi lần mã hoá, và IV **không bao giờ được lặp với cùng một key**. Lặp IV trong GCM là thảm hoạ: nó cho phép khôi phục plaintext (XOR hai ciphertext cùng key+IV loại bỏ keystream) và làm giả tag. Dùng IV ngẫu nhiên 96-bit (random) và giới hạn số message mỗi key, hoặc counter-based IV được quản lý cẩn thận.

### Encryption at rest vs in transit vs field-level

- **In transit**: TLS giữa client–LB–service–DB (kể cả trong VPC nếu compliance yêu cầu).
- **At rest**: disk/volume encryption (RDS, EBS, S3 SSE) — chỉ bảo vệ khi **mất ổ đĩa/snapshot**, **không** bảo vệ khi attacker query được DB qua app (app giải mã trong suốt).
- **Application-level / field-level**: mã hoá từng field nhạy cảm (CCCD, số thẻ) ở tầng ứng dụng, nên kể cả khi query được DB cũng chỉ thấy ciphertext. Đây là lớp cho PII thật sự nhạy cảm.

### Envelope encryption

**Envelope encryption** giải bài toán "mã hoá triệu bản ghi mà không gọi KMS triệu lần, và rotate key không phải mã hoá lại tất cả". Có hai loại key: **DEK** (Data Encryption Key) mã hoá dữ liệu thật; **KEK** (Key Encryption Key, Master Key) nằm **trong KMS, không bao giờ rời KMS**, dùng để mã hoá (wrap) DEK. Lưu cạnh ciphertext: `{ciphertext, iv, tag, encrypted_dek, key_version}`. Khi đọc: gọi KMS giải mã DEK (hoặc cache DEK), rồi dùng DEK giải dữ liệu. **Rotate KEK**: chỉ cần **re-wrap DEK** (rẻ, KMS giữ version cũ để giải); **không** cần giải mã lại dữ liệu. Rotate DEK (nếu bắt buộc): background job đọc–giải–mã lại theo batch, idempotent theo `key_version`.

### Blind index

Dữ liệu mã hoá bằng AES-GCM có IV ngẫu nhiên nên **ciphertext khác nhau mỗi lần**, không query exact-match được. **Blind index** là một cột phụ chứa `HMAC(index_key, normalize(value))` — xác định (cùng input → cùng output) nên tra cứu bằng được, nhưng cần `index_key` (trong KMS) mới tính được, nên không brute-force được như plain hash. Dùng cho "tìm user theo số điện thoại": lưu `phone_encrypted` (để đọc lại) **và** `phone_blind_index` (để tìm). Blind index chỉ hỗ trợ exact match, không range/substring.

### Secrets management

Thứ tự ưu tiên theo OWASP Secrets Management:

1. **Không có secret nếu được**: IAM role per service (EKS **Pod Identity**/**IRSA**, workload identity), RDS IAM auth, OIDC federation cho CI — credential ngắn hạn do nền tảng cấp, không có key dài hạn để lộ.
2. **Secrets manager**: AWS Secrets Manager/SSM Parameter Store, Vault, GCP Secret Manager; inject lúc runtime (External Secrets Operator/CSI driver trên K8s); policy mỗi service chỉ đọc prefix của nó.
3. File `.env`/env var: rủi ro (lộ qua git, image layer, `docker inspect`, crash dump, error reporter gửi `process.env`); không log env, hạn chế scope; K8s Secret chỉ base64 → bật encryption at rest cho etcd + RBAC.

Rotation: hỗ trợ **hai secret song song** (current + previous) để đổi không downtime; credential ngắn hạn tự hết hạn.

## Cơ chế hoạt động

Envelope encryption khi ghi và đọc một field PII:

```mermaid
sequenceDiagram
    participant App
    participant KMS
    participant DB
    Note over App,DB: Ghi
    App->>KMS: GenerateDataKey (hoặc Encrypt DEK)
    KMS-->>App: plaintext DEK + encrypted DEK (wrapped bằng KEK)
    App->>App: AES-256-GCM(data, DEK, iv, AAD=tenant+record)
    App->>DB: lưu {ciphertext, iv, tag, encrypted_dek, key_version}
    App->>App: xoá plaintext DEK khỏi memory
    Note over App,DB: Đọc
    App->>DB: đọc row
    App->>KMS: Decrypt(encrypted_dek)
    KMS-->>App: plaintext DEK
    App->>App: AES-256-GCM giải mã, verify tag + AAD
```

Rotate KEK chỉ đụng tới cột `encrypted_dek`:

```mermaid
flowchart LR
    A["KEK v1 trong KMS"] --> B["Unwrap DEK bằng KEK v1"]
    B --> C["Wrap DEK bằng KEK v2"]
    C --> D["Lưu encrypted_dek mới + key_version=2"]
    E["ciphertext dữ liệu KHÔNG đổi"] -.-> D
```

## Ví dụ thực tế

### Đo thật: base64 không phải bảo mật

```text
base64url-decoded JWT payload: {"sub":"u_42","role":"customer","exp":1900000000}
```

JWT payload chỉ là base64url — decode một dòng ra toàn bộ claim. Vì vậy **không** để bí mật trong JWT payload, và luôn **verify chữ ký** trước khi tin bất kỳ claim nào.

### Đo thật: AES-256-GCM, AAD và tamper detection

```ts
function encrypt(key, plaintext, aad) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, iv); c.setAAD(Buffer.from(aad));
  return { iv, ct: Buffer.concat([c.update(plaintext, 'utf8'), c.final()]), tag: c.getAuthTag() };
}
```

```text
stored row: {"iv":"FheqCoEZrn1G/+QA","ct":"KB/jPVUb7ReQoGX+","tag":"jU6OLwH2dEhsvh9JRUkX+A==","key_version":1}
decrypt correct AAD              -> 079201001234
decrypt row moved to user 43     -> ERROR: Unsupported state or unable to authenticate data
decrypt 1 flipped bit            -> ERROR: Unsupported state or unable to authenticate data
data still decrypts after re-wrap -> 079201001234
```

Giải mã đúng khi AAD khớp. Nếu đổi AAD (giả vờ ciphertext thuộc user 43 thay vì 42), hoặc lật **một bit** của ciphertext, giải mã **thất bại** — đó là authentication tag của GCM làm việc. AAD `tenant=acme;user=42;field=national_id` khoá ciphertext vào đúng bản ghi, nên attacker không tráo ciphertext của bản ghi này sang bản ghi khác. Dòng cuối: sau khi re-wrap DEK bằng KEK mới, dữ liệu vẫn giải được — minh chứng rotate KEK không cần mã hoá lại dữ liệu.

### Đo thật: IV lặp làm lộ plaintext

```ts
const k = randomBytes(32), iv = randomBytes(12);          // same key + SAME iv reused
const enc = (p) => { const c = createCipheriv('aes-256-gcm', k, iv); return Buffer.concat([c.update(p), c.final()]); };
const x = Buffer.from(enc(p1).map((b, i) => b ^ enc(p2)[i]));   // c1 XOR c2 = p1 XOR p2 (keystream cancels)
const recovered = Buffer.from(x.map((b, i) => b ^ p1[i]));      // XOR known p1 -> p2
```

```text
same key+IV: c1 XOR c2 XOR known p1 = salary=99000000
```

Với cùng key+IV, XOR hai ciphertext triệt tiêu keystream, còn lại XOR của hai plaintext; biết một plaintext (`salary=12000000`) thì khôi phục được plaintext kia (`salary=99000000`). Đây là lý do IV **không bao giờ** được lặp với cùng key — và vì sao phải random IV 96-bit mỗi lần mã hoá.

### Đo thật: blind index để tra cứu

```ts
const blind = (phone) => createHmac('sha256', INDEX_KEY).update(phone.replace(/\D/g, '')).digest('hex').slice(0, 32);
```

```text
blind_index("0901 234 567") = 34c5db2d1a33d2960217254d860bef46
blind_index("0901234567")   = 34c5db2d1a33d2960217254d860bef46
```

Hai cách viết cùng số điện thoại (có/không khoảng trắng) cho **cùng** blind index sau khi chuẩn hoá (`replace(/\D/g, '')`), nên `WHERE phone_blind_index = $1` tìm được bản ghi. Plain `sha256` của một số 10 chữ số brute-force được (10^10 ứng viên); HMAC cần `INDEX_KEY` nên attacker có DB mà không có key thì không dựng được bảng tra. Chuẩn hoá trước khi HMAC là bắt buộc, nếu không `"0901 234 567"` và `"0901234567"` ra index khác nhau.

### Đo thật: xoá .env khỏi commit không xoá khỏi history

```text
$ git commit -m 'add config'     (adds .env with Pr0d-P4ss)
$ git rm .env && git commit -m 'remove .env'
$ ls -a            ->  . .. .git          (.env gone from working tree)
$ git log -p --all -S 'Pr0d-P4ss'
d68833f remove .env
-DATABASE_URL=postgres://app:Pr0d-P4ss@db.internal/shop
fb4cc70 add config
+DATABASE_URL=postgres://app:Pr0d-P4ss@db.internal/shop
```

Working tree sạch, nhưng `git log -S` tìm thấy secret ở cả commit thêm và commit xoá — nó nằm trong history. Đây là lý do: coi như đã lộ, **rotate ngay**, kiểm tra log truy cập (CloudTrail nếu là AWS key), rồi mới dùng `git filter-repo`/BFG để dọn (và lưu ý mọi clone/fork vẫn giữ bản cũ). Phòng ngừa: `.gitignore`, pre-commit secret scanning (gitleaks/trufflehog), GitHub push protection, secrets manager thay file.

### Sự cố AWS access key bị push lên public repo (scenario)

Theo thứ tự incident response:

1. **Contain ngay**: deactivate/xoá access key (không chờ xoá commit); nếu có dấu hiệu dùng, revoke session tạm của role liên quan.
2. **Assess**: CloudTrail theo access key id — API nào bị gọi, từ IP nào, có tạo user/key/role mới, EC2 lạ (crypto mining) ở region lạ, S3 GetObject hàng loạt?
3. **Eradicate**: xoá resource/credential attacker tạo; rotate secret mà key có quyền đọc (Secrets Manager); kiểm tra persistence (IAM user, Lambda, trust policy bị sửa).
4. **Recover + communicate**: thông báo theo quy trình, xử lý data exposure (pháp lý nếu có PII).
5. **Prevent**: bỏ long-lived key → **OIDC federation** cho CI; push protection/secret scanning; least privilege; billing alert. Vì sao xoá commit không kết thúc sự cố: key đã bị bot thu thập trong vài phút đầu và có thể đã được dùng; chỉ deactivate key mới thực sự cắt quyền.

## Trade-offs & lựa chọn thay thế

| Dữ liệu | Công cụ | Vì sao |
| --- | --- | --- |
| Password | Hash chậm (argon2id) | Không cần đọc lại |
| OTP | Hash | Dùng một lần, so sánh |
| CCCD/số điện thoại | Encrypt (envelope) + blind index | Cần đọc lại và tra cứu |
| Số thẻ (PAN) | **Không lưu** — tokenize qua PSP | PCI DSS; tránh trách nhiệm |
| Email (cần search) | Plain hoặc partial encrypt + blind index | Cân bằng tra cứu và riêng tư |
| Webhook signature | HMAC/chữ ký | Chứng minh nguồn gốc |

| Secrets | Cách | Khi nào |
| --- | --- | --- |
| AWS API access | IAM role (IRSA/Pod Identity) | Mặc định; không có key để lộ |
| DB password | RDS IAM auth, hoặc Secrets Manager + rotation | Tránh password tĩnh |
| API key bên thứ ba | Secrets Manager, inject runtime | Khi vendor không hỗ trợ OIDC |
| CI credential | GitHub OIDC → assume role ngắn hạn | Không long-lived key trong CI |
| Local dev | Secret riêng môi trường dev, lấy qua CLI SSO | Không bao giờ dùng secret prod |

Chọn thế nào: ưu tiên **không có secret** (IAM role, OIDC) vì không có gì để lộ; secret còn lại đưa vào **secrets manager** với policy tối thiểu và rotation hai-version. Với tài chính/money, nội dung Notion "financial → write-through cache" và "lưu số thẻ" là sai hướng: số thẻ **không lưu** mà tokenize; quyết định tiền đọc từ source of truth. Với CCCD: encrypt + tách bảng/service + mask khi hiển thị + audit mọi access.

## Edge cases & failure modes

- **IV lặp**: dùng counter không quản lý hoặc random pool nhỏ → lộ plaintext (đo thật). Random 96-bit + giới hạn message/key.
- **AES-CBC không MAC**: padding oracle, bit-flipping; luôn dùng AEAD (GCM) cho dữ liệu giải mã lại.
- **Key cạnh dữ liệu**: encrypt nhưng để KEK trong cùng repo/DB → vô nghĩa khi cả hai bị lộ. KEK trong KMS.
- **Blind index không chuẩn hoá**: `"0901 234 567"` vs `"0901234567"` ra index khác; chuẩn hoá trước HMAC.
- **Blind index lộ tần suất**: giá trị trùng nhau có index trùng → lộ phân bố (bao nhiêu người cùng mã vùng); chấp nhận hoặc thêm kỹ thuật nâng cao.
- **Rotate DEK bỏ sót version**: job rotate không idempotent theo `key_version`, đọc không được bản version cũ đang chạy.
- **Env var rò qua error reporter**: Sentry/crash reporter gửi `process.env`; cấu hình loại trừ.
- **K8s Secret tưởng là mã hoá**: chỉ base64; bật etcd encryption at rest + RBAC.
- **Xoá .env tưởng xong**: secret vẫn trong history và mọi clone (đo thật); rotate trước.

## Pitfalls

- ❌ Coi base64 là mã hoá → ✅ encoding không có bí mật; JWT payload đọc được, phải verify chữ ký.
- ❌ AES-CBC cho dữ liệu giải mã lại → ✅ AES-256-GCM (AEAD) có tag chống sửa; AAD gắn bản ghi.
- ❌ Lặp IV với cùng key trong GCM → ✅ random 96-bit mỗi lần; lặp IV lộ plaintext.
- ❌ Hash SHA-256 một số điện thoại để tra cứu → ✅ blind index HMAC (cần key), encrypt để đọc lại.
- ❌ Lưu KEK cạnh dữ liệu → ✅ KEK trong KMS, envelope encryption; rotate KEK chỉ re-wrap DEK.
- ❌ Lưu số thẻ (PAN/CVV) → ✅ tokenize qua PSP; không lưu.
- ❌ Hardcode secret / commit .env → ✅ secrets manager/IAM role; coi như lộ thì rotate ngay, không chỉ xoá file.
- ❌ Tin K8s Secret được mã hoá → ✅ chỉ base64; bật etcd encryption + RBAC.

## Tóm tắt

- Encoding (base64, không bí mật) ≠ hashing (một chiều, password) ≠ HMAC (có key, xác thực message) ≠ encryption (hai chiều, có key).
- Dữ liệu giải mã lại dùng AEAD (AES-256-GCM) có tag chống sửa; AAD gắn ciphertext vào bản ghi (đo thật: tamper và tráo AAD đều fail).
- IV/nonce không bao giờ lặp với cùng key; lặp IV trong GCM khôi phục được plaintext (đo thật).
- Envelope encryption: KEK trong KMS wrap DEK; rotate KEK chỉ re-wrap DEK, không mã hoá lại dữ liệu; blind index (HMAC chuẩn hoá) để tra cứu exact-match.
- Secrets: ưu tiên không có secret (IAM role/IRSA, OIDC cho CI); còn lại vào secrets manager, rotation hai-version; env var/K8s Secret có rủi ro riêng.
- Xoá .env khỏi commit không xoá khỏi history (đo thật); key bị lộ phải rotate ngay, không chỉ xoá file.
