import { AptosClient, TokenClient } from 'aptos';
import axios from 'axios';
import { MongoClient } from 'mongodb';
import { getMetadataForNfts } from './mongodb';
import { Attribute } from './types';
const NODE_URL =
  process.env.APTOS_NODE_URL || 'https://fullnode.devnet.aptoslabs.com';

interface TokenData {
  creator_address: string;
  collection_name: string;
  name: string;
  metadata_uri: string;
}

export const getAptosTokenClient = (): TokenClient => {
  const client = new AptosClient(NODE_URL);
  const tokenClient = new TokenClient(client);
  return tokenClient;
};

export const getNumberOfNFTs = async (
  contractAddress: string,
  ownerAddress: string
): Promise<number> => {
  const API_KEY = process.env.API_KEY || 'DEV_API_KEY';
  try {
    const getTokensDataResult = await axios.get(
      `http://142.132.198.227:3100/token_count/${ownerAddress}/${contractAddress}`,
      { headers: { 'x-api-key': API_KEY } }
    );
    return parseInt(getTokensDataResult.data?.count, 10) ?? 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

export const getNumberOfStakedNFTs = async (
  accountAddress: string,
  ownerAddress: string,
  creatorAddress: string,
  stakeEvent: string,
  unstakeEvent: string
): Promise<number> => {
  const API_KEY = process.env.API_KEY || 'DEV_API_KEY';
  try {
    const getTokensDataResult = await axios.get(
      `http://142.132.198.227:3100/stake_count/${accountAddress}/${ownerAddress}/${creatorAddress}?stakeEvent=${stakeEvent}&unstakeEvent=${unstakeEvent}`,
      { headers: { 'x-api-key': API_KEY } }
    );
    return parseInt(getTokensDataResult.data, 10) ?? 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

const countUnique = (array: string[]) => {
  const counts: Record<string, number> = {};
  for (let i = 0; i < array.length; i++) {
    counts[array[i]] = 1 + (counts[array[i]] || 0);
  }
  return counts;
};

export const getStakedNFTs = async (
  accountAddress: string,
  ownerAddress: string,
  creatorAddress: string,
  stakeEvent: string,
  unstakeEvent: string
): Promise<{ name: string; collection_name: string }[]> => {
  const API_KEY = process.env.API_KEY || 'DEV_API_KEY';
  try {
    const getStakedNFTsResponse = await axios.get(
      `http://142.132.198.227:3100/stake_count/byEvent/${accountAddress}/${ownerAddress}/${creatorAddress}?event=${stakeEvent}`,
      { headers: { 'x-api-key': API_KEY } }
    );
    const getUnstakedNFTsResponse = await axios.get(
      `http://142.132.198.227:3100/stake_count/byEvent/${accountAddress}/${ownerAddress}/${creatorAddress}?event=${unstakeEvent}`,
      { headers: { 'x-api-key': API_KEY } }
    );

    if (
      !getStakedNFTsResponse?.data ||
      getStakedNFTsResponse?.data.length === 0
    ) {
      return [];
    }

    const collection_name = getStakedNFTsResponse?.data[0].collection_name;
    const stakedNames = getStakedNFTsResponse?.data.map(
      (item: any) => item.name
    );
    const unsatedNames = (getUnstakedNFTsResponse?.data ?? []).map(
      (item: any) => item.name
    );

    const stakedCount = countUnique(stakedNames);
    const unstakedCount = countUnique(unsatedNames);
    const stakedNFTs = [];

    for (const nftName of Object.keys(stakedCount)) {
      if (stakedCount[nftName] > (unstakedCount[nftName] ?? 0)) {
        stakedNFTs.push({ name: nftName, collection_name });
      }
    }
    return stakedNFTs;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getNumberOfNFTsWithAttributes = async (
  mongoClient: MongoClient,
  contractAddress: string,
  ownerAddress: string,
  attribute: Attribute | undefined,
  stakedNFTs: { name: string; collection_name: string }[] = []
): Promise<number> => {
  if (!attribute) {
    return 0;
  }
  const API_KEY = process.env.API_KEY || 'DEV_API_KEY';
  try {
    const getTokenOwnershipResult = await axios.get(
      `http://142.132.198.227:3100/token_ownership/${ownerAddress}/${contractAddress}`,
      { headers: { 'x-api-key': API_KEY } }
    );

    if (!Array.isArray(getTokenOwnershipResult.data)) {
      return 0;
    }
    const ownerShips = [
      ...stakedNFTs,
      ...(getTokenOwnershipResult?.data ?? []),
    ];
    const collectionName = ownerShips[0].collection_name;

    const nftNames = ownerShips.map((item) => item.name);
    const metadatas = await getMetadataForNfts(
      mongoClient,
      collectionName,
      nftNames
    );
    if (!metadatas || metadatas.length === 0) {
      return 0;
    }

    let nftCount = 0;

    for (const metadata of metadatas) {
      nftCount += metadata.metadata.attributes.filter(
        (item: any) =>
          item.trait_type.toLowerCase() === attribute.name.toLowerCase() &&
          item.value.toLowerCase() === attribute.value.toLowerCase()
      ).length;
    }

    return nftCount;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

export const getTokenDataForCreator = async (
  contractAddress: string
): Promise<TokenData[]> => {
  const API_KEY = process.env.API_KEY || 'DEV_API_KEY';
  try {
    const getTokensDatasResult = await axios.get(
      `http://142.132.198.227:3100/token_data/${contractAddress}`,
      { headers: { 'x-api-key': API_KEY } }
    );
    return getTokensDatasResult.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};
