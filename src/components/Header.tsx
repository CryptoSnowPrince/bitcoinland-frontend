import { Button, IconButton } from "@mui/material";
import { FC } from "react";
import './Header.css';
import Logo from '../assets/logo-header.png';
import {Twitter} from '@mui/icons-material'
// import Discord from '../assets/discord.png';
const Header: FC = () => {

    return <div className="header">
        <div className="header-bar">
            <a href={window.location.href} >
                <img src={Logo} className="header-logo" alt="logo"/>
            </a>
            <div className="header-spacer"></div>
            <Button size="large">Whitepaper</Button>
            <a href="https://twitter.com/aptoslandnft">
                <IconButton aria-label="twitter" color="secondary">
                    <Twitter />
                </IconButton>
            </a>
            {/* <a href="https://twitter.com/aptoslandnft">
            <IconButton aria-label="twitter" color="secondary">
            <img src={Discord} alt="discord" className="header-discord"/>
                </IconButton>
                
            </a> */}
        </div>
        <div className="header-alert"><div>Please make sure you're only connecting to&nbsp;</div><a href="https://connect.aptosland.io">https://connect.aptosland.io</a></div>
    </div>;
}

export default Header;