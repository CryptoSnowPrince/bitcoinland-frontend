import axios from 'axios';
import * as corsLib from 'cors';
import * as functions from 'firebase-functions';
import * as tweetnacl from 'tweetnacl';
import {
  getBotConfig,
  getMongoClient,
  getUserCountForAddress,
  upsertUser,
} from './mongodb';

import {
  getNumberOfNFTs as getNumberOfNFTsFromAptos,
  getNumberOfNFTsWithAttributes,
  getStakedNFTs,
} from './aptos';
import { reverification } from './reverification';
import { User } from './types';

const DISCORD_API_URL = 'https://discord.com/api/oauth2';

const cors = corsLib({
  origin: true,
});

export const mongoClientPromise = getMongoClient();

export const verify = functions.https.onRequest((request, response) =>
  cors(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return response.sendStatus(403);
      }
      const { accessToken, discordServerId, address, publicKey, signature } =
        request.body;
      if (
        !accessToken ||
        !discordServerId ||
        !address ||
        !publicKey ||
        !signature
      ) {
        return response.sendStatus(400);
      }

      const mongoClient = await mongoClientPromise;

      const verifySignature = (
        publicKey: string,
        signature: string
      ): boolean => {
        try {
          const message = `APTOS\nmessage: Please sign this message for https://connect.aptosland.io to verify your assets.\nnonce: nonce`;
          return tweetnacl.sign.detached.verify(
            Buffer.from(message),
            Buffer.from(signature!.slice(2), 'hex'),
            Buffer.from(publicKey!.slice(2, 66), 'hex')
          );
        } catch (error) {
          console.error(error);
          return false;
        }
      };

      if (verifySignature(publicKey, signature) === false) {
        return response.sendStatus(500);
      }

      const getDiscrodIdResult = await axios.get(`${DISCORD_API_URL}/@me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { id: discord_id } = getDiscrodIdResult.data.user;

      const botConfig = await getBotConfig(mongoClient, discordServerId);
      if (botConfig == null) {
        throw new Error('config not found');
      }

      if (
        (await getUserCountForAddress(
          mongoClient,
          address,
          discord_id,
          discordServerId
        )) > 0
      ) {
        throw new Error(
          `wallet ${address} is already verified with another discord user.`
        );
      }

      const user: User = {
        discord_id,
        address,
        roles: [],
      };

      let numberOfStakedNFTs = 0;
      let stakedNFTs: { name: string; collection_name: string }[] = [];
      if (botConfig.staking) {
        stakedNFTs = await getStakedNFTs(
          botConfig.staking.account_address,
          address,
          botConfig.staking.creator,
          botConfig.staking.stakeEvent,
          botConfig.staking.unstakeEvent
        );
        numberOfStakedNFTs = stakedNFTs.length;
      }

      const getNumberOfNFTs = async (roleId: string): Promise<number> => {
        let numberOfNfts = 0;
        if (botConfig.roles[roleId].attribute) {
          numberOfNfts = await getNumberOfNFTsWithAttributes(
            mongoClient,
            botConfig.roles[roleId].contract_id,
            address,
            botConfig.roles[roleId].attribute,
            stakedNFTs
          );
        } else {
          numberOfNfts = await getNumberOfNFTsFromAptos(
            botConfig.roles[roleId].contract_id,
            address
          );
          numberOfNfts = numberOfNfts + numberOfStakedNFTs;
        }
        return numberOfNfts;
      };

      if (botConfig.multiContract) {
        // multiple contracts
        for (const roleId of Object.keys(botConfig.roles)) {
          let numberOfNfts = await getNumberOfNFTs(roleId);
          user.roles.push({
            [roleId]: numberOfNfts >= botConfig.roles[roleId].minAmount,
          });
        }
      } else {
        // single contract
        const firstRoleId = Object.keys(botConfig.roles)[0];
        let numberOfNfts = await getNumberOfNFTs(firstRoleId);
        for (const roleId of Object.keys(botConfig.roles)) {
          user.roles.push({
            [roleId]: numberOfNfts >= botConfig.roles[roleId].minAmount,
          });
        }
      }

      await upsertUser(mongoClient, discordServerId, user);

      return response.sendStatus(200);
    } catch (error) {
      console.log(error);
      return response.sendStatus(500);
    }
  })
);

export const reverify = reverification;
