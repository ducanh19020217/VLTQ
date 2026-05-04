import { curriculum } from '../data/curriculum';
import { BookOpen, FlaskConical, Atom } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  onSelectTopic?: (id: string) => void;
}

export function Sidebar({ onSelectTopic }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lấy topicId từ URL path (ví dụ: /pendulum -> pendulum)
  const activeTopicId = location.pathname.substring(1) || 'pendulum';

  const handleSelect = (id: string) => {
    navigate(`/${id}`);
    if (onSelectTopic) onSelectTopic(id);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <Atom size={24} />
        <span>Vật Lý Trực Quan</span>
      </div>
      
      <div className="sidebar-content">
        {curriculum.map((item) => (
          <div key={item.grade} className="grade-section">
            <h3 className="grade-title">Lớp {item.grade}</h3>
            <ul>
              {item.topics.map((topic) => (
                <li 
                  key={topic.id}
                  className={`topic-item ${activeTopicId === topic.id ? 'active' : ''}`}
                  onClick={() => handleSelect(topic.id)}
                >
                  {topic.type === '2d' ? <BookOpen size={16} /> : <FlaskConical size={16} />}
                  {topic.title}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
