# 선택 기능 운영 연결

1. `supabase db push`로 `202608130001_release_foundations.sql`을 적용합니다.
2. Supabase Auth에서 Phone provider와 SMS 공급자를 켭니다. 이제 앱은 실제 OTP 세션 없이는 가입을 완료하지 않습니다.
3. Google provider를 켜고 `findgoo://auth/callback`을 Redirect URLs에 등록합니다.
4. 네이버 개발자 센터 키를 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` Edge Function secret으로 저장한 뒤 `naver-auth`를 배포하고 `.env.local`에 URL을 넣습니다.
5. `delete-account`, `send-push` Edge Function을 배포합니다. `send-push`에는 `PUSH_WEBHOOK_SECRET`을 지정하고 notices INSERT Database Webhook의 같은 헤더에 넣습니다.
6. EAS 프로젝트를 연결해 `app.json`의 `extra.eas.projectId`가 생성되게 합니다. Android 원격 푸시는 Expo Go가 아닌 development build에서 확인합니다.

민감한 서비스 키는 `.env.local`에 넣지 않고 Supabase Edge Function secrets 또는 EAS secrets에만 저장합니다.
