
let allPlays;

pitchDataURL = "https://statsapi.mlb.com/api/v1.1/game/661042/feed/live?fields=liveData,plays,allPlays,matchup," +
    "pitcher,id,fullName,link,playEvents,isPitch,pitchData,startSpeed,endSpeed,strikeZoneTop,strikeZoneBottom," +
    "coordinates,aX,aY,aZ,pX,pZ,vX0,vY0,vZ0,x,y,x0,y0,z0,plateTime";

// TODO: in the middle of iterating pitches
pitchIndex = 1;

const PIXELS_AT_45 = 600;
const CAMERA_Y = -6; // camera is 6 feet behind the plate
const CAMERA_Z = 3; // camera is 3 feet off the ground
const WINDOW_WIDTH = 600;
const WINDOW_HEIGHT = 600;
const BASEBALL_RADIUS = 0.1208; // in feet

function qsolve(a, b, c) {
    const result = (-1 * b + Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a);
    const result2 = (-1 * b - Math.sqrt(Math.pow(b, 2) - (4 * a * c))) / (2 * a);
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

function plotOnSVG(pd) {

    // make the function
    const mot = motionOverTime(pd);

    const co = pd.coordinates;

    // calculate plate-cross time
    // zero up to plate time
    const plateTime = qsolve(0.5 * co.aY, co.vY0, co.y0);
    // plate time is wrong?



    // 0 is 50ft cross time
    for (let qt = plateTime - 0.0; qt > 0; qt += -0.050) {

        const circle_info = mot(qt)

        d3.select("#mainView").append('circle')
            .attr("r", circle_info.radius)
            .attr("cx", circle_info.pixel_x)
            .attr("cy", circle_info.pixel_y)
            .attr("opacity", "0.3")
            .attr("class", "pitch-circle");
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

function loadPitch() {
    // find the next pitch
    d3.selectAll(".pitch-circle").remove();

    for (let i = 8; i < 12; i++) {
        // nice! this works so that I can see who pitches where.
        // lh/rh is correct - Framber pitches with his left, Shohei with his right
        let pitchData = allPlays[i].playEvents[0].pitchData;
        if(pitchData) {
            plotOnSVG(pitchData);
        }
    }

}

/*


 */

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
