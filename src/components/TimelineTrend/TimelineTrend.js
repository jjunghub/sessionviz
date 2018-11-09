import * as React from "react";
import * as d3 from "d3";
import style from "./TimelineTrend.css";

// import * as classNames from "classnames/bind";
// const cx = classNames.bind(style);
const cx = text => "timeline-" + text;

class TimelineTrend extends React.Component {
  // state = {
  //   select_year : [2018,2018]
  // }
  ykey = "papers";
  PAD = { L: 50, T: 60, B: 30, R: 30 };

  NumberingInfo = (name, number, key) => (
    <div className={cx("info")} key={key}>
      <div className={cx("name")} onClick={() => this.changeDomain(key)}>
        {name}
      </div>
      <div className={cx("number")}>{d3.format(",")(number)}</div>
    </div>
  );
  changeDomain = key => {
    this.ykey = key;
    this.lineDataProcessing(this.data, this.ykey);
    this.forceUpdate();
    console.log(key);
  };

  svg = undefined;
  data = [];
  select_year = [2018, 2018];
  dataProcessing = newdata => {
    this.data = newdata;
    this.select_year = d3.extent(this.data, d => d.year);
  };

  renderChart = (targetSVG, data, fillRangeX, PAD, scaletype) => {
    const height = parseFloat(this.svg.node().clientHeight);
    const width = parseFloat(this.svg.node().clientWidth);

    // set scale functions
    const xlim = d3.extent(data, d => d.x);
    const xScale = d3
      .scaleLinear()
      .domain(xlim)
      .range([0, width - PAD.L - PAD.R]);

    let yScale, d3line, yAxis;
    if (scaletype === "log") {
      yScale = d3
        .scaleLog()
        .domain([1, d3.max(data, d => d.y) + 1])
        .range([height - PAD.T - PAD.B, 0]);

      d3line = d3
        .line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y + 1));

      yAxis = d3
        .axisLeft()
        .scale(yScale)
        .tickValues([1, 11, 101, 1001, 10001, yScale.domain()[1]])
        .tickFormat(function(d) {
          d = d - 1;
          if (d <= yScale.domain()[1]) {
            let s = d;
            if (d >= 1000) {
              s = d3.format("2d")(d / 1000);
              return s + "k";
            }
            // if (yScale.domain()[1] > 1000){
            //     s = d3.format(".1f")(d / 1000);
            //     return this.parentNode.nextSibling
            //     ? "\xa0" + s
            //     : s + "k";
            // }
            return s;
          }
          return "";
        });
    } else {
      yScale = d3
        .scaleLinear()
        .domain([0, 1.2 * d3.max(data, d => d.y)])
        .range([height - PAD.T - PAD.B, 0]);

      d3line = d3
        .line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

      yAxis = d3
        .axisLeft()
        .scale(yScale)
        // .tickValues([1, 11, 101, 1001, 10001, yScale.domain()[1]])
        .tickFormat(function(d) {
          if (d <= yScale.domain()[1]) {
            let s = d;
            if (d >= 1000) {
              s = d3.format("2d")(d / 1000);
              return s + "k";
            }
            // if (yScale.domain()[1] > 1000){
            //     s = d3.format(".1f")(d / 1000);
            //     return this.parentNode.nextSibling
            //     ? "\xa0" + s
            //     : s + "k";
            // }
            return s;
          }
          return "";
        });
    }
    const xAxis = d3
      .axisBottom()
      .scale(xScale)
      .tickFormat(d3.format(".4d"))
      .ticks(5);

    // Let's Draw!
    // get g.figures and transform padded position.
    let g = targetSVG.selectAll("g." + cx("figures")).data([0]);
    g = g
      .enter()
      .append("g")
      .attr("class", cx("figures"))
      .merge(g)
      .style("transform", "translate(" + PAD.L + "px, " + PAD.T + "px)");

    // draw fill path.
    let fillpath = g.selectAll("path." + cx("fill")).data([0]);
    fillpath = fillpath
      .enter()
      .append("path")
      .attr("class", cx("fill"))
      .merge(fillpath);
    fillpath.attr(
      "d",
      d3line(
        data
          .filter(d => fillRangeX[0] <= d.x && d.x <= fillRangeX[1])
          .concat([{ x: fillRangeX[1], y: 0 }, { x: fillRangeX[0], y: 0 }])
      )
    );

    // draw stroke path
    let strokepath = g.selectAll("path." + cx("stroke")).data([0]);
    strokepath = strokepath
      .enter()
      .append("path")
      .attr("class", cx("stroke"))
      .merge(strokepath);
    strokepath.attr("d", d3line(data));

    // draw x-axis
    let g_xAxis = g.selectAll("g." + cx("x-axis")).data([0]);
    g_xAxis
      .enter()
      .append("g")
      .attr("class", cx("axis") + " " + cx("x-axis"))
      .merge(g_xAxis)
      .style(
        "transform",
        "translate(" + 0 + "px, " + (height - PAD.B - PAD.T) + "px)"
      )
      .call(xAxis);

    // draw y-axis
    let g_yAxis = g.selectAll("g." + cx("y-axis")).data([0]);
    g_yAxis
      .enter()
      .append("g")
      .attr("class", cx("axis") + " " + cx("y-axis"))
      .merge(g_yAxis)
      .call(yAxis);

    // draw slide button
    const dragged = (d, i, e) => {
      const getRoundDomain = value => {
        return Math.max(
          xlim[0],
          Math.min(xlim[1], Math.round(xScale.invert(value)))
        );
      };

      let newRangeX;
      if (i === 1) {
        newRangeX = [
          getRoundDomain(d3.select(e[0]).attr("cx")),
          getRoundDomain(d3.event.x)
        ].sort((a, b) => d3.ascending(a, b));
      } else {
        newRangeX = [
          getRoundDomain(d3.event.x),
          getRoundDomain(d3.select(e[1]).attr("cx"))
        ].sort((a, b) => d3.ascending(a, b));
      }

      if (newRangeX !== this.select_year) {
        this.select_year = newRangeX;
        this.forceUpdate();
      }
    };

    let slider = g.selectAll("circle." + cx("slider-button")).data(fillRangeX);
    slider = slider
      .enter()
      .append("circle")
      .attr("class", cx("slider-button"))
      .merge(slider);

    slider
      .attr("cx", d => xScale(d))
      .attr("cy", height - PAD.B - PAD.T + 0)
      .attr("r", 10)
      .call(
        d3
          .drag()
          // .on("start", dragStart)
          .on("drag", dragged)
          .on("end", dragged)
      );
  };

  resize = () => {
    if (this.svg === undefined) return;
    this.forceUpdate();
  };

  componentDidMount() {
    // console.assert(
    //   this.props.rootId === undefined,
    //   "please define rootId as props"
    // );
  }

  lineDataProcessing = (data, key) => {
    this.lineData = data.map(d => ({
      x: d.year,
      y: d[key].length
    }));
  };

  componentDidUpdate() {
    if (this.props.data === undefined) return;
    if (this.svg === undefined) {
      this.svg = d3.select("#" + this.props.rootId).select("svg");
      window.addEventListener("resize", this.resize);
    }

    this.renderChart(
      this.svg,
      this.lineData,
      this.select_year,
      this.PAD,
      "linear"
    );
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.data !== nextProps.data) {
      this.dataProcessing(nextProps.data);
      this.lineDataProcessing(this.data, this.ykey);
      return true;
    }
    if (this.state !== nextState) {
      return true;
    }
    return false;
  }

  getSelectDataNumber = (data, select_year) => {
    let totalNumber = [
      { name: "paper", number: 0, colname: "papers" },
      { name: "researcher", number: 0, colname: "researcher" },
      { name: "jounal/conference", number: 0, colname: "publication" }
    ];

    if (data === undefined) return totalNumber;
    return totalNumber.map(d => {
      let all = [];
      let colname = d.colname;
      data
        .filter(d => select_year[0] <= d.year && d.year <= select_year[1])
        .forEach(d => (all = all.concat(d[colname])));
      return { ...d, number: d3.set(all).size() };
    });
  };

  render() {
    if (this.data === undefined || this.data === []) {
      return <div />;
    }
    const totalNumber = this.getSelectDataNumber(this.data, this.select_year);
    let graphinfo = "";
    if (this.ykey === "papers") {
      graphinfo = "Number of published papers in each year";
    } else if (this.ykey === "researcher") {
      graphinfo = "Number of researchers in each year";
    } else if (this.ykey === "publication") {
      graphinfo = "Number of jounarl/conferences in each year";
    }

    return (
      <div style={{ display: "flex" }}>
        <div style={{ flex: "2 0" }} />
        <div id={this.props.rootId} className={cx("wrapper")}>
          <div className={cx("title")}>{this.props.title}</div>
          <div className={cx("contents")}>
            <div className={cx("svg-label")}>{graphinfo}</div>
            <svg className={cx("left")} />
            <div className={cx("right")}>
              <div className={cx("yearrange")}>
                {this.select_year[0]} ~ {this.select_year[1]}
              </div>
              {totalNumber.map(d =>
                this.NumberingInfo(d.name, d.number, d.colname)
              )}
            </div>
          </div>
        </div>
        <div style={{ flex: "2 0" }} />
      </div>
    );
  }
}

export default TimelineTrend;
