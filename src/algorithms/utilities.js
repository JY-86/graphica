import evaluatex from 'evaluatex/dist/evaluatex';
import { Queue } from '@datastructures-js/queue';

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);


const DIFF_NAN = 3.4e+37;

class Vector {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }

    scale(multiplier) {
        this.x *= multiplier;
        this.y *= multiplier;
    }

    flip() {
        this.scale(-1);
    }
    magnitude() {
        return Math.sqrt(this.x^2 + this.y^2);
    }

    static Subtract(first, second) {
        return new Vector(first.x - second.x, first.y - second.y);
    }

    static Copy(vec) {
        return new Vector(vec.x, vec.y)
    }

    toString() {
        return `Vec(${this.x}, ${this.y})`
    }
}

function getDiffGrid_Optimised(pixelWidth, pixelHeight, xLeft, yTop, xStep, yStep, functionEvaluator) {
    var diff;
    let parentArr = [];
    for (var i = 0; i < pixelHeight; i++) { 
        let arrBuffer = new ArrayBuffer(pixelWidth*8); // 32bit integers take 4 bytes each. Therefore the number of needed bytes is 4x the number of entries
        let arrView = new Float64Array(arrBuffer);
        parentArr.push(arrView);
        for (var j = 0; j < pixelWidth; j++) { //y pixels go down screen, but units go up
            let x = xLeft + j*xStep;
            let y = yTop - i*yStep;
            
            diff = functionEvaluator(x,y);
            
            arrView[j]=diff;
        }
        // console.log(diff)
    }

    // console.timeEnd(f)
    return parentArr    
}

// prevLinepoints, square removed from calculation, 
// if moved, then square removed is shifted so you have top row and side column
// if zoom in, no calculations are required unless 
// if scale



// sort out inconsistent semicolons across whole project.
//xLeft is the lefmost x unit on the screen, xRight is rightmost, same for y

// add in hyperbola/discontinuity/out of domain handling, figure out why top row sometimes not drawn, figure out things like circle
// the problem with things like X^2 and x^4 is that one pixel row above is not enough, the next function point is far above. Figure out how to solve - maybe explicitly calculate points next to points that are on top row?


function getLinePoints_v2(pixelWidth, pixelHeight, xLeft, xRight, yBottom, yTop, functionEvaluator) {   
    //timer
    let f = Math.random().toString()
    console.time(f)
    
    // diff grid calculations
    let xStep = (xRight-xLeft) / (pixelWidth-1); // -1 because we are already starting from xLeft, so there are n-1 pixel steps
    let yStep = (yTop-yBottom) / (pixelHeight-1);

    let arr = getDiffGrid_Optimised(pixelWidth, pixelHeight, xLeft, yTop, xStep, yStep, functionEvaluator)

    // utility functions
    const pixWidthMultiplier = Math.pow(10, Math.ceil(Math.log10(pixelWidth)))
    let getUniquePosKey = (x,y) => x*pixWidthMultiplier + y 

    // line points by columns
    let linePointsCol = []
    let emptyCols = [];
    let isFunction = true;

    for (var i = 0; i < pixelWidth; i++) {
        let pointsInCol = 0;
        for (var j = 1; j < pixelHeight-1; j++) { //only tests from 2nd row to n-1 row (inclusive)
            let a = arr[j-1][i]
            let b = arr[j][i]
            if (a===NaN || b===NaN) continue;
            if (Math.sign(a) !== Math.sign(b)) {
                linePointsCol.push([getUniquePosKey(j, i), i, j - Math.abs(b)/(Math.abs(a)+Math.abs(b))]) //pixel key, x, y
                pointsInCol++;
            }
        }
        if (pointsInCol === 0) emptyCols.push(i);
        else if (pointsInCol >= 2) isFunction = false;
    }

    // line points by rows. These are only used to compare, so we put them in a hash set for quick lookup times
    let linePointsRow = new Set();
    let emptyRows = [];
    let isOneToMany = true;

    for (var i = 1; i < pixelHeight-1; i++) {
        let pointsInRow = 0;
        for (var j = 1; j < pixelWidth-1; j++) { //skip the first row and last row, because we dont want any points on the edges to be excluded later
            let a = arr[i][j-1]
            let b = arr[i][j]
            if (a===NaN || b===NaN) continue;
            if (Math.sign(a) !== Math.sign(b)) {
                
                linePointsRow.add(getUniquePosKey(i, j-1)); //convert it to a string because we need a value type, otherwise we would compare different obj references)
                linePointsRow.add(getUniquePosKey(i, j));
                pointsInRow++;
            }
        }
        if (pointsInRow === 0) emptyRows.push(i);
        else if (pointsInRow >= 2) isOneToMany = false;
    }

    // get line points based on intersection of above points
    let linePoints = [];

    for (var i = 0; i < linePointsCol.length; i++) {
        let point = linePointsCol[i]
        if (linePointsRow.has(point[0])) {
            linePoints.push([point[1], point[2]]);
        }
    }

    // add in edges to line points
    let edges = findEdges(pixelWidth, pixelHeight, arr)
    for (i in edges) {
        linePoints = linePoints.concat(edges[i])
    }
    
    // order points and clean up based on the type of function it is
    let functionCase = isFunction ? "col" : (isOneToMany ? "row" : "rel")
    
    let splitLinePoints = []
    if (functionCase === "col") {
        let breaks = emptyCols;
        edges.top.forEach(x => breaks.push(x[0]+0.5));
        edges.bottom.forEach(x => breaks.push(x[0]+0.5));
        linePoints = addBreaksToPoints(linePoints, breaks);

        linePoints.sort((p1,p2) => p1[0] - p2[0])

        
        // split based on empty columns
        splitLinePoints = filterBreaksFromPoints(linePoints)

    }
    else if (functionCase === "row") {
        let breaks = emptyRows;
        edges.left.forEach(x => breaks.push(x[1]));
        edges.right.forEach(x => breaks.push(x[1]));
        linePoints = addBreaksToPoints(linePoints, breaks);

        linePoints.sort((p1,p2) => p1[1] - p2[1])

        
        // split based on empty columns
        splitLinePoints = filterBreaksFromPoints(linePoints)
        
    }
    else {
        // hardest case - a relation like x^2+y^2 =1
    }
    
    // flatten the list to match Konva line drawing format
    splitLinePoints = splitLinePoints.map(x => x.flat())
    // let linePointsFlat = linePoints.flat()

  //  console.timeEnd(f)

   // console.log(splitLinePoints)
    return splitLinePoints
}

function init2DNumberMatrix(width, height, initNum=0) {
    let arr = [];
    for (var i = 0; i < height; i++) {
        let arrBuffer = new ArrayBuffer(width*8); // 32bit integers take 4 bytes each. Therefore the number of needed bytes is 4x the number of entries
        let arrView = new Float64Array(arrBuffer);
        if (initNum !== 0) {
            for (var j = 0; j < width; j++) {
                arrView[j] = initNum;
            }
        }
        arr.push(arrView)
    }
    return arr;
}

function getLinePoints_v3(pixelWidth, pixelHeight, xLeft, xRight, yBottom, yTop, functionEvaluator, log=false) {   
    //timer
    let f = Math.random().toString()
    console.time(f)
    
    // diff grid calculations
    let xStep = (xRight-xLeft) / (pixelWidth-1); // -1 because we are already starting from xLeft, so there are n-1 pixel steps
    let yStep = (yTop-yBottom) / (pixelHeight-1);

    let arr = getDiffGrid_Optimised(pixelWidth, pixelHeight, xLeft, yTop, xStep, yStep, functionEvaluator)

    // console.table(arr.map(x => x.map(y => y.toPrecision(4).padEnd(4))));

    // utility function status
    const pixWidthMultiplier = Math.pow(10, Math.ceil(Math.log10(pixelWidth)))
    let getUniquePosKey = (x,y) => x*pixWidthMultiplier + y 

    
    // column line points array.
    let sentinel = 2; // sentinel must be more than 1.
    let linePointsCol = init2DNumberMatrix(pixelWidth, pixelHeight, -sentinel); // maybe need to init with 0?
    let emptyCols = [];
    let isFunction = true;

    for (var i = 0; i < pixelWidth; i++) {
        let pointsInCol = 0;
        for (var j = 1; j < pixelHeight; j++) { // tests from 1st row to n row (inclusive)
            let a = arr[j-1][i]
            let b = arr[j][i]
            // console.log(a,b)
            if (Number.isNaN(a) || Number.isNaN(b) || !Number.isFinite(a) || !Number.isFinite(b)) continue;
            if (Math.sign(a) !== Math.sign(b) && Math.sign(a) !== 0) { // if a value is exactly 0, it should only be read one time - when b=0
                let absA = Math.abs(a);
                let absB = Math.abs(b);
                let yColAvg = absB / (absA+absB);
                if (absA <= absB) {
                    linePointsCol[j-1][i] = 1-yColAvg;  // later will add yColAvg to j to get y pos
                    linePointsCol[j][i] = sentinel;
                } // this if statement only pushes to the pixel closest to the line.
                else {
                    linePointsCol[j-1][i] = sentinel; 
                    linePointsCol[j][i] = -yColAvg; //later will subtract yColAvg from j to get y pos.
                }
                pointsInCol++;
            }
        }
        if (pointsInCol === 0) emptyCols.push(i);
        else if (pointsInCol >= 2) isFunction = false;
    }

    // console.table(linePointsCol.map(x => x.map(y => y.toPrecision(2).padEnd(2))));

    // row matrix
    let linePointsRow = init2DNumberMatrix(pixelWidth, pixelHeight, -sentinel); // maybe need to init with 0?
    let emptyRows = [];
    let isOneToMany = true;

    for (var i = 0; i < pixelHeight; i++) {
        let pointsInRow = 0;
        for (var j = 1; j < pixelWidth; j++) { // tests from 1st row to n row (inclusive)
            let a = arr[i][j-1]
            let b = arr[i][j]
            if (Number.isNaN(a) || Number.isNaN(b) || !Number.isFinite(a) || !Number.isFinite(b)) continue; 
            // else if (Number.isNaN(b)) linePointsRow[i][j-1] = 0;
            // else if (Number.isNaN(a)) linePointsRow[i][j] = 0;
            if (Math.sign(a) !== Math.sign(b) && Math.sign(a) !== 0) { // if a value is exactly 0, it should only be read one time - when b=0
                let absA = Math.abs(a);
                let absB = Math.abs(b);
                let xColAvg = absB / (absA+absB);
                linePointsRow[i][j-1] = 0;//1-xColAvg;  // after testing keeping it at 0 instead of displacing x with a float looks smoother
                linePointsRow[i][j] = 0;//-xColAvg;
                pointsInRow++;
            }
        }
        if (pointsInRow === 0) emptyRows.push(i);
        else if (pointsInRow >= 2) isOneToMany = false;
    }

    


    // union+intersection matrix
    let unionMatrix = init2DNumberMatrix(pixelWidth, pixelHeight, 0);
    let pixelatedPoints = []; // improve to high performance later

    for (var i = 0; i < pixelHeight; i++) {
        for (var j = 0; j < pixelWidth; j++) { // tests from 1st row to n row (inclusive)
            let colVal = linePointsCol[i][j];
            let rowVal = linePointsRow[i][j];
            
            if (colVal == sentinel) unionMatrix[i][j] = 1;
            else unionMatrix[i][j] = (rowVal !== -sentinel) + (colVal !== -sentinel) // 0 if no point there, 1 if one point there, 2 if both

            // make all edges a 2
            if (unionMatrix[i][j] && (i==0 || i==pixelHeight-1 || j==0 || j==pixelWidth-1)) unionMatrix[i][j] = 2;

            if (unionMatrix[i][j] === 2) pixelatedPoints.push([j,i])
        }
    }

    // find empty rows and empty columns from union matrix - updated method of finding empty rows
    // emptyRows=[]
    // emptyCols=[]
    // actually - calculate them directly from NaN values in arr.

    for (var i = 0; i < pixelHeight; i++) {
        for (var j = 0; j < pixelWidth; j++) { // tests from 1st row to n row (inclusive)
            let colVal = linePointsCol[i][j];
            let rowVal = linePointsRow[i][j];
            
            if (colVal == sentinel) unionMatrix[i][j] = 1;
            else unionMatrix[i][j] = (rowVal !== -sentinel) + (colVal !== -sentinel) // 0 if no point there, 1 if one point there, 2 if both

            // make all edges a 2
            if (unionMatrix[i][j] && (i==0 || i==pixelHeight-1 || j==0 || j==pixelWidth-1)) unionMatrix[i][j] = 2;

            if (unionMatrix[i][j] === 2) pixelatedPoints.push([j,i])
        }
    }

    
    // console.table(unionMatrix);
    // console.log(pixelatedPoints, emptyCols)
    // console.log(pixelatedPoints.join(" | "))
    // order points and clean up based on the type of function it is
    let functionCase = isFunction ? "col" : (isOneToMany ? "row" : "rel")


    
    
    // map pixelated points to the exact float positions
    // console.log(pixelatedPoints.join("|"))
    for (let i = 0; i < pixelatedPoints.length; i++) {
        let x = pixelatedPoints[i][0];
        let y = pixelatedPoints[i][1];
        let additionX = linePointsRow[y][x] * (Math.abs(linePointsRow[y][x]) !== sentinel)
        let additionY = linePointsCol[y][x] * (Math.abs(linePointsCol[y][x]) !== sentinel)
        pixelatedPoints[i] = [x + additionX, y + additionY]
    }
    // console.log(pixelatedPoints.join("|"))

    let splitLinePoints = []
    if (functionCase === "col") {
        let breaks = emptyCols;
        pixelatedPoints = addBreaksToPoints(pixelatedPoints, breaks);

        pixelatedPoints.sort((p1,p2) => p1[0] - p2[0])

        
        // split based on empty columns
        splitLinePoints = filterBreaksFromPoints(pixelatedPoints)

    }
    else if (functionCase === "row") {
        let breaks = emptyRows;
        pixelatedPoints = addBreaksToPoints(pixelatedPoints, breaks);

        pixelatedPoints.sort((p1,p2) => p1[1] - p2[1])

        
        // split based on empty columns
        splitLinePoints = filterBreaksFromPoints(pixelatedPoints)
        
    }
    else {
        let lines = [];
        for (var i = 0; i < pixelHeight; i++) {
            for (var j = 0; j < pixelWidth; j++) { // tests from 1st row to n row (inclusive)
                // if (union[i][j] === 2) lines.push(BFS_Modified(unionMatrix, i, j))
            }
        }
        // hardest case - a relation like x^2+y^2 =1
    }
    
    if (log) {
        console.log(emptyCols)
        console.table(arr);
        console.table(linePointsRow.map(x => x.map(y => y.toPrecision(2).padEnd(2))));
        console.table(linePointsCol.map(x => x.map(y => y.toPrecision(2).padEnd(2))));
        console.table(unionMatrix)
        console.log(pixelatedPoints)
        console.log(splitLinePoints)
    }

    // flatten the list to match Konva line drawing format
    splitLinePoints = splitLinePoints.map(x => x.flat())
    return splitLinePoints
    // let linePointsFlat = linePoints.flat()


    // line points by columns
    // let linePointsCol = []
    // let emptyCols = [];


//     let isFunction = true;

//     for (var i = 0; i < pixelWidth; i++) {
//         let pointsInCol = 0;
//         for (var j = 1; j < pixelHeight-1; j++) { //only tests from 2nd row to n-1 row (inclusive)
//             let a = arr[j-1][i]
//             let b = arr[j][i]
//             if (a===NaN || b===NaN) continue;
//             if (Math.sign(a) !== Math.sign(b)) {
//                 linePointsCol.push([getUniquePosKey(j, i), i, j - Math.abs(b)/(Math.abs(a)+Math.abs(b))]) //pixel key, x, y
//                 pointsInCol++;
//             }
//         }
//         if (pointsInCol === 0) emptyCols.push(i);
//         else if (pointsInCol >= 2) isFunction = false;
//     }

//     // line points by rows. These are only used to compare, so we put them in a hash set for quick lookup times
//     let linePointsRow = new Set();
//     let emptyRows = [];
//     let isOneToMany = true;

//     for (var i = 1; i < pixelHeight-1; i++) {
//         let pointsInRow = 0;
//         for (var j = 1; j < pixelWidth-1; j++) { //skip the first row and last row, because we dont want any points on the edges to be excluded later
//             let a = arr[i][j-1]
//             let b = arr[i][j]
//             if (a===NaN || b===NaN) continue;
//             if (Math.sign(a) !== Math.sign(b)) {
                
//                 linePointsRow.add(getUniquePosKey(i, j-1)); //convert it to a string because we need a value type, otherwise we would compare different obj references)
//                 linePointsRow.add(getUniquePosKey(i, j));
//                 pointsInRow++;
//             }
//         }
//         if (pointsInRow === 0) emptyRows.push(i);
//         else if (pointsInRow >= 2) isOneToMany = false;
//     }

//     // get line points based on intersection of above points
//     let linePoints = [];

//     for (var i = 0; i < linePointsCol.length; i++) {
//         let point = linePointsCol[i]
//         if (linePointsRow.has(point[0])) {
//             linePoints.push([point[1], point[2]]);
//         }
//     }

//     // add in edges to line points
//     let edges = findEdges(pixelWidth, pixelHeight, arr)
//     for (i in edges) {
//         linePoints = linePoints.concat(edges[i])
//     }
    
//     // order points and clean up based on the type of function it is
//     let functionCase = isFunction ? "col" : (isOneToMany ? "row" : "rel")
    
//     let splitLinePoints = []
//     if (functionCase === "col") {
//         let breaks = emptyCols;
//         edges.top.forEach(x => breaks.push(x[0]+0.5));
//         edges.bottom.forEach(x => breaks.push(x[0]+0.5));
//         linePoints = addBreaksToPoints(linePoints, breaks);

//         linePoints.sort((p1,p2) => p1[0] - p2[0])

        
//         // split based on empty columns
//         splitLinePoints = filterBreaksFromPoints(linePoints)

//     }
//     else if (functionCase === "row") {
//         let breaks = emptyRows;
//         edges.left.forEach(x => breaks.push(x[1]));
//         edges.right.forEach(x => breaks.push(x[1]));
//         linePoints = addBreaksToPoints(linePoints, breaks);

//         linePoints.sort((p1,p2) => p1[1] - p2[1])

        
//         // split based on empty columns
//         splitLinePoints = filterBreaksFromPoints(linePoints)
        
//     }
//     else {
//         // hardest case - a relation like x^2+y^2 =1
//     }
    
//     // flatten the list to match Konva line drawing format
//     splitLinePoints = splitLinePoints.map(x => x.flat())
//     // let linePointsFlat = linePoints.flat()

//   //  console.timeEnd(f)

//    // console.log(splitLinePoints)
//     return splitLinePoints
}


function BFS_Modified(unionMatrix, x, y) {
    const VISITED = -3;

    let line = [[x,y]];
    unionMatrix[x,y] = VISITED;

    let Q = new Queue([[x,y]]);
    while (!Q.isEmpty()) {
        let pos = Q.dequeue();
        if (unionMatrix[pos[0], pos[1]] == 2) { // 2 indicates that it is a key point 
            // reset the search from this point
            Q.clear();
            Q.enqueue(pos)
            unionMatrix[pos[0],pos[1]] = VISITED;
        }
        else {
            let {x,y} = pos;
            let neighbours = [[x+1,y], [x-1,y], [x,y+1], [x,y-1]];
            neighbours.forEach(neighbour => {
                let {nx, ny} = neighbour;
                // if (nx < unionMatrix.length && ny < unionMatrix.unionMatrix[nx,ny] >=1)
            })
        }
    }
    
}







function addBreaksToPoints(points, breaks) {
    // place breaks in the list as sentinels. Then loop through the list and on any sentinel, split it.
    return points.concat(breaks.map(x => [x, x, "#"]));
}

function filterBreaksFromPoints(sortedPoints) {
    let splitArr = [];
    console.log(sortedPoints)
    let intervals = [0];
    
    for (let i = 1; i < sortedPoints.length-1; i++) {
        if (sortedPoints[i].length === 3) {
            if (sortedPoints[i-1].length == 2) intervals.push(i-1); // all breaks are an array of length 3, not 2
            if (sortedPoints[i+1].length == 2) intervals.push(i+1);
        }
    }
    intervals.push(sortedPoints.length-1);
    // console.log(intervals)
    for (let i = 0; i < intervals.length; i += 2) {
        splitArr.push(sortedPoints.slice(intervals[i], intervals[i+1]+1));
    }
    // console.log(splitArr)
    return splitArr;
}

// console.log(filterBreaksFromPoints([[1,1,1], [1,1,1], [100,1]]))

// find all points around edges
function findEdges(pixelWidth, pixelHeight, diffArr) {
    let topEdgeArr = [];
    let bottomEdgeArr = [];
    let leftEdgeArr = [];
    let rightEdgeArr = [];

    for (var n of [0, pixelHeight-1]) {
        for (var i = 1; i < pixelWidth; i++) {
            let a = diffArr[n][i-1]
            let b = diffArr[n][i]
            if (a===NaN || b===NaN) continue;
            if (Math.sign(a) !== Math.sign(b)) {
                let point = [(Math.abs(a) < Math.abs(b) ? i-1 : i), n]
                if (n===0) topEdgeArr.push(point); 
                else bottomEdgeArr.push(point)
            }
        }
    }
    for (var n of [0, pixelWidth-1]) {
        for (var i = 2; i < pixelHeight-1; i++) { //omit first and last points because already tested in for loop above
            let a = diffArr[i-1][n]
            let b = diffArr[i][n]
            if (a===NaN || b===NaN) continue;
            if (Math.sign(a) !== Math.sign(b)) {
                let point = [n, (Math.abs(a) < Math.abs(b) ? i-1 : i)]
                if (n===0) leftEdgeArr.push(point); 
                else rightEdgeArr.push(point)
            }
        }
    }

    return {
        top: topEdgeArr,
        left: leftEdgeArr,
        right: rightEdgeArr,
        bottom: bottomEdgeArr
    }
}

// last things to solve:
// place edge points in correct place
// make it able to evaluate functions with breaks in domain --> if a whole column does not have any points, and it is not the last column, then 

// make it able to evaluate relations with multiple y values
//count the number of points per column
// for two adjacent columns with the same number of points

// performance

function testFunctionEvaluator(x,y) {
    let LHS, RHS;
    try {
        LHS = y//Math.pow(y,2) + Math.pow(x,2) //y//y//x
        RHS = 1/x//Math.pow(x,2)//Math.sin(x)//x//Math.sin(y)*y//Math.pow(x,4)//1/x//Math.atan(x)//Math.pow(x,4)//-1/x//Math.pow(x,2) * (1-Math.pow(x,2))//(x-2)*(x-4)*(x+1)//Math.atan(x)//Math.pow(x,2)//1/x//Math.min(Math.atan(x), 1)//Math.atan(x)//x/10//Math.log(x)//2*x* Math.pow(Math.E, -Math.pow(x,2))// Math.pow(x,3)-3//Math.sin(x)//(x-2)*(x-4)*(x+1)//0.1*(y-2)*(y-5)*(y+6)
    }
    catch {
       LHS = DIFF_NAN // !!!!!!!!!!!!!!!!!!!!!! Nan might be 64 bit, in which case it would screw up the types array and force it to expand, which would greatly reduce performance gains. fix this.
       RHS = DIFF_NAN 
    }  
    return LHS-RHS
}

getLinePoints_v3(19, 19, -2.5, 2.5, -2.5, 2.5, testFunctionEvaluator, true)

function pointsToSVG(points) {
    let d = `M ${points[0]} ${points[1]}`
    for (let i = 2; i < points.length-1; i+=2) {
        d += `L ${points[i]} ${points[i+1]}`
    }
    return d
}

function strip(number) {
    return Number(parseFloat(number).toPrecision(12));
}



function getEvaluatorFunction(latex) {
    if (latex === undefined) {
        return "No function specified"
    }
    
    // split latex on equals sign. If no equals sign or >1, return an error
    let expressions = latex.split('=')
    if (expressions.length !== 2 || 
        expressions[0] === '' || 
        expressions[1] === '') return "Invalid equal sign";
    
    // see which variables are used in the expression. If not x and y, allow it if expression[0] is only
    // one var, otherwise throw error. If you see e, its a constant and assign it that value automatically - IMPLEMENT LATER
    let vars=[];

    
    // the earlier var is treated as y

    // plug both sides into evaluatex
    let f1, f2;
    try {
        f1 = evaluatex(expressions[0], {"e":2.71828}, {latex: true})
        f2 = evaluatex(expressions[1], {"e":2.71828}, {latex: true})
        
        // these are tests to ensure that there are no unexpected 3rd variables in the function. If there are these lines will throw an error.
        // the 1100
        f1({"y":1100.2388, "x":1100.2388})
        f2({"y":1100.2388, "x":1100.2388})
    }
    catch {
        return "Function is not parsable"
    }
    
    console.log(expressions[0], expressions[1])
    let evaluator = (x,y) => {
        let LHS, RHS;
        try {
            LHS = f1({"y":y, "x":x})//y//y//x
            RHS = f2({"y":y, "x":x})//Math.pow(x,4)//Math.sin(x)//x//Math.sin(y)*y//Math.pow(x,4)//1/x//Math.atan(x)//Math.pow(x,4)//-1/x//Math.pow(x,2) * (1-Math.pow(x,2))//(x-2)*(x-4)*(x+1)//Math.atan(x)//Math.pow(x,2)//1/x//Math.min(Math.atan(x), 1)//Math.atan(x)//x/10//Math.log(x)//2*x* Math.pow(Math.E, -Math.pow(x,2))// Math.pow(x,3)-3//Math.sin(x)//(x-2)*(x-4)*(x+1)//0.1*(y-2)*(y-5)*(y+6)
        }
        catch {
            return DIFF_NAN
        }  
        return LHS-RHS
    }

    return evaluator
    // if either returns an error, return an error
    // build an evaluator function based on the subtraction of the other 2 functions.
}





let e = getEvaluatorFunction("y=x+l")
// console.log(evaluatex("\\sqrt{-x+5}", {}, {latex:true})({"x":100})) // it returns NaN

// console.log(evaluatex("e", {}, {latex: true})())
// console.log("RUNNING PERFORMANCE TESTS")
// getDiffGrid(1000, 1000, -15.2, 40.65, 0.03, 0.03, testFunctionEvaluator)
// getDiffGrid_Optimised(1000, 1000, -15.2, 40.65, 0.03, 0.03, testFunctionEvaluator)

export {clamp, Vector, getLinePoints_v2, getLinePoints_v3, testFunctionEvaluator, strip, pointsToSVG, getEvaluatorFunction};





// // add edges - this is very inefficient
// linePoints = edges.left.concat(linePoints.concat(edges.right)) // left and right edges

// for (var i = linePoints.length-1; i >= 0; i--) { // could be made a binary search for optimisation
//     // top edge arr and bottom edge arr should be in sorted order
//     if (edges.top.length > 0 && linePoints[i][0] <= edges.top[edges.top.length-1][0]){
//         linePoints.splice(i+1,0,edges.top.pop())
        
//     }
//     if (edges.bottom.length > 0  && linePoints[i][0] <= edges.bottom[edges.bottom.length-1][0]){
//         linePoints.splice(i,0,edges.bottom.pop())
//     }
// }
        



// function getLinePoints(pixelWidth, pixelHeight, xLeft, xRight, yBottom, yTop, functionEvaluator, supersample) {
//     // default resolution: +0.005
//     // get x step and if that 
//     pixelHeight *= supersample
    
//     let f = Math.random().toString()
//     // console.log(f + "start")
//     console.time(f)
    
//     let xStep = (xRight-xLeft) / (pixelWidth-1); // -1 because we are already starting from xLeft, so there are n-1 pixel steps
//     let yStep = (yTop-yBottom) / (pixelHeight-1);

//     let linePoints = []
//     let arr = []
//     for (var i = 0; i < pixelHeight; i++) { // this includes the row above
//         arr.push([]);
//         for (var j = 0; j < pixelWidth; j++) { //y pixels go down screen, but units go up
//             let x = xLeft + j*xStep;
//             let y = yTop - i*yStep;
//             let diff = functionEvaluator(x,y);
//             arr[i].push(diff)
//         }
//     }

//     // need to go in columns now
//     for (var i = 0; i < pixelWidth; i++) {
//         for (var j = 1; j < pixelHeight-1; j++) { //only tests from 2nd row to n-1 row (inclusive)
//             let a = arr[j-1][i]
//             let b = arr[j][i]
//             if (a===NaN || b===NaN) continue;

//             if (Math.sign(a) !== Math.sign(b)) {
               
//                 linePoints.push(i, j - Math.abs(b)/(Math.abs(a)+Math.abs(b)))
//                 // if (Math.abs(a) < Math.abs(b)) {
//                 //     linePoints.push(i, j-1)
//                 // }
//                 // else {
//                 //     linePoints.push(i, j)
//                 // }
//             }
//         }
//     }

//     // test for 1st row and nth row. We do a horizontal difference check rather than a vertical

//     // this gives correct values, but they are in the wrong order in the line, so it looks weird
//     for (var n of [0, pixelHeight-1]) {
//         for (var i = 1; i < pixelWidth; i++) {
//             let a = arr[n][i-1]
//             let b = arr[n][i]
//             if (a===NaN || b===NaN) continue;
//             if (Math.sign(a) !== Math.sign(b)) {
//                 if (Math.abs(a) < Math.abs(b)) {
//                     linePoints.push(i-1, n)
//                 }
//                 else {
//                     linePoints.push(i, n)
//                 }
//             }
//         }
//     }
    
//     // console.log(f + "end")
//     console.timeEnd(f)
//     for (let i = 1; i < linePoints.length; i+=2) {
//         linePoints[i] /= supersample
//     }
//     // linePoints = linePoints.map(x=>x/supersample)
//     // this function now returns all the correct points, but in the wrong order. That's what you have to fix.
//     return linePoints
// }



// // function getDiffGrid(pixelWidth, pixelHeight, xLeft, yTop, xStep, yStep, functionEvaluator) {
// //     let f = "normal" + Math.random().toString()
// //     console.time(f)

// //     let arr = []
// //     for (var i = 0; i < pixelHeight; i++) { 
// //         arr.push([]);
// //         for (var j = 0; j < pixelWidth; j++) { //y pixels go down screen, but units go up
// //             let x = xLeft + j*xStep;
// //             let y = yTop - i*yStep;
// //             let diff = functionEvaluator(x,y);
// //             arr[i].push(diff)
// //         }
// //     }

// //     console.timeEnd(f)
// //     return arr    
// // }

