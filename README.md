0. 프로젝트 관리 <br>
  .env 파일을 이용하여 민감한 정보 관리 <br>
  .gitignore 파일을 생성하여 .env 파일과 node_modules 폴더가 업로드되지 않게 함 <br>
  .prettierrc 파일을 생성하여 일정한 코드 포맷팅 유지 <br>
<br>
1. AWS EC2 배포 <br>
  배포 IP : 18.218.78.166 <br>
  접속 포트 : 3017 <br>
<br>
2. 인증 미들웨어 구현 <br>
   src/middlewares/auth.middleware.js 에서 jwt를 쿠키를 통해 읽고 토큰 사용자 정보를 req.account 속성값으로 저장 <br>
<br>
3. 데이터베이스 모델링 <br>
   prisma/schema.prisma 에 정의 <br>
   - Accounts 테이블 : 계정 데이터를 저장. 하나의 계정은 여러개의 캐릭터 대응 가능 <br>
   - Character 테이블 : 캐릭터 데이터를 저장. 하나의 캐릭터는 여러개의 인벤토리와 장착 데이터와 대응 <br>
   - Items 테이블 : 아이템 데이터를 저장. 하나의 아이템은 여러개의 인벤토리와 장착 데이터에 대응 <br>
   - Inventory 테이블 : 인벤토리 데이터를 저장. 캐릭터ID와 아이템코드의 복합키로 식별. 여러 캐릭터가 여러 아이템을 보유하는 N:N 관계 지원 <br>
   - MountedItems 테이블 : 장착템 데이터를 저장. 여러 캐릭터가 여러 아이템을 장착하는 N:N 관계 지원  <br>
<br>
4. API 명세서 <br>
  https://www.notion.so/14c31a65498e8031baf7ede29d788ad7?v=14c31a65498e81c38ede000c2d370c54 <br>
