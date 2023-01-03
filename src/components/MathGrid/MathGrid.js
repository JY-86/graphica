import React from 'react';
import 'tachyons';
import { Stage, Layer, Rect, Circle, Line, Text } from 'react-konva';
import Konva from 'konva'

class MathGrid extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      width: 500,
      height: 500,
      gridSettings: {
        scale: 1, //normal scale. 2 means 2x zoomed in.
        center: [0,0] //centre of screen
      }
    }
    this.containerDiv = React.createRef()
  }
  
  componentDidMount = () => {
    this.calculateSize();

    // !!!! replace with listener for div resize once you add in minimising of right window https://web.dev/resize-observer/
    window.addEventListener("resize", this.calculateSize);
  }

  componentWillUnmount = () => {
    window.removeEventListener("resize", this.calculateSize);
  }

  calculateSize = () => {
    const width = this.containerDiv.current.clientWidth;
    const height = this.containerDiv.current.clientHeight;
    this.setState({width:width, height:height});
  }

  calculatePosInfo = (width, height) => {
    return {
      width:width,
      height: height,
      hw: width/2, // half width. For convenience
      hh: height/2, // half height. For convenience
      center: [width/2, height/2],
      topLeft: [0, 0],
      bottomLeft: [0, height],
      bottomRight: [width, height],
      topRight: [width, 0]
    }
  }

  calculateGridInfo = (gridSettings, posInfo) => {
    let {scale, center} = gridSettings;

    let minGridSpacing = 10; //px
    let maxGridSpacing = 20; //px

    let gridSpacing = 15 * 1/scale;

    let gridJump = 1;

    // calculate variables relevant to scaling both x and y of grid. can optimise to no loop and just a math equation later
    while (gridSpacing > maxGridSpacing) {
      gridSpacing /= 2;
      gridJump /= 2
    }
    while (gridSpacing < minGridSpacing) {
      gridSpacing *=2;
      gridJump *= 2;
    }

    // also implement big lines with text every 5 later

    // X LINES
    // calculate the earliest number, unit value, and pixel position (offset) of the earliest x grid line that appears on the screen
    let {line, offset} = this.calculateEarliestLineFromAxis(center[0], posInfo.hw, gridSpacing)
    // let screenBound;
    // let line;
    // let offset;
    // if (center[0] <= posInfo.hw) {
    //   screenBound = center[0] - posInfo.hw; // will be < 0
    //   // find last multiple of gridSpacing that is > than ans. This is the first grid line on the screen
    //   line = -1 * Math.floor(Math.abs(screenBound / gridSpacing)) // can simplify
    //   offset = line*gridSpacing - screenBound// number of pixels to the right of the leftmost bound of canvas that gridline should be drawn
    // }
    // else {
    //   screenBound = center[0] - posInfo.hw; // will be > 0
    //   // find first multiple of gridSpacing that is > than ans. This is the first grid line on the screen
    //   line = Math.ceil(screenBound / gridSpacing);
    //   offset = line*gridSpacing - screenBound; // number of pixels to the right of the leftmost bound of canvas that gridline should be drawn
    // }

    let xLines = this.getGridLinesFromInitial(offset, line, gridJump, gridSpacing, posInfo.width)
    // from this populate an array of pixel positions and their values for x lines
    // let xLines= [];
    // xLines.push({value: line*gridJump, pos: offset, lineNum:line});

    // while (xLines[xLines.length-1].pos < posInfo.width) {
    //   let xPrev = xLines[xLines.length-1];
    //   xLines.push({value: xPrev.value+gridJump, pos: xPrev.pos+gridSpacing, lineNum: xPrev.lineNum+1});
    // }
    // xLines.pop(); // last element is over boundary

    
    // Y LINES
    // calculate the earliest number, unit value, and pixel position (offset) of the earliest y grid line that appears on the screen
    
    // reuse these variables. merge everything into a function later
    // screenBound = 0;
    // line = 0;
    // offset = 0;
    // if (center[0] <= posInfo.hw) {
    //   screenBound = center[0] - posInfo.hw; // will be < 0
    //   // find last multiple of gridSpacing that is > than ans. This is the first grid line on the screen
    //   line = -1 * Math.floor(Math.abs(screenBound / gridSpacing)) // can simplify
    //   offset = line*gridSpacing - screenBound// number of pixels to the right of the leftmost bound of canvas that gridline should be drawn
    // }
    // else {
    //   screenBound = center[0] - posInfo.hw; // will be > 0
    //   // find first multiple of gridSpacing that is > than ans. This is the first grid line on the screen
    //   line = Math.ceil(screenBound / gridSpacing);
    //   offset = line*gridSpacing - screenBound; // number of pixels to the right of the leftmost bound of canvas that gridline should be drawn
    // }


    // // from this populate an array of pixel positions and their values for x lines
    // let xLines= [];
    // xLines.push({value: line*gridJump, pos: offset, lineNum:line});

    // while (xLines[xLines.length-1].pos < posInfo.width) {
    //   let xPrev = xLines[xLines.length-1];
    //   xLines.push({value: xPrev.value+gridJump, pos: xPrev.pos+gridSpacing, lineNum: xPrev.lineNum+1});
    // }
    // xLines.pop(); // last element is over boundary

    return {xLines: xLines};
  }

  getGridLinesFromInitial = (initialOffset, initialLineNum, gridJump, gridSpacing, maxLength) => {
    let lines= [];
    lines.push({value: initialLineNum*gridJump, pos: initialOffset, lineNum:initialLineNum});

    while (lines[lines.length-1].pos < maxLength) {
      let prev = lines[lines.length-1];
      lines.push({value: prev.value+gridJump, pos: prev.pos+gridSpacing, lineNum: prev.lineNum+1});
    }
    lines.pop(); // last element is over boundary
    return lines
  }

  calculateEarliestLineFromAxis = (centerVal, halfAxis, gridSpacing) => {
    let screenBound, line, offset;

    if (centerVal <= halfAxis) {
      screenBound = centerVal - halfAxis; // will be < 0
      // find last multiple of gridSpacing that is > than ans. This is the first grid line on the screen
      line = -1 * Math.floor(Math.abs(screenBound / gridSpacing)) // can simplify
      offset = line*gridSpacing - screenBound // number of pixels to the right of the leftmost bound of canvas that gridline should be drawn
    }
    else {
      screenBound = centerVal - halfAxis; // will be > 0
      // find first multiple of gridSpacing that is > than ans. This is the first grid line on the screen
      line = Math.ceil(screenBound / gridSpacing);
      offset = line*gridSpacing - screenBound; // number of pixels to the right of the leftmost bound of canvas that gridline should be drawn
    }
    return {line: line, offset: offset}
  }

  handleWheel = (e) => {
    const SPEED = 0.01; // add some sort of modifiier because nearer to 0.01 it gets crazy fast. you need to slow speed as num gets smaller, and increase it as num gets bigger.

    // will also need to make it scale on mousewheel somehow.

    let nativeEvent = e.evt
    this.setState((prevState) => ({
      gridSettings: {
        ...prevState.gridSettings,
        scale: Math.max(0.01, prevState.gridSettings.scale + nativeEvent.deltaY * SPEED)
      }
    }))
    console.log("scale", (this.state.gridSettings.scale).toFixed(2), "deltaY", nativeEvent.deltaY.toFixed(2))
  }

  handleMouseMove = (e) => {
    const SPEED = 1;

    let nativeEvent = e.evt

    let isMouseDown = nativeEvent.which //.which is 1 when left mouse button pressed, 0 otherwise

    if (isMouseDown) {
      this.setState((prevState) => ({
        gridSettings: {
          ...prevState.gridSettings,
          center: [prevState.gridSettings.center[0] - nativeEvent.movementX*SPEED, prevState.gridSettings.center[1] - nativeEvent.movementY*SPEED]
        }
      }))
    }
    
    // console.log("scale", (this.state.gridSettings.scale).toFixed(2), "deltaY", nativeEvent.deltaY.toFixed(2))
  }

  render () {
    let {width, height, gridSettings} = this.state
    let posInfo = this.calculatePosInfo(width, height)
    let gridInfo = this.calculateGridInfo(gridSettings, posInfo);

    // make a list of x gridlines
    //let xGridLines = [];
    let xGridLines = gridInfo.xLines.map((item) => {
      return <Line points={[item.pos,0,item.pos,height]} stroke={"black"} strokeWidth={item.lineNum === 0 ? 2 : 0.3} key={item.pos}/>
    })

    //console.log(xGridLines)
    return (
      <div ref={this.containerDiv} className='w-100 h-100' style={{position:'relative'}}>
        <Stage 
          width={width} 
          height={height} 
          style={{position:'absolute', top:0, left:0}}
          onWheel = {this.handleWheel}
          onMouseMove={this.handleMouseMove}
        >
          <Layer >
            {xGridLines}
            {/* <Line points={[0,height/2,width,height/2]} stroke={"black"} strokeWidth={2}/>
            <Line points={[width/2,0,width/2,height]} stroke={"black"} strokeWidth={2}/> */}
          </Layer>
        </Stage>
      </div>
//https://stackoverflow.com/questions/65433710/how-to-set-stage-width-and-height-to-100-react-konva
    )
  }
}

export default MathGrid;
