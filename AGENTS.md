# Helium Chat

## 프로젝트 개요
채팅 입력창에 메시지를 보내면 해당 메시지가 랜덤 색상의 버블로 변환되어
역중력(부력)으로 위로 떠올라 천장에 쌓이는 인터랙티브 모션 데모.

## 기술 스택
- Vite 8 (vanilla JS, 프레임워크 없음)
- Matter.js 0.20.0 (2D 물리 엔진)
- DOM 기반 렌더링 (Canvas 아님)
- GitHub Pages 배포

## 아키텍처 결정
- 물리 시뮬레이션은 Matter.js Engine이 담당.
  gravity.y를 음수로 설정하여 모든 바디가 위로 떠오르게 함.
- 렌더링은 DOM 요소(div)로 처리. 각 div를 absolute position으로 배치하고,
  requestAnimationFrame 루프에서 Matter body의 position/angle을 읽어
  CSS transform으로 동기화.
- 버블의 물리 바디 크기는 DOM 요소를 먼저 렌더링하여 치수를 측정한 뒤 결정.
- Canvas 렌더러(Matter.Render)는 사용하지 않음. 텍스트 가독성과 스타일링을 위해
  DOM 렌더링을 선택.

## 물리 설정 (기본값, 튜닝 가능)
- gravity.y: -0.3 (역중력, 부력 역할)
- body restitution: 0.3 (반발 계수, 충돌 시 약간 튕김)
- body friction: 0.05 (마찰, 쌓였을 때 미끄러짐 정도)
- body frictionAir: 0.02 (공기 저항, 떠오르는 속도 감쇠)
- 바람: 매 프레임 sin(time) 기반 x축 힘 적용 (우->좌 바이어스)
- torque: sin(time + phase) 기반 미세 회전력 (기우뚱 효과)

## 시각 스타일
- 플랫 2D 벡터 그래픽. 그림자(box-shadow, drop-shadow) 없음.
- 버블은 단색 배경 + 흰색 텍스트만으로 구성.
- 장식적 요소 없이 텍스트 폭에 맞는 최소한의 사각형(둥근 모서리).

## 코드 스타일
- ES Module import/export 사용
- 파일 분리: main.js (진입점), physics.js (Matter.js 월드 관리),
  bubble.js (버블 생성/동기화), input.js (입력 처리), style.css
- 변수/함수 이름은 camelCase, 상수는 UPPER_SNAKE_CASE
- 주석은 한국어로

## 반응형
- 뷰포트 리사이즈 시 Matter.js 벽 경계를 재계산해야 함
- 모바일에서 소프트 키보드가 올라올 때 입력창이 가려지지 않도록 처리