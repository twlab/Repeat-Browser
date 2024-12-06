<script>
  import { onMount, afterUpdate, createEventDispatcher} from "svelte";
  import Plotly from "plotly.js";
  import {Cart} from '../stores/CartStore';

  export let consensusData;
  export let data;
  export let name;
  export let repeat;
  export let yrange;
  export let selectrange;
  export let index;

  const dispatch = createEventDispatcher();

  let userSelectedColor1 = '#b1c0e2';
  let userSelectedColor2 = '#c5a086';

  onMount(() => {
    const [all, unique] = consensusData;
    const trace1 = {
      y: all.map((d, i) => d.score),
      x: all.map((d, i) => i),
      fillcolor: userSelectedColor1,
      fill: "tonexty",
      type: "scatter",
      mode: "none",
      name: "All reads"
    };

    const trace2 = {
      y: unique.map((d, i) => d.score),
      x: unique.map((d, i) => i),
      fillcolor:userSelectedColor2,
      fill: "tozeroy",
      type: "scatter",
      mode: "none",
      name: 'Unique reads'
    };

    const layout = {
        modebar: {orientation: 'v'},
        margin: {r: 55, b: 30, t: 100},
            legend: {x: 0, y: 1},

        yaxis: {
            range: [0, yrange],
            linewidth: 100,
            ticklen: 100,
            tickangle: 180

        },
        title: `${repeat} - ${data}`
    };

    let _data = [trace1, trace2];
    let isHovered = false;
    function toggleHover() {
        isHovered = !isHovered;
    }

    Plotly.newPlot("area-div" + index, data, layout).then(chart => {
      chart.on('plotly_relayout', eventData => {
          const selectedRange = [eventData['xaxis.range[0]'], eventData['xaxis.range[1]']];
          dispatch('rangeupdate', { selectedRange });
      });
    });

  });

  function extractContentInBrackets(inputString) {
      const regex = /\((.*?)\)/g; // Match anything inside square brackets
      const matches = inputString.match(regex);

      if (matches) {
          return matches.map(match => match.slice(1, -1)); // Remove brackets
      } else {
          return [];
      }
  }

  function extractItemWithinBracket(inputString) {
      const regex = /([^\[]+)\[/; // Match the item before a left bracket
      const match = inputString.match(regex);

      if (match) {
          return match[1];
      } else {
          return null;
      }
  }

  function extractItemBeforeBracket(inputString) {
      const regex = /([^(]+)\(/; // Match the item before a left bracket
      const match = inputString.match(regex);

      if (match) {
          return match[1];
      } else {
          return null;
      }
  }

  const biosampleName = extractItemBeforeBracket(name);
  const extractedContent = extractContentInBrackets(name);
  const [assay, strand] = extractedContent;

  const mwLength = biosampleName.length + "px";


  afterUpdate(()=>{
          const [all, unique] = consensusData;
          const trace1 = {
                  y: all.map((d, i) => d.score),
                  x: all.map((d, i) => i),
                  fillcolor:userSelectedColor1,
                  fill: "tonexty",
                  type: "scatter",
                  mode: "none",
                  name: "All reads"
          };

          const trace2 = {
                  y: unique.map((d, i) => d.score),
                  x: unique.map((d, i) => i),
                  fillcolor:userSelectedColor2,
                  fill: "tozeroy",
                  type: "scatter",
                  mode: "none",
                  name: 'Unique reads'
          };

          const layout = {
                  height: 80,
                  margin: {r: 68, l:60, b: 10, t:5},
                  showlegend: false,
                  xaxis:{
                      showgrid: false,
                      zeroline: false,
                      showline: false,
                      ticks: '',
                      showticklabels: false,
                      range: selectrange
                  },
                  yaxis: {
                      showline: true,
                      nticks: 2,
                      tickvals: [0, yrange],
                      linewidth: 2,
                      ticklen: 5,
                      tickwidth: 2,
                      fixedrange: true,
                      // tickangle: 180,
                      range: [0, yrange]
                  },
                    hovermode: 'x unified',
                    title: false
          };

          let _data = [trace1, trace2];

          Plotly.newPlot("area-div" + index, _data, layout, {displayModeBar: false, displaylogo: false})
              .then(function(chartInstance) {
                  chartInstance.on('plotly_relayout', function(eventData) {
                      // console.log('Updated X-Axis Range:', eventData['xaxis.range[0]'], eventData['xaxis.range[1]']);
                      const selectedRange = [eventData['xaxis.range[0]'], eventData['xaxis.range[1]']];
                      dispatch('rangeupdate', { selectedRange });
                  });
              });
  })
</script>

<div style="display: flex; align-items: center; margin-bottom: 20px;">
    <label for="colorPicker1" style="margin-right: 5px;">Multi-mapped Reads: </label>
        <input id="colorPicker1" type="color" bind:value={userSelectedColor1}>
    <label for="colorPicker2" style="margin-right: 5px; margin-left: 10px;">Unique mapped Reads:</label>
        <input id="colorPicker2" type="color" bind:value={userSelectedColor2}>
</div>

<div style="display: flex; align-items: flex-start; padding: 3px; position: relative" class="border-b border-gray-400">
    <div style="flex: 1; padding-right: 5px; max-width: 65px; font-family:Helvetica Neue, Arial, sans-serif;
    font-size: 12px; font-weight: bold;">
        <div class="tooltip-container">
            <span>
                {biosampleName}<br>
                <span style="font-size: 10px;">{assay}</span><br>
                {#if strand}
                    ({strand})
                {/if}
            </span>

            <div class="tooltip">
                {data}
            </div>
        </div>
    </div>

    <div id={"area-div" + index} style="flex: 1; text-align: right;">
        <div class="absolute top-0 right-0">
            <i class="fa fa-fw fa-close pr-6 pl-2 cursor-pointer"
               on:click={() => Cart.updateConsensusTrack($Cart.consensuslist.filter(
                            d => d.fileId !== data))}></i>
        </div>
    </div>
</div>



<style>
    .tooltip-container {
        position: relative;
        display: inline-block;
    }

    .tooltip {
        position: absolute;
        bottom: 100%;
        left: 20px;
        /*transform: translateX(-50%);*/
        padding: 6px;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        font-size: 14px;
        border-radius: 4px;
        white-space: nowrap;
        display: none;
    }

    .tooltip-container:hover .tooltip {
        display: block;
    }
</style>


<!--<div id="area-divundefined" />-->
<!--<div id="area-div0" class="border-b">-->
<!--    `${repeat} - ${data}`-->
<!--</div>-->
<!--<div id="area-div1" class="border-b">-->
<!--    `${repeat} - ${data}`-->
<!--</div>-->

<!--<div id="area-div2" />-->
<!--<div id="area-div3" />-->
<!--<div id="area-div4" />-->
<!--<div id="area-div5" />-->



