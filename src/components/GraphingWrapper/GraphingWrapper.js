import React from 'react';
import 'tachyons';
import MathBar from '../MathBar/MathBar.js';
import MathGrid from '../MathGrid/MathGrid.js';
import evaluatex from 'evaluatex';
import { getEvaluatorFunction } from '../../algorithms/utilities.js';

class GridWrapper extends React.Component {
  constructor(props) {
    super(props)

    // props: new equations from state. add later.

    this.state = {
      equations: []
    }
  }

  changeEquations = (id, latex, isDelete=false) => {
    this.setState(prevState => {
        let equationsCopy = [...prevState.equations];

        if (isDelete) {
          return {equations: equationsCopy.filter(equation => equation.id !== id)} // returns all elements except the one with this id
        }

        for (let i = 0; i < prevState.equations.length; i++) {
            if (prevState.equations[i].id === id) {
                equationsCopy[i].latex = latex
                equationsCopy[i].evaluatorFunc = getEvaluatorFunction(latex);
                return {equations: equationsCopy}
            }
        }
        
        return {equations: [...prevState.equations, {id: id, latex: latex, evaluatorFunc: getEvaluatorFunction(latex)}]}
    })

    // console.log(this.state.equations)
  }

  buildEquationObj = (latex) => {
    return {
      id: Math.random(),
      latex: latex,
      evaluatorFunc: getEvaluatorFunction(latex)
    }
  }

  wipeEquations = (newLatex) => {
    let equations = [];
    newLatex.forEach(latex => {
      equations.push(this.buildEquationObj(latex))
    })
    console.log(equations)
    this.setState({equations: equations})
  }
  
  
  render () {

    // equations state
    // [{id: 0.69458, latex: "5", equationFunction: func}, ...]
    //console.log(this.state.equations, this.state.equations.filter(x => typeof(x.equationFunc) !== "string"))
    let validEquations = this.state.equations.map((x,i) => [x.evaluatorFunc, i]).filter(x => typeof(x[0]) !== "string") // a string type indicates an error message

    return (
        <div id="body" className='h-100 flex justify-start flex-row' style={{position:"relative"}}>
            <MathBar onEquationChange={this.changeEquations} equations={this.state.equations} equationReset={this.wipeEquations}/>
            <div id="grid" className='flex h-100' style={{flexGrow:'1'}}>
            <MathGrid lineEquations={validEquations}/>
            </div>
        </div>
    )
  }
}

export default GridWrapper;


// https://www.codiga.io/blog/custom-electron-titlebar-part-1/