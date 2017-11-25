/**
 * Created by yanggang on 2017/3/6.
 */
import React from 'react';
import {HashRouter as Router,Route,Link,Switch,Redirect} from 'react-router-dom';
import { Layout } from 'antd';
const { Header, Footer, Sider, Content } = Layout;



export class User extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
           <div>user</div>
        );
    }
}