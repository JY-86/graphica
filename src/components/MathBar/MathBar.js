import React from 'react';
import 'tachyons';
import { addStyles, EditableMathField } from 'react-mathquill'
import '../ImageButton/ImageButton';
import ImageButton from '../ImageButton/ImageButton';
import EquationInput from '../EquationInput/EquationInput';
import {ReactComponent as Plus} from '../../assets/plus.svg';
import {ReactComponent as Undo} from '../../assets/undo.svg';
import {ReactComponent as Redo} from '../../assets/redo.svg';
import {ReactComponent as Collapse} from '../../assets/collapse_window.svg';
import {ReactComponent as Expand} from '../../assets/restore_window.svg';
import { ReactComponent as Info } from '../../assets/equation_drawn.svg';
import constants from '../../constants';
import './MathBar.css'

class MathBar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isCollapsed: false
    }

    this.mathQuillConfig = {
        spaceBehavesLikeTab: false,
        leftRightIntoCmdGoes: 'up',
        restrictMismatchedBrackets: true,
       // sumStartsWithNEquals: true,
        supSubsRequireOperand: true,
        charsThatBreakOutOfSupSub: '+-=<>',
        autoSubscriptNumerals: true,
        autoCommands: 'pi theta sqrt sum cot csc phi sec',// breaks everything for some reason
        autoOperatorNames: 'sin cos sqrt',
        maxDepth: 10,
        // substituteTextarea: function() {
        //     return document.createElement('textarea');
        // }
        // handlers: {
        //     edit: function(mathField) { ... },
        //     upOutOf: function(mathField) { ... },
        //     moveOutOf: function(dir, mathField) { if (dir === MQ.L) ... else ... }
        // }
    } 

    this.history = [[]];
    this.historyIdx = 0;

    this.MAX_EQUATIONS = 5;

    addStyles()
  }

  componentDidUpdate(prevProps) {
    
    if (this.props.equations !== prevProps.equations) {
      let latex = this.props.equations.map(x => x.latex).filter(x => x !== undefined)
      // console.log(latex, this.history, this.history[this.historyIdx], this.historyIdx)
      // console.log(this.history[this.historyIdx], latex, this.compareArrs(this.history[this.historyIdx], latex))
      console.log(this.historyIdx, this.history, latex)
      if (!this.compareArrs(this.history[this.historyIdx], latex)) {
        
        this.history = this.history.slice(0, this.historyIdx+1)
        this.history.push(latex)
        this.historyIdx = this.history.length-1 
        console.log("CHANGING: ", this.history, this.historyIdx)
        this.forceUpdate()
      }
      // console.log(this.history)
    }
  }

  compareArrs(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    let equal = true;
    arr1.forEach((x,i) => {
      if (x !== arr2[i]) equal = false;
    })
    return equal;
  }

  // deepCopy(arr) {
  //   return JSON.parse(JSON.stringify(arr))
  // }

  addClicked = () => {
    if (this.props.equations.length >= this.MAX_EQUATIONS) {
      console.log("Cannot do that. More than 5")
    }
    else {
      this.props.onEquationChange(Math.random(), undefined)
      // this.setState(prevState => ({fields: [...prevState.fields, Math.random()] }))
    }
    
  }

  undoClicked = () => {
    this.historyIdx--;
    if (this.historyIdx === -1) {
      this.historyIdx = 0;
    }
    console.log(this.historyIdx, this.history[this.historyIdx])
    
    this.props.equationReset(this.history[this.historyIdx])
    
  }

  redoClicked = () => {
    this.historyIdx++;
    if (this.historyIdx === this.history.length) {
      this.historyIdx = this.history.length-1;
      return
    }
    console.log(this.historyIdx, this.history[this.historyIdx])
    
    this.props.equationReset(this.history[this.historyIdx])
  }

  collapseClicked = () => {
    this.setState({isCollapsed: true})
  }

  expandClicked = () => {
    this.setState({isCollapsed: false})
  }

  getMathField = (info, idx) => {
    // determine if function valid
    let valid = typeof(info.evaluatorFunc) !== "string"; // if it equals string, means there is an error message
    return <EquationInput key={info.id} latex={info.latex} onChange={(latex) => this.props.onEquationChange(info.id, latex.latex())} valid={valid} onDelete={() => this.props.onEquationChange(info.id, "", true)} color={constants.equationColors[Math.min(idx, constants.equationColors.length-1)]}/>
    // return (<div key={field} className="w-100 pl3">
    //     <EditableMathField 
    //     latex={"1+2"}
    //     // defaultValue={"y="} 
    //     config={this.mathQuillConfig} 
    //     onChange={(latex) => this.setLatex(field, latex.latex())} 
    //     style={{
    //       border:"none",
    //       minHeight: "50px",
    //       // verticalAlign: "middle"
    //     }} 
    //     className="ma0 w-100"
    //      />
    //   </div>
    // )
  }

  render () {
    // let mathFields = this.state.fields.map((field, i) => this.getMathField(field, i));
    let { equations } = this.props;
    
    let mathFields = equations.map((x,i) => this.getMathField(x, i))


    let plusDisabled = equations.length === this.MAX_EQUATIONS;
    let undoDisabled = this.historyIdx === 0;
    let redoDisabled = this.historyIdx === this.history.length-1;

    let content = equations.length > 0 ? mathFields : (
      <div style={{width:"80%", height:"200px"}} className='flex flex-row justify-center items-center'>
        <p style={{color:"grey", userSelect:"none", textAlign:"center"}}><em>Press the plus button to graph</em></p>
      </div>
    )
    if (this.state.isCollapsed) {
      return (
        <div style={{backgroundColor:"white", borderRadius:"10px", position:"absolute", left:"10px", top: "10px", zIndex:"2", boxShadow:"0px 0px 5px 1px rgba(0,0,0,0.2)"}} className='expand'>
          <div style={{display:"flex", justifyContent:"center", alignItems:"center", width:"100%", height:"100%"}}>
            <Expand width={20} height={20} onClick={this.expandClicked} />
          </div>
        </div>
      )
    }
    else return (
      <div id="math-bar" style={{width:"max(min(33%, 450px), 200px)"}}>
        <div className="flex flex-column w-100 h-100" style={{
          background: "rgb(250,250,250)",
          borderRight: "1px solid rgba(200,200,200)",
          boxShadow: "4px 0px 5px 3px rgba(0, 0, 0, 0.05)"
        }}>
          <div id="topBar" className="flex w-100 justify-between items-center pa2" style={{height:"50px", borderBottom: "1px solid rgb(200,200,200)", 
            background: "linear-gradient(0deg, rgba(220,220,220,1) 0%, rgba(255,255,255,1) 100%)"}}>
            <div className={`${'eqnButton ' + (plusDisabled ? '' : 'eqnButtonEnabled')}`} onClick={this.addClicked}>
              <Plus width={20} height={20} className={`${plusDisabled ? 'disabled' : ''}`}/>
            </div>
            <div className='flex flex-row'>
              <div className={`${'eqnButton ' + (undoDisabled ? '' : 'eqnButtonEnabled')}`} onClick={this.undoClicked}>
                <Undo width={20} height={20}  className={`${undoDisabled ? 'disabled' : ''}`}/>
              </div>
              <div className={`${'eqnButton ' + (redoDisabled ? '' : 'eqnButtonEnabled')}`} onClick={this.redoClicked}>
                <Redo width={20} height={20} className={`${redoDisabled ? 'disabled' : ''}`}/>
              </div>
            </div>
            <div className={'eqnButton eqnButtonEnabled'} onClick={this.collapseClicked}>
              <Collapse width={20} height={20} />
            </div>
          </div>
          <div style={{height:"100%"}} className=" pa0 flex flex-column items-center w-100">
              {content}
              {/* <EditableMathField latex={"\\frac{1}{\\sqrt{2}}\\cdot 2"} config={this.mathQuillConfig} onChange={this.setLatex} style={{border:"none"}} className="ma0 pl3 w-100"/> */}
          </div>
          <div style={{height:"50px", marginTop:"auto", marginBottom:"10px"}} className="ph4 flex flex-row items-center w-100">
            <Info width={30} height={30} style={{marginRight: "10px"}} fill={"blue"}/>
            <p>
              Info
            </p>
          </div>
        </div>
      </div>
    )
  }
}

export default MathBar;
