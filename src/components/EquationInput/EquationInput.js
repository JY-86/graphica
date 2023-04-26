import React from 'react';
import 'tachyons';
import { addStyles, EditableMathField } from 'react-mathquill'
import './EquationInput.css'
import  {ReactComponent as Cross} from '../../assets/cross.svg';
import  {ReactComponent as Warning} from '../../assets/warning.svg';
//import  {ReactComponent as Accepted} from '../../assets/equation_accepted.svg';
import {ReactComponent as Accepted} from '../../assets/equation_drawn.svg';
import {ReactComponent as Empty} from '../../assets/equation_empty.svg';

const mathQuillConfig = {
    spaceBehavesLikeTab: false,
    leftRightIntoCmdGoes: 'up',
    restrictMismatchedBrackets: true,
   // sumStartsWithNEquals: true,
    supSubsRequireOperand: true,
    charsThatBreakOutOfSupSub: '+-=<>',
    autoSubscriptNumerals: true,
    autoCommands: 'pi theta sqrt',
    maxDepth: 10,
    // substituteTextarea: function() {
    //     return document.createElement('textarea');
    // }
    // handlers: {
    //     edit: function(mathField) { ... },
    //     upOutOf: function(mathField) { ... },
    //     moveOutOf: function(dir, mathField) { if (dir === MQ.L) ... else ... }
    // }
    // handlers: {
    //     enter: function() { console.log("enter pressed") }
    // }
} 

function EquationInput(props) {
    
    let latex = props.latex === undefined ? "" : props.latex;

    let symbol;
    if (latex === "") symbol = <Empty width={33} height={33}/>;
    else if (props.valid) symbol = <Accepted width={33} height={33} fill={props.color}/>;
    else symbol = <Warning width={30} height={30}/>;
    return (
        <div className="w-100 flex equationBox" style={{position:"relative"}}>
            <div id="indicatorBar" className="pa1 flex justify-center items-center" style={{width:"60px", height:"100%", borderRight:"1px solid rgba(200,200,200)"}}>
                {symbol}
            </div>
            <EditableMathField 
                id="mathField"
                latex={latex}
                // defaultValue={"y="} 
                config={mathQuillConfig} 
                style={{
                 border:"blue",
                 minHeight: "60px",
                 padding: "5px"
                // verticalAlign: "middle"
                }} 
                placeholder='Enter equation'
                className="ma0 w-100"
                onChange={props.onChange}
            />
            <Cross className='cross' style={{width:"15px", height:"15px", position:"absolute", top:"2px", right:"2px"}} onClick={(e) => props.onDelete()}/>
        </div>
    )
}

export default EquationInput;
