import * as functions from 'firebase-functions';
import {
  getNumberOfNFTs as getNumberOfNFTsFromAptos,
  getNumberOfNFTsWithAttributes,
  getStakedNFTs,
} from './aptos';
import {
  getBotConfig,
  getMongoClient,
  getUserCursorForCollection,
  upsertUser,
} from './mongodb';

export const mongoClientPromise = getMongoClient();

export const reverification = functions.pubsub
  .topic('reverify')
  .onPublish(async (message) => {
    if (!process.env.MONGO_CONNSTR) {
      throw new Error('MONDO_CONNSTR is missing!');
    }
    const guildId = message.json.guildId;

    if (!guildId) {
      throw new Error('guildId is missing!');
    }
    const mongoClient = await mongoClientPromise;

    const botConfig = await getBotConfig(mongoClient, guildId);
    if (!botConfig) {
      throw new Error('couldnt load config');
    }

    const userCursor = await getUserCursorForCollection(mongoClient, guildId);

    try {
      while (await userCursor.hasNext()) {
        const user = await userCursor.next();
        if (!user) {
          continue;
        }
        user.roles = [];

        let numberOfStakedNFTs = 0;
        let stakedNFTs: { name: string; collection_name: string }[] = [];

        if (botConfig.staking) {
          stakedNFTs = await getStakedNFTs(
            botConfig.staking.account_address,
            user.address,
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
              user.address,
              botConfig.roles[roleId].attribute,
              stakedNFTs
            );
          } else {
            numberOfNfts = await getNumberOfNFTsFromAptos(
              botConfig.roles[roleId].contract_id,
              user.address
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
        const { _id, ...userWithoutId } = user;
        console.log(
          `updated user with discord_id ${
            user._id
          } from collection ${guildId} to roles ${JSON.stringify(user.roles)}`
        );
        await upsertUser(mongoClient, guildId, {
          ...userWithoutId,
          discord_id: _id as any,
          reverifyTimestamp: new Date(),
        });
      }
    } catch (error) {
      console.error(error);
    }
  });
