import 'big-js'

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);


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



// prevLinepoints, square removed from calculation, 
// if moved, then square removed is shifted so you have top row and side column
// if zoom in, no calculations are required unless 
// if scale



// sort out inconsistent semicolons across whole project.
//xLeft is the lefmost x unit on the screen, xRight is rightmost, same for y

// add in hyperbola/discontinuity/out of domain handling, figure out why top row sometimes not drawn, figure out things like circle
// the problem with things like X^2 and x^4 is that one pixel row above is not enough, the next function point is far above. Figure out how to solve - maybe explicitly calculate points next to points that are on top row?
function getLinePoints(pixelWidth, pixelHeight, xLeft, xRight, yBottom, yTop, functionEvaluator, supersample) {
    // default resolution: +0.005
    // get x step and if that 
    pixelHeight *= supersample
    
    let f = Math.random().toString()
    // console.log(f + "start")
    console.time(f)
    
    let xStep = (xRight-xLeft) / (pixelWidth-1); // -1 because we are already starting from xLeft, so there are n-1 pixel steps
    let yStep = (yTop-yBottom) / (pixelHeight-1);

    let linePoints = []
    let arr = []
    for (var i = 0; i < pixelHeight; i++) { // this includes the row above
        arr.push([]);
        for (var j = 0; j < pixelWidth; j++) { //y pixels go down screen, but units go up
            let x = xLeft + j*xStep;
            let y = yTop - i*yStep;
            let diff = functionEvaluator(x,y);
            arr[i].push(diff)
        }
    }

    // need to go in columns now
    for (var i = 0; i < pixelWidth; i++) {
        for (var j = 1; j < pixelHeight-1; j++) { //only tests from 2nd row to n-1 row (inclusive)
            let a = arr[j-1][i]
            let b = arr[j][i]
            if (a===NaN || b===NaN) continue;

            if (Math.sign(a) !== Math.sign(b)) {
               
                linePoints.push(i, j - Math.abs(b)/(Math.abs(a)+Math.abs(b)))
                // if (Math.abs(a) < Math.abs(b)) {
                //     linePoints.push(i, j-1)
                // }
                // else {
                //     linePoints.push(i, j)
                // }
            }
        }
    }

    // test for 1st row and nth row. We do a horizontal difference check rather than a vertical

    // this gives correct values, but they are in the wrong order in the line, so it looks weird
    for (var n of [0, pixelHeight-1]) {
        for (var i = 1; i < pixelWidth; i++) {
            let a = arr[n][i-1]
            let b = arr[n][i]
            if (a===NaN || b===NaN) continue;
            if (Math.sign(a) !== Math.sign(b)) {
                if (Math.abs(a) < Math.abs(b)) {
                    linePoints.push(i-1, n)
                }
                else {
                    linePoints.push(i, n)
                }
            }
        }
    }
    
    // console.log(f + "end")
    console.timeEnd(f)
    for (let i = 1; i < linePoints.length; i+=2) {
        linePoints[i] /= supersample
    }
    // linePoints = linePoints.map(x=>x/supersample)
    // this function now returns all the correct points, but in the wrong order. That's what you have to fix.
    return linePoints
}



// function getDiffGrid(pixelWidth, pixelHeight, xLeft, yTop, xStep, yStep, functionEvaluator) {
//     let f = "normal" + Math.random().toString()
//     console.time(f)

//     let arr = []
//     for (var i = 0; i < pixelHeight; i++) { 
//         arr.push([]);
//         for (var j = 0; j < pixelWidth; j++) { //y pixels go down screen, but units go up
//             let x = xLeft + j*xStep;
//             let y = yTop - i*yStep;
//             let diff = functionEvaluator(x,y);
//             arr[i].push(diff)
//         }
//     }

//     console.timeEnd(f)
//     return arr    
// }

function getDiffGrid_Optimised(pixelWidth, pixelHeight, xLeft, yTop, xStep, yStep, functionEvaluator) {
    // let f = "optimised " + Math.random().toString()
    // console.time(f)
    
    let parentArr = []
    for (var i = 0; i < pixelHeight; i++) { 
        let arrBuffer = new ArrayBuffer(pixelWidth*4); // 32bit integers take 4 bytes each. Therefore the number of needed bytes is 4x the number of entries
        let arrView = new Float32Array(arrBuffer);
        parentArr.push(arrView);
        for (var j = 0; j < pixelWidth; j++) { //y pixels go down screen, but units go up
            let x = xLeft + j*xStep;
            let y = yTop - i*yStep;
            let diff = functionEvaluator(x,y);
            arrView[j]=diff;
        }
    }

    // console.timeEnd(f)
    return parentArr    
}

function getLinePoints_v2(pixelWidth, pixelHeight, xLeft, xRight, yBottom, yTop, functionEvaluator) {   
    let f = Math.random().toString()
    console.time(f)
    
    let xStep = (xRight-xLeft) / (pixelWidth-1); // -1 because we are already starting from xLeft, so there are n-1 pixel steps
    let yStep = (yTop-yBottom) / (pixelHeight-1);

    let linePointsCol = []
    // let arr = []
    // for (var i = 0; i < pixelHeight; i++) { 
    //     arr.push([]);
    //     for (var j = 0; j < pixelWidth; j++) { //y pixels go down screen, but units go up
    //         let x = xLeft + j*xStep;
    //         let y = yTop - i*yStep;
    //         let diff = functionEvaluator(x,y);
    //         arr[i].push(diff)
    //     }
    // }
    let arr = getDiffGrid_Optimised(pixelWidth, pixelHeight, xLeft, yTop, xStep, yStep, functionEvaluator)
    
    // line points by columns
    for (var i = 0; i < pixelWidth; i++) {
        for (var j = 1; j < pixelHeight-1; j++) { //only tests from 2nd row to n-1 row (inclusive)
            let a = arr[j-1][i]
            let b = arr[j][i]
            if (a===NaN || b===NaN) continue;
            if (Math.sign(a) !== Math.sign(b)) {
                //linePointsCol.push(i, j - Math.abs(b)/(Math.abs(a)+Math.abs(b)))
                linePointsCol.push([j.toString() + i.toString(), i, j - Math.abs(b)/(Math.abs(a)+Math.abs(b))]) //pixel key, x, y
            }
        }
    }
    //linePointsCol = linePointsCol.map(x => [x[1],x[2]]).flat()
    // line points by rows. These are only used to compare and so do not need to be in sorted order, so we put them in a hash set for quick lookup times
    let linePointsRow = new Set();

    for (var i = 1; i < pixelHeight-1; i++) {
        for (var j = 1; j < pixelWidth-1; j++) { //skip the first row and last row, because we dont want any points on the edges to be excluded later
            let a = arr[i][j-1]
            let b = arr[i][j]
            if (a===NaN || b===NaN) continue;
            if (Math.sign(a) !== Math.sign(b)) {
                linePointsRow.add(i.toString() + (j-1).toString()); //convert it to a string because we need a value type, otherwise we would compare different obj references)
                linePointsRow.add(i.toString() + (j).toString());
            }
        }
    }

    // filter for only intersection of two line points collections
    let linePointsFlat = [];
    for (var i = 0; i < linePointsCol.length; i++) {
        let point = linePointsCol[i]
        if (linePointsRow.has(point[0])) {
            linePointsFlat.push(point[1], point[2]);
        }
    }

    // test all points around the edges. These points must always be there and never be filtered out, otherwise the line looks jumpy.
    // the question is where to place these points in the line

    // this gives correct values, but they are in the wrong order in the line, so it looks weird
    let topEdgeArr = [];
    let bottomEdgeArr = [];
    for (var n of [0, pixelHeight-1]) {
        let push = (x) => { if (n === 0) topEdgeArr.push(x); else bottomEdgeArr.push(x) }// which array to push to
        for (var i = 1; i < pixelWidth; i++) {
            let a = arr[n][i-1]
            let b = arr[n][i]
            if (a===NaN || b===NaN) continue;
            if (Math.sign(a) !== Math.sign(b)) {
                if (Math.abs(a) < Math.abs(b)) {
                    push([i-1, n])
                }
                else {
                    push([i, n])
                }
            }
        }
    }

    let leftEdgeArr = [];
    let rightEdgeArr = [];
    for (var n of [0, pixelWidth-1]) {
        let push = (x,y) => { if (n === 0) leftEdgeArr.push(x,y); else rightEdgeArr.push(x,y) }// which array to push to
        for (var i = 2; i < pixelHeight-1; i++) { //omit first and last points because already tested in for loop above
            let a = arr[i-1][n]
            let b = arr[i][n]
            if (a===NaN || b===NaN) continue;
            if (Math.sign(a) !== Math.sign(b)) {
                if (Math.abs(a) < Math.abs(b)) {
                    push(n, i-1)
                }
                else {
                    push(n, i)
                }
            }
        }
    }
    
    // insert left and right edge points. They should be at the start and end of the line respectively.
    linePointsFlat = leftEdgeArr.concat(linePointsFlat.concat(rightEdgeArr))

    // insert top and bottom edge points. The top should be at the start of their column in the list, the bottom at the end.
    // doesnt really work, and the points are off
    // let topPtr = topEdgeArr.length-1;
    // let bottomPtr = bottomEdgeArr.length-1;
    // console.log(linePointsFlat)
    // for (var i = linePointsFlat.length-2; i >= 0; i-=2) { // loops over all x values
    //     if (bottomPtr >= 0 && linePointsFlat[i] === bottomEdgeArr[bottomPtr][0] || i==0) {
    //         linePointsFlat.splice(i+1, 0, bottomEdgeArr[bottomPtr][0])
    //         linePointsFlat.splice(i+1, 0, bottomEdgeArr[bottomPtr][1])
    //         bottomPtr--;
    //         console.log("i:", linePointsFlat[i])
    //     }
        
    // }
    console.timeEnd(f)
    //console.log()
    // linePoints = linePoints.map(x=>x/supersample)
    // this function now returns all the correct points, but in the wrong order. That's what you have to fix.
    return linePointsFlat
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
        LHS = y//y//x
        RHS = -1/x//Math.pow(x,2) * (1-Math.pow(x,2))//(x-2)*(x-4)*(x+1)//Math.atan(x)//Math.pow(x,2)//1/x//Math.min(Math.atan(x), 1)//Math.atan(x)//x/10//Math.log(x)//2*x* Math.pow(Math.E, -Math.pow(x,2))// Math.pow(x,3)-3//Math.sin(x)//(x-2)*(x-4)*(x+1)//0.1*(y-2)*(y-5)*(y+6)
    }
    catch {
       LHS = NaN
       RHS = NaN 
    }  
    return LHS-RHS
}

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

console.log("RUNNING PERFORMANCE TESTS")
getDiffGrid(1000, 1000, -15.2, 40.65, 0.03, 0.03, testFunctionEvaluator)
getDiffGrid_Optimised(1000, 1000, -15.2, 40.65, 0.03, 0.03, testFunctionEvaluator)

export {clamp, Vector, getLinePoints, getLinePoints_v2, testFunctionEvaluator, strip, pointsToSVG};


