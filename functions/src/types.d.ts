export interface BotConfig {
  guild_id: string;
  channel_id: string;
  emoji: string;
  project_name: string;
  multiContract?: boolean;
  verifyViaParas?: boolean;
  disable?: {
    reverify?: boolean;
  };
  staking?: {
    account_address: string;
    creator: string;
    stakeEvent: string;
    unstakeEvent: string;
  };
  roles: {
    [roleId: string]: {
      minAmount: number;
      contract_id: string;
      paras_nft_title?: string | string[];
      paras_creator_id?: string;
      paras_copies?: number;
      paras_collection?: string;
      stakingContractId?: string;
      stakingFunction?: string;
      attribute?: Attribute;
    };
  };
}

export interface User {
  discord_id: string;
  address: string;
  roles: {
    [roleId: string]: boolean;
  }[];
  reverifyTimestamp?: Date;
}

export interface Attribute {
  name: string;
  value: string;
}
