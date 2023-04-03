import axios from 'axios';
import * as dotenv from 'dotenv';
import { exit } from 'process';
import { getTokenDataForCreator } from '../../functions/src/aptos';
import { getMongoClient, insertMetadata } from '../../functions/src/mongodb';

dotenv.config();

const CREATOR_ADDRESS =
  '0x3a9e6f534d1038fe84bb9707795733b36c4041695158d591b616e5202067a321';

if (!process.env.MONGO_CONNSTR) {
  throw new Error('MONDO_CONNSTR is missing!');
}

const mongoClientPromise = getMongoClient();

if (!CREATOR_ADDRESS) {
  throw new Error('creatorAddress is missing!');
}

async function main() {
  console.log('process.env.API_KEY', process.env.API_KEY);
  const mongoClient = await mongoClientPromise;

  const tokenDatas = await getTokenDataForCreator(CREATOR_ADDRESS);

  if (!tokenDatas || tokenDatas.length === 0) {
    throw new Error('cant get valid token Data');
  }
  // if (extname(tokenDatas[0].metadata_uri) !== ".json") {
  //   throw new Error(
  //     `metadata_uri is not a json file: ${tokenDatas[0].metadata_uri}`
  //   );
  // }

  for (const [index, tokenData] of tokenDatas.entries()) {
    try {
      console.log(
        `${tokenData.collection_name} - ${index}/${tokenDatas.length}`
      );
      if (tokenData.metadata_uri.startsWith('ipfs')) {
        tokenData.metadata_uri = tokenData.metadata_uri.replace(
          /^ipfs?:\/\//,
          'https://aptosland.infura-ipfs.io/ipfs/'
        );
      }
      const getMetadataResult = await axios.get(tokenData.metadata_uri);
      if (getMetadataResult.status === 200) {
        insertMetadata(
          mongoClient,
          CREATOR_ADDRESS,
          tokenData.collection_name,
          tokenData.name,
          getMetadataResult.data
        );
      }
    } catch (error) {
      console.error(error);
    }
  }
  exit(0);
}

void main();
