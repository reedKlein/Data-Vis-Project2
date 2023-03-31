
// var options = {
//     radius : 12,
//     opacity: 0.5,
//     duration: 500
// };

// var hexLayer = L.hexbinLayer(options).addTo(map)
// hexLayer.colorScale().range(['white', 'blue']);

// hexLayer
//   .radiusRange([6, 11])
// 	.lng(function(d) { return d[0]; })
//   .lat(function(d) { return d[1]; })
//   .colorValue(function(d) { return d.length; })
//   .radiusValue(function(d) { return d.length; });

// var latFn = d3.randomNormal(center[0], 1);
// var longFn = d3.randomNormal(center[1], 1);

// var generateData = function(){
//     var data = [];
//     for(i=0; i<1000; i++){
//         data.push([longFn(),  latFn()]);
//     }
//     hexLayer.data(data);
// };

// map.addLayer(hexLayer);