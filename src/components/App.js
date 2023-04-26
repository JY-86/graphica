import './App.css';
import React from 'react';
import 'tachyons';
import MathBar from './MathBar/MathBar.js';
import MathGrid from './MathGrid/MathGrid.js';
import FPSStats from "react-fps-stats";
import GridWrapper from './GraphingWrapper/GraphingWrapper';
import constants from '../constants';
import {ReactComponent as Logo} from '../assets/logo_extended_white.svg'
import {ReactComponent as Save} from '../assets/save.svg';
import {ReactComponent as Load} from '../assets/load.svg';
// import {ReactComponent as Screenshot} from '../assets/screenshot.svg';
import {ReactComponent as Screenshot} from '../assets/fullscreen_systemcontrol_edited.svg';
import {ReactComponent as Help} from '../assets/help.svg';
import 'semantic-ui-css/semantic.min.css';
import ReactPlayer from 'react-player';
import logoStartup from '../assets/multimedia/logo_animation.mp4';
import helpGridMovement from '../assets/multimedia/help_video_samples/help_grid_movement.mp4';
import logoStartupSound from '../assets/multimedia/logo_animation_audio.mp3';
import useSound from 'use-sound';
import { Checkbox, Modal, Message, Divider, Form, Button } from 'semantic-ui-react';


var { fs } = window;

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      videoPlaying: true,
      opacityFade: null,
      isCheckboxShown: false,
      open: "",
      screenshotError: "",
      screenshotFieldVal: "",
    }

    this.logoSound = new Audio(logoStartupSound)
    this.settings = {}
    this.modalMount= null;

    this.screenshot = null;
    
  }

  setLatex = (field, latex) => {
    this.setState(prevState => ({latex: {...prevState.latex, [field]: latex}}))
    console.log(this.state.latex)
  }
  
  getEvaluatorFunctions(latex) {

  }

  componentDidMount() {
    // find whether user has checked that he does not want to see the logo anymore
    try {
      this.settings = JSON.parse(fs.readFileSync('./settings.json', { encoding:'utf8'}))
    }
    catch (e) {
      console.log("Could not read file", e)
    }

    if (this.settings.playIntro === false) {
      this.setState({videoPlaying: false})
    }
    else {
      this.logoSound.play();
    }

    // show checkbox only after 6 seconds
    setTimeout(() => this.setState({isCheckboxShown: true}), 7500)
  }

  logoPlayEnded = () => {
    this.setState({
      videoPlaying: false,
      opacityFade: setTimeout(() => this.setState({opacityFade: null}), 1000)
    })
  }
  
  introStatusChange = (checked) => {
    console.log("Ran")
    this.settings.playIntro = !checked;
    try {
      fs.writeFileSync('./settings.json', JSON.stringify(this.settings), 'utf8')
    }
    catch (e) {
      console.log("Error writing user settings: ", e)
    }
  }

  screenshotFormSubmit = (e, b) => {
    e.preventDefault();
    
    let message = ""
    if (this.state.screenshotFieldVal.length === 0) {
      message = "Please enter a file name"
    }
    else if (this.state.screenshotFieldVal.trim().length !== this.state.screenshotFieldVal.length) {
      message = "Your file name cannot contain spaces. There are leading or trailing spaces present."
    }
    else if (this.state.screenshotFieldVal.includes(" ")) {
      message = "Please enter a file name without spaces"
    }

    if (message == "") {
      this.setState({screenshotError: "", open:""})

      // save
      try {

      }
      catch {

      }
    }
    else {
      this.setState({screenshotError: message})
    }
    console.log(b)
  }

  handleScreenshotChange = (e) => {
    console.log(this.state.screenshotFieldVal, e.target.value)
    this.setState({screenshotFieldVal: e.target.value})
  }

  render () {
    let videoPlayer = (
      <div style={{position:'absolute', zIndex:5, width:"100%", height:"100%"}} className={this.state.opacityFade ? 'opacityFade' : ''}>
        <div style={{height:'35px', backgroundColor: constants.titleBarColor, position:'relative'}}  />
        <div style={{height:'100%', backgroundColor: "white", width:'100%'}} className='flex justify-center items-center'>
          <ReactPlayer playing={true} url={logoStartup} controls={false} width={'60%'} height={'80%'} style={{borderColor:'white', borderWidth:'5px'}} onEnded={this.logoPlayEnded}/>
          <Checkbox style={{position:"absolute", right:"10px", bottom:"10px"}} label={"Don't show again"} onChange={(e, {checked}) => this.introStatusChange(checked)} className={this.state.isCheckboxShown ? 'opacityGrow' : 'opacityZero'}/>
        </div>
      </div>
    );

    let header = this.state.open === "" ? (
      <div id="header"  
        style={{height:'35px', backgroundColor: constants.titleBarColor, position:'relative'}}  
        className='h-100 flex flex-row justify-between items-center pa2'
      >
        <div>
          <Save width={25} height={25} className="noDrag" fill={constants.titleBarSymbolColor} stroke={constants.titleBarSymbolColor}/>
          <Load width={25} height={25} className="noDrag" fill={constants.titleBarSymbolColor} stroke={constants.titleBarSymbolColor}/>
        </div>
        <Logo height={20} width={100} style={{ position:"absolute", left:"50%", top:"8px"}}/>
        <div>
          <Screenshot width={25} height={25} className="noDrag" onClick={() => this.setState({open: "screenshot"})} fill={constants.titleBarSymbolColor} stroke={constants.titleBarSymbolColor}/>
          <Help width={25} height={25} onClick={() => this.setState({open: "help"})} className="noDrag" fill={constants.titleBarSymbolColor} stroke={constants.titleBarSymbolColor}/>
          <div style={{width:"200px"}} />
        </div>

      </div>
    ) : (
      <div id="header" 
        style={{height:'35px', backgroundColor: constants.titleBarColor, position:'relative', zIndex:"999999"}}  
        className='h-100 flex flex-row justify-center items-center pa2'
      >
        {/* <Logo height={20} width={100} style={{ position:"absolute", left:"50%", top:"8px"}}/> */}
      </div>
    )

    let body = (<div ref={ref => this.modalMount = ref} style={{height:"100%"}}>
      <GridWrapper/>
    </div>)


    // Zooming and Panning the Grid
    // Grid Settings and Buttons
    // Equation Bar
    // Header Bar
    // Equations
    // Handling the grid
    // Zooming and
    let helpModal = (<>
      <Modal basic style={{width:"70%", marginTop:"10vh"}} centered={false} open={this.state.open === "help"} closeIcon={true} closeOnDimmerClick={false} closeOnEscape={true} dimmer={'dimmer'} onClose={() => this.setState({open: ""})} mountNode={this.modalMount}>
        <Modal.Header><div style={{width:"100%", display:"flex", justifyContent:"center"}}>Help</div></Modal.Header>
        <Modal.Content>
          <Message>
            <Message.Header>Grid Control - Zooming and Panning</Message.Header>
            <Divider/>
            <div style={{display:"grid", gridAutoFlow:"column", gridAutoColumns:"2fr 1fr"}}>
              <div style={{marginRight:"10px"}}>
                <p>
                  There are two main ways to control the grid - zooming and panning.
                </p>
                <p>
                  If you have a mouse available, you can use the scrolwheel to zoom. Otherwise, pinch the
                  trackpad with two fingers to zoom out or in. To pan, left click on your mouse or trackpad and drag the grid.
                </p>
                <p>
                  There are also helpful buttons in the bottom right of the screen. 
                </p>
                <ul>
                  <li><p>Zooming in is controlled by the magnifiying glass with a  plus symbol. Holding down the button will zoom in at an accelerating rate.</p></li>
                  <li><p>Zooming out is controlled by the magnifying glass  with a minus symbol. Holding down the button will zoom out at an accelerating rate.</p></li>
                  <li><p>Pressing the home button will reset the grid to the default view.</p></li>
                </ul>
              </div>
              <div style={{padding:"0px 20px 10px 10px"}}>
                <ReactPlayer loop={true} playing={true} url={helpGridMovement} controls={false} width={'100%'} height={'100%'} style={{boxShadow:"0px 0px 5px 1px rgba(0,0,0,0.2)"}}/>
              </div>
            </div>
          </Message>
          <Message>
            <Message.Header>Grid Settings</Message.Header>
            <p>
              This is an example of expanded content that will cause the modal's
              dimmer to scroll.
            </p>
            <p>
              This is an example of expanded content that will cause the modal's
              dimmer to scroll.
            </p>
            <ReactPlayer loop={true} playing={true} url={helpGridMovement} controls={false} width={'200px'} height={'200px'} style={{borderColor:'black', borderWidth:'2px'}}/>
          </Message>
          <Message>
            <Message.Header>Grid Settings</Message.Header>
            <p>
              This is an example of expanded content that will cause the modal's
              dimmer to scroll.
            </p>
            <p>
              This is an example of expanded content that will cause the modal's
              dimmer to scroll.
            </p>
            <ReactPlayer loop={true} playing={true} url={helpGridMovement} controls={false} width={'200px'} height={'200px'} style={{borderColor:'black', borderWidth:'2px'}}/>
          </Message>
          <Message>
            <Message.Header>Grid Settings</Message.Header>
            <p>
              This is an example of expanded content that will cause the modal's
              dimmer to scroll.
            </p>
            <p>
              This is an example of expanded content that will cause the modal's
              dimmer to scroll.
            </p>
            <ReactPlayer loop={true} playing={true} url={helpGridMovement} controls={false} width={'200px'} height={'200px'} style={{borderColor:'black', borderWidth:'2px'}}/>
          </Message>
        </Modal.Content>
      </Modal>
      </>);

      // save screenshot modal
      let screenshotModal = (<>
        <Modal style={{width:"70%", marginTop:"10vh"}} centered={false} open={this.state.open === "screenshot"} closeIcon={true} closeOnDimmerClick={false} closeOnEscape={true} dimmer={'dimmer'} onClose={() => this.setState({open: ""})} mountNode={this.modalMount}>
          <Modal.Header><div style={{width:"100%", display:"flex", justifyContent:"center"}}>Save Screenshot</div></Modal.Header>
          <Modal.Content>
            <Form error={this.state.screenshotError !== ""} onSubmit={this.screenshotFormSubmit}>
              <br/>
              <Form.Field>
                <label>File Name</label>
                <input placeholder='Enter File Name' onChange={this.handleScreenshotChange}/>
              </Form.Field>
              <Message
                error
                header='Invalid Input'
                content={this.state.screenshotError}
              />
              <br/>
              <div style={{width:"100%", display:"flex", justifyContent:"center"}}><Button type='submit'>Save</Button></div>
            </Form>
          </Modal.Content>
        </Modal>
        </>);

    return (<>
      
      {(this.state.videoPlaying || this.state.opacityFade) && videoPlayer}
      <div style={{height:"100%", display:"flex", flexDirection:'column'}}>
          {header}
          {body}
          {helpModal}
          {screenshotModal}
          {/* <div style={{height:'min(10vh, 50px)'}} id="tabs" className='h-100 flex flex-row justify-between items-center pa3 bg-dark-gray'>
          
          </div> */}
          {/* <FPSStats/> */}
      </div>
    </>)
  }
}

export default App;


// https://www.codiga.io/blog/custom-electron-titlebar-part-1/