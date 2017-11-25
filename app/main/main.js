/**
 * Created by yanggang on 2017/3/6.
 */
import React from 'react';
import {HashRouter as Router, Route, Link, Switch, Redirect} from 'react-router-dom';
import {Layout, Menu, Icon} from 'antd';
const {Header, Footer, Sider, Content} = Layout;

const SubMenu = Menu.SubMenu;

import {System} from '../system/system';
import {NotFound} from '../notfound';

import './main.less';

export class Main extends React.Component {
    constructor(props) {
        super(props);
    }

    handleClick = (e) => {
        console.log('click ', e);
        this.setState({
            current: e.key,
        });
    }

    render() {
        console.log(this.props);
        return (<Layout className="main">
                <Header className="header"></Header>
                <Layout>
                    <Sider width="200">
                        <Menu mode="inline"
                            theme="dark"
                            onClick={this.handleClick}

                              openKeys={["data","statistics","monitor"]}
                        >
                            <Menu.Item key="config">
                                <Icon type="setting"/>基本配置
                            </Menu.Item>
                            <SubMenu title={<span><Icon type="appstore-o" /><span>数据管理</span></span>}  key="data">
                                <Menu.Item key="user">用户</Menu.Item>
                                <Menu.Item key="ip">IP白名单</Menu.Item>
                                <Menu.Item key="type">图片类型</Menu.Item>
                                <Menu.Item key="image">图片信息</Menu.Item>
                            </SubMenu>
                            <SubMenu title={<span><Icon type="line-chart" /><span>统计分析</span></span>}  key="statistics">
                                <Menu.Item key="s1">统计分析1</Menu.Item>
                                <Menu.Item key="s2">统计分析2</Menu.Item>
                            </SubMenu>
                            <SubMenu title={<span><Icon type="eye-o" /><span>系统监控</span></span>}  key="monitor">
                                <Menu.Item key="m1">系统监控1</Menu.Item>
                                <Menu.Item key="m2">系统监控2</Menu.Item>
                            </SubMenu>
                        </Menu>
                    </Sider>
                    <Layout >
                        <Router>
                            <Switch>
                                <Route strict path="/main/system" component={System}/>
                                <Route component={NotFound}/>
                            </Switch>
                        </Router>
                    </Layout>
                </Layout>
            </Layout>
        );
    }
}