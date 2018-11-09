import React from "react";
import * as d3 from "d3";
import "./ImpactPapers.css";

class ImpactPapers extends React.Component {
  view = "famous";
  xScale = undefined;
  colorScale = undefined;
  thisyear = 2018;

  cx = x => x;

  dataProcessing = data => {
    console.log(data);
  };

  drawTable = (targetId, data) => {
    const root = d3.select("#" + targetId);

    let rows = root
      .select("." + this.cx("rows"))
      .selectAll("div." + this.cx("row"))
      .data(data)
      .enter()
      .append("div")
      .attr("class", this.cx("row"));

    rows
      .append("div")
      .attr("class", this.cx("rank"))
      .text((d, i) => i + 1);
    let meta = rows.append("div").attr("class", this.cx("left"));
    const detail = ["title", "publication", "pub_year"];
    detail.forEach(about => {
      meta
        .append("div")
        .attr("class", this.cx(about))
        .text(d => d[about]);
    });

    let region = rows.append("div").attr("class", this.cx("right"));

    rows
      .append("div")
      .attr("class", this.cx("number"))
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
      d3.selectAll("." + this.cx("row")).remove();
      return true;
    } else {
      return false;
    }
  };

  componentDidUpdate() {
    //전체적인 d3 render구조가 어떤게 더 좋을지는 좀 더 생각해봐야겠다.
    if (this.props.data) {
      if (this.props.view !== undefined) this.view = this.props.view;
      this.drawTable(this.props.targetId, this.props.data[this.view]);
    }
  }

  render() {
    return (
      <div id={this.props.targetId} className={this.cx("table")}>
        <div className={this.cx("head")}>
          <div className={this.cx("col1")}> RANK </div>
          <div className={this.cx("col2")}> PAPER </div>
          <div className={this.cx("col3")}> CITE BURST </div>
          <div className={this.cx("col4")}> TOTAL C</div>
        </div>
        <div className={this.cx("rows")} />

        {/* <div className={this.cx("row-style")}>
          <div className={this.cx("left-style")}>
            <div className={this.cx("title-style")}>IM PAPERS TITLE</div>
            <div className={this.cx("authors-style")}>AUTHORS</div>
          </div>
          <div className={this.cx("right-style")} />
        </div> */}
      </div>
    );
  }
}

export default ImpactPapers;
