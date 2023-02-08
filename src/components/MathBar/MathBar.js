import React from 'react';
import 'tachyons';
import { addStyles, EditableMathField } from 'react-mathquill'
import '../ImageButton/ImageButton';
import ImageButton from '../ImageButton/ImageButton';
import EquationInput from '../EquationInput/EquationInput';

class MathBar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
        fields: [],
        latex: []
    }

    this.mathQuillConfig = {
        spaceBehavesLikeTab: false,
        leftRightIntoCmdGoes: 'up',
        restrictMismatchedBrackets: true,
       // sumStartsWithNEquals: true,
        supSubsRequireOperand: true,
        charsThatBreakOutOfSupSub: '+-=<>',
        autoSubscriptNumerals: true,
        // autoCommands: 'pi theta sqrt sum cot csc phi sec', breaks everything for some reason
        autoOperatorNames: 'sin cos',
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

    this.history = []

    addStyles()
  }

  setLatex = (field, latex) => {
    this.setState(prevState => ({latex: {...prevState.latex, [field]: latex}}))
    console.log(this.state.latex)
  }
  
  addClicked = () => {
    this.setState(prevState => ({fields: [...prevState.fields, Math.random()] }))
  }

  undoClicked = () => {
    console.log("click b")
  }

  redoClicked = () => {
    console.log("click c")
  }

  collapseClicked = () => {
    console.log("click d")
  }

  getMathField = (field, idx) => {
    return <EquationInput key={field} onChange={(latex) => this.setLatex(field, latex.latex())} />
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
    let mathFields = this.state.fields.map((field, i) => this.getMathField(field, i)) 
    return (
      <div className="flex flex-column w-100 h-100" style={{
        background: "rgb(250,250,250)",
        borderRight: "1px solid rgba(200,200,200)",
        boxShadow: "4px 0px 5px 3px rgba(0, 0, 0, 0.05)"
      }}>
        <div id="topBar" className="flex w-100 justify-between items-center pa1" style={{height:"50px", borderBottom: "1px solid blue"}}>
          <ImageButton width={30} height={30} onClicked={this.addClicked}/>
          <div>
            <ImageButton width={30} height={30} onClicked={this.undoClicked}/>
            <ImageButton width={30} height={30} onClicked={this.redoClicked}/>
          </div>
          <ImageButton width={30} height={30} onClicked={this.collapseClicked}/>
        </div>
        <div style={{minHeight:"50px"}} className=" pa0 flex flex-column items-center w-100">
            {mathFields}
            {/* <EditableMathField latex={"\\frac{1}{\\sqrt{2}}\\cdot 2"} config={this.mathQuillConfig} onChange={this.setLatex} style={{border:"none"}} className="ma0 pl3 w-100"/> */}
        </div>
      </div>
    )
  }
}

export default MathBar;
