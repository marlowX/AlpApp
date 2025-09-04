import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Avatar, Space, Badge, Dropdown } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  BgColorsOutlined,
  DatabaseOutlined,
  TruckOutlined,
  TeamOutlined,
  ScissorOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useTheme } from '@alp/theme';
import styled from 'styled-components';

const { Header, Sider, Content, Footer } = AntLayout;

// Styled components
const StyledLayout = styled(AntLayout)`
  min-height: 100vh;
`;

const StyledHeader = styled(Header)`
  background: ${props => props.theme?.token?.colorBgContainer || '#fff'};
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 10;
`;

const StyledSider = styled(Sider)`
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
`;

const StyledContent = styled(Content)`
  margin: 24px 16px;
  padding: 24px;
  min-height: calc(100vh - 64px - 70px - 48px);
  background: ${props => props.theme?.token?.colorBgContainer || '#fff'};
  border-radius: ${props => props.theme?.token?.borderRadiusLG || 8}px;
`;

const Logo = styled.div`
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
`;

const TriggerButton = styled(Button)`
  margin-left: 16px;
`;

const HeaderRight = styled.div`
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Menu items
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: 'zko',
      icon: <FileTextOutlined />,
      label: 'ZKO',
      children: [
        {
          key: '/zko',
          label: <Link to="/zko">Lista zleceń</Link>,
        },
        {
          key: '/zko/new',
          label: <Link to="/zko/new">Nowe ZKO</Link>,
        },
        {
          key: '/zko/buffer',
          label: <Link to="/zko/buffer">Bufory</Link>,
        },
      ],
    },
    {
      key: 'worker-panels',
      icon: <TeamOutlined />,
      label: 'Panele pracowników',
      children: [
        {
          key: '/worker/pila',
          icon: <ScissorOutlined />,
          label: <Link to="/worker/pila">🔪 Stanowisko PIŁY</Link>,
        },
        {
          key: '/worker/okleiniarka',
          icon: <BgColorsOutlined />,
          label: <Link to="/worker/okleiniarka">🎨 Stanowisko OKLEINIARKI</Link>,
        },
        {
          key: '/worker/wiertarka',
          icon: <ToolOutlined />,
          label: <Link to="/worker/wiertarka">🔩 Stanowisko WIERTARKI</Link>,
          disabled: true,
        },
        {
          key: '/worker/magazyn',
          icon: <DatabaseOutlined />,
          label: <Link to="/worker/magazyn">📦 Magazyn</Link>,
          disabled: true,
        },
        {
          key: '/worker/kompletowanie',
          icon: <DatabaseOutlined />,
          label: <Link to="/worker/kompletowanie">📋 Kompletowanie</Link>,
          disabled: true,
        },
      ],
    },
    {
      key: 'workflow',
      icon: <PlayCircleOutlined />,
      label: <Link to="/workflow">Workflow</Link>,
    },
    {
      key: 'production',
      icon: <DatabaseOutlined />,
      label: 'Produkcja',
      children: [
        {
          key: '/production/cutting',
          label: <Link to="/production/cutting">Cięcie</Link>,
        },
        {
          key: '/production/edging',
          label: <Link to="/production/edging">Oklejanie</Link>,
        },
        {
          key: '/production/drilling',
          label: <Link to="/production/drilling">Wiercenie</Link>,
        },
      ],
    },
    {
      key: 'transport',
      icon: <TruckOutlined />,
      label: <Link to="/transport">Transport</Link>,
    },
  ];

  // User menu
  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Profil',
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Ustawienia',
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Wyloguj',
        danger: true,
      },
    ],
  };

  // Get selected keys based on current path
  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path === '/') return ['/'];
    // Find matching menu item
    for (const item of menuItems) {
      if (item.key === path) return [path];
      if (item.children) {
        for (const child of item.children) {
          if (child.key === path) return [path];
        }
      }
    }
    return [path];
  };

  return (
    <StyledLayout>
      <StyledSider trigger={null} collapsible collapsed={collapsed}>
        <Logo>
          {collapsed ? 'ALP' : 'AlpApp ZKO'}
        </Logo>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={menuItems}
        />
      </StyledSider>
      
      <AntLayout>
        <StyledHeader>
          <TriggerButton
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          
          <HeaderRight>
            <Button
              type="text"
              icon={<BgColorsOutlined />}
              onClick={toggleTheme}
            >
              {isDarkMode ? 'Jasny' : 'Ciemny'}
            </Button>
            
            <Badge count={5} size="small">
              <Button type="text" icon={<BellOutlined />} />
            </Badge>
            
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>Jan Kowalski</span>
              </Space>
            </Dropdown>
          </HeaderRight>
        </StyledHeader>
        
        <StyledContent>
          <Outlet />
        </StyledContent>
        
        <Footer style={{ textAlign: 'center' }}>
          AlpApp ©{new Date().getFullYear()} Created by AlpSys
        </Footer>
      </AntLayout>
    </StyledLayout>
  );
};

export default Layout;