<script>
    import {onMount, createEventDispatcher} from "svelte";
    import {fetchConsensusDatabyZarr} from "../components/consensus/utils";
    import Select, { Option } from '@smui/select';
    import { Cart } from '../stores/CartStore';

    let assays = ['DNA-seq', 'Cage-seq'];


    export let inputJson;

    const dispatch = createEventDispatcher();
    var hzome = ini_hzome();


    var about_string = 'Click the tile to navigate to the consensus view';

    async function clickTile(e){
        if ((d3.select(this).style('cursor') != 'not-allowed') && (d3.select(this).style('cursor') != 'pointer')){
            d3.select(this).style('cursor', 'wait');
        }
        const tag = e.row_name.split('-')[e.row_name.split('-').length-1];
        let dataID;
        let regex;
        if (!isNaN(tag)){
            regex = /\(([^)]+)\)/;
            // const tagInt = parseInt(tag);
            // dataID = $Cart['data'][tag-1].id;
        } else {
            regex = /\((.*?)\)/; // Regex pattern to match the word within brackets
        }
        const matches = e.row_name.match(regex)[1];
        const biosample = e.row_name.split(' (')[0];
        let tileFile = $Cart['data'].filter(x => (x.Assay == matches || x.Target == matches)
            && x.Biosample == biosample);
        dataID = tileFile[0].id;
        let eName = dataID;
        try{
            const tileData = d3.select(this)[0][0].__data__;
            const tileTE = tileData.col_name;
            let tileFile = $Cart['data'].filter(x => (x.Assay == matches || x.Target == matches)
                && x.Biosample == biosample);
            const res = await fetchConsensusDatabyZarr(tileFile, tileTE, 0);
            d3.select(this).style('cursor', 'pointer');
            // d3.select(this).on("click", clickTile);
            dispatch('tileClick', {data: eName, repeat: e.col_name, value: e.value, activate: true});
        } catch (e) {
            d3.select(this).style('cursor', 'not-allowed');
            dispatch('tileClick', {data: eName, repeat: e.col_name, value: e.value, activate: false});
            // d3.select(this).on("click", clickTile);
            // d3.select(this).on("click", ()=>{});
        }
        // dispatch('tileClick', {data: eName, repeat: e.col_name, value: e.value});
    }

    function make_clust(input_json){
        d3.json("/js/mult_view.json", function(n){
            const network_data = JSON.parse(input_json);
            // define arguments object
            var args = {
                root: '#container-id-1',
                'network_data': network_data,
                'about':about_string,
                'row_label_scale': 2,
                'col_label_scale': 1.4,
                'col_tip_callback':test_col_callback,
                'tile_tip_callback':test_tile_callback,
                'dendro_callback':dendro_callback,
                'matrix_update_callback':matrix_update_callback,
                'cat_update_callback': cat_update_callback,
                'sidebar_width':150,
            };

            resize_container(args);

            d3.select(window).on('resize',function(){
                resize_container(args);
                cgm.resize_viz();
            });
            let cgm = Clustergrammer(args);
            d3.select(cgm.params.root + ' .wait_message').remove();

            let tile = d3.selectAll('.row_tile')
                .on("click", clickTile);
        });
    }

    function matrix_update_callback(){

        if (genes_were_found[this.root]){
            enr_obj[this.root].clear_enrichr_results(false);
        }
    }

    function cat_update_callback(){
        console.log('callback to run after cats are updated');
    }

    function test_tile_callback(tile_data){
        var row_name = tile_data.row_name;
        var col_name = tile_data.col_name;
    }

    function test_col_callback(col_data){
        var col_name = col_data.name;
    }

    function dendro_callback(inst_selection){
        var inst_rc;
        var inst_data = inst_selection.__data__;

        // toggle enrichr export section
        if (inst_data.inst_rc === 'row'){
            d3.select('.enrichr_export_section')
                .style('display', 'block');
        } else {
            d3.select('.enrichr_export_section')
                .style('display', 'none');
        }
    }

    function resize_container(args){

        var screen_width = window.innerWidth / 1.3;
        var screen_height = window.innerHeight  - 20;

        d3.select(args.root)
            .style('width', screen_width+'px')
            .style('height', screen_height+'px');
    }

    onMount(()=>{
        make_clust(inputJson)
    })

</script>




<div class="flex flex-col justify-center w-full">
    <div class="bg-gray-200 block px-4 rounded-t shadow-lg bg-white max-w-sm w-full">
        <h5 class="text-gray-900 text-xl leading-tight font-medium py-2 px-4 inline-flex justify-between items-center w-full">
            <span>Heatmap (Species: {$Cart.biosample})</span>
            <div style="display: inline-flex; margin-left: 1rem; align-items: center;">
                <div>
                    <Select bind:value={$Cart.assay} label="Assay Type">
                        {#each assays as assay}
                            <Option value={assay}>{assay}</Option>
                        {/each}
                    </Select>
                </div>
            </div>
            <span style="margin-left: auto;">Click on a <b>Heatmap cell</b> to navigate to the next figures.</span>
        </h5>
    </div>

    <div class="p-6 block rounded-b shadow-lg bg-white max-w-sm w-full px-4">
        <div id='container-id-1'>
            <h1 class='wait_message'>Please wait ...</h1>
        </div>
    </div>
</div>