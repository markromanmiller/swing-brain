
let allPlays;

const pitchDataURL = "https://statsapi.mlb.com/api/v1.1/game/661042/feed/live?fields=liveData,plays,allPlays,matchup," +
    "pitcher,id,fullName,link,playEvents,isPitch,pitchData,startSpeed,endSpeed,strikeZoneTop,strikeZoneBottom," +
    "coordinates,aX,aY,aZ,pX,pZ,vX0,vY0,vZ0,x,y,x0,y0,z0,plateTime";

// TODO: in the middle of iterating pitches
let playIndex = 0;
let pitchIndex = 0;
let pitchShown;

const PIXELS_AT_45 = 600;
const CAMERA_Y = -6; // camera is 6 feet behind the plate
const CAMERA_Z = 3; // camera is 3 feet off the ground
const WINDOW_WIDTH = 600;
const WINDOW_HEIGHT = 600;
const BASEBALL_RADIUS = 0.1208; // in feet

const SHOULDER_X = 40;
const SHOULDER_Y = 260;

function qsolve(a, b, c) {
    const root_discriminant = Math.sqrt(Math.pow(b, 2) - (4 * a * c));
    const result = (-1 * b + root_discriminant) / (2 * a);
    const result2 = (-1 * b - root_discriminant) / (2 * a);
    return Math.min(result, result2);
}

function motionOverTime(pd) {

    const co = pd.coordinates;

    return function(time) {
        // zero time HAS to be 50-crossing

        const x = 0.5 * co.aX * time * time + co.vX0 * time + co.x0;
        const y = 0.5 * co.aY * time * time + co.vY0 * time + co.y0;
        const z = 0.5 * co.aZ * time * time + co.vZ0 * time + co.z0;

        return {
            pixel_x: PIXELS_AT_45 * x / (y - CAMERA_Y) + WINDOW_WIDTH / 2,
            pixel_y: -PIXELS_AT_45 * (z - CAMERA_Z) / (y - CAMERA_Y) + WINDOW_HEIGHT / 2,
            radius: PIXELS_AT_45 * BASEBALL_RADIUS / Math.abs(y - CAMERA_Y)
        }
    }
}

function updateBat(evt) {
    let loc = cursorPoint(evt);
    // make a bat such that...
    // 33 inches length.
    // 1394 is 34 inches or 2.833
    // pick the rotation such that:
    // angle is easy lol.

    const diff_x = loc.x - SHOULDER_X;
    const diff_y = loc.y - SHOULDER_Y;

    const transformSpec = "rotate(" +
        (Math.atan2(diff_y, diff_x)*180 / 3.141592) +
        " 40 260) translate(" +
        Math.max(0, Math.min(120, Math.sqrt(diff_x*diff_x + diff_y*diff_y) - (283*0.75))) +
        ")";

    //console.log(transformSpec);
    d3.select("#bat").attr("transform", transformSpec);

    // make it such that the distance (3/4 of the bat) is at the sweet spot

}

// Find your root SVG element
let svg = document.querySelector("svg");
let pt = svg.createSVGPoint();
function cursorPoint(evt){
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

svg.addEventListener('mousemove', updateBat, false);
svg.addEventListener('mouseleave', function() {
    d3.select("#bat").attr("transform", "rotate(-110 40 260) translate(40 0)");
}, false);
svg.addEventListener('click', function() {
    if (pitchShown) {
        loadPitch();
    } else {
        showPitch();
    }
}, false);

function plotOnSVG(pd) {

    // make the function
    const mot = motionOverTime(pd);

    const co = pd.coordinates;

    // calculate plate-cross time
    // zero up to plate time
    const plateTime = qsolve(0.5 * co.aY, co.vY0, co.y0);
    // plate time is wrong?

    const hideTime = (Math.random() * .050) + .175;

    // 0 is 50ft cross time
    // platetime is cross time to plate.
    for (let qt = plateTime - 0.0; qt > 0; qt += -0.050) {

        const circle_info = mot(qt);

        const circ = d3.select("#mainView").append('circle')
            .attr("r", circle_info.radius)
            .attr("cx", circle_info.pixel_x)
            .attr("cy", circle_info.pixel_y)
            .attr("class", "pitch-circle")
            .attr("opacity", "0.3");

        if (qt > plateTime - hideTime) {
            circ.attr("visibility", "hidden");
        }
        if (qt === plateTime) {
            circ.attr("opacity", "1");
        }
    }
}

function drawHLine(y, z) {
    const line_y = -PIXELS_AT_45 * (z - CAMERA_Z) / (y - CAMERA_Y) + WINDOW_HEIGHT / 2;

    d3.select("#mainView")
        .append('line')
        .attr("x1", 0).attr("x2", WINDOW_WIDTH)
        .attr("y1", line_y).attr("y2", line_y)
        .attr("stroke-width", 1).attr("stroke", "black");
}

function drawVLine(x, y) {
    const line_x = PIXELS_AT_45 * x / (y - CAMERA_Y) + WINDOW_WIDTH / 2;

    d3.select("#mainView")
        .append('line')
        .attr("x1", line_x).attr("x2", line_x)
        .attr("y1", 0).attr("y2", WINDOW_HEIGHT)
        .attr("stroke-width", 1).attr("stroke", "black");
}

function iterateToNextPitch(pitcher) {
    // I need a class to handle this lol.

    // assume playindex and pitchindex currently point to valid info.
    do {
        pitchIndex += 1;
        if (allPlays[playIndex].playEvents.length <= pitchIndex) {
            playIndex += 1;
            pitchIndex = 0;
            while (allPlays[playIndex].matchup.pitcher.id !== pitcher) {
                playIndex += 1;
            }
        }
    } while (!allPlays[playIndex].playEvents[pitchIndex].isPitch);

}

function loadPitch() {
    // clear everything
    d3.selectAll(".pitch-circle").remove();

    // only Shohei 660271
    iterateToNextPitch(660271);
    let pitchData = allPlays[playIndex].playEvents[pitchIndex].pitchData;
    plotOnSVG(pitchData);
    pitchShown = false;

}

function showPitch() {
    d3.selectAll(".pitch-circle").attr("visibility", null);
    pitchShown = true;
}

$.getJSON({
    url: pitchDataURL,
    success: function( result ) {
        allPlays = result.liveData.plays.allPlays;

        drawHLine(400, 12);
        drawHLine(400, 0);
        drawVLine(-0.708, 0);
        drawVLine(0.708, 0);
        drawHLine(0, 1);
        drawHLine(0, 3.2);

        loadPitch();

    }
});
