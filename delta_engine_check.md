# Knowledge Delta Engine 제안 vs 현재 코드 대조 (읽기 전용 분석)

작성일: 2026-11-11. 코드만 읽고 작성했으며 서버 실행·HTTP 호출은 하지 않았다.

경로 약어
- `RAG` = `C:\Users\honor\OneDrive\Desktop\hackathnhlaba\rag-service\app\`
- `APP` = `C:\Users\honor\OneDrive\Desktop\expert-knowledge-platform\ekep\backend\app\`

## 0. 한 줄 요약

- 제안의 핵심 축(분류 → 비교 → 델타 라벨 → 승인)은 **두 곳에 나뉘어 이미 존재**한다. RAG 쪽은 답변 단위로 `POST /facts`에서 `kb_verdict`(correct/plausible/possibly_outdated/contradicted/unsupported), 앱 쪽은 인터뷰 종료 후 `reconcile`에서 지식단위(KnowledgeUnit) 단위로 `neu/ergaenzung/bestaetigung/widerspruch`를 매긴다.
- **없는 것**: 안정적 `knowledge_id` + 정수 version 증가(RAG 쪽), 기존 fact/chunk에 대한 실제 UPDATE/ENRICH 실행, 문장 단위 해시 비교, subtopic 계층, 지식단위 단위 chunk 교체, 전문가 역할(expert role) 메타데이터, 앱 승인 → RAG 승인 동기화.
- 승인(`/facts/{id}/approve`)은 메타데이터 플래그 변경 + 원장(ledger) 기록뿐이며, 문서 chunk를 수정·대체·역사화하지 않는다.

## 1. 델타 타입 매핑표

| 제안 델타 | 가장 가까운 등가물 | 정확한 코드 경로 | 판정 |
|---|---|---|---|
| **ADD** (새 지식) | RAG: `kb_verdict=unsupported`(또는 `plausible`) → `review_status=draft`로 저장. 승인 시 `change_type=new_knowledge` | `RAG\store.py:222-223` (verdict→review_status), `RAG\store.py:244` (chroma `col.add`, id=`fact:<hex>`), `RAG\updates.py:18-19`. 앱: `relation="neu"` → `action="create"` `APP\services\knowledge_search.py:389` | **부분**. fact는 `POST /facts` 시점에 이미 chunk로 인덱싱되고 승인 시 `approved=True`로 검색 가능해짐(`store.py:281-282` 기본 필터). 그러나 새 `knowledge_id` 발급은 없고(`fact:` uuid만), 앱의 `create` 권고는 실행되지 않음 |
| **ADD/ENRICH** (기존 보완) | 앱: `relation="ergaenzung"` → `action="update"` + `target_id` (권고만). 앱 내부 analyst: `existing_unit_id` 지정 시 같은 인터뷰의 unit을 덮어쓰고 `version += 1` | `APP\services\knowledge_search.py:389,394-395,457-459`; `APP\services\orchestrator.py:561-569` | **부분**. RAG 쪽에는 기존 fact/chunk에 내용을 보태는 경로가 없음. 앱의 `ergaenzung`은 `UnitReconciliation` 행과 export `vector_sync`에만 남음(`APP\services\export.py:70-83,202-205`) |
| **UPDATE** (값 갱신, 구버전 비활성) | 문서 레벨만: `DocMeta.supersedes` → 구 문서 chunk `valid_to_i` 닫고 `superseded_by` 설정. 재인제스트 시 같은 `doc_id` chunk 전부 삭제 후 재생성 | `RAG\store.py:153,167-181` (`_apply_supersession`), `RAG\store.py:111` (`delete_document` 후 재인덱싱), `RAG\semantic.py:241-248` | **부분**. 문서 단위 UPDATE는 있음. **fact 단위 UPDATE 없음**: `add_fact`는 항상 `supersedes=""`(`store.py:234`), `set_review`는 메타 플래그만 바꿈(`store.py:247-255`) |
| **NO_CHANGE** | RAG: `kb_verdict=correct`(또는 `plausible`) → draft 저장, 승인 시 `change_type=confirmation`. 앱: `bestaetigung` → `none` | `RAG\llm.py:141,144` (verdict 정의), `RAG\updates.py:22-23`, `APP\services\knowledge_search.py:389,396` | **있음** (단, "아무것도 안 함"이 아니라 fact chunk는 그대로 저장됨) |
| **CONFLICT** | RAG: `kb_verdict=contradicted` → `review_status=needs_review`, 문서 chunk와 fact chunk 둘 다 보존, 승인은 사람. 승인 시 `change_type=correction`(문서 소유자에게 새 버전 요청 문구). 앱: `widerspruch` → `review` | `RAG\store.py:218-223`, `RAG\llm.py:143`, `RAG\updates.py:20,27`, `APP\services\knowledge_search.py:389,397` | **있음** (둘 다 저장 + 승인 요청). 단 승인 후 해소 액션(어느 쪽을 활성으로 둘지)은 없음 |
| **SUPERSEDE** (구버전 역사화, 신버전 활성) | 문서 레벨: `supersedes` + validity window. fact 레벨: `kb_verdict=possibly_outdated` → 승인 시 `change_type=historical`(기록만) | `RAG\store.py:167-181`, `RAG\validity.py:31-37` (`possibly_outdated` 판정), `RAG\updates.py:21,28` | **부분**. 문서↔문서 supersede는 있음. fact가 문서/다른 fact를 supersede하는 경로 없음 |

제안에 등가물이 **없는** 항목
- 안정적 `knowledge_id` + 정수 version 증가: RAG 측에는 없음. 가장 가까운 것은 `semantic.json`의 `concept_key`(버전 간 동일성 식별자, `RAG\semantic.py:104-106,114-116`)와 chunk 메타의 `concept_keys` csv(`store.py:341-346`, fact에만 기록). 앱 측 `KnowledgeUnit.version`(int, `APP\models.py:153`)과 `KnowledgeRevision` 스냅샷(`models.py:164-175`, `routes.py:387-389`)은 제안과 같은 모델이지만 **앱 DB에만** 있고 RAG로 전달되지 않음.
- 문장 단위 hash compare: 없음. `RAG\registry.py:53-85`의 `sha256_file`/`is_indexed`는 **파일** 단위이며, `is_indexed`는 `store.py`에서 호출되지 않음(grep 결과 없음; `mark_indexed`만 `store.py:154`에서 호출).
- subtopic 계층: 없음. `database\taxonomy.json` 최상위 키는 `departments`, `glossary`, `concept_kinds` 세 개뿐(topics/subtopics 없음). `concept_key`의 `<department>.<topic>.<attribute>` 형식(`semantic.py:77`)이 암묵적 topic만 제공.
- 지식단위 단위 chunk 교체: 없음. 문서 전체 재인제스트 시 교체(`store.py:111`)만 있음.

## 2. 메타데이터 매핑표

출처: chunk 메타 헤더 `RAG\store.py:3-7`, 문서 메타 `store.py:136-148`, fact 메타 `store.py:229-243`, 행 변환 `store.py:315-333`.

| 제안 필드 | 우리 필드 | 판정 / 비고 |
|---|---|---|
| department | `department` (taxonomy key, LLM 분류 또는 입력) | **있음**. 검색 필터 지원 `store.py:285-286` |
| topic | `topic`(fact: 인터뷰 topic 자유문자열, 문서: `""`), `section`(문서 제목/조항) | **부분**. 구조화된 topic 키 없음; `concept_key` 2번째 세그먼트가 사실상 topic |
| subtopic | 없음 | **없음** |
| knowledge_id | `doc_id`(문서), chunk id `doc_id:i`, fact id `fact:<hex>`; `concept_keys`(fact chunk만, csv) | **부분**. 버전을 가로지르는 안정 id는 `concept_key`뿐이고 문서 chunk 메타에는 기록 안 됨(semantic.json의 `chunk_id` 링크로만) |
| source | `source`, `origin`(document/interview), `source_hint`, `citation` | **있음** |
| expert role | `expert`(이름), `owner` | **없음**. 앱은 `Employee.role`을 갖지만 `APP\services\rag_client.py:52-55`가 전달하지 않음 |
| version | `version`(문자열; 문서=라벨, fact=인터뷰 날짜 `store.py:232`) | **부분**. 정수 증가 없음 |
| status | `approved`(bool) + `review_status`(draft/needs_review/approved/rejected) + `kb_verdict` | **있음** |
| updated_at | `ingested_at`, `reviewed_at`(`store.py:253`) | **부분**. 범용 `updated_at` 없음 |
| (제안에 없음, 우리에 있음) | `valid_from_i`, `valid_to_i`, `supersedes`, `superseded_by`, `audience`, `language`, `kb_explanation`, `kb_evidence_ids`, `tags`, `reviewer`, `review_note` | 시간 유효성은 제안보다 우리가 더 명시적 |

벡터 DB: Chroma 단일 컬렉션(임베딩 백엔드별 1개, `RAG\config.py:37`). where 필터는 `approved`, `origin`, `department`, `language`만(`store.py:280-289`); topic/knowledge_id/expert/version/updated_at 필터 없음 → **부분**.

## 3. "델타"가 오늘 계산되는 곳

### 3-1. RAG 서비스: `POST /facts` (`RAG\main.py:121-164`) — 답변 1건 단위
1. 분류: `semantic.analyze_fact` (프롬프트 `FACT_SYSTEM`, `RAG\semantic.py:111-120,175-177`) → department, concept_key 목록, unknown_terms. 입력에 taxonomy + glossary + KNOWN KEYS 포함.
2. 증거 검색: `st.search(fact.answer, as_of=오늘, k=8, include_historical=True, department=dep)` (`main.py:141`); 3건 미만이면 부서 필터 없이 재검색(`main.py:142-143`). `include_unapproved`는 기본 False → **승인된 chunk만** 증거(같은 전문가의 draft fact는 증거가 아님). `as_of`는 항상 오늘(`main.py:127`, `FactIn`에 as_of 없음).
3. LLM 비교: `llm.check_statement` (프롬프트 `CHECK_SYSTEM`, `RAG\llm.py:135-154`). 입력 = "Interview question + Expert answer"(`main.py:145`) + 증거 블록(id, validity_status, citation, text) + glossary. 출력 `CheckVerdict`(`RAG\models.py:57-61`).
4. 저장: `store.add_fact` → chunk 메타 `kb_verdict/kb_explanation/kb_evidence_ids` (`store.py:239-240`), 텍스트는 `Topic/Q/A` 결합(`store.py:227`).
5. 타이밍: RAG 입장에서는 요청 내 **동기**. 앱 입장에서는 `orchestrator.answer`가 `asyncio.create_task(_submit_fact)`로 **fire-and-forget**(`APP\services\orchestrator.py:332-334,345-354`) → 인터뷰 턴을 막지 않음. 결과 `kb_verdict`는 **메모리 dict**에만 보관(`orchestrator.py:52,354`), 다음 `/interview/next` 호출의 turns에 실림(`orchestrator.py:132-142`). 앱 DB에는 저장되지 않음.
6. 별도 ad-hoc: `POST /check` (`main.py:271-284`), 같은 `check_statement` 사용.

### 3-2. 앱: `knowledge_search.reconcile` (`APP\services\knowledge_search.py:402-476`) — 지식단위 단위, 인터뷰 종료 후
- 호출 시점: `orchestrator.finish` 끝(`orchestrator.py:463-466`) 및 `POST /interviews/{id}/reconcile`(`APP\api\knowledge_routes.py:54-61`). **사후(post-interview)** 단계 = 제안의 위치와 동일.
- 증거: unit마다 `provider.search(title + content, top_k=SEARCH_TOP_K 기본 3, exclude_interview_id)` (`knowledge_search.py:420-421`, `APP\config.py:111`), 상위 3건. provider가 `rag_service`면 `GET /search?as_of=오늘`, 부서·언어 필터 없음(`knowledge_search.py:295`). `.env`에는 `KNOWLEDGE_SEARCH_PROVIDER=rag_service`로 설정돼 있음(값 확인; URL 값은 미표기).
- LLM 비교: 프롬프트 `RECONCILE_SYSTEM`(`knowledge_search.py:391-399`), 스키마 `ReconciliationResult`(`APP\agents\schemas.py:169-180`). "어느 쪽이 맞는지는 판단하지 않고 관계만" 명시.
- 휴리스틱 폴백: LLM 실패 시 top score ≥ `SEARCH_RECONCILE_THRESHOLD`(기본 0.55)면 `ergaenzung`, 아니면 `neu` (`knowledge_search.py:454-459`).
- 저장: `UnitReconciliation`(relation/action/target_id/score/candidates/method, `APP\models.py:246-260`) → export의 `vector_sync`.

### 3-3. 제안의 세 가지 비교 메커니즘 대조
| 메커니즘 | 현재 | 판정 |
|---|---|---|
| Hash compare | 파일 SHA256만(`RAG\registry.py:53-59`), 중복 스킵 함수 `is_indexed`는 미호출. 앱의 `_vectors`에 임베딩 캐시 키용 sha1(`knowledge_search.py:186`)은 비교 목적 아님 | **없음**(문장 단위), 파일 단위도 비활성 |
| Embedding similarity | `store.search` 코사인 score(`store.py:302`)로 증거 순위; 앱 폴백 임계값(0.55) | **있음**(순위/폴백용), 델타 라벨의 1차 판정기는 아님 |
| LLM semantic comparison | `CHECK_SYSTEM`, `RECONCILE_SYSTEM`, analyst의 `existing_unit_id`(`APP\agents\intelligence.py:210-211`) | **있음**(세 곳, 서로 독립) |

## 4. 승인 / 라이프사이클

### `POST /facts/{id}/approve` (`RAG\main.py:172-188`)
1. `store.set_review(fact_id, True, reviewer, note)` → chunk 메타 `approved=True, review_status=approved, reviewer, review_note, reviewed_at` (`store.py:247-255`). **텍스트·임베딩·validity window 변경 없음.**
2. `semantic.set_fact_status` → semantic.json 아이템의 `review_status` 갱신(`semantic.py:226-233`).
3. `updates.record_approval` → `database/_updates/<date>_<expert>_<id>.md` + `ledger.csv` 1행(`RAG\updates.py:40-73`). `change_type`은 `kb_verdict` 매핑(`updates.py:18-24`).
4. 문서 chunk에 대한 효과: **없음**. 모듈 docstring이 명시: "The policy documents themselves are never edited automatically; a 'correction' tells the document owner that a new version is due" (`updates.py:4-5`). supersede·valid_to 닫기·chunk 교체 모두 일어나지 않음.
5. 실질 효과: 승인된 fact chunk가 기본 검색(`approved=True` 필터)에 노출됨 → 사실상 "활성 KB에 ADD". CONFLICT 승인 시 문서 chunk(current)와 fact chunk(approved)가 **둘 다 current로 공존**하고, 이후 `/check` 증거에 둘 다 등장함. 해소 단계 없음.

### `GET /updates` (`main.py:191-193`)
- `ledger.csv`를 읽어 반환(`updates.py:76-85`). 현재 `database/_updates/` 디렉터리가 **존재하지 않음**(ls 확인) → 첫 승인 전까지 빈 목록.

### 기타
- `POST /facts/{id}/reject`: `approved=False, review_status=rejected`; chunk는 남음(기본 검색에서 제외).
- `DELETE /facts/{id}`: chroma + semantic.json에서 하드 삭제(`store.py:190-195`).
- 앱 `POST /units/{id}/review` (`APP\api\routes.py:352-395`): confirm/correct/… 모두 `version += 1` + `KnowledgeRevision` 스냅샷(append-only 역사) → 제안의 versioning/historisation과 가장 가까우나 **앱 DB에만**. `routes.py`에서 `rag_client` 호출 없음(grep: import·호출 없음) → 앱 승인이 RAG `/facts/{id}/approve`로 전파되지 않음.
- 앱 export(`APP\services\export.py`): pull 방식 JSON 계약 `ekep.knowledge-export 1.1.0`, `knowledge_id=KU-id`, `version`, `vector_sync` 포함. RAG `main.py`에 이를 소비하는 라우트는 없음(import 엔드포인트 없음).

## 5. 앱 측: reconcile 라우트와 analyst가 RAG 결과로 하는 일

- **Analyst** (`APP\agents\intelligence.py:195-246`, 적용 `orchestrator._apply_analysis:516-617`): 답변마다 백그라운드로 지식단위 추출, coverage, gaps(new/resolved), contradictions, new_topics. `analyst_context`(`intelligence.py:225-240`)에는 **RAG 검색 결과도 kb_verdict도 포함되지 않음**. 따라서 analyst의 contradictions는 **전문가 발언 간**(turn_ids) 모순이고, gaps는 **인터뷰 내부 coverage 기준** 공백이다. KB 대비 모순/공백이 아님.
- **Live knowledge search** (`knowledge_search.schedule/run_search:342-377`): 답변마다 병렬 검색 → `KnowledgeSearch` 행 저장 + UI 이벤트. analyst·interviewer 어느 쪽도 이 결과를 입력으로 받지 않음.
- **Interviewer**가 받는 RAG 입력은 별도: `/interview/next`의 제안 질문 + evidence를 컨텍스트에 덧붙임(`orchestrator._rag_augment:145-159`). RAG의 `reason=contradiction/gap`(`RAG\llm.py:184-188`)이 KB 대비 모순/공백을 **질문 선택**에 반영하는 유일한 경로.
- **reconcile 라우트** (`knowledge_routes.py:44-61`): GET은 저장된 검색·조정 결과 조회, POST는 재실행. 결과는 `UnitReconciliation` 저장과 `vector_sync` export뿐, **KB 쓰기 없음**. reconcile은 RAG의 `kb_verdict`를 참조하지 않으며(독립 LLM 판정), `/check`도 호출하지 않음.

## 6. 제안의 4개 컴포넌트 대응

| 제안 컴포넌트 | 현재 | 판정 |
|---|---|---|
| Interview Agent | 앱 orchestrator + `INTERVIEWER_SYSTEM`; RAG `/interview/next`(`INTERVIEW_SYSTEM`) | **있음** |
| Classification Engine (Dept→Topic→Subtopic) | `semantic.analyze_fact/analyze_document`(department + concept_key) | **부분** (department만 계층; topic은 concept_key 안에 암묵, subtopic 없음) |
| Delta Engine | `llm.check_statement`(답변 단위, 인터뷰 중) + `knowledge_search.reconcile`(unit 단위, 사후). 둘이 독립 | **부분** (라벨 체계·시점·단위가 서로 다름, UPDATE 실행 없음) |
| Lifecycle Manager (versioning/approval/update/historisation) | approval: `set_review` + ledger; versioning/historisation: 문서 `supersedes`, 앱 `KnowledgeRevision`; update: 없음 | **부분** |
| 구속력 있는 정책 vs 전문가 경험의 source/approval 구분 | `origin`(document/interview), `doc_type`, 문서 `approved` 기본 True(`RAG\models.py:17`) vs fact 기본 False, 부서별 approver(`taxonomy.json` departments[].approver, `semantic.approver_for`) | **부분** (구속력 등급 필드 없음) |

## 7. 제안에 맞추기 위한 최소 변경 갭 리스트 (코드 없음, 크기 S/M/L)

1. **S** — chunk 메타에 `expert_role` 추가: `FactIn`에 필드 추가, `rag_client.add_fact`가 `Employee.role` 전달, `store.add_fact` 메타 기록.
2. **S** — `updated_at` 메타: `set_review`, `set_concept_keys`, `_apply_supersession`에서 갱신.
3. **S** — 문장 단위 해시 비교: `add_fact` 전에 정규화된 answer의 sha256을 `content_hash`로 저장하고, 같은 해시의 fact가 있으면 LLM 호출 없이 `NO_CHANGE(duplicate)` 처리.
4. **S** — 문서 레벨 hash compare 활성화: `add_document`에서 `registry.is_indexed` 호출해 동일 해시 재인제스트 스킵.
5. **S** — `concept_key`에서 topic 세그먼트를 추출해 chunk 메타 `topic_key`로 기록(문서 chunk 포함) → 검색 필터 추가. subtopic 계층을 실제로 두려면 **M**: `taxonomy.json`에 `departments[].topics[].subtopics` 추가 + `FACT_SYSTEM/ANALYZE_SYSTEM`에서 선택 + 메타 `subtopic_key`.
6. **M** — 안정 `knowledge_id` + 정수 version: `concept_key`를 `knowledge_id`로 채택해 chunk 메타에 기록, 같은 key의 승인 fact/문서 아이템 수를 `knowledge_version`으로 증가. `semantic.concepts`의 timeline이 이미 버전 이력 역할.
7. **M** — fact 레벨 UPDATE/SUPERSEDE 실행: `/facts/{id}/approve`에 `resolution=supersede|coexist|enrich` 파라미터. `supersede`면 `kb_evidence_ids`의 chunk(또는 같은 `concept_key`의 이전 승인 fact)에 `_apply_supersession`과 같은 처리(`valid_to_i` 닫기, `superseded_by=fact_id`). 문서 원본 파일은 건드리지 않으므로 기존 docstring 원칙과 충돌 없음.
8. **M** — 승인 응답·`/updates`에 제안 용어 `delta_type`(ADD/UPDATE/NO_CHANGE/CONFLICT/SUPERSEDE) 매핑 필드 추가(`CHANGE_TYPE` 옆에 병기).
9. **M** — reconcile과 kb_verdict 정렬: `reconcile`이 unit마다 RAG `/check`를 호출하거나, `_verdicts`를 `UnitReconciliation`에 저장해 `widerspruch` ↔ `contradicted` 불일치를 표면화.
10. **L** — 앱 승인 → RAG 승인 동기화: `POST /units/{id}/review confirm` 시 RAG `/facts/{id}/approve` 호출. 전제: turn_id ↔ fact_id 매핑을 메모리(`_verdicts`)가 아닌 DB에 저장. 대안: RAG에 `ekep.knowledge-export` 소비용 `POST /import` 추가.
11. **S** — 구속력 등급 메타: `doc_type`(circular/amendment/manual …) 기반 `authority=binding|guidance|experience` 파생 필드, 문서=binding 기본, interview=experience 기본.
12. **S** — 문서화만: `analyze_fact`=Classification Engine, `check_statement`+`reconcile`=Delta Engine, `set_review`+`updates`+`KnowledgeRevision`=Lifecycle Manager로 README에 명명(코드 변경 없음).

## 8. 확인 못 한 것

- `.env`의 `RAG_SERVICE_URL` 실제 값과 현재 RAG 서비스 기동 여부(HTTP 호출 금지 조건으로 미확인).
- `ekep.knowledge-export` JSON을 외부에서 소비하는 컨슈머 존재 여부(두 코드베이스 안에는 없음).
- `semantic.json`(532KB)의 실제 concept 수·`changed` 비율(측정 안 함).
