# Helium Chat

## 프로젝트 개요
채팅 입력창에 메시지를 보내면 해당 메시지가 랜덤 색상의 버블로 변환되어
역중력(부력)으로 위로 떠올라 천장에 쌓이는 인터랙티브 모션 데모.

## 기술 스택
- Vite 8 (vanilla JS, 프레임워크 없음)
- Matter.js 0.20.0 (2D 물리 엔진)
- DOM 기반 렌더링 (Canvas 아님)
- GitHub Pages 배포 (gh-pages, base: '/helium-chat/')

## 아키텍처 결정
- 물리 시뮬레이션은 Matter.js Engine이 담당.
  gravity.y를 음수로 설정하여 모든 바디가 위로 떠오르게 함.
- 렌더링은 DOM 요소(div)로 처리. 각 div를 absolute position으로 배치하고,
  requestAnimationFrame 루프에서 Matter body의 position/angle을 읽어
  CSS transform으로 동기화.
- Matter.Runner가 물리 업데이트, rAF 루프가 힘 적용 + DOM 동기화를 각각 독립 담당.
- 버블의 물리 바디 크기는 DOM 요소를 먼저 렌더링하여 치수를 측정한 뒤 결정.
- Canvas 렌더러(Matter.Render)는 사용하지 않음. 텍스트 가독성과 스타일링을 위해
  DOM 렌더링을 선택.

## 파일 구조
- main.js — 진입점, 모듈 초기화 및 연결
- physics.js — Matter.js 엔진/월드/벽 관리, 리사이즈 대응
- bubble.js — 버블 생성 (DOM + Matter body), 색상 생성, 버블 배열 관리
- render-loop.js — rAF 루프, 바람/토크 힘 적용, DOM-물리 동기화
- input.js — 입력 처리 (Enter/클릭), 전송 피드백, 마우스 추적 glow
- explode.js — 클릭/터치 시 폭발 효과 (근처 버블에 방사형 힘 적용)
- style.css — 다크모드 전용 UI 스타일

## 물리 설정 (튜닝 가능)
- gravity.y: -0.5 (역중력, 부력 역할)
- body restitution: 0.3 (반발 계수, 충돌 시 약간 튕김)
- body friction: 0.05 (마찰, 쌓였을 때 미끄러짐 정도)
- body frictionAir: 0.02 (공기 저항, 떠오르는 속도 감쇠)
- 초기 상향 속도: y = -3 (생성 직후 튀어오름)
- 질량 랜덤 편차: 기본 mass × (0.8~1.2)
- 바람: 없음 (좌측 바이어스 제거됨)
- 흔들림: sin(time + phase) 기반 x축 진동만 적용
- torque: sin(time + phase) 기반 미세 회전력 (기우뚱 효과)
- 벽: 천장 + 좌벽 + 우벽 (두께 60px), 바닥 없음
- chamfer: min(width, height) / 2 (pill shape 물리 바디)

## 시각 스타일
- 다크모드 전용. 배경 #000 (순수 블랙).
- 플랫 2D. 장식적 요소 없음.
- 버블은 높은 채도의 단색 배경 + 흰색 텍스트.
  HSL(hue 가변, sat 80-100%, lit 42-52%).
  연속 버블 간 최소 60도 hue shift 보장.
- 버블에 자체 컬러의 은은한 glow (box-shadow, opacity 0.35).
- 버블 생성 시 입력창과 동일한 외형에서 시작 →
  800ms cubic-bezier ease로 색상/glow 전환 (입력창에서 벗겨지는 효과).
- 입력창: pill shape, border 없음, #1a1a1a 배경.
  마우스 추적 radial-gradient glow (lerp 보간으로 부드럽게 추적).
- 전송 시 입력창 scale(0.96) 50ms 피드백.
- 클릭/터치 시 버블 폭발 효과 (반경 300px, 거리 반비례 힘).

## 코드 스타일
- ES Module import/export 사용
- 변수/함수 이름은 camelCase, 상수는 UPPER_SNAKE_CASE
- 주석은 한국어로
- 버블 스타일은 getComputedStyle(input)에서 복사하여 입력창과 완전 일치 보장

## 반응형
- #bubble-area는 height: 100%로 전체 화면 커버 (입력바 영역 포함)
- #input-bar는 position fixed, z-index로 버블 아래 배치
- 뷰포트 리사이즈 시 Matter.js 벽 경계를 재계산
- 모바일: env(safe-area-inset-bottom) 대응, font-size 16px 이상 (줌 방지)
