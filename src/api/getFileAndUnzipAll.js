import axios from 'axios';
import * as url from "url";
import {openArray} from "zarr";

const fetch = require('node-fetch')
const zarrRemote = require('zarr-js')(fetch)
// import pako from 'pako';
// const http = require('http');
// const decompressResponse = require('decompress-response');

export async function getFileAndUnzipAll(DATASET, KEY, SUBFAMILIES) {
  const URL = DATASET[KEY];
  let response = await axios.get(URL).then(res => res.data);
  //console.log('response: ' + response);
  const result = { id: DATASET.id, body: response};

  return result;
}


export async function getZarrStatdata(FILE, SUBFAMILIES) {
    let zarr_url = FILE['Zarr'];
    if (!zarr_url.endsWith('/')){
        zarr_url += '/';
    }
    if (zarr_url.startsWith("s3://")) {
        zarr_url = zarr_url.replace("s3://", "https://s3-obs1.htcf.wustl.edu/");
    }

    const id = FILE['id'];
    let chunksizes = [[0, 0], [1, 0], [2, 0]];
    let dataname = 'subfam_stat';

    const z = await openArray({ store: zarr_url + 'subfam_stat'});

    const data_test = await z.get(null);
    const response = await fetch(zarr_url + '\.zattrs');
    const data = await response.json();
    const sub_stat_list = data['subfamily_stat'];


    const obj = {all: {}, unique:{}}
    let tmp_all = {};
    let tmp_uniq = {};
    for(let i=0; i<sub_stat_list.length; i++){
        tmp_all[sub_stat_list[i]] = data_test['data'][0][i];
        tmp_uniq[sub_stat_list[i]] = data_test['data'][1][i];
    }
    obj.all = {
        id,
        ...tmp_all
    }
    obj.unique = {
        id,
        ...tmp_uniq
    }
    return obj
}

export function reshapeZarrStatFormat(input) {
    const { id, body } = input;
    const subfamily = body[0];
    const ALL_RPKM = body[1];
    const UNI_RPKM = body[2];
    const length = subfamily.length;

    const objOutput = {
        all: {},
        unique: {}
    }
    let tmp_all = {};
    let tmp_uniq = {};

    for (var i = 1; i < subfamily.length; i++){
        tmp_uniq[subfamily[i]] = UNI_RPKM[i];
        tmp_all[subfamily[i]] = ALL_RPKM[i];
    }

    objOutput.all = {
        id,
        ...tmp_all
    }

    objOutput.unique = {
        id,
        ...tmp_uniq
    }

    return objOutput;
}


// function reshapeForResponse(input, SUBFAMILIES) {
//   const tmp = {

//   }
//   SUBFAMILIES.map(subfamily => {

//   })
// }

function responseParse(input, dataset, key) {
  const myArray = input.split('\n');
  // console.log(dataset)
  const parsedStringList = myArray.map(entry => responseParseRow(entry)).filter(d => d);
  const tmp = {}
  parsedStringList.forEach(item => {
      const { key, values } = item;
      tmp[key] = {...values};
  })
  return tmp;
}

function responseParseRow(input) {

  const myArray = input.split('\t');
if (myArray.length === 0) {
  return null;
}
var firstItem = myArray[0];
var lastItem = myArray[myArray.length - 1];

  const parsedItem = getJSON(lastItem);

  if (parsedItem !== null) {
      const { all_reads_RPKM, all_reads_RPM, unique_reads_RPKM, unique_reads_RPM, subfamily } = parsedItem;
      var objOutput = {
          key: firstItem,
          values : { all_reads_RPKM, all_reads_RPM, unique_reads_RPKM, unique_reads_RPM }
      };
      return objOutput;
  } 
      
  return null;
}

function getJSON(str) {
  try {
      return JSON.parse(str);
  } catch (error) {
      return null;
  }
}

