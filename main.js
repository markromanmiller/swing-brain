
let pitchData;

pitchDataURL = "https://statsapi.mlb.com/api/v1.1/game/661042/feed/live?fields=liveData,plays,allPlays,matchup," +
    "pitcher,id,fullName,link,playEvents,isPitch,pitchData,startSpeed,endSpeed,strikeZoneTop,strikeZoneBottom," +
    "coordinates,aX,aY,aZ,pX,pZ,vX0,vY0,vZ0,x,y,x0,y0,z0,plateTime";

$.getJSON({
    url: pitchDataURL,
    success: function( result ) {
        console.log(result);
        $( "#src" ).text(result.keys());
    }
});
