import React from 'react';
import 'tachyons';
import { addStyles, EditableMathField } from 'react-mathquill'



class MathBar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
        latex: ""
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

    addStyles()
  }

  setLatex = (latex) => {
    this.setState({latex: latex})
  }
  
  render () {
    return (
      <div className="flex flex-column w-100 bg-black-10 h-100">
        <div style={{minHeight:"50px"}} className=" pa0 flex items-center w-100">
            <EditableMathField latex={"\\frac{1}{\\sqrt{2}}\\cdot 2"} config={this.mathQuillConfig} onChange={this.setLatex} style={{border:"none"}} className="ma0 pl3 w-100"/>
        </div>
      </div>
    )
  }
}

export default MathBar;
