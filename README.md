# 내가 쏜다 커피

[ec-coffee.vercel.app](https://ec-coffee.vercel.app) 기능을 참조한 간단한 커피 취합 앱입니다.

- **로그인**: 등록된 사용자가 없습니다. (데모: 이메일/비밀번호 입력 시 로그인)
- **홈**: 커피 취합 시작하기, 주문 이력 보기, 팀원 관리
- **새 주문**: 주문자·커피숍 선택 후 주문 시작
- **주문 이력** / **팀원 관리**: 로그인 필요

Tailwind CSS(CDN)로 스타일링.

### 실시간 데이터 동기화 (Supabase)

같은 앱을 쓰는 사람끼리 **주문을 실시간으로 공유**하려면 Supabase를 연결하세요.

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. **SQL Editor**에서 `supabase/schema.sql` 내용 전체 실행 (orders, team_members, cafes 테이블 + RLS + Realtime)
3. **Settings → API**에서 Project URL, anon public key 복사
4. 프로젝트 루트에 `.env` 생성:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

5. `npm run dev` 또는 `npm run build` 후 배포

`.env`가 없으면 기존처럼 **로컬 저장소(localStorage)** 만 사용합니다.

```bash
npm run dev
```
