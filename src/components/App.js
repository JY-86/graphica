import './App.css';
import React from 'react';
import 'tachyons';
import MathBar from './MathBar/MathBar.js';
import MathGrid from './MathGrid/MathGrid.js';
import FPSStats from "react-fps-stats";

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      equations: ""
    }
  }
  
  render () {
    return (
      <div style={{height:"100%", display:"flex", flexDirection:'column'}}>
          <div style={{height:'min(10vh, 50px)'}} id="header" className='h-100 flex flex-row justify-between items-center pa3 bg-dark-gray'>
            <div>Sign In</div>
            <div>
              Desmos
            </div>
            <div>
              Help
            </div>
          </div>
          <div id="body" className='h-100 flex justify-start flex-row'>
              <div id="math-bar" style={{width:"max(min(33%, 450px), 200px)"}}>
                <MathBar/>
              </div>
              <div id="grid" className='flex h-100' style={{flexGrow:'1'}}>
                <MathGrid/>
              </div>
          </div>
          <FPSStats/>
      </div>
    )
  }
}

export default App;
