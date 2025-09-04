import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  DashboardOutlined,
  TeamOutlined,
  ScissorOutlined,
  BgColorsOutlined,
  ToolOutlined,
  InboxOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: string,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const ZKOSidebar: React.FC = () => {
  const location = useLocation();
  
  // Determine selected key based on current path
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/zko/create')) return 'create';
    if (path.includes('/zko/list')) return 'list';
    if (path.includes('/zko/modern-list')) return 'modern-list';
    if (path.includes('/zko/worker/pila')) return 'worker-pila';
    if (path.includes('/zko/worker/okleiniarka')) return 'worker-okleiniarka';
    if (path.includes('/zko/worker/wiertarka')) return 'worker-wiertarka';
    if (path.includes('/zko/worker/magazyn')) return 'worker-magazyn';
    if (path.includes('/zko/worker/kompletowanie')) return 'worker-kompletowanie';
    if (path === '/zko' || path === '/zko/') return 'modern-list';
    return 'modern-list';
  };

  const items: MenuItem[] = [
    getItem('Zarządzanie ZKO', 'management', <AppstoreOutlined />, [
      getItem(<Link to="/zko/modern-list">Lista ZKO (Nowoczesna)</Link>, 'modern-list', <DashboardOutlined />),
      getItem(<Link to="/zko/list">Lista ZKO (Klasyczna)</Link>, 'list', <UnorderedListOutlined />),
      getItem(<Link to="/zko/create">Nowe ZKO</Link>, 'create', <PlusCircleOutlined />),
    ]),
    
    getItem('Panele pracowników', 'workers', <TeamOutlined />, [
      getItem(<Link to="/zko/worker/pila">🔪 Stanowisko PIŁY</Link>, 'worker-pila', <ScissorOutlined />),
      getItem(<Link to="/zko/worker/okleiniarka">🎨 Stanowisko OKLEINIARKI</Link>, 'worker-okleiniarka', <BgColorsOutlined />),
      getItem(<Link to="/zko/worker/wiertarka">🔧 Stanowisko WIERTARKI</Link>, 'worker-wiertarka', <ToolOutlined />),
      getItem(<Link to="/zko/worker/magazyn">📦 MAGAZYN</Link>, 'worker-magazyn', <InboxOutlined />),
      getItem(<Link to="/zko/worker/kompletowanie">📋 KOMPLETOWANIE</Link>, 'worker-kompletowanie', <ShoppingOutlined />),
    ]),
  ];

  return (
    <Menu
      mode="inline"
      selectedKeys={[getSelectedKey()]}
      defaultOpenKeys={['management', 'workers']}
      style={{ height: '100%', borderRight: 0 }}
      items={items}
    />
  );
};

export default ZKOSidebar;