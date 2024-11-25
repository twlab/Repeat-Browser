<script>
    import Plotly from "plotly.js-dist";
    import pako from "pako";
    import {afterUpdate} from "svelte";
    import Select, { Option } from '@smui/select';
    import { Cart } from '../stores/CartStore';
    import {pickle} from "../../scripts/pickle.js";

    export let enrichmentInput;
    let isDropdownDisabled = false;
    let enrichType;
    const enrichmentTypeArray = ["ChIP-Seq", "CAGE-Seq", "Others"]

    async function loadIndex(indexUrl) {
        const response = await fetch(indexUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch index file: ${response.statusText}`);
        }
        const indexData = await response.json();
        return indexData.reduce((acc, entry) => {
            acc[entry.id] = entry;
            return acc;
        }, {});
    }

    async function fetchPartialBinaryData(url, offset, length) {
        const headers = new Headers();
        headers.append('Range', `bytes=${offset}-${offset + length - 1}`);

        const response = await fetch(url, { headers });
        if (!response.ok && response.status !== 206) { // 206 is the status for partial content
            throw new Error(`Failed to fetch binary file range: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    }

    async function queryDataById(dataId, binaryUrl, indexUrl) {
        // Load the index file from the remote URL
        const indexData = await loadIndex(indexUrl);

        // Check if the data_id exists in the index
        const entry = indexData[dataId];
        if (!entry) {
            throw new Error(`ID '${dataId}' not found in the index.`);
        }
        // Fetch the relevant part of the binary file
        const binaryItem = await fetchPartialBinaryData(binaryUrl, entry.offset, entry.length);

        // Decompress the fetched part
        let decompressedData = pako.inflate(binaryItem, { to: 'string' });

        // Replace NaN and undefined with null in the JSON string
        decompressedData = decompressedData.replace(/NaN|undefined/g, "null");

        // Deserialize the string back into the original data structure
        const result = JSON.parse(decompressedData);

        return result;
    }

    function sortEnrichment(enrichmentObj, topN, filterSimple){
        // Step 1: Filter the object to include only keys that end with ")n"
        if(filterSimple){
            enrichmentObj = Object.fromEntries(
                Object.entries(enrichmentObj).filter(([key, value]) => !key.endsWith(')n'))
            );
        }

        // Step 2: Convert the object to an array of key-value pairs
        const objArray = Object.entries(enrichmentObj);

        // Step 3: Sort the array by the value (second element in each pair)
        const sortedArray = objArray.sort((a, b) => b[1] - a[1]);

        // Step 4: Get the top 100 items (or fewer if there are less than 100)
        const topNArray = sortedArray.slice(0, topN);

        // Step 5: Create the x and y arrays for the Plotly data structure
        const x = topNArray.map(([key, value]) => key);
        const y = topNArray.map(([key, value]) => value);

        // Step 6: Format the data as required
        const data = [
            {
                x: x,
                y: y,
                type: 'bar'
            }
        ];

        return data;
    }

    async function runQuery(queryID, queryType, queryAssay) {
        // console.log($Cart.biosample, enrichType);
        let species;
        if($Cart.biosample === "Human"){
            species = "hg";
        } else if($Cart.biosample === "Mouse") {
            species = "mm";
        } else {
            species = "hg";
        }
        let assayType;
        if((enrichType === "ChIP-Seq" && queryAssay === "")  || queryAssay.includes("Ch")){
            assayType = "ChIP";
            enrichType = "ChIP-Seq";
        } else if((enrichType === "CAGE-Seq" && queryAssay === "") || (queryAssay.includes("CAGE") || queryAssay.includes("RNA"))){
            assayType = "CAGE";
            enrichType = "CAGE-Seq";
        } else if((enrichType === "Others" && queryAssay === "") || (queryAssay.includes("DNa") || queryAssay.includes("ATAC"))){
            assayType = "DNase_ATAC";
            enrichType = "Others";
        }
        if(queryType === "TF"){
            isDropdownDisabled = true;
        } else {
            isDropdownDisabled = false;
        }

        const binaryUrl = `https://s3-obs1.htcf.wustl.edu/repeatbrowser/precomputedEnrichment/${queryType}_key_${species}_${assayType}.bin.gz`;
        const indexUrl = `https://s3-obs1.htcf.wustl.edu/repeatbrowser/precomputedEnrichment/${queryType}_key_${species}_${assayType}_index.json`;
        const dataId = queryID;

        let enrichmentObj
        try {
            enrichmentObj = await queryDataById(dataId, binaryUrl, indexUrl);
            // console.log(`Data for ID '${dataId}':`, result);
        } catch (error) {
            // console.error('Error querying data:', error);
        }

        const top100Obj = sortEnrichment(enrichmentObj, 100, true);

        return top100Obj;
    }

    // Layout configuration


    afterUpdate(async ()=>{
        const enrichmentData = await runQuery(enrichmentInput.id, enrichmentInput.type, enrichmentInput.assay);
        const layout = {
            autosize: true,            // Let the plot automatically size itself
            margin: { l: 30, r: 0, t: 0, b: 120 }  // Set margins to 0
        };
        Plotly.newPlot('enrichmentDiv', enrichmentData, layout);
    })

    // Plotly.newPlot('enrichmentDiv', data);
</script>

<div class="flex flex-col justify-center px-4 my-4 mx-auto" style="width: 80%">
    <!-- Container for h5 and dropdown aligned in the same line with the dropdown on the right -->
    <div class="flex items-center justify-between py-2">
        <h5 class="text-gray-900 text-xl leading-tight font-medium">
            TE/TF Enrichment Distribution: {enrichmentInput.id}
        </h5>
        <div>
            <Select bind:value={enrichType} label="Enrichment Assay Type" disabled={isDropdownDisabled}>
                {#each enrichmentTypeArray as type}
                    <Option value={type}>{type}</Option>
                {/each}
            </Select>
        </div>
    </div>

    <!-- Enrichment Div -->
    <div id="enrichmentDiv" class="mt-4"></div>
</div>
