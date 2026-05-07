export interface SimulationTopic {
  id: string;
  title: string;
  type: '2d' | '3d';
  component?: string; // Which simulation component to load
}

export interface GradeContent {
  grade: number;
  topics: SimulationTopic[];
}

export const curriculum: GradeContent[] = [
  {
    grade: 6,
    topics: [
      { id: 'lever', title: 'Đòn bẩy', type: '2d' },
      { id: 'density', title: 'Khối lượng riêng', type: '2d' },
      { id: 'thermal-expansion', title: 'Sự nở vì nhiệt', type: '2d' }
    ]
  },
  {
    grade: 7,
    topics: [
      { id: 'reflection', title: 'Phản xạ ánh sáng', type: '2d' },
      { id: 'sound-pitch', title: 'Độ cao của âm', type: '2d' },
      { id: 'magnet', title: 'Từ tính của nam châm', type: '2d' }
    ]
  },
  {
    grade: 8,
    topics: [
      { id: 'pressure', title: 'Áp suất chất lỏng', type: '2d' },
      { id: 'buoyancy', title: 'Lực đẩy Ác-si-mét', type: '2d' },
      { id: 'heat-conduction', title: 'Dẫn nhiệt', type: '2d' }
    ]
  },
  {
    grade: 9,
    topics: [
      { id: 'ohm-law', title: 'Định luật Ôm', type: '2d' },
      { id: 'refraction', title: 'Khúc xạ ánh sáng', type: '2d' },
      { id: 'electric-motor', title: 'Động cơ điện', type: '2d' }
    ]
  },
  {
    grade: 10,
    topics: [
      { id: 'projectile-motion', title: 'Chuyển động ném ngang', type: '2d' },
      { id: 'artillery-3d', title: 'Pháo binh 3D (Đạn đạo)', type: '3d' },
      { id: 'circular-motion', title: 'Chuyển động tròn đều', type: '2d' },
      { id: 'momentum', title: 'Định luật bảo toàn động lượng', type: '2d' }
    ]
  },
  {
    grade: 11,
    topics: [
      { id: 'electric-field', title: 'Điện trường', type: '2d' },
      { id: 'magnetic-force', title: 'Lực Lo-ren-xơ', type: '3d' },
      { id: 'wave-interference', title: 'Giao thoa sóng', type: '2d' }
    ]
  },
  {
    grade: 12,
    topics: [
      { id: 'pendulum', title: 'Con lắc đơn', type: '2d' },
      { id: 'spring-oscillator', title: 'Con lắc lò xo', type: '2d' },
      { id: 'photoelectric-effect', title: 'Hiện tượng quang điện', type: '2d' }
    ]
  }
];
