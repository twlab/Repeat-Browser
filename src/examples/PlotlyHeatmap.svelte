<script>
  import { onMount, afterUpdate, createEventDispatcher } from 'svelte';
  import { Cart } from '../stores/CartStore';
  import Plotly from 'plotly.js';
  let onlyData = undefined;
  let dataLabels;
  export let propsData;
  export let repeatLabels;
  export let scaleMax;
  export let TYPE;
  const dispatch = createEventDispatcher();

  onMount(() => {
    dataLabels = propsData[TYPE].map(d => d.id);
    onlyData = extractRequiredDataPoints(propsData, repeatLabels, TYPE);
    if (onlyData !== undefined) {
      $Cart.scale = Math.max(...[].concat(...onlyData));
      drawHeatMap(onlyData, repeatLabels, dataLabels, $Cart.scale);
    }
  })

  afterUpdate(() => {
      if (onlyData !== undefined) {
        drawHeatMap(onlyData, repeatLabels, dataLabels, scaleMax);
      }
  });

  function drawHeatMap(z, repeatLabels, dataLabels, scale_max) {
    let myPlot = document.getElementById('myDiv');
    const z_filtered = z.map(array => {
      let new_array = array.map(n => n || 0);
      return new_array
    });
    const zMax = Math.max(...[].concat(...z_filtered));

    const data = [
      {
        z: z,
        x: repeatLabels,
        y: dataLabels,
        type: 'heatmap',
        showscale: true,
        zauto: false,
        zmax: scaleMax,
        zmin: 0
      }
    ];

    Plotly.newPlot('myDiv', data,
            {
              modebar: {
                orientation: 'v',
              },
              responsive: true,
              margin: { l: 100, b: 50, r: 120, t: 20}},
            {displayModeBar: true, displaylogo: false});

    myPlot.on('plotly_click', function(data){
      var pts = {};
      for(var i=0; i < data.points.length; i++){
          pts.x = data.points[i].x;
          pts.y = data.points[i].y;
      }
      dispatch('heatmap-click', { data: pts.y, repeat: pts.x }); // TODO: a store should be informed about this click so the view can changed
    });
  }

  function extractRequiredDataPoints(DATA, repeats, TYPE) {
    const toReturn = DATA[TYPE].map(row => {
      let tmp = [];
      repeats.forEach(element => {
        tmp.push(row[element]);
      });
      return tmp;
    });

    if (toReturn[0].length === 0) {
      return undefined;
    } else {
      return toReturn;
    }
  }
</script>

<div>
  <div id="myDiv"></div>
</div>

