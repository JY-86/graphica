import React from 'react';
import 'tachyons';
import { addStyles, EditableMathField } from 'react-mathquill'


const mathQuillConfig = {
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

function EquationInput(props) {
    

    // const buttonStyle = {
    //     backgroundIma
    // }
    return (
        <div className="w-100 flex" style={{borderBottom:"1px solid rgba(200,200,200)"}}>
            <div id="indicatorBar" style={{width:"60px", height:"100%", backgroundColor:"red", borderRight:"1px solid rgba(200,200,200)"}}>

            </div>
            <EditableMathField 
                latex={"1+2"}
                // defaultValue={"y="} 
                config={mathQuillConfig} 
                style={{
                border:"none",
                minHeight: "50px",
                // verticalAlign: "middle"
                }} 
                className="ma0 w-100"
                {...props}
            />
        </div>
    )
}

export default EquationInput;
