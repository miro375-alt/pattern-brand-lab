# 업무툴 배포 가이드

> prompt-builder-php의 DEPLOY.md 문화를 이식·로컬라이징. 우리는 NAS/도커가 아니라 **GitHub Pages + 프라이빗 데이터 저장소** 구조다.
> ⛔ NAS 배포 금지(사용자 지시). 이 파일은 .gitignore 대상 아님(비밀 없음).

## 구조 한 줄 요약

`src/` 사람이 읽는 소스 → `node build.mjs`가 단일 app.html 조립+AES 암호화 → `docs/*.enc.json`만 공개 저장소에 push → GitHub Pages 서빙 → 로그인(복호화)해야 열림.

## 표준 배포 절차 (순서 엄수)

```bash
cd ~/Desktop/유아패브릭브랜드/업무툴
node build.mjs            # 조립+암호화 (자체 왕복·오답pw 검사 포함)
node verify.mjs --local   # 사전 점검 — 전부 ✅ 아니면 push 금지
git pull --rebase         # 더블세션 락: 다른 세션 커밋 먼저 흡수
git add -A && git commit -m "..." && git push
node verify.mjs           # 라이브 회귀 — 전부 ✅ 나와야 "배포 완료"
```

- **배포 전후 WORKLOG.md에 `배포 시작` / `배포 완료(커밋해시)` 기록** (더블세션 락).
- Pages 반영은 push 후 20~60초. 확인은 verify.mjs가 한다(수동 확인 필요 없음).

## 비밀 관리

| 항목 | 위치 | 주의 |
|---|---|---|
| 로그인 계정 + GitHub PAT | `.secrets.json` (gitignore) | 빌드가 주입. 절대 커밋 금지 — 소스에는 `__TOKEN__` 자리표시자만 |
| 네이버 API 키 | `../도구/.env.local` | 리서치 스크립트 전용 |
| PAT 만료 시 | 새 fine-grained PAT(Contents RW, pattern-brand-data 한정) 발급 → `.secrets.json` 교체 → 표준 배포 절차 | 만료되면 앱에 "동기화 오류" 표시됨 |

## 캐시 특성 (당황 방지)

- **서비스워커**: 셸(index 등)은 캐시 우선+백그라운드 갱신 → 새 셸은 **두 번째 로드**에 보인다. 암호문(docs/)은 네트워크 우선이라 즉시 반영.
- PWA로 설치한 경우 앱 완전 종료 후 재실행 2회면 확실히 갱신.
- 급할 때: 브라우저 하드 리프레시(⌘⇧R)면 즉시.

## 사용자 데이터 (state.json)

- 원격 `pattern-brand-data/state.json`이 정본 — **세션이 직접 쓰지 않는다**(테스트 시 반드시 원상복구, sha 기반 조건부 PUT만).
- 커밋 이력이 곧 백업. 마이그레이션이 필요한 스키마 변경은 앱의 migrate()가 처리하고 원본은 localStorage `pbl.v4backup`류로 보존한다.

## 자주 하는 실수 (실사례)

1. 빌드 없이 push → 소스만 바뀌고 라이브는 그대로. **암호문이 산출물이다.**
2. verify.mjs 생략 → getdoc 정규식에 하이픈 빠져 문서 무한로딩 났던 사례(2026-08-11). 회귀는 기계가 잡는다.
3. app.html을 직접 수정 → 다음 빌드가 덮어씀. **수정은 항상 src/에서.**
4. 문서(기획/*.html·md) 갱신 후 빌드를 잊음 → 문서고에 옛 버전. 빌드 입력은 `../기획/` 기준.
