import React from "react";
import * as d3 from "d3";
import "./ImpactPapers.scss";

// import * as classNames from "classnames/bind";
// const cx = classNames.bind(style);
const cx = x => "ip-" + x;

class ImpactPapers extends React.Component {
  view = "famous";
  xScale = undefined;
  colorScale = undefined;
  thisyear = 2018;

  dataProcessing = data => {
    console.log(data);
  };

  drawTable = (targetId, data) => {
    const root = d3.select("#" + targetId);
    root.selectAll("." + cx("row")).remove();

    let rows = root
      .select("." + cx("rows"))
      .selectAll("div." + cx("row"))
      .data(data)
      .enter()
      .append("div")
      .attr("class", cx("row"));

    rows
      .append("div")
      .attr("class", cx("rank"))
      .text((d, i) => i + 1);

    let meta = rows.append("div").attr("class", cx("left"));
    const detail = ["title", "publication", "pub_year"];
    detail.forEach(about => {
      meta
        .append("div")
        .attr("class", cx(about))
        .text(d => d[about]);
    });

    let region = rows.append("div").attr("class", cx("right"));

    rows
      .append("div")
      .attr("class", cx("number"))
      .text(d => d.cereb_cite);

    let size = {
      height: parseFloat(region.node().clientHeight),
      width: parseFloat(region.node().clientWidth)
    };
    let svgs = region
      .append("svg")
      .attr("width", size.width)
      .attr("height", size.height);

    const P = { L: 10, R: 10 };
    this.xScale = d3
      .scaleLinear()
      .domain([
        Math.min(2000, d3.min(data, d => d.pub_year)),
        Math.max(this.thisyear, d3.max(data, d => d.pub_year)) + 1
      ])
      .range([P.L, size.width - P.R]);

    this.colorScale = d3
      .scaleSequential(d3.interpolateOranges)
      .domain([
        0,
        Math.log(
          d3.max(data.map(each => d3.max(each.citeburst, d => d.cite))) + 1
        )
      ]);

    svgs.each((d, i, e) => this.drawCiteBurst(d, d3.select(e[i])));

    // console.log(size);
  };

  drawCiteBurst = (data, svg) => {
    const width = this.xScale(this.thisyear + 1) - this.xScale(this.thisyear);
    const cellheight = 20;

    svg
      .selectAll("rect")
      .data(data.citeburst)
      .enter()
      .append("rect")
      .attr("x", d => this.xScale(d.year))
      .attr("y", 10)
      .attr("width", width)
      .attr("height", cellheight)
      .attr("fill", d => this.colorScale(Math.log(d.cite + 1)));
  };

  shouldComponentUpdate = (nextProps, nextState) => {
    if (this.props !== nextProps) {
      d3.selectAll("." + cx("row")).remove();
      return true;
    } else {
      return false;
    }
  };

  componentDidMount() {
    window.addEventListener("resize", () => this.changeView());
  }

  componentDidUpdate() {
    //전체적인 d3 render구조가 어떤게 더 좋을지는 좀 더 생각해봐야겠다.
    if (this.props.data) {
      // if (this.props.view !== undefined) this.view = this.props.view;
      this.changeView();
      // this.drawTable(this.props.targetId, this.props.data[this.view]);
    }
  }

  changeView = () => {
    if (this.props.data === undefined) return;
    const view = d3
      .select("." + cx("wrapper"))
      .select("#view")
      .node().value;

    this.drawTable(this.props.targetId, this.props.data[view]);
  };

  render() {
    return (
      <div style={{ display: "flex" }}>
        <div style={{ flex: "2 0" }} />
        <div className={cx("wrapper")}>
          <div className={cx("title")}>{this.props.title}</div>
          <div style={{ textAlign: "right" }}>
            <select
              name="view"
              id="view"
              onChange={() => this.changeView()}
              style={{ textAlign: "center" }}
            >
              <option value="famous">most total cited papers</option>
              <option value="trending">
                high citation increase in last 4 years
              </option>
              <option value="new">new papers in 2018</option>
            </select>
          </div>
          <div className={cx("contents")}>
            <div id={this.props.targetId} className={cx("table")}>
              <div className={cx("head")}>
                <div className={cx("col1")}> RANK </div>
                <div className={cx("col2")}> PAPER </div>
                <div className={cx("col3")}>
                  {"CITATION BURST"}
                  <br />
                  {"(YEARLY CITED TIMELINE)"}
                </div>
                <div className={cx("col4")}> TOTAL CITATION</div>
              </div>
              <div className={cx("rows")} />
            </div>
          </div>
        </div>
        <div style={{ flex: "2 0" }} />
      </div>
    );
  }
}

export default ImpactPapers;
