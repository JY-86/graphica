import React from 'react';
import 'tachyons';
import { Stage, Layer, Rect, Circle, Line, Text } from 'react-konva';
import Konva from 'konva'
import {clamp, Vector, getLinePoints, testFunctionEvaluator} from '../../algorithms/utilities'
import 'big-js';

//Big.DP = 30

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
    this.containerDiv = React.createRef();
    this.mousePos = [0,0];
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
    const minGridSpacing = 20; //px
    const maxGridSpacing = 40; //px
    const idealGridSpacing = 30; //px

    let {scale, center} = gridSettings;


    let gridSpacing = idealGridSpacing * 1/scale;

    let gridJump = 1;
    //let gridJumpSteps = [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 4, 10, 20, 40, 80]
    //let gridJumpStepIndex = gridJumpSteps.indexOf(1);
    
    // calculate variables relevant to scaling both x and y of grid. can optimise to no loop and just a math equation later
    while (gridSpacing > maxGridSpacing) {
      gridSpacing /= 2;
      gridJump /= 2
      //gridJumpStepIndex--;
    }
    while (gridSpacing < minGridSpacing) {
      gridSpacing *= 2;
      gridJump *= 2;
      //gridJumpStepIndex++;
    }
    //let gridJump = gridJumpSteps[clamp(gridJumpStepIndex, 0, gridJumpSteps.length-1)]


    // X LINES
    let earliestXLine = this.calculateEarliestLineFromAxis(center[0], posInfo.hw, gridSpacing)
    let xLines = this.getGridLinesFromInitial(earliestXLine.offset, earliestXLine.line, gridJump, gridSpacing, posInfo.width)
    
    // Y LINES
    let earliestYLine = this.calculateEarliestLineFromAxis(center[1], posInfo.hh, gridSpacing)
    let yLines = this.getGridLinesFromInitial(earliestYLine.offset, earliestYLine.line, gridJump, gridSpacing, posInfo.height)
    
    
    // also implement big lines with text every 5 later

    return {xLines: xLines, yLines: yLines, unitScreenBounds: this.calculateUnitScreenBounds(center, gridSpacing, gridJump, posInfo.hw, posInfo.hh)};
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

  calculateUnitScreenBounds = (center, gridSpacing, gridJump, xHalfAxis, yHalfAxis) => {
    return {
      left: (center[0] - xHalfAxis) / gridSpacing * gridJump,
      right: (center[0] + xHalfAxis) / gridSpacing * gridJump,
      bottom: (-center[1] - yHalfAxis) / gridSpacing * gridJump, //why - ?? i think i screwed up how vertical center works. !!!REDO LATER.
      top: (-center[1] + yHalfAxis) / gridSpacing * gridJump,
    }
  }

  calculateEarliestLineFromAxis = (centerVal, halfAxis, gridSpacing) => {
    // calculate the earliest number, unit value, and pixel position (offset) of the earliest x grid line that appears on the screen
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
    const SPEED_MULTIPLIER = 0.01;

    // as scale gets very small, speed gets smaller as well. as scale very large, speed very large.
    // could set speed = 0
    // will also need to make it scale on mousewheel somehow.

    // calculate how far centre will need to be moved to look like grid zooming in on mouse


    let nativeEvent = e.evt
    this.setState((prevState) => {
      let speed = SPEED_MULTIPLIER * prevState.gridSettings.scale
      let newScale = Math.max(0.001, prevState.gridSettings.scale + nativeEvent.deltaY * speed);

      // get mouse pos from centre
      let mouseX = prevState.gridSettings.center[0] - prevState.width/2 + this.mousePos[0] ;
      let mouseY = prevState.gridSettings.center[1] - prevState.height/2 + this.mousePos[1];
      let mouseToCentreVec = new Vector(mouseX, mouseY);
      

      // center[0] + (center[0] - prevState.width/2 + this.mousePos[0]) * nativeEvent.deltaY * speedMultiplier

      console.log(prevState.gridSettings.center, mouseToCentreVec)
      // scale to offset size
      // (prevScale + nativeEvent.deltaY * SPEED_MULTIPLIER * prevScale) / prevScale - 1
      // 
      //let s = (new Big(newScale)).div(new Big(prevState.gridSettings.scale)).minus(new Big(1))
      //mouseToCentreVec.scale(s)//newScale / prevState.gridSettings.scale - 1)
      
      if (newScale !== 0.001){
        mouseToCentreVec.scale(nativeEvent.deltaY * SPEED_MULTIPLIER); // this is simplified version of newScale/oldscale -1
      }
      else {
        mouseToCentreVec.scale(0);
      }
      mouseToCentreVec.flip()

      //let screenCentreVec = new Vector(prevState.width/2, prevState.height/2);
      let newCentre = [prevState.gridSettings.center[0] + mouseToCentreVec.x, prevState.gridSettings.center[1] + mouseToCentreVec.y]
      // console.log(mouseToCentreVec)
      return {gridSettings: {
        ...prevState.gridSettings,
        scale: newScale,
        center: newCentre
      }}
    })
   // console.log("scale", (this.state.gridSettings.scale).toFixed(2), "deltaY", nativeEvent.deltaY.toFixed(2))
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
    
    // allow other methods to access mouse position within canvas
    
    
    let rect = nativeEvent.target.getBoundingClientRect()
    this.mousePos = [nativeEvent.clientX - rect.left, nativeEvent.clientY - rect.top]

    // console.log(nativeEvent.x - rect.left, nativeEvent.screenX)

    // console.log("scale", (this.state.gridSettings.scale).toFixed(2), "deltaY", nativeEvent.deltaY.toFixed(2))
    
  }

  render () {
    let {width, height, gridSettings} = this.state
    let posInfo = this.calculatePosInfo(width, height)
    let gridInfo = this.calculateGridInfo(gridSettings, posInfo);

    let yAxis = gridInfo.xLines.filter((line) => line.lineNum === 0)[0] // if main X line is not on the screen, this is undefined
    let xAxis = gridInfo.yLines.filter((line) => line.lineNum === 0)[0] // as above
    

    // these numbers are overkill
    let xNumbersYPos = xAxis !== undefined ? xAxis.pos : (gridSettings.center[1] > 0 ? -height - 2: height + 2); // the 2nd tertiary operator checks if x axis is below or above screen. If it is below, x nums should stick to bottom of screen. Otherwise, to top.
    xNumbersYPos = clamp(xNumbersYPos, 10, height-20)

    // make a list of x gridlines
    //let xGridLines = [];
    let xGridLines = gridInfo.xLines.map((item) => {
     // console.log(item.value)
      // see react conditional rendering docs for explanation of the Text && bit.
      let strokeWidth = 0.3;
      if (item.lineNum % 5 == 0) {
        strokeWidth = 0.6;
      }
      if (item.lineNum == 0) {
        strokeWidth = 2;
      }

      return (
        <div>
          {(item.lineNum % 5 == 0 && item.lineNum !== 0) && <Text verticalAlign={"middle"} align={"center"} x={item.pos-30} y={xNumbersYPos-10} width={60} height={20} text={item.value.toString()} 
          fontSize={10} fontFamily={'Calibri'} fill={'black'}/>} 
          <Line points={[item.pos,0,item.pos,height]} stroke={"black"} strokeWidth={strokeWidth} key={item.pos}/>
        </div>      
      )
    })
    let yGridLines = gridInfo.yLines.map((item) => {
      return <Line points={[0,item.pos,width,item.pos]} stroke={"black"} strokeWidth={item.lineNum === 0 ? 2 : 0.3} key={item.pos}/>
    })

    

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
            {yGridLines}
            <Line points={getLinePoints(width,height,
              gridInfo.unitScreenBounds.left,
              gridInfo.unitScreenBounds.right,
              gridInfo.unitScreenBounds.bottom,
              gridInfo.unitScreenBounds.top, 
              testFunctionEvaluator)} strokeWidth={1} stroke={"red"}/>
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
