<script lang="ts">
    import Modal from '../ui/Modal.svelte';
    import PivotTable from '../components/data-view/PivotTable.svelte';
    import defaultData from '../json/zarr_data_1027.json';
    // import defaultData from '../json/zarr_default_data.json';
    import IconButton from '@smui/icon-button';
    import { Label } from '@smui/button';
    import Fab from '@smui/fab';
    import { Icon } from '@smui/icon-button';
    import VirtualList from 'svelte-tiny-virtual-list';
    import Select, { Option } from '@smui/select';
    import {Cart} from "../stores/CartStore";
    import {onMount} from "svelte";
    // import defaultData from "../json/default_cart_data.json";
    import {getZarrParameters} from '../api/inputdata';
    import {dataTour} from "../api/toursteps"

    import { MenuComponentDev } from '@smui/menu';

    let menu: MenuComponentDev;
    let clicked = 'nothing yet';
    let upload_active = false;

    let cartData;
    let cartRepeats;

    let tmp_url='';
    let zarr_url;

    let files;

    let valueA=0;

    const assembly = ["hg38", "hg19", "mm10"];

    // $: if (files) {
    //     update_data();
    // }

    async function update_data(){
        const file = files[0]
        const json_content = await file.text().then(d => {
            const {data, repeats} = JSON.parse(d);
            Cart.addDataItems(data);
            Cart.addRepeats(repeats);
            alert(`The files and repeats Updated.`);
        });
    }

    const unsubscribe = Cart.subscribe(async store => {
        const { data, repeats } = store;
        cartData = data;
        cartRepeats = repeats;
    });

    function handleClick(data) {
        alert(`${data.id} (${data.Assay}) Uploaded.`)
    }

    async function setUn() {
        zarr_url = tmp_url;
        const data_json = await getZarrParameters(zarr_url).then(data => {
            handleClick(data);
            Cart.addDataItems([...new Set([...$Cart.data, data])]);
        });
    }

    onMount(() => {
        // unsubscribe();
    });

    let itemSize = 100;
    export let mode;
</script>

<div class="flex flex-wrap">
    <div class="flex flex-col justify-center" style="width: 67%">
        <div class="flex flex-col justify-center w-full px-4">
            <div class="bg-gray-200 block px-4 rounded-t shadow-lg bg-white w-full">
                <span class="text-gray-900 text-xl leading-tight font-medium py-2">Data Selection:</span>
                <div style="display: inline-flex; margin-left: 1rem; align-items: center;">
                    <div>
                        <Select bind:value={$Cart.assembly} label="Assembly Type">
                            {#each assembly as ass}
                                <Option value={ass} click:on={()=>Cart.setAssembly(ass)}>{ass}</Option>
                            {/each}
                        </Select>
                    </div>
                </div>
            </div>
            <div class="block p-4 rounded-b shadow-lg bg-white max-w-sm w-full" id="default-data-table">
                <Modal>
                    <PivotTable />
                </Modal>
            </div>
<!--            <DataSelectTable />-->
        </div>
    </div>

    <div class="flex flex-col " style="width: 33%; min-width: 340px;">
        <div class="bg-gray-200 block px-4 rounded-t shadow-lg w-full">
            <h5 class="text-gray-900 text-xl leading-tight font-medium py-2">Selected Data: {cartData.length}</h5>
        </div>
        <div class="max-w-sm rounded-b block shadow-lg">
            <div class="block rounded-t bg-white max-w-sm w-full px-4" id="data-file-virtualist">
                {#if cartData.length > 0}
                    <VirtualList
                        height={200}
                        width=100%
                        itemCount={cartData.length}
                        itemSize={60}>

                    <div slot="item" let:index let:style {style} class="row">
                        <span>
                            <IconButton class="material-icons" style="display: inline-block"
                                        on:click={() => Cart.addDataItems($Cart.data.filter(
                                    d => d.id !== cartData[index].id))}>
                            cancel</IconButton>
                            <span class="inline-block py-2">
<!--                                <p class="font-bold">File: {cartData[index].id}</p>-->
<!--                                <span class="text-xs">biosample-target</span>-->
                                {#if (cartData[index].Target == 'unknown')}
                                    <p class="font-bold text-xs">{cartData[index].Biosample}({cartData[index].Assay})</p>
                                {:else }
                                    <p className="font-bold text-xs">{cartData[index].Biosample}({cartData[index].Target})</p>
                                {/if}
<!--                                <p class="font-bold text-xs">{cartData[index].Biosample}({cartData[index].Assay})</p>-->
                                <span class="text-xs">Target: {cartData[index].Target}, ID: {cartData[index].id}</span>
                            </span>
                        </span>
                    </div>
                </VirtualList>
                {/if}
                <hr />
            </div>
            <div class="px-6 py-4">
                <h5 class="text-gray-900 text-xl font-medium mb-2">Data Selection</h5>
                <p class="text-gray-700 text-sm mb-4">
                    In this page, you can select the pre-processed data you interested in. <br>
                    1) Click the blue button in the table. <br>
                    2) Click the status button to select.
                </p>
                <a on:click={dataTour} class="inline-flex items-center cursor-pointer px-2 py-2 text-sm font-medium text-center text-white bg-lightBlue-600 rounded-lg hover:bg-lightBlue-900 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                    <i class="fa fa-fw fa-book pr-6 pl-2"></i>
                    Detailed Tour
                    <svg aria-hidden="true" class="w-4 h-4 ml-2 -mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                </a>
            </div>
        </div>
    </div>
</div>

<hr class="m-4">

<div class="flex justify-center w-full px-4">
    <Fab color="primary" on:click={() => {
        Cart.setSpecies(defaultData.biosample);
        Cart.addDataItems(defaultData.data);
        Cart.addRepeats(defaultData.repeats);
    }} extended ripple={false}>
        <Icon class="material-icons">refresh</Icon>
        <Label>Reset datasets and repeats as default</Label>
    </Fab>
</div>

<style>
    IconButton{
        float: right;
    }

    .row {
        padding: 0 0px;
        border-bottom: 1px solid #eee;
        box-sizing: border-box;
        /*line-height: 50px;*/
        font-weight: 500;
        background: #fff;
    }

    .actions label {
        padding: 10px 0;
        font-size: 18px;
        color: #999;
        font-family: -apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;
    }
</style>
