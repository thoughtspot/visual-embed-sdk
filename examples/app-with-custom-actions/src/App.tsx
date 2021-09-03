import React from 'react';
import { HashRouter, Link, Routes, Route, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import "antd/dist/antd.css";
import './App.css';
import { Search } from './components/search/Search';
import { Pinboard } from './components/pinboard/Pinboard';
import { Visualisation } from './components/visualisation/Visualisation';
import { FullApp } from './components/fullApp/FullApp';

const { Sider, Content } = Layout;

const PathToKey = {
  '/': 'search',
  '/search': 'search',
  '/visualisation': 'visualisation',
  '/pinboard': 'pinboard',
  '/fullapp': 'fullapp',
}


function App() {
  return (
    <HashRouter>
      <AppView />
    </HashRouter>
  )
}

const AppView = () => {
  const location = useLocation();
  const [selectedKey, setSelectedKey] = React.useState('analyze');
  React.useEffect(() => {
    setSelectedKey(PathToKey[location.pathname]);
  }, [location])

  return (
    <div className="App">
      <Layout style={{ flex: 1 }}>
        <Sider width={250}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            selectedKeys={[selectedKey]}
            defaultOpenKeys={['sub1']}
            style={{ height: '100%' }}
            onClick={(e) => setSelectedKey(e.key as string)}
          >
            <Menu.Item key="search" icon={<UserOutlined />} title="Search">
              <Link to="/search">Search</Link>
            </Menu.Item>
            <Menu.Item key="visualisation" icon={<UserOutlined />} title="Visualisation">
              <Link to="/visualisation">Visualisation</Link>
            </Menu.Item>
            <Menu.Item key="pinboard" icon={<UserOutlined />} title="Pinboard">
              <Link to="/pinboard">Pinboard</Link>
            </Menu.Item>
            <Menu.Item key="fullapp" icon={<UserOutlined />} title="FullApp">
              <Link to="/fullapp">Full App</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Content>
          <Routes>
            <Route path="/" element={<Search />}></Route>
            <Route path="/search" element={<Search />}></Route>
            <Route path="/pinboard" element={<Pinboard />}></Route>
            <Route path="/visualisation" element={<Visualisation />}></Route>
            <Route path="/fullapp" element={<FullApp />}></Route>
          </Routes>
        </Content>
      </Layout>


    </div>
  );
}

export default App;
