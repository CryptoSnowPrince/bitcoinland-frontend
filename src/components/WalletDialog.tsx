import { useWallet, WalletName } from "@manahippo/aptos-wallet-adapter";
import { Dialog, DialogTitle, List, ListItem, ListItemText } from "@mui/material";
export interface SimpleDialogProps {
    open: boolean;
    onClose: (wallet: WalletName<string> | undefined)  => void;
  }

const WalletDialog = (props: SimpleDialogProps) => {
    const { onClose, open } = props;
    const {wallets } = useWallet();
  
    const handleClose = () => {
      onClose(undefined);
    };
  
    const handleClick = (name: WalletName<string>) => {
        onClose(name);
    };
  
    return (
      <Dialog onClose={handleClose} open={open}>
        <DialogTitle>Select your APTOS Wallet</DialogTitle>
        <List sx={{ pt: 0 }}>
          {wallets.map((wallet) => {
            const option = wallet.adapter;
            return <ListItem button onClick={() => handleClick(option.name)} key={option.name}>
              <ListItemText primary={option.name} />
            </ListItem>
            })}
        </List>
      </Dialog>
    );
  }

  export default WalletDialog;