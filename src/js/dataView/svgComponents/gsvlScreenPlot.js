import * as d3 from "d3";
import _ from 'lodash';


console.log('d3', d3);

function gsvlScreenPlot(id, data, x_labels, y_labels, image_clicked)
{    // No mixed size support at this point!!!!!!!!!!!
    var _screen = {};

    var _tile_data = data.filter(Boolean), // (PlateGrids) Get rid of empty elements; make a copy
        _flat_data,                        // Flat PlateGrids - image visualisation
        _id = id,
        _x_labels = x_labels,
        _y_labels = y_labels,
        _statistics = [],
        _flat_statistics = [],
        _property,
        _mode = "Plate",
        _sort_property = null,
        _color_property = null,
        _selected_wells = [],
        _min = null,
        _max = null,
        _global_min = null,
        _global_max = null;

    var _current_parade_keys = []; // Parade "Add data" keys

    var _duration = 0;
    var div = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);
    var _color_scale_div = null;

    var _offset = 10,
        _aspect_ratio = 1.0,
        _size_x = 24,
        _size_y = _aspect_ratio * _size_x,
        _margin_x = 4,
        _margin_y = _margin_x,
        _thumbnail_offset = 2,
        _number_of_plates = data.length,
        _width = 2 * _offset + (_margin_x + _size_x) * data[0][0].length,
        _height = 2 * _offset + (_margin_y + _size_y) * data[0].length,
        _num_rows = data[0].length,
        _num_columns = data[0][0].length,
        _num_images = _num_rows * _num_columns,
        _render_thumbnails = false,
        _square_fill_color = "#bed5dc";

    _screen.image_clicked = image_clicked;

    var color = d3.scaleQuantize()
        .domain([0, 100])
        .range([
            "#3182bd", "#6baed6", "#9ecae1", "#c6dbef",
            "#fdd0a2", "#fdae6b", "#fd8d3c", "#e6550d"
        ]);

    var _counter = 0;
    d3.select(_id).append("svg");

    _screen._selected_wells = function(selected_wells) {
      if(!arguments.length) return _selected_wells;
      _selected_wells = selected_wells.filter(Boolean);
      return _screen;
    }

    _screen._color_property = function(property) {
      if(!arguments.length) return _color_property;
      _color_property = property;
      return _screen;
    };

    _screen._sort_property = function(property) {
      if(!arguments.length) return _sort_property;
      _sort_property = property;
      return _screen;
    };

    _screen.flatten_3Darray = function(array) {
      var flat_array = array.reduce(function(a, b) {
        return a.concat(b);
      });
      flat_array = flat_array.reduce(function(a, b) {
        return a.concat(b);
      });
      return flat_array;
    }

    _screen.render = function() {
      console.log("Render");
      _flat_data = this.flatten_3Darray(_tile_data);
      if (_mode == "Plate") {
        this._render_plates();
        if (_render_thumbnails) this._render_plate_thumbnails();
      }
      else if (_mode == "Image") {
        this._render_images();
      }
      else {
        console.log("Mode", _mode, "not supported");
      }

      if (_color_property != null) {
        this.scale_colors();
      }
      else {
        d3.select(_color_scale_div).text("");
        d3.select(_color_scale_div).selectAll("div.color_cell").remove();
      }

      if (_sort_property != null && _mode == "Image") {
        this._sort();
      }
      return _screen;
    }

    _screen._render_plate_thumbnails = function() {
      console.log("Render plates thumbnails");
      var rect = d3.select(_id).node().getBoundingClientRect();
      var plate_columns = Math.floor(rect.width / _width);
      if (plate_columns < 1) plate_columns = 1;
      var plate_rows = Math.ceil(_tile_data.length / plate_columns);

      var chart = d3.select(_id);
      var canvas = chart.select(_id + ">svg");
      var plates = canvas.selectAll(".plate");
      plates.selectAll(".image_row")
            .data(function (d,i) {return d;})
            .enter().append("svg:svg")
              .attr("class", "image_row");
      plates.selectAll(".row")
            .data(function (d) {return d;})
              .exit().remove();
      plates.selectAll(".row")
            .attr("index", function(d, i) {return i;});

      var rows = plates.selectAll(".row");
      rows.selectAll(".image")
          .data(function (d) { return d; })
          .enter().append("svg:image")
            .attr("class", "image");
      rows.selectAll(".cell")
          .data(function (d) {return d;})
            .exit().remove();
      rows.selectAll(".image")
          .attr("xlink:href", function(d) {
            var size = '/' + (_size_x - 2 * _thumbnail_offset) + '/';
            if (d != null) return d.thumb_url.replace('/64/', size);
            return "";
          })
          .attr("width", _size_x)
          .attr("height", _size_y)
          .attr("index", function(d, i, j) {
            var plate_index = parseInt(d3.select(this.parentNode.parentNode).node().attributes.index.value);
            return i + (j - plate_index * _num_rows) * _num_columns + plate_index * _num_images;
          })
          .attr("x", function(d, i, j) {return _offset + i * (_size_x + _margin_x);})
          .attr("y", function(d, i, j) {
            var offset_y = parseInt(d3.select(this.parentNode.parentNode).node().attributes.index.value);
            return _offset + (j - offset_y * _num_rows) * (_size_y + _margin_y);
          })
          .filter(function (d, i) {
            console.log(d["What happens here:", _color_property], _min, _max);
            return (d[_color_property] < _min || d[_color_property] > _max);
          })
          .attr("fill", _square_fill_color)
          .attr("xlink:href", "");
    }

    _screen._render_plates = function() {
      console.log("Render plates");
      var rect = d3.select(_id).node().getBoundingClientRect();
      var plate_columns = Math.floor(rect.width / _width);
      if (plate_columns < 1) plate_columns = 1;
      var plate_rows = Math.ceil(_tile_data.length / plate_columns)

      d3.select(_id)
          //.transition().duration(_duration)
          .attr("height", plate_rows * _height)
          .attr("width", function() {
              if (plate_columns == 1) return plate_columns * _width;
              return rect.width
          })
          .attr("style", "text-align:center");

      var chart = d3.select(_id);
      chart.select(_id + ">svg")
          .attr("class", "screen_canvas")
          //.transition().duration(_duration)
          .attr("width", plate_columns * _width)
          .attr("height", plate_rows * _height);

      var data;
      if ((_sort_property == null && _color_property == null)
          || _render_thumbnails || _statistics.length == 0)
      {
          data = _tile_data;
      } else {
          //data = _statistics;
          data = _.merge(_tile_data, _statistics);
      }

      if(_render_thumbnails) {
          console.log("Using Tile Data");
          data = _tile_data;
      }

      var canvas = chart.select(_id + ">svg");
      canvas.selectAll(".images").remove();
      if (!_render_thumbnails) canvas.selectAll(".image").remove();
      canvas.selectAll(".plate")
            .data(data)
            .enter().append("svg:g")
              .attr("class", "plate")
      canvas.selectAll(".plate")
            .data(data)
                .exit().remove();
      canvas.selectAll(".plate")
            .attr("id", function(d, i) {return "plateSvg_" + i;})
            .attr("index", function(d, i) {
              return i;
            })
            .attr("width", _width)
            .attr("height", _height)
            //.transition().duration(_duration)
            .attr("transform", function(d, i) {
              var row = Math.floor(i / plate_columns);
              var col = i % plate_columns;
              return "translate(" + col * _width + "," + row * _height + ")";
            });

      var plates = canvas.selectAll(".plate")
      plates.selectAll(".row")
            .data(function (d,i) {return d;})
            .enter().append("svg:g")
              .attr("class", "row");
      plates.selectAll(".row")
            .data(function (d) {return d;})
              .exit().remove();
      plates.selectAll(".row")
            .attr("index", function(d, i) {return i;});

      var rows = plates.selectAll(".row");
      rows.selectAll(".cell")
          .data(function (d) { return d; })
          .enter().append("svg:rect")
            .attr("class", "cell");
      rows.selectAll(".cell")
          .data(function (d) {return d;})
            .exit().remove();
      rows.selectAll(".cell")
          .attr("class", function(d) {
            if (d == null) return "cell";
            if (_selected_wells.includes(d.wellId)) {
              return "cell selected";
            } else {
              return "cell";
            }
          })
          .attr("id", function(d) {if (d == null) return null; return d.id;})
          .attr("index", function(d, i) {
            const j = parseInt(this.parentNode.attributes.index.value);
            var plate_index = parseInt(this.parentNode.parentNode.attributes.index.value);
            return i + (j - plate_index * _num_rows) * _num_columns + plate_index * _num_images;
          })
          .attr("width", _size_x)
          .attr("height", _size_y)
          .attr("index", function(d, i) {
            const j = parseInt(this.parentNode.attributes.index.value);
            var plate_index = parseInt(this.parentNode.parentNode.attributes.index.value);
            return i + (j - plate_index * _num_rows) * _num_columns + plate_index * _num_images;
          })
          .attr("x", function(d, i) {
            const j = parseInt(this.parentNode.attributes.index.value);
            return _offset + i * (_size_x + _margin_x);
          })
          .attr("y", function(d, i) {
            const j = parseInt(this.parentNode.attributes.index.value);
            var offset_y = parseInt(this.parentNode.parentNode.attributes.index.value);
            return _offset + (j - offset_y * _num_rows) * (_size_y + _margin_y);
          })
          .attr("fill", function(d) {
              if (d == null) return "transparent";
              return _square_fill_color;
          })
          .on('mouseover', function(d) {
              if (d == null) return;
              d3.select(this)
              var message = ""
              for (var attr in d) message += "<b>" + attr + ":</b> " + d[attr] + "<br>";
              div.transition()
                 .duration(500)
                 .style("opacity", .9);
              div.html(message)
                 .style("left", (d3.event.x) + "px")
                 .style("top", (d3.event.y - 28) + "px");
          })
          .on('mouseout', function() {
              d3.select(this)
              div.transition()
                  .duration(500)
                  .style("opacity", 0);
          })
          .on(
            'click', function(d, event) {
              if (d == null) return;
              _screen.image_clicked(d, event);
          });
    };

    _screen._render_images = function() {
      console.log("Render images");
      var rect = d3.select(_id).node().getBoundingClientRect();
      var image_columns = Math.floor(rect.width / (_size_x + _margin_x));
      if (image_columns < 1) image_columns = 1;
      var image_rows = Math.ceil(_number_of_plates * _num_images / image_columns);

      d3.select(_id)
          .attr("style", "text-align:center")
          .attr("height", image_rows * (_size_y + _margin_y))
          //.transition().duration(_duration)
          .attr("width", function() {
            if (image_columns == 1) return _margin_x + image_columns * (_size_x + _margin_x);
            return rect.width
          });

      var chart = d3.select(_id);
      chart.select(_id + ">svg")
          .attr("class", "screen_canvas")
          .attr("height", _margin_y + image_rows * (_size_y + _margin_y))
          //.transition().duration(_duration)
          .attr("width", _margin_x + image_columns * (_size_x + _margin_x));

      var canvas = chart.select(_id + ">svg")
      canvas.selectAll(".plate").remove();

      var data;
      if ((_sort_property == null && _color_property == null)
          || _statistics.length == 0)
      {
          data = _flat_data.filter(function(d) {return d !== null});
          console.log("data:flat_data", data, _flat_data);
      } else {
          data = _flat_statistics.filter(function(d) {return d !== null});
          console.log("data:flat_stats", data, _flat_statistics);
      }

      canvas.selectAll(".images")
              .data(data)
          .enter().append("svg:rect")
              .attr("class", "images");
      canvas.selectAll(".images")
              .data(data)
          .exit().remove();
      canvas.selectAll(".images")
          .filter(function (d, i) {
              return (d[_color_property] < _min || d[_color_property] > _max)
          }).remove();

      if (_sort_property != null) {
        canvas.selectAll(".images")
          .filter(function (d, i) {
            return (d[_sort_property] == null)
          }).remove();
      }

      var filtered_no_images = canvas.selectAll(".images")[0].length;
      if (filtered_no_images != _number_of_plates * _num_images) {
          var filtered_image_rows = Math.ceil(filtered_no_images / image_columns);
          console.log("new height", filtered_image_rows, filtered_image_rows * (_size_y + _margin_y));
          d3.select(_id).attr("height",  filtered_image_rows * (_size_y + _margin_y));
          chart.select(_id + ">svg").attr("height",  filtered_image_rows * (_size_y + _margin_y));
      }

      canvas.selectAll(".images")
          .attr("index", function(d, i) {
              return i;
          })
          .attr("x", function(d, i) {
              return _margin_x + (i % image_columns) * (_size_x + _margin_x);
          })
          .attr("y", function(d, i) {
              return _margin_y + Math.floor(i / image_columns) * (_size_y + _margin_y);
          })
          .attr("width", _size_x)
          .attr("height", _size_y)
          .attr("fill", function(d) {
              if (d == null) return "transparent";
              return _square_fill_color;
          })
          .attr("stroke", '#555')
          .attr("stroke-width", '0.2')
          .on('mouseover', function(d) {
              if (d == null) return;
              d3.select(this)
                  .style('stroke', '#0F0')
                  .style('stroke-width', '1');
              var message = ""
              for (var attr in d) message +=  "<b>" + attr + ":</b> " + d[attr] + "<br>";
              div.transition()
                  .duration(1000)
                  .style("opacity", .9);
              div.html(message)
                  .style("left", (d3.event.x) + "px")
                  .style("top", (d3.event.y - 28) + "px");
          })
          .on('mouseout', function() {
              d3.select(this)
                  .style('stroke', '#555')
                  .style('stroke-width', '0.2');
              div.transition()
                  .duration(500)
                  .style("opacity", 0);
          })
          .on('click', function(d) {
            if (d == null) return;
            _screen.image_clicked(d, event);
          })
    }

    var compare = function (a, b) {
      return a[_sort_property] < b[_sort_property]?-1:1;
    };

    _screen._sort = function() {
      console.log("Sort");
      if (_mode == "Plate") {
        alert("Sorting available only in Image mode");
        return;
      }
      var rect = d3.select(_id).node().getBoundingClientRect();
      var image_columns = Math.floor(rect.width / (_size_x + _margin_x));

      var chart = d3.select(_id)
      var canvas = chart.select(_id + ">svg")

      var check = canvas.selectAll(".images")
                        .filter(function(d) {return d[_sort_property] != null })
                        .sort(compare);
      canvas.selectAll(".images")
        .attr("x", function(d, i) {
          var x = _margin_x + (i % image_columns) * (_size_x + _margin_x);
          return _margin_x + (i % image_columns) * (_size_x + _margin_x);
        })
        .attr("y", function(d, i) {
          return _margin_y
                + Math.floor(i / image_columns)
                * (_size_y + _margin_y);
        })
        .filter(function(d) {return d[_sort_property] == null })
          .attr("fill", "red");
      return;
    };

    _screen._tile_data = function(data) {
        if(!arguments.length) return _tile_data;
        _tile_data = data.filter(Boolean);
        return _screen;
    }

    _screen._mode = function (mode) {
        if(!arguments.length) return _mode;
        _mode = mode;
        return _screen;
    }

    _screen.change_mode = function(mode) {
        console.log("Change mode", mode);
        this._mode(mode).render();
    }

    _screen.scale_colors = function() {
        console.log("Scale colors");
        if (_min == null || _max == null) {
            this.set_color_scale();
        }
        if (_color_scale_div != null) this._render_color_scale_div();
        var chart = d3.select(_id);
        var canvas = chart.select(_id + ">svg");
        if (_mode == "Image") {
          canvas.selectAll(".images")
            .attr("fill",  function(d) {
              if (d == null) {
                //return 'transparent';
                return 'green';
              } else {
                if (color(d[_color_property]) == "#NaNNaNNaN")
                {
                  return _square_fill_color;
                  return 'red';
                }
                return color(d[_color_property]);
              }
          });
        }
        if (_mode == "Plate") {
            var plates = canvas.selectAll(".plate");
            var rows = plates.selectAll(".row");
            rows.selectAll(".cell")
                .attr("fill",  function(d) {
                    if (d == null) {
                      return 'green';
                      // return 'transparent';
                    } else {
                        if (color(d[_color_property]) == "#NaNNaNNaN") {
                          return 'red';
                          return _square_fill_color;
                        }
                        if (d[_color_property] < _min) {
                          return 'black';
                        }
                        if (d[_color_property] > _max) {
                          return 'white';
                        }
                        return color(d[_color_property]);
                    }
                })
              /*
                .filter(function (d, i) {
                    if (d == null) return false;
                    return (d[_color_property] < _min || d[_color_property] > _max);
                })
                    .attr("fill", _square_fill_color);
              */
        }
    }
    _screen.set_color_scale = function(min, max, render) {
      console.log("Set color scale", min, max, render);
      var data;
      if (_statistics.length == 0) {
        data = _tile_data;
      } else {
        data = _statistics;
      }
      if(!arguments.length) {
        _global_max = d3.max(data, function(data) {
          return d3.max(data, function(array) {
            return d3.max(array, function(d) {
              if (d == null) {
                return null
              };
              return d[_color_property];
            })
          })
        });
        _global_min = d3.min(data, function(data) {
          return d3.min(data, function(array) {
            return d3.min(array, function(d) {
              if (d == null) {
                return null
              };
              return d[_color_property];
            })
          })
        });
        _min = _global_min;
        _max = _global_max;
      }
      else {
        _max = max;
        _min = min;
      }
      console.log([_global_min, _global_max],[_min, _max]);
      color = d3.scaleLinear()
                .domain([_min, _min + 0.5 * (_max - _min), _max])
                .range(["#5f013e", "#dd65af", "white"]);
      if (render) this.render();
    }

    _screen.get_color_scale = function() {
        console.log("Get color scale");
        return [_min, _max];
    }

    _screen._render_color_scale_div = function () {
      console.log("Render color scale div");
      d3.select(_color_scale_div)
          .style("vertical-align", "middle");
      d3.select(_color_scale_div).selectAll("*").remove();
      d3.select(_color_scale_div).append("div")
          .attr("id", "_min_value")
          .style("padding", "8px")
          .style("display", "inline-block")
          .text(_min.toFixed(2));
      d3.select(_color_scale_div).append("div")
          .attr("id", "scale_bar_holder")
          .style("display", "inline-block")
          .style("width", "150px")
          .style("height", "10px")
          .append("div").attr("id", "scale_bar");
      $("#scale_bar").slider({
          range: true,
          min: _global_min,
          max: _global_max,
          values: [ _min, _max ],
          change: function( event, ui ) {
              _screen.set_color_scale(ui.values[0],  ui.values[1], true);
          }
      });
      d3.select(_color_scale_div).append("div")
          .attr("id", "_min_value")
          .style("padding", "8px")
          .style("text-align", "right")
          .style("display", "inline-block")
          .text(_max.toFixed(2));
      d3.select(".ui-slider-horizontal")
          .style("background", "linear-gradient(left, #ffffff 0%,#000000 100%)");
      //var data = [];
      //var number_of_colors = 30;
      //var color_step = (_max - _min) / number_of_colors;
      //for (var i = _min; i < _max; i += color_step) data.push(i);
      //d3.select(_color_scale_div).text("Color scale: " + _min.toFixed(2) + " ");
      //d3.select(_color_scale_div).selectAll("div.color_cell")
      //  .data(data)
      //  .enter()
      //        .append("div")
      //            .classed("color_cell", true)
      //        .append("span");
      //d3.select(_color_scale_div).selectAll("div.color_cell")
      //        .data(data)
      //    .exit().remove();

      //d3.select(_color_scale_div).selectAll("div.color_cell")
      //        .data(data)
      //    .style("display", "inline-block")
      //    .style("width", "3px")
      //    .style("height", "15px")
      //    .style("vertical-align", "middle")
      //     .style("background-color", function(d){
      //        return color(d)
      //     })
      //    .select("span")
      //    .text(function(d) {if (d == 0) return _min; if (d == number_of_colors) return _max;});
      //d3.select(_color_scale_div).append("div").style("padding", "2px").style("display", "inline-block").text(_max.toFixed(2));
    }

    _screen.set_color_scale_div = function(div_id) {
      console.log("Set color scale div", div_id);
      _color_scale_div = div_id;
    }

    _screen.change_tile_size = function(size) {
      console.log("Change tile size", size);
      if(!arguments.length) return [_size_x, _size_y];
      if (size === undefined) return;
      _size_x = size;
      _size_y = _aspect_ratio * _size_x;
      _width = 2 * _offset + (_margin_x + _size_x) * _num_columns;
      _height = 2 * _offset + (_margin_y + _size_y) * _num_rows;
      this.render();
      return _screen;
    }
    _screen.change_margin_size = function(size) {
        if(!arguments.length) return [_margin_x, _margin_y];
        if (size === undefined) return;
        console.log("Change margin size", size);
        _margin_x = size;
        _margin_y = _margin_x;
        _width = 2 * _offset + (_margin_x + _size_x) * _num_columns;
        _height = 2 * _offset + (_margin_y + _size_y) * _num_rows;
        this.render();
        return _screen;
    }

    _screen.change_aspect_ratio = function(size) {
        if(!arguments.length) return _aspect_ratio;
        if (size === undefined) return;
        console.log("Change aspect ratio size", size);
        _aspect_ratio = size;
        _size_y = _aspect_ratio * _size_x;
        _width = 2 * _offset + (_margin_x + _size_x) * _num_columns;
        _height = 2 * _offset + (_margin_y + _size_y) * _num_rows;
        this.render();
        return _screen;
    }

    _screen.change_offset_size = function(size) {
        if(!arguments.length) return _offset;
        if (size === undefined) return;
        console.log("Change offset size", size);
        _offset = size;
        _width = 2 * _offset + (_margin_x + _size_x) * _num_columns;
        _height = 2 * _offset + (_margin_y + _size_y) * _num_rows;
        this.render();
        return _screen;
    }

    _screen.change_color_property = function(property) {
        console.log("Change color property", property);
        this._color_property(property);
        this.set_color_scale();
        if (_sort_property == null || property == null) {
            this.render();
        } else {
            this.scale_colors();
        }
        this.scale_colors();
        this.render();
    };

    _screen.change_sort_property = function(property) {
        console.log("Change sort property", property);
        this._sort_property(property);
        if (_color_property == null || property == null) {
            this.render();
        } else {
            this._sort();
            this.render();
        }
        this.render();
    }

    _screen.change_statistics = function(statistics) {
        console.log("Change statistics", statistics);
        _statistics = statistics.slice(0);
        _flat_statistics = this.flatten_3Darray(_statistics);
        this.render();
    }

    _screen.change_parade_analytics = function(analytics) {
      const analytics_keys = Object.keys(analytics);
      for (let i = 0; i < analytics_keys.length; i++) {
        if (!_current_parade_keys.includes(analytics_keys[i])) {
          _current_parade_keys.push(analytics_keys[i]);
          for (let p = 0; p < _tile_data.length; p++) {
            for (let r = 0; r < _tile_data[p].length; r++) {
              for (let c in _tile_data[p][r]) {
                if (_tile_data[p][r][c] === undefined || _tile_data[p][r][c] == null) continue;
                const imageId = _tile_data[p][r][c].id
                _tile_data[p][r][c][analytics_keys[i]] = 
                  analytics[analytics_keys[i]].data[imageId];
              }
            }
          }
        }
      }
      this.render();
    }

    _screen.render_thumbnails = function(render_thumbnails) {
        if(!arguments.length) return _render_thumbnails;
        _render_thumbnails = render_thumbnails;
        _square_fill_color = "#bed5dc";
        //if (_render_thumbnails) _square_fill_color = "transparent";
        this.render();
    }

    window.onresize = function() {_screen.render();};
    return _screen;
}

export default gsvlScreenPlot