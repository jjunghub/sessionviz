import React from "react";
import * as d3 from "d3";
import "./ImpactAuthors.css";

// import * as classNames from "classnames/bind";
// const cx = classNames.bind(style);
const cx = x => "ia-" + x;

class ImpactAuthors extends React.Component {
  view = "famous";

  dataProcessing = data => {};

  onClickAuthor = auid => {
    // 일썹화면
    console.log(auid);
  };
  drawTable = (targetId, data) => {
    console.log(data);
    const root = d3.select("#" + targetId);
    d3.selectAll("." + cx("row")).remove();

    let rows = root
      .select("." + cx("rows"))
      .selectAll("div." + cx("row"))
      .data(data)
      .enter()
      .append("div")
      .attr("class", cx("row"))
      .on("click", d => this.onClickAuthor(d.auid));

    rows
      .append("div")
      .attr("class", cx("rank"))
      .attr("class", cx("col1"))
      .text((d, i) => i + 1);

    rows
      .append("div")
      .attr("class", cx("name"))
      .attr("class", cx("col2"))
      .text(d => d["display_name"]);

    rows
      .append("div")
      .classed(cx("aff"), true)
      .classed(cx("col3"), true)
      // .attr("class", cx("aff"))
      // .attr("class", cx("col3"))
      .text(d => d["affliation"]);

    rows
      .append("div")
      .attr("class", cx("col4"))
      .classed(cx("period"), true)
      .text(d => {
        if (d["fromyear"] === d["toyear"]) {
          return d["fromyear"];
        } else {
          return d["fromyear"] + "~" + d["toyear"];
        }
      });

    rows
      .append("div")
      .attr("class", cx("col5"))
      .classed(cx("total-cite"), true)
      .text(d => d["total_cite"]);
  };

  shouldComponentUpdate = (nextProps, nextState) => {
    if (this.props !== nextProps) {
      d3.selectAll("." + cx("row")).remove();
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

  changeView = () => {
    const view = d3
      .select("." + cx("wrapper"))
      .select("#view")
      .node().value;

    console.log(view);
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
              <option value="famous">most cited</option>
              <option value="trending">most active recent 3 years</option>
              <option value="new">new researcher 2018</option>
            </select>
          </div>
          <div className={cx("contents")}>
            <div id={this.props.targetId} className={cx("table")}>
              <div className={cx("head")}>
                <div className={cx("col1")}> RANK </div>
                <div className={cx("col2")}> RESEARCHER </div>
                <div className={cx("col3")}> AFFLIATION </div>
                <div className={cx("col4")}> ACTIVE YEAR </div>
                <div className={cx("col5")}> TOTAL C</div>
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

export default ImpactAuthors;
