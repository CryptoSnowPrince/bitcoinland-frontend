import { FindCursor, MongoClient, WithId } from 'mongodb';
import { BotConfig, User } from './types';
import {subMinutes} from 'date-fns'
export const getMongoClient = async (): Promise<MongoClient> => {
  if(!process.env.MONGO_CONNSTR) {
    throw new Error('MONDO_CONNSTR is missing!')
  }
  return MongoClient.connect(process.env.MONGO_CONNSTR as string);
};

export const getBotConfig = async (
  client: MongoClient,
  guild_id: string
): Promise<WithId<BotConfig> | null> => {
  const collection = client.db().collection<BotConfig>('bot_config');
  return collection.findOne({ guild_id });
};

export const getUserCountForAddress = async (
  client: MongoClient,
  address: string,
  discord_id: string,
  collectionName: string
): Promise<number> => {
  const collection = client.db().collection<User>(collectionName);
  return collection.count({address, _id: {$ne: discord_id}} as any) as any;
};

export const upsertUser = async (
  client: MongoClient,
  collectionName: string,
  user: User
): Promise<unknown> => {
  const collection = client.db().collection(collectionName);
  const { discord_id, ...rest } = user;
  const _id: any = user.discord_id;
  return collection.updateOne(
    { _id },
    { $set: { ...rest } },
    { upsert: true, ignoreUndefined: true }
  );
};

export const getUserCursorForCollection = async (
  client: MongoClient,
  collectionName: string
): Promise<FindCursor<WithId<User>>> => {
  const collection = client.db().collection<User>(collectionName);
  return collection.find({$or: [{reverifyTimestamp: {$exists: false}}, {reverifyTimestamp: {$lte: subMinutes(new Date(), 30)}}]},{noCursorTimeout:true});
};


export const insertMetadata = async (
  client: MongoClient,
  creator_address: string,
  collection_name: string,
  name: string, 
  metadata: object
): Promise<unknown> => {
  const collection = client.db().collection('aptos_metadata');
  return collection.insertOne(
    {creator_address, collection_name, name, metadata}
  );
};


export const getMetadataForNfts = async (
  client: MongoClient,
  collection_name: string,
  names: string[],
): Promise<any[]> => {
  const collection = client.db().collection<User>('aptos_metadata');
  return collection.find({collection_name, name: {$in: names}}).toArray();
};