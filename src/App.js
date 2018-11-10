import React, { Component } from "react";
import "./App.css";
import TagNetwork from "./components/TagNetwork";
import ImpactAuthors from "./components/ImpactAuthors";
import ImpactPapers from "./components/ImpactPapers";
import TimelineTrend from "./components/TimelineTrend";

import * as d3 from "d3";

class App extends Component {
  state = {
    data_tagNetwork: {}
  };
  loadData = async () => {
    try {
      console.log("Data Loading.");
      const data = await Promise.all([
        require("./data/api_timeline.json"),
        require("./data/api_impacttags.json"),
        require("./data/api_impactauthors.json"),
        require("./data/from_paper_api.json")
      ]); //TODO : CONNECT API
      console.log("successfully load dataset!");

      this.setState({
        data_timelineTrend: data[0],
        data_tagNetwork: data[1],
        data_authorTable: data[2],
        data_paperTable: data[3]
      });
    } catch (e) {
      console.log(e);
    }
  };

  changeViewFamous = () => {
    this.setState({ view: "famous" });
  };
  changeViewTrend = () => {
    this.setState({ view: "trending" });
  };
  changeViewNew = () => {
    this.setState({ view: "new" });
  };

  componentDidMount() {
    console.log("app component did mount");
    this.loadData();
  }
  shouldComponentUpdate = (nextProps, nextState) => {
    console.log("app shouldComponentUpdate", this.state !== nextState);
    return this.state !== nextState;
  };
  componentDidUpdate() {
    console.log("app coponentDidUpdate");
  }

  render() {
    console.log("app render", this.state.data_tagNetwork);
    return (
      <div className="App">
        <header className="App-header">
          <h2 className="App-title"># Machine Learning (10,104)</h2>
        </header>
        <TimelineTrend
          title={"TIMELINE & COUNTING"}
          data={this.state.data_timelineTrend}
          rootId={"timeline-trend"}
        />
        {/* <div style={{ textAlign: "left" }}>
          <button onClick={this.changeViewTrend}>Trending</button>
          <button onClick={this.changeViewFamous}>Famous</button>
          <button onClick={this.changeViewNew}>New</button>
        </div> */}
        <TagNetwork
          title={"PAPER KEYWORD ANALYSIS"}
          sessionTags={["machine learning"]}
          data={this.state.data_tagNetwork}
          rootId={"tag-network-graph"}
          view={this.state.view}
        />
        <ImpactAuthors
          title={"IMPACT RESEARCHER"}
          targetId={"impactAuthors"}
          data={this.state.data_authorTable}
          view={this.state.view}
        />

        <ImpactPapers
          title={"IMPACT PAPERS"}
          targetId={"impactPapers"}
          data={this.state.data_paperTable}
          view={this.state.view}
        />
      </div>
    );
  }
}

export default App;
