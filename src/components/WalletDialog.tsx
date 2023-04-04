import { WalletName } from "@manahippo/aptos-wallet-adapter";
import { Dialog, DialogTitle, List, ListItem, ListItemText } from "@mui/material";
import useBitcoinWallet from "../hooks/useBitcoinWallet";
export interface SimpleDialogProps {
  open: boolean;
  onClose: (wallet: WalletName<string> | string | undefined) => void;
}

const WalletDialog = (props: SimpleDialogProps) => {
  const { onClose, open } = props;
  const { wallets } = useBitcoinWallet();

  const handleClose = () => {
    onClose(undefined);
  };

  const handleClick = (name: WalletName<string> | string) => {
    onClose(name);
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Select your Bitcoin Wallet</DialogTitle>
      <List sx={{ pt: 0 }}>
        {wallets.map((wallet) => {
          // const option = wallet.adapter;
          return <ListItem button onClick={() => handleClick(wallet)} key={wallet}>
            <ListItemText primary={wallet} />
          </ListItem>
        })}
      </List>
    </Dialog>
  );
}

export default WalletDialog;