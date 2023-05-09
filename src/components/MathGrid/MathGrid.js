import React from 'react';
import 'tachyons';
import { Stage, Layer, Rect, Circle, Line, Text, Group, Path } from 'react-konva';
import Konva from 'konva'
import {clamp, Vector, getLinePoints, getLinePoints_v2, getLinePoints_v3, testFunctionEvaluator, strip, pointsToSVG} from '../../algorithms/utilities'
import 'big-js';
import { withResizeDetector } from 'react-resize-detector';
import {ReactComponent as ZoomIn} from '../../assets/zoom_in.svg';
import {ReactComponent as ZoomOut} from '../../assets/zoom_out.svg';
import {ReactComponent as Home} from '../../assets/home.svg';
import {ReactComponent as Settings} from '../../assets/settings.svg';
import './MathGrid.css'
import constants from '../../constants';
import {Popup, Checkbox, Label, Divider} from 'semantic-ui-react';
import { Slider } from "react-semantic-ui-range";

class MathGrid extends React.Component {
  constructor(props) {
	super(props)
	this.state = {
	  width: 500,
	  height: 500,
	  isSettingsOpen: false,
	  isSettingsFading: null,
	  gridSettings: {
		scale: 1, //normal scale. 2 means 2x zoomed in.
		center: [0,0] //centre of screen
	  },
	  showGridlines: true,
	  showLabels: true,
	  showAxes: true
	}
	this.containerDiv = React.createRef();
	this.mousePos = [0,0];

	this.labelFontSize = 14;

	this.zoomSpeedMultiplier = 0.0005;

	// grid buttons logic
	this.zoomInterval = 0;
	this.zoomOutInterval = 0;
	this.zoomFactor = 1.00;
	this.ZOOM_FACTOR_DEFAULT = 1.0;
	this.ZOOM_FACTOR_DELTA = 0.0003;
  }
  
  componentDidMount = () => {
	this.calculateSize();

	// !!!! replace with listener for div resize once you add in minimising of right window https://web.dev/resize-observer/
	// window.addEventListener("resize", this.calculateSize);
  }

  componentWillUnmount = () => {
	window.removeEventListener("resize", this.calculateSize);
  }

  componentDidUpdate(prevProps) {
    const { width, height } = this.props; // from imported resize detector module
	
	if (width !== prevProps.width || height !== prevProps.height) {
		this.calculateSize()
	}
  }

  calculateSize = () => {
	this.setState({width:this.containerDiv.current.clientWidth, 
	  height:this.containerDiv.current.clientHeight});
  }

  pixelsToUnits = (px, gridSpacing, gridJump) => {
	return px / gridSpacing * gridJump;
  }

  unitsToPixels = (units, gridSpacing, gridJump) => {
	return units / gridJump * gridSpacing
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

  getGridJumpAndSpacing(scale) {
	const MIN_GRID_SPACING = 14; //px
	const MAX_GRID_SPACING = MIN_GRID_SPACING*2.5; //px
	const IDEAL_GRID_SPACING = (MIN_GRID_SPACING + MAX_GRID_SPACING) / 2; //px


	// grid jump is the amount of units between 2 grid lines. grid spacing is the amount of pixels between 2 grid lines.

	// these are all like magic numbers, make it more clearly documented

	// let gridSpacing = IDEAL_GRID_SPACING / scale;

	// let gridJump = 1; // the unit spacing between 2 grid lines
	// let jumpCount = 0; // on the -8, -5, -2 qnd 2, 5, 8... jumps, its a 2.5x jump
	// let getJumpAmount = (jumpCount) => (Math.abs(jumpCount) - 2) % 3 == 0 ? 2.5 : 2

	// // calculate variables relevant to scaling both x and y of grid. can optimise to no loop and just a math equation later
	// while (gridSpacing > MAX_GRID_SPACING) {
	//   jumpCount--;
	//   let jumpAmount = getJumpAmount(jumpCount)
	//   gridSpacing /= jumpAmount;
	//   gridJump /= jumpAmount
	// }
	// while (gridSpacing < MIN_GRID_SPACING) {
	//   jumpCount++;
	//   let jumpAmount = getJumpAmount(jumpCount)
	//   gridSpacing *= jumpAmount;
	//   gridJump *= jumpAmount
	// }
	// return {gridJump: gridJump, gridSpacing: gridSpacing}

	
	// version 2 - keep version 1 for how it actually works and if any errors crop up, but this is way faster
	// this is for when gridSpacing is bigger than max spacing
	let unclampedGridSpacing = IDEAL_GRID_SPACING / scale;
	let clamp10 = Math.pow(10, Math.ceil(Math.log10(unclampedGridSpacing/MAX_GRID_SPACING)))
	let gridSpacing = unclampedGridSpacing / clamp10

	if (gridSpacing < MIN_GRID_SPACING / 2) {
	  gridSpacing *= 5
	}
	else if (gridSpacing <= MIN_GRID_SPACING) {
	  gridSpacing *= 2
	}
	let gridJump = gridSpacing / unclampedGridSpacing

	return {gridJump: gridJump, gridSpacing: gridSpacing}
  }

  calculateGridInfo = (gridSettings, posInfo) => {
	// move these constants into fields and allow them to be set as props (just for fun)
	let {scale, center} = gridSettings;
	let {gridJump, gridSpacing} = this.getGridJumpAndSpacing(gridSettings.scale)
	
	// X LINES
	let earliestXLine = this.calculateEarliestLineFromAxis(center[0], posInfo.hw, gridSpacing)
	let xLines = this.getGridLinesFromInitial(earliestXLine.offset, earliestXLine.line, gridJump, gridSpacing, posInfo.width)
	
	// Y LINES
	let earliestYLine = this.calculateEarliestLineFromAxis(center[1], posInfo.hh, gridSpacing)
	let yLines = this.getGridLinesFromInitial(earliestYLine.offset, earliestYLine.line, gridJump, gridSpacing, posInfo.height)
	
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
	// can change later to use pixels to units function.

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

	// can move screenbound and offset lines outside of if statement to reduce duplication
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

  getClampedScale = (unclampedScale) => {
	return Math.max(0.0001, unclampedScale);
  }

  // deviations are from centre, with down as +y and right as +x
  zoom = (factor, xDeviation, yDeviation, isZoomIn) => {
	this.setState((prevState) => {
		//let speed = SPEED_MULTIPLIER * prevState.gridSettings.scale
		let newScale = this.getClampedScale(prevState.gridSettings.scale * factor);
		let newCenter;
  
		let mouseX = prevState.gridSettings.center[0] + xDeviation; //- prevState.width/2 + this.mousePos[0];
		let mouseY = prevState.gridSettings.center[1] + yDeviation; //- prevState.height/2 + this.mousePos[1];
		let dist = Math.sqrt(Math.pow(mouseX,2) + Math.pow(mouseY,2))
  
		if (dist < 20 && isZoomIn) { // if mouse is close to (0, 0) and zooming in, just zoom on (0, 0) for convenience because that's what user likely intended.
		  newCenter = prevState.gridSettings.center
		}
		else {
		  let pxSettingsOld = this.getGridJumpAndSpacing(prevState.gridSettings.scale)
		  let pxSettingsNew = this.getGridJumpAndSpacing(newScale)
  
		  // convert centre to units
		  let unitMouseCoord = [mouseX, mouseY].map((x) => this.pixelsToUnits(x, pxSettingsOld.gridSpacing, pxSettingsOld.gridJump))
		  let newPxMouseCoords = unitMouseCoord.map((x) => this.unitsToPixels(x, pxSettingsNew.gridSpacing, pxSettingsNew.gridJump))
  
		  newCenter = [
			newPxMouseCoords[0] - xDeviation, //+ prevState.width/2 - this.mousePos[0],
			newPxMouseCoords[1] - yDeviation //+ prevState.height/2 - this.mousePos[1]
		  ]
		}
  
		return {gridSettings: {
		  ...prevState.gridSettings,
		  scale: newScale,
		  center: newCenter
		}}
	  })
  }

  handleWheel = (e) => {
	// add detection of when touchpad or mouse.
	let nativeEvent = e.evt

	this.zoom(1 + nativeEvent.deltaY * this.zoomSpeedMultiplier, -this.state.width/2 + this.mousePos[0], - this.state.height/2 + this.mousePos[1], nativeEvent.deltaY < 0)
   // console.log(nativeEvent.deltaY)
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
  }

  getGridLineJSX(lineInfo, axis, width, height, numberPos) {
	let isMajor = lineInfo.lineNum % 5 == 0 && lineInfo.lineNum !== 0
	// points
	let points;
	if (axis === "x") points = [lineInfo.pos,0,lineInfo.pos,height];
	if (axis === "y") points = [0,lineInfo.pos,width,lineInfo.pos]; //add width and height vars to func

	// thickness
	let strokeWidth = 0.1;
	if (isMajor) strokeWidth = 0.6;
	if (lineInfo.lineNum == 0) strokeWidth = 2;

	// unique identifier
	let key = lineInfo.lineNum//lineInfo.pos+axis.charCodeAt(0)
	
  
	// color
	let color = "#767676"
	if (isMajor) color = "#6e6e6e";
	if (lineInfo.lineNum == 0) color = "#404040";
	
	// attached text label
	// let text = false; // false in JSX results in react just skipping it
	// if (isMajor) {
	//   let pos = [lineInfo.pos, numberPos];
	//   if (axis == "y") pos.reverse();

	//   text = <Text 
	//     verticalAlign={"middle"} 
	//     align={"center"} 
	//     x={pos[0]-30} 
	//     y={pos[1]-10}
	//     width={60} 
	//     height={20} 
	//     text={strip(lineInfo.value.toString())} 
	//     fontSize={10} 
	//     fontFamily={'Calibri'} 
	//     fill={'black'} 
	//     fillAfterStrokeEnabled={true} //allows for outline of 1/2 stroke width
	//     stroke={'white'}
	//     strokeWidth={3}
	//     key={key+1} //+1 to make it unique
	//     zIndex={2}
	//   />
	// }


	// add in rendering of '0' only if both axes visible.

	// see react conditional rendering docs for explanation of the Text && bit.
	return (
		<Line points={points} stroke={color} strokeWidth={strokeWidth} key={key} 
		perfectDrawEnabled={false} listening={false} shadowForStrokeEnabled={false} strokeHitEnabled={false}/>
	)
  }

  getLineLabelJSX(lineInfo, axis, alternateAxisPos, axisOffscreen) {
	const WIDTH = 100;
	const HEIGHT = 100;

	let isMajor = lineInfo.lineNum % 5 == 0 && lineInfo.lineNum !== 0

	let text = false; // false in JSX results in react just skipping it
	if (isMajor) {
	  let pos = [lineInfo.pos, alternateAxisPos];
	  if (axis == "y") pos.reverse();

	  let alignment;
	  if (axis == "x") alignment = {
		verticalAlign: "top",
		align: "center",
		xOffset: -WIDTH/2,
		yOffset: this.labelFontSize / 2
	  };
	  else alignment = {
		verticalAlign: "middle",
		align: "right",
		xOffset: -WIDTH - this.labelFontSize / 2,
		yOffset: -HEIGHT/2
	  };

	  let str;
	  if (false) { //(scale > 500000) {
		str = strip(lineInfo.value).toExponential()
		str = str.replace("e+", "x10^")
	  }
	  else str = strip(lineInfo.value.toString());

	  text = <Text 
		verticalAlign={alignment.verticalAlign} 
		align={alignment.align} 
		x={pos[0]+alignment.xOffset} 
		y={pos[1]+alignment.yOffset}
		width={WIDTH} 
		height={HEIGHT} 
		
		text={str} 
		fontSize={this.labelFontSize} 
		fontFamily={'Calibri'} 
		fill={axisOffscreen ? '	#696969':'black'} 
		fillAfterStrokeEnabled={true} //allows for outline of 1/2 stroke width
		stroke={'white'}
		strokeWidth={2}
	  />
	}

	return text
  }

  zoomInHeld = (direction, e) => {
	this.zoomInterval = setInterval(() => this.directZoom(direction), 10);
	e.nativeEvent.target.setPointerCapture(e.nativeEvent.pointerId)
  }

  zoomInReleased = (e) => {
	clearInterval(this.zoomInterval);
	this.zoomFactor = this.ZOOM_FACTOR_DEFAULT
	
	e.nativeEvent.target.releasePointerCapture(e.nativeEvent.pointerId)
  }

  directZoom = (direction) => {
	// console.log(this.getClampedScale(this.state.scale))
	this.zoom(this.zoomFactor, 0, 0, false) // we never want it to zoom directly on center, so we set isZomIn to false

	if (direction==="in") this.zoomFactor -= this.ZOOM_FACTOR_DELTA
	else this.zoomFactor += this.ZOOM_FACTOR_DELTA
	this.zoomFactor = clamp(this.zoomFactor, this.ZOOM_FACTOR_DEFAULT - 0.2, this.ZOOM_FACTOR_DEFAULT + 0.2); // 
  }

  resetGrid = () => {
	this.setState({
		gridSettings: {
			scale: 1,
			center: [0,0]
		}
	})
  }

  flipSettings = () => {
	clearTimeout(this.state.isSettingsFading)
	this.setState(prevState => ({
		isSettingsOpen: !prevState.isSettingsOpen,
		isSettingsFading: setTimeout(() => this.setState({isSettingsFading: null}), 1000)
	}))

	
  }
  
  onZoomMultiplierChange = (val) => {
	this.zoomSpeedMultiplier = 0.0001 + ((0.001 - 0.0001) * (val/100))
  }
  
  render () {
	// console.log(this.props.lineEquations)

	let {width, height, gridSettings} = this.state
	let posInfo = this.calculatePosInfo(width, height)
	let gridInfo = this.calculateGridInfo(gridSettings, posInfo);

	let yAxis = gridInfo.xLines.filter((line) => line.lineNum === 0)[0] // if main X line is not on the screen, this is undefined
	let xAxis = gridInfo.yLines.filter((line) => line.lineNum === 0)[0] // as above
	
	const OFFSET = 0;
	let xNumbersYPos = xAxis !== undefined ? clamp(xAxis.pos, OFFSET, height-this.labelFontSize*1.5-OFFSET) : (gridSettings.center[1] > 0 ? OFFSET: height-this.labelFontSize*1.5-OFFSET); // the 2nd tertiary operator checks if x axis is below or above screen. If it is below, x nums should stick to bottom of screen. Otherwise, to top. Fix magic numbers
	let yNumbersXPos = yAxis !== undefined ? clamp(yAxis.pos, 20, width-OFFSET) : (gridSettings.center[0] > 0 ? 20: width-OFFSET); // the 2nd tertiary operator checks if x axis is left or right screen. If it is right, y nums should stick to right of screen. Otherwise, to top. Fix magic numbers
	
	// make a lists gridlines
	let filteredXLines = gridInfo.xLines;
	let filteredYLines = gridInfo.yLines;
	if (!this.state.showGridlines && this.state.showAxes) {
		filteredXLines = gridInfo.xLines.filter(item => item.value === 0)
		filteredYLines = gridInfo.yLines.filter(item => item.value === 0)
	}
	else if (!this.state.showGridlines && !this.state.showAxes) {
		filteredXLines = [];
		filteredYLines = [];
	}
	let xGridLines = filteredXLines.map((item) => this.getGridLineJSX(item, "x", width, height, xNumbersYPos))
	let yGridLines = filteredYLines.map((item) => this.getGridLineJSX(item, "y", width, height, yNumbersXPos))
	let xLabels = gridInfo.xLines.map((item) => this.getLineLabelJSX({...item, pos: item.pos - (item.value < 0 ? 2 : 0)}, "x", xNumbersYPos, xAxis == undefined)) // negative values are offset slightly left so the label is centered on the number only, ignoring - sign
	let yLabels = gridInfo.yLines.map((item) => this.getLineLabelJSX({...item, value: -item.value}, "y", yNumbersXPos, yAxis == undefined)) // values of y lines are in reverse of what they should be, so we reverse them again here.


	// the only problem with labels now is the y axis left offset when axis are not on screen. Then numbers can be cut off screen.

	// line
	let lines = [];
	// console.log(this.props.lineEquations)
	for (let i = this.props.lineEquations.length-1; i >= 0; i--) { // draw lines in reverse order so earliest line on top
		let equationFunc = this.props.lineEquations[i][0];

		let line = getLinePoints_v3(width,height,
			gridInfo.unitScreenBounds.left,
			gridInfo.unitScreenBounds.right,
			gridInfo.unitScreenBounds.bottom,
			gridInfo.unitScreenBounds.top, 
			equationFunc)

		let lineJSX = line.map(linePoints => {
			//console.log(linePoints)
			return <Line points={linePoints} strokeWidth={3} stroke={constants.equationColors[Math.min(this.props.lineEquations[i][1], constants.equationColors.length-1)]} perfectDrawEnabled={false} listening={false} shadowForStrokeEnabled={false} strokeHitEnabled={false}/>		
		})

		lines.push(lineJSX)
	}

	
	let gridLines = <>
		{xGridLines}
		{yGridLines}
	</>
	let labels = !this.state.showLabels ? false : <>
		{xLabels}
		{yLabels}
	</>

	let sliderSettings = {
		start: 50,
		min: 0,
		max: 100,
		onChange: this.onZoomMultiplierChange
	}
	return (
	  <div ref={this.containerDiv} className='w-100 h-100' style={{position:'relative'}}>
		<Stage 
		  width={width} 
		  height={height} 
		  style={{position:'absolute', top:0, left:0}}
		  onWheel = {this.handleWheel}
		  onMouseMove={this.handleMouseMove}
		>
		  <Layer listening={false}>
		  	{xGridLines}
			{yGridLines}
			{labels}
			{/* <Path x={0} y={0} stroke={"brown"} strokeWidth={3} data={svg}/> */}
			{/* <Line points={points} strokeWidth={1} stroke={"brown"} perfectDrawEnabled={false} listening={false} shadowForStrokeEnabled={false} strokeHitEnabled={false}/> */}
			
		  </Layer>
		  <Layer>
			{lines.flat()}
			
		  </Layer>
		</Stage>
		<div className="floatingButton" style={{position:"absolute", right:"10px", top: "10px", }}>
			<Popup
				trigger={<Settings width={20} height={20} onClick={this.flipSettings}/>}
				position='bottom right'
				open={this.state.isSettingsOpen || this.state.isSettingsFading}
				style={{marginRight: "0px", position:"relative", left :"10px", top:"2px"}}
				className = {`transition fade ${this.state.isSettingsOpen ? 'in' : 'out'}`}
			>
				<div className='flex items-right flex-column'>
					<Checkbox toggle={true} label={"Show grid lines"} onChange={(e, {checked})=> this.setState({showGridlines: checked, showAxes: true})} checked={this.state.showGridlines} className='pa1'/>
					<Checkbox toggle={true} label={"Show axes"} checked={this.state.showAxes} onChange={(e, {checked})=> this.setState({showAxes: checked})} className='pa1' disabled={this.state.showGridlines}/>
					<Checkbox toggle={true} label={"Show labels"} onChange={(e, {checked})=> this.setState({showLabels: checked})} checked={this.state.showLabels} className='pa1'/>
					<Divider/>
					<Label content="Zoom Sensitivity" /> 
					<input style={{marginTop:"5px"}} type={"range"} min="0" max="100" className="slider" onChange={e => this.onZoomMultiplierChange(e.target.value)}/>
				</div>
			</Popup>
        </div>
		
		<div className="floatingButton" style={{position:"absolute", right:"10px", bottom: "10px", }}>
            <ZoomIn width={20} height={20} onPointerDown={(e) => this.zoomInHeld("in", e)} onPointerUp={this.zoomInReleased}/>
        </div>
		<div className="floatingButton" style={{position:"absolute", right:"10px", bottom: "45px", }}>
            <ZoomOut width={20} height={20} onPointerDown={(e) => this.zoomInHeld("out", e)} onPointerUp={this.zoomInReleased}/>
        </div>
		<div className="floatingButton" style={{position:"absolute", right:"10px", bottom: "80px", }}>
            <Home width={20} height={20} onClick={this.resetGrid}/>
        </div>
	  </div>
	)
	//https://stackoverflow.com/questions/65433710/how-to-set-stage-width-and-height-to-100-react-konva
  }
}

export default withResizeDetector(MathGrid);



// TO DO - final grid touchups. After this grid fully done. !!!DO THESE LAST, IT IS INEFFECTIVE TO PERFECT IT NOW!!! Almost perfect is what you should aim for.
// fix scrolling difference with mouse (100) and trackpad. Will have to detect device or make algo to make value look reasonable. 
// make scale speed not linear, check desmos for ideas (faster as you zoom out, slower as you zoom in)

// add in exponential labels when numbers get very big or very small, and expand the zoom range.

// fix y label left justify
// potentially change label font

// potentially make all things to the same number of decimal places

// TO DO - more significant:
// fix problems with the line drawing function in utilities
// improve performance!! You can optimise a lot of things, like gridJump
// improve commenting and magic numbers and variable names, especially for gridJump. Remove spaghetti code.



// make grid labels not say .00001 --> DONE
// make scaling on mouse work at small distances --> DONE

// make grid scaling not by 2 each time --> done
// These are the scales These are big grid line intervals with text. Note they follow a pattern (from 1): x2, x2.5, x2
// 0.05
// 0.1
// 0.2 
// 0.5
// 1
// 2
// 5
// 10
// 20
// 50
// 100

// normal: you've zoomed in until grid lines twice as big in pixels, and now you want to halve spacing and make nums 2x smaller
// new: you zoom in until grid lines 2x as big, now you want to make nums 2.5x smaller. To do this, you have to 
// move the center. so it is still in the same unit value. You don't divide center by 2.5
// since you're also decreasing pixel scale by 2.I think you divide by 2.5/2 = 5/4 = 1.25
// don't delete these comments, will help you write explanatory code later.



// you have to use performance analysers to find what takes the most time - i think its something easily fixable, not
// the functionevaluator or anything crucial






///OLD SCALING CODE
// get mouse pos from centre
// let mouseX = prevState.gridSettings.center[0] - prevState.width/2 + this.mousePos[0] ;
// let mouseY = prevState.gridSettings.center[1] - prevState.height/2 + this.mousePos[1];
// let mouseToCentreVec = new Vector(mouseX, mouseY);


// // center[0] + (center[0] - prevState.width/2 + this.mousePos[0]) * nativeEvent.deltaY * speedMultiplier

// console.log(prevState.gridSettings.center, mouseToCentreVec)
// // scale to offset size
// // (prevScale + nativeEvent.deltaY * SPEED_MULTIPLIER * prevScale) / prevScale - 1
// // 
// //let s = (new Big(newScale)).div(new Big(prevState.gridSettings.scale)).minus(new Big(1))
// //mouseToCentreVec.scale(s)//newScale / prevState.gridSettings.scale - 1)

// if (newScale !== 0.001){
//   mouseToCentreVec.scale(nativeEvent.deltaY * SPEED_MULTIPLIER); // this is simplified version of newScale/oldscale -1
// }
// else {
//   mouseToCentreVec.scale(0);
// }
// mouseToCentreVec.flip()

// //let screenCentreVec = new Vector(prevState.width/2, prevState.height/2);
// let newCentre = [prevState.gridSettings.center[0] + mouseToCentreVec.x, prevState.gridSettings.center[1] + mouseToCentreVec.y]
// console.log(mouseToCentreVec)