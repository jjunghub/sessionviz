import * as React from "react";
import * as d3 from "d3";
import style from "./TagNetwork.css";

// import * as classNames from "classnames/bind";
// const cx = classNames.bind(style);
const cx = text => "tag-" + text;

class TagNetwork extends React.Component {
  static defaultProps = {
    view: "trending"
  };

  view = "trending";
  simulation = undefined;

  selectColor = "DeepPink";
  highlightColor = "CornflowerBlue";

  rawname = {
    trending: "n_2018",
    famous: "n_2018",
    new: "n_2018"
  };

  selectTag = undefined; //{ id: "hehe", color: "pink" };

  nodes = [];
  links = [];
  sessionTags = [];
  majorNodes;
  n_group = 1;
  size = { width: 0, height: 0 };
  svg = undefined;
  colorScale = undefined;
  linkOpacity = undefined;
  highlight_brightness = [0.05];
  nomarl_brightness = [0];
  stroke_brightness = [0];

  dataProcessing = () => {
    const { sessionTags } = this.props;

    // this.nodes = this.props.data[this.view].nodes.map(d => d);
    // //IMPORTANT! must hard copy.
    // this.links = JSON.parse(JSON.stringify(this.props.data[this.view].links));

    // only one view
    this.nodes = this.props.data.nodes.map(d => d);
    //IMPORTANT! must hard copy.
    this.links = JSON.parse(JSON.stringify(this.props.data.links));

    this.sessionTags = sessionTags;
    this.n_group = d3.max(this.nodes, d => d.modularity) + 1;

    console.log(this.nodes, this.links);
  };

  radialBatch = () => {
    return (
      d3
        .forceSimulation(this.nodes)
        .force(
          "link",
          d3
            .forceLink(this.links)
            .id(d => d.id)
            .strength(0.0001)
          // .distance(100)
        )
        .force(
          "radial",
          d3
            .forceRadial(
              d => {
                if (d.modularity === 0) {
                  return 0;
                } else {
                  return this.getBaseRadius(this.size);
                }
              },
              this.size.width / 2,
              this.size.height / 2
            )
            .strength(0.1)
        )
        .force(
          "collision",
          d3
            .forceCollide()
            .radius(d => d.radius + 1)
            .strength(0.1)
        )
        // .force("charge", d3.forceManyBody().strength(-100))
        .force("cluster", this.force_cluster().strength(1))
    );
  };

  // Move d to be adjacent to the cluster node.
  // from: https://bl.ocks.org/mbostock/7881887
  force_cluster = () => {
    let nodes;
    let strength = 0.1;

    const force = alpha => {
      // scale + curve alpha value
      alpha *= strength * alpha;
      nodes.forEach(d => {
        let cluster = this.majorNodes[d.modularity];
        if (cluster === d) {
          return;
        }

        let x = d.x - cluster.x;
        let y = d.y - cluster.y;
        let l = Math.sqrt(x * x + y * y);
        let r = d.radius + cluster.radius;

        if (l !== r) {
          l = ((l - r) / l) * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          cluster.x += x;
          cluster.y += y;
        }
      });
    };

    force.initialize = _ => {
      nodes = _;
    };

    force.strength = _ => {
      strength = _ == null ? strength : _;
      return force;
    };
    return force;
  };

  initNodeSizeLocation = (size, R) => {
    const size_factor = this.rawname[this.view];
    const base_radius = this.getBaseRadius(size);

    const rScale = d3
      .scaleLinear()
      .domain(
        d3.extent(
          this.nodes.filter(d => !d.id.includes(this.props.sessionTags)),
          d => Math.sqrt(d[size_factor])
        )
      )
      .range([R.min, R.max]);

    this.nodes = this.nodes.map(d => {
      if (d.modularity === 0) {
        return {
          ...d,
          x: size.width / 2 + Math.random(),
          y: size.height / 2 + Math.random(),
          // radius: rScale(Math.sqrt(d[size_factor]))
          radius: R.min
        };
      } else {
        return {
          ...d,
          x:
            Math.cos(((d.modularity - 1) / (this.n_group - 1)) * 2 * Math.PI) *
              base_radius +
            size.width / 2 +
            Math.random(),
          y:
            Math.sin(((d.modularity - 1) / (this.n_group - 1)) * 2 * Math.PI) *
              base_radius +
            size.height / 2 +
            Math.random(),
          radius: rScale(Math.sqrt(d[size_factor]))
        };
      }
    });

    //각 클러스터별 가장 큰 노드 구하기
    this.majorNodes = new Array(this.n_group);
    this.nodes.forEach(d => {
      let group = d.modularity;
      if (!this.majorNodes[group] || d.radius > this.majorNodes[group].radius) {
        this.majorNodes[group] = d;
      }
    });
  };

  rainbow = t => {
    let c = d3.cubehelix();

    if (t < 0 || t > 1) t -= Math.floor(t);
    let ts = Math.abs(t - 0.5);
    c.h = 360 * t - 100;
    c.s = 1.5 - 1.5 * ts;
    c.l = 0.8 - 0.9 * ts;
    return c + "";
  };

  sinebow = t => {
    let c = d3.rgb(),
      pi_1_3 = Math.PI / 3,
      pi_2_3 = (Math.PI * 2) / 3;

    if (t === 0) {
      c.r = 150;
      c.g = 150;
      c.b = 150;
    } else {
      let x;
      t = (0.5 - t) * Math.PI;
      c.r = 255 * (x = Math.sin(t)) * x;
      c.g = 255 * (x = Math.sin(t + pi_1_3)) * x;
      c.b = 255 * (x = Math.sin(t + pi_2_3)) * x;
    }

    return c + "";
  };

  getBaseRadius = size => {
    return (Math.min(size.height, size.width) * 3) / 8;
  };

  getColor = (modularity, type = "normal") => {
    if (type === "normal") {
      return d3.hsl(this.colorScale(modularity)).brighter([0.9]);
    } else if (type === "bright") {
      return d3.hsl(this.colorScale(modularity)).brighter([0.3]);
    } else if (type === "brighter") {
      return d3.hsl(this.colorScale(modularity)).brighter([0.5]);
    } else if (type === "click") {
      return d3.hsl(this.colorScale(modularity)).brighter([0.8]);
    }
    // rainbow
    // return d3.hsl(this.colorScale(modularity)).brighter([0.8]);
    // return d3.hsl(this.colorScale(modularity)).brighter([1.3]);
    // return d3.hsl(this.colorScale(modularity)).brighter([1]);
  };
  draw = () => {
    this.svg = d3.select("#" + this.props.rootId).select("svg");
    this.size = {
      height: parseFloat(this.svg.node().clientHeight),
      width: parseFloat(this.svg.node().clientWidth)
    };
    const linkwidth = {
      min: 1,
      max: 2
    };

    const R = {
      min: 5,
      max: 30
    };
    this.initNodeSizeLocation(this.size, R);

    const wd_max = d3.max(this.nodes, d => d.weight_degree);
    const widthScale = d3
      .scaleLog()
      .domain(d3.extent(this.links, d => d.weight))
      .range([linkwidth.min, linkwidth.max]);

    // const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    this.colorScale = d3
      // .scaleSequential(d3.interpolateSpectral)
      // .scaleSequential(d3.interpolateSinebow)
      .scaleSequential(this.sinebow)
      .domain([0, d3.max(this.nodes, d => d.modularity) + 1]);
    // .domain([d3.max(this.nodes, d => d.modularity) + 1, -3]);

    this.linkOpacity = d3
      .scaleLinear()
      .domain(d3.extent(this.links, d => d.weight))
      .range([0.15, 1]);

    const linkColor = d3
      .scaleSequential(d3.interpolatePuBuGn)
      .domain(d3.extent(this.links, d => d.weight));

    let figure_node = this.svg
      .select("g." + cx("nodes"))
      .selectAll("circle")
      .data(this.nodes);

    const padding = 5;

    figure_node
      .enter()
      .append("circle")
      .on("mouseover", d => this.cursorOn(d))
      .on("mouseout", outD => this.cursorOut(outD))
      .on("click", d => this.onClickNode(d))
      .merge(figure_node)
      // .transition()
      // .duration(1000)
      .interrupt()
      .attr("r", d => d.radius)
      .style(
        "fill",
        d => this.getColor(d.modularity)
        // d => d3.hsl(this.colorScale(d.modularity)).brighter([0.8])
        // .brighter([0.5])
        // d3.hsl(this.colorScale(d.modularity)).brighter(this.nomarl_brightness)
      )
      .style("fill-opacity", "0.95")
      .style("stroke-opacity", "0.9")
      .attr(
        "cx",
        d =>
          (d.x = Math.max(
            d.radius + padding,
            Math.min(this.size.width - d.radius - padding, d.x)
          ))
      )
      .attr(
        "cy",
        d =>
          (d.y = Math.max(
            d.radius + padding,
            Math.min(this.size.height - d.radius - padding, d.y)
          ))
      )
      .style(
        "stroke",
        d => d3.color(this.colorScale(d.modularity))
        // d3.hsl(this.colorScale(d.modularity)).brighter(this.stroke_brightness)
      )
      .style("stroke-width", "1px")
      .attr("class", cx("node"));

    figure_node.exit().remove();

    let label = this.svg
      .select("g." + cx("labels"))
      .selectAll("text")
      .data(this.nodes);
    label
      .enter()
      .append("text")
      .merge(label)
      .attr("class", cx("label"))
      .style("display", "none")
      .style("fill", "black")
      .text(d => d.id);
    label.exit();
    // .transition()
    // .duration(100)
    // .remove();

    let figure_link = this.svg
      .select("g." + cx("links"))
      .selectAll("line")
      .data(this.links);
    figure_link
      .enter()
      .append("line")
      .attr("class", cx("link"))
      .merge(figure_link)
      .style("stroke-opacity", "0")
      .style("stroke-width", d => widthScale(d.weight) + "px");
    figure_link.exit().remove();

    this.showMajor();
    this.simulation = this.radialBatch().on("tick", this.ticked);
    // .on("end", this.ticked);
  };
  showMajor = () => {
    let labels = this.svg.select("g." + cx("labels")).selectAll("text");
    labels.interrupt().style("fill", "black");

    labels
      .filter(d => this.majorNodes.includes(d) || d.modularity === 0)
      .transition()
      .delay(50)
      .style("display", "inline")
      .style("fill-opacity", "1");
    // .each(getTextWidth);

    labels
      .filter(d => !this.majorNodes.includes(d) && d.modularity !== 0)
      .transition()
      .delay(50)
      .style("display", "none");
  };
  cursorOn = hoverD => {
    if (this.svg === undefined) {
      return;
    } else if (this.selectTag) {
      this.tempShowLabel(hoverD.id, this.highlightColor);
      return;
    }

    // 연결된 노드 찾기
    const fromSource = this.links
      .filter(d => d.source.id === hoverD.id)
      .map(d => d.target.id);
    const fromTarget = this.links
      .filter(d => d.target.id === hoverD.id)
      .map(d => d.source.id);

    this.brightlist = this.nodes.filter(
      d => fromSource.includes(d.id) || fromTarget.includes(d.id)
    );

    // 연결 노드의 각 module별 대표 노드 구하기
    // console.log(brightlist);
    let repNodes = new Array(this.n_group);
    this.brightlist.forEach(d => {
      let group = d.modularity;
      if (!repNodes[group] || d.radius > repNodes[group].radius) {
        repNodes[group] = d;
      }
    });

    let nodes = this.svg
      .selectAll("circle")
      .interrupt()
      .style("fill-opacity", "0.95")
      .style("stroke-opacity", "0.9")
      .style("fill", d => this.getColor(d.modularity, "normal"));

    nodes
      .filter(d => this.brightlist.includes(d) || d === hoverD)
      .transition()
      .duration(500)
      .style("fill", d => {
        if (d === hoverD) {
          // return "white";
          return this.getColor(d.modularity, "brighter");
        } else {
          return this.getColor(d.modularity, "bright");
        }
      })
      .style("stroke-width", d => {
        if (d === hoverD) {
          return "3px";
        } else {
          return "1px";
        }
      });

    nodes
      .filter(d => !this.brightlist.includes(d) && d !== hoverD)
      .transition()
      .duration(500)
      .style("fill-opacity", "0.05")
      .style("stroke-opacity", "0.1");
    // .attr("dim", true);

    const labels = this.svg.select("g." + cx("labels")).selectAll("text");

    labels
      .style("fill", "black")
      .interrupt()
      .transition()
      .delay(10)
      .style("display", "none")
      .style("fill-opacity", "1")
      .style("fill", "black");

    for (let i = 0; i < this.n_group; i++) {
      if (
        hoverD === this.majorNodes[hoverD.modularity] &&
        hoverD.modularity === i
      )
        continue;
      if (repNodes[i]) {
        labels
          .filter(d => d === repNodes[i])
          .interrupt()
          .transition()
          .delay(20)
          .style("display", "inline")
          .style("fill-opacity", "1");
      } else {
        labels
          .filter(d => d === this.majorNodes[i])
          .interrupt()
          .transition()
          .delay(20)
          .style("display", "inline")
          .style("fill-opacity", "0.3");
      }
    }

    this.tempShowLabel(hoverD.id, this.highlightColor);

    // labels
    //   .filter(d => d === hoverD)
    //   .interrupt()
    //   .style("display", "inline")
    //   .style("fill-opacity", "1")
    //   .style("fill", "darkmagenta");

    let links = this.svg
      .select("g." + cx("links"))
      .selectAll("line")
      .style("stroke-opacity", "0");

    links
      .filter(
        d =>
          (this.brightlist.includes(d.source) || d.source === hoverD) &&
          (this.brightlist.includes(d.target) || d.target === hoverD)
      )
      // .style("stroke", d => linkColor(d.weight))
      .interrupt()
      .attr("bright", true)
      .style("stroke-opacity", "0")
      .transition()
      .duration(500)
      .style("stroke-opacity", d => this.linkOpacity(d.weight));
  };

  tempShowLabel = (showId, color) => {
    const thislabel = this.svg
      .select("g." + cx("labels"))
      .selectAll("text")
      .filter(d => d.id === showId);

    thislabel
      .attr("temp", thislabel.style("display"))
      .attr("temp-fill", thislabel.style("fill"));
    console.log(thislabel.attr("temp-fill"));

    thislabel
      .interrupt()
      .raise()
      .style("display", "inline")
      .style("fill", color);
  };

  restoreTempState = showId => {
    const thislabel = this.svg
      .select("g." + cx("labels"))
      .selectAll("text")
      .filter(d => d.id === showId);
    if (showId !== this.selectTag.id) {
      thislabel.style("display", thislabel.attr("temp")).style("fill", "black");
    } else {
      thislabel.style("display", "inline").style("fill", this.selectColor);
    }
  };

  cursorOut = outD => {
    if (!this.selectTag) {
      this.svg
        .select("g." + cx("nodes"))
        .selectAll("circle")
        .interrupt()
        .transition()
        .delay(30)
        .attr("dim", false)
        .style("fill-opacity", "0.95")
        .style("stroke-opacity", "0.9")
        .style("fill", d => this.getColor(d.modularity, "normal"))
        .style("stroke-width", "1px");
      this.svg
        .select("g." + cx("links"))
        .selectAll("line")
        .attr("dim", false)
        .attr("bright", false);

      this.showMajor();
    } else {
      this.restoreTempState(outD.id);
    }
  };
  onClickNode = hoverD => {
    if (!this.selectTag) {
      this.selectTag = {
        id: hoverD.id,
        color: this.getColor(hoverD.modularity, "click")
      };

      this.tempShowLabel(hoverD.id, this.selectColor);
    } else {
      if (this.selectTag.id === hoverD.id) {
        this.selectTag = undefined;
        this.cursorOut(hoverD);
      } else {
        this.selectTag = undefined;
        this.cursorOn(hoverD);
        this.selectTag = {
          id: hoverD.id,
          color: this.getColor(hoverD.modularity, "click")
        };
        this.tempShowLabel(hoverD.id, this.selectColor);
      }
    }

    this.drawlist();
  };

  highlight = hoverD => {
    if (this.svg === undefined) {
      return;
    }
    const fromSource = this.links
      .filter(d => d.source.id === hoverD.id)
      .map(d => d.target.id);
    const fromTarget = this.links
      .filter(d => d.target.id === hoverD.id)
      .map(d => d.source.id);

    const brighlist = [hoverD.id].concat(fromSource, fromTarget);

    this.svg
      .selectAll("circle")
      // .filter(d => brighlist.includes(d.id))
      // .transition()
      // .duration(10)
      .attr("fill", d => {
        if (d === hoverD) {
          return "white";
        } else {
          return d3.hsl(this.colorScale(d.modularity)).brighter([1]);
        }
      })
      // .attr("bright", true)
      .style("stroke-width", d => {
        if (d === hoverD) {
          return "2px";
        } else {
          return "1px";
        }
      })
      .attr("dim", false);

    this.svg
      .selectAll("circle")
      .filter(d => !brighlist.includes(d.id))
      // .attr("fill", d => d3.color(colorScale(d.modularity)))
      .attr("dim", true);
    // .attr("bright", false);

    this.svg
      .select("g." + cx("links"))
      .selectAll("line")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)
      .filter(
        d => brighlist.includes(d.source.id) && brighlist.includes(d.target.id)
      )
      .attr("bright", true)
      // .style("stroke", d => linkColor(d.weight))
      .style("stroke-opacity", d => this.linkOpacity(d.weight))
      .attr("dim", false);

    this.svg
      .select("g." + cx("links"))
      .selectAll("line")
      .filter(
        d =>
          !(brighlist.includes(d.source.id) && brighlist.includes(d.target.id))
      )
      .attr("bright", false)
      .attr("dim", true);

    let label = this.svg
      .select("g." + cx("labels"))
      .selectAll("text")
      .style("text-anchor", "middle")
      .style("display", "none");
    label
      .filter(d => hoverD === d || brighlist.includes(d.id))
      .style("display", "inline");

    // .style("text-anchor", "start");
  };

  ticked = () => {
    this.svg
      .select("g." + cx("links"))
      .selectAll("line")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    const padding = 5;
    this.svg
      .select("g." + cx("nodes"))
      .selectAll("circle")
      .attr(
        "cx",
        d =>
          (d.x = Math.max(
            d.radius + padding,
            Math.min(this.size.width - d.radius - padding, d.x)
          ))
      )
      .attr(
        "cy",
        d =>
          (d.y = Math.max(
            d.radius + padding,
            Math.min(this.size.height - d.radius - padding, d.y)
          ))
      );

    const size = this.size;
    function longLabelPosition() {
      if (
        d3.select(this).data()[0].x -
          d3
            .select(this)
            .node()
            .getBBox().width /
            2 <
        0
      ) {
        d3.select(this).attr(
          "transform",
          d =>
            "translate(" +
            d3
              .select(this)
              .node()
              .getBBox().width /
              2 +
            "," +
            d.y +
            ")"
        );
      } else if (
        d3.select(this).data()[0].x +
          d3
            .select(this)
            .node()
            .getBBox().width /
            2 >
        size.width
      ) {
        d3.select(this).attr(
          "transform",
          d =>
            "translate(" +
            (size.width -
              d3
                .select(this)
                .node()
                .getBBox().width /
                2) +
            "," +
            d.y +
            ")"
        );
      }
    }
    this.svg
      .select("g." + cx("labels"))
      .attr("transform", d => "translate(" + 0 + "," + -5 + ")")
      .selectAll("text")
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")")
      .each(longLabelPosition);
  };

  drawlist = () => {
    const sortby = d3
      .select("#" + this.props.rootId)
      .select("#sortby")
      .node().value;

    const sortkind = d3
      .select("#" + this.props.rootId)
      .select("#sortkind")
      .node().value;
    console.log(sortby, sortkind);

    if (this.selectTag && !this.sessionTags.includes(this.selectTag.id)) {
      d3.select("#" + this.props.rootId)
        .select("#selectTag")
        .style("display", "inline")
        .select("div")
        .text("# " + this.selectTag.id);
      // .style("color", this.selectTag.color);

      this.taglist = this.brightlist.filter(
        d => !this.props.sessionTags.includes(d.id)
      );
    } else {
      d3.select("#" + this.props.rootId)
        .select("#selectTag")
        .style("display", "none");

      this.taglist = this.nodes.filter(
        d => !this.props.sessionTags.includes(d.id)
      );
    }

    // sort taglist
    this.taglist.sort((a, b) => {
      if (sortkind === "ascending") {
        return d3.ascending(a[sortby], b[sortby]);
      } else {
        return d3.descending(a[sortby], b[sortby]);
      }
    });
    console.log(this.taglist);

    const listRoot = d3
      .select("#" + this.props.rootId)
      .select("." + cx("root-taglist"))
      .select("." + cx("list"));

    let cells = listRoot.selectAll("." + cx("cell")).data(this.taglist);

    let cells_enter = cells
      .enter()
      .append("div")
      .attr("class", cx("cell"));

    cells_enter.append("div").attr("class", cx("rank"));
    cells_enter.append("div").attr("class", cx("a-tag"));
    cells_enter.append("div").attr("class", cx("number"));

    let cell_select = cells_enter.merge(cells);

    cell_select.select("." + cx("rank")).text((d, i) => i + 1);

    cell_select
      .select("." + cx("a-tag"))
      .text(d => d.id)
      // .style("color", d => this.getColor(d.modularity, "normal"))
      // .style("background-color", d => this.getColor(d.modularity, "normal"))
      .style("border-color", d => this.getColor(d.modularity, "normal"))
      .style("color", "black");

    if (sortby === "id") {
    } else {
      cell_select.select("." + cx("number")).text(d => d[sortby]);
    }

    cells.exit().remove();
  };

  resize = () => {
    if (this.svg === undefined) return;

    // const old_size = Math.min(this.size.height, this.size.width);
    const old_size = this.size;
    const old_min = Math.min(this.size.height, this.size.width);

    this.size = {
      height: this.svg.node().clientHeight,
      width: this.svg.node().clientWidth
    };
    const now_size = this.size;
    const now_min = Math.min(this.size.height, this.size.width);

    // const now_size = Math.min(this.size.height, this.size.width);
    console.log(old_size, now_size);

    this.nodes.forEach(d => {
      d.x =
        now_size.width / 2 + (d.x - old_size.width / 2) * (now_min / old_min);
      d.y =
        now_size.height / 2 + (d.y - old_size.height / 2) * (now_min / old_min);
      d.vx = d.vx * (now_min / old_min);
      d.vy = d.vy * (now_min / old_min);
    });

    this.simulation.force(
      "radial",
      d3
        .forceRadial(
          d => {
            if (d.modularity === 0) {
              return 0;
            } else {
              return this.getBaseRadius(this.size);
            }
          },
          this.size.width / 2,
          this.size.height / 2
        )
        .strength(0.1)
    );
    this.simulation.stop();
    this.simulation = this.radialBatch().on("tick", this.ticked);

    // nodes
    this.svg
      .select("g." + cx("nodes"))
      .selectAll("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    // labels
    this.svg
      .select("g." + cx("labels"))
      .selectAll("text")
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")");
    // .each(longLabelPosition);
  };
  componentDidMount() {
    window.addEventListener("resize", this.resize);
  }

  componentDidUpdate() {
    // const datacolumn = Object.keys(this.props.data[this.props.view]);
    const datacolumn = Object.keys(this.props.data);

    if (datacolumn.includes("nodes") && datacolumn.includes("links")) {
      this.selectTag = undefined;
      this.dataProcessing();
      this.draw();
      this.drawlist();
      this.resize();
    } else {
      console.log("Wrong Format! check data received.");
    }
  }

  shouldComponentUpdate = (nextProps, nextState) => {
    if (this.props.data !== nextProps.data) {
      if (this.simulation) {
        this.simulation.stop();
      }
      return true;
    }
    if (this.props.view !== nextProps.view) {
      if (this.simulation) {
        this.simulation.stop();
      }
      this.selectTag = undefined;
      this.view = nextProps.view;
      // this.dataProcessing();
      // this.draw();
      // this.drawlist();
      return true;
    }
    return false;
  };

  render() {
    return (
      <div style={{ display: "flex" }}>
        <div style={{ flex: "2 0" }} />
        <div id={this.props.rootId} className={cx("wrapper")}>
          <div className={cx("title")}>{this.props.title}</div>
          <div className={cx("select-list")}>
            Connected with
            <div style={{ display: "inline-block" }}>
              {this.props.sessionTags.map(d => (
                <div className={cx("session-tags")} key={d}>
                  {"# " + d}
                </div>
              ))}
              <div id={"selectTag"} style={{ display: "inline" }}>
                &<div className={cx("session-tags")} />
              </div>
            </div>
          </div>
          <div className={cx("contents")}>
            <svg className={cx("svg-style")}>
              <g className={cx("elements")}>
                <g className={cx("links")} />
                <g className={cx("nodes")} />
                <g className={cx("labels")} />
              </g>
            </svg>
            <div className={cx("root-taglist")}>
              <div>
                sort by
                <select
                  name="sortby"
                  id="sortby"
                  onChange={() => this.drawlist()}
                >
                  <option value="n_2018">frequency in 2018</option>
                  <option value="id">name</option>
                  <option value="from_year">first connected year</option>
                </select>
                <select
                  name="sortkind"
                  id="sortkind"
                  onChange={() => this.drawlist()}
                >
                  <option value="descending">&darr;</option>
                  <option value="ascending">&uarr;</option>
                </select>
              </div>
              <div className={cx("list")} />
            </div>
          </div>
        </div>
        <div style={{ flex: "2 0" }} />
      </div>
    );
  }
}

export default TagNetwork;
