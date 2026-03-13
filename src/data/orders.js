export const TEST_ORDERS = [
  {
    id: 1,
    date: '2025.03.10',
    shop: '스타벅스 강남점',
    orderer: '김철수',
    count: 5,
    status: '완료',
    items: [
      { name: '아메리카노', options: 'ICE Tall', count: 2, orderedBy: '김철수' },
      { name: '카페 라떼', options: 'HOT Grande', count: 1, orderedBy: '이영희' },
      { name: '카라멜 마키아또', options: 'HOT Venti', count: 2, orderedBy: '박민수' },
    ],
  },
  {
    id: 2,
    date: '2025.03.08',
    shop: '이디야 역삼점',
    orderer: '이영희',
    count: 3,
    status: '완료',
    items: [
      { name: '바닐라 라떼', options: 'ICE', count: 1, orderedBy: '이영희' },
      { name: '녹차 라떼', options: 'HOT', count: 2, orderedBy: '김철수' },
    ],
  },
  {
    id: 3,
    date: '2025.03.05',
    shop: '투썸 신논현점',
    orderer: '박민수',
    count: 4,
    status: '완료',
    items: [
      { name: '아메리카노', options: 'HOT', count: 2, orderedBy: '박민수' },
      { name: '밀크티', options: 'ICE', count: 2, orderedBy: '이영희' },
    ],
  },
];
