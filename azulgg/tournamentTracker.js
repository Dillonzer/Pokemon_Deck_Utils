function Tournament(name, format, round)
{
  this.Name = name;
  this.Format = format;
  this.Round = round;
  this.RoundEnd = new Date(0);
  this.Ongoing = true;
}

var playerName = 'speedlemon'
var tournamentId, tournamentObject, wins, losses, ties, timerInterval
var standingsObject
var intervalCleared = true
var topcut = false
var topcutNumber = -1
var top32, top16, top8, top4, finals = false

function setTournament() {
    url = "https://play.limitlesstcg.com/ext/dillonzer/init?username="+playerName+"&tournamentId="+tournamentId
    
    var settings = {
        "url": url,
        "method": "GET",
        "timeout": 0,
    };
  
    $.ajax(settings).done(function (response) {
        
        tournamentObject = new Tournament(response.tournament.name, response.tournament.format)

        setTournamentInformation()
    });
}

function AreWeInTopcut(){
  var settings = {
    "url": "https://play.limitlesstcg.com/ext/live/tournament/"+tournamentId,
    "method": "GET",
    "timeout": 0,
  };
  
  $.ajax(settings).done(function (response) {
    if(response.phaseType == "SINGLE_ELIMINATION" || response.phaseType == "SINGLE_BRACKET")
    {
      topcut = true      
      standings()     
    }
    else
    {
      topcut = false
    }
  });
}

function WhatTopCutRound(usernameCheck, topNumber)
{
  var settings = {
    "url": "https://play.limitlesstcg.com/ext/dillonzer/update?username="+usernameCheck+"&tournamentId="+tournamentId,
    "method": "GET",
    "timeout": 0,
  };
  
  $.ajax(settings).done(function (response) {
    switch(topNumber) {
      case 16:
        top16 = response.player.active
        break;
      case 8:
        top8 = response.player.active
        break;
      case 4:
        top4 = response.player.active
        break;
      case 2:
        finals = response.player.active
        break;
      default:
    } 
  });
}

function standings()
{
  var settings = {
    "url": "https://play.limitlesstcg.com/ext/dillonzer/standings?tournamentId="+tournamentId,
    "method": "GET",
    "timeout": 0,
  };
  
  $.ajax(settings).done(function (response) {
    standingsObject = response   
    //calculate here to find what round we are in
    WhatTopCutRound(standingsObject[16].username, 16)
    WhatTopCutRound(standingsObject[8].username, 8)
    WhatTopCutRound(standingsObject[4].username, 4)
    WhatTopCutRound(standingsObject[2].username, 2) 
  });
}

function start(){
  var settings = {
    "url": "https://play.limitlesstcg.com/ext/dillonzer/registrations?username="+playerName,
    "method": "GET",
    "timeout": 0,
  };
  
  $.ajax(settings).done(function (response) {
    $.each(response, function(index, value) {
      if(value.status == "ONGOING")
        {
          tournamentId = value.id
          setTournament()
        }
    });
  });
}

function setTournamentInformation()
{
  updateInformation()
  setInterval(updateInformation, 30000)
}

var timerFunction = async function() {  
  if(typeof tournamentObject.RoundEnd != 'undefined')
  {
    var now = new Date().getTime();
    var roundEnd = tournamentObject.RoundEnd
    var currentRound = tournamentObject.Round
    var timeleft = roundEnd - now;
    
    var minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((timeleft % (1000 * 60)) / 1000);
    var stringSeconds = ""
    if(seconds.toString().length == 1)
    {
      stringSeconds = "0" + seconds
    }
    else
    {
      stringSeconds = seconds
    }

    if(topcut)
    {  
      if(finals && !top4) 
      {
        document.getElementById("round").textContent = "Finals"
      }  
      else if(top4 && !top8) 
      {
        document.getElementById("round").textContent = "Top 4"
      }
      else if(top8 && !top16) 
      {
        document.getElementById("round").textContent = "Top 8"
      }
      else if(top16) 
      {
        document.getElementById("round").textContent = "Top 16"
      }
    }
    else
    {
      document.getElementById("round").textContent = "Round " + currentRound + " - "+ minutes + ":" + stringSeconds
    }
    
    if (timeleft <= 0 && !topcut) {
      clearInterval(timerInterval);    
      document.getElementById("round").textContent = "ROUND OVER"
    }

  }
  
}

var updateInformation = function() {
    console.log("Update Info")
    url = "https://play.limitlesstcg.com/ext/dillonzer/update?username="+playerName+"&tournamentId="+tournamentId

    var settings = {
      "url": url,
      "method": "GET",
      "timeout": 0,
    };

    AreWeInTopcut()
    
    $.ajax(settings).done(function (response) {
        tournamentObject.Round = response.tournament.round
        tournamentObject.Ongoing = response.tournament.ongoing       
        

        document.getElementById("record").textContent = "W/L/T: " + response.player.record.wins + "-" + response.player.record.losses + "-" + response.player.record.ties
        
    
        if(response.tournament.roundEnd != null)
        {
          tournamentObject.RoundEnd = new Date(response.tournament.roundEnd)
          
          if(response.match.completed)
          {
            console.log("Match Completed")
            if(!intervalCleared)
            {
                clearInterval(timerInterval)
                intervalCleared = true
            }
            if(!topcut)
            {
                document.getElementById("round").textContent = "Round " + (tournamentObject.Round + 1) + " Up Next"
            }
          }
          else
          {
            tournamentObject.RoundEnd = new Date(response.tournament.roundEnd)
            clearInterval(timerInterval)
            intervalCleared = false
            setInterval(timerFunction, 1100)
          }
        }
        else
        {    
          document.getElementById("round").textContent = "Round " + tournamentObject.Round
        }
      
    });
  } 

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
