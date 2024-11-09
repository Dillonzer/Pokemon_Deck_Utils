function Tournament(name, format, round)
{
  this.Name = name;
  this.Format = format;
  this.Round = round;
  this.RoundEnd = new Date(0);
  this.Ongoing = true;
}

var playerName = 'azulgg'
var tournamentId, tournamentObject, wins, losses, ties

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
  document.getElementById("tname").textContent = tournamentObject.Name  
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

    document.getElementById("round").textContent = "Round: " + currentRound + " - "+ minutes + ":" + stringSeconds
    
    if (timeleft <= 0) {
      clearInterval(timerFunction);    
      document.getElementById("round").textContent = "ROUND OVER"
      updateInformation()
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
    
    $.ajax(settings).done(function (response) {
        tournamentObject.Round = response.tournament.round
        tournamentObject.Ongoing = response.tournament.ongoing
        

        if(response.tournament.roundEnd != null)
        {
          tournamentObject.RoundEnd = new Date(response.tournament.roundEnd)
        }
        

        document.getElementById("wins").textContent = "WINS: " + response.player.record.wins 
        document.getElementById("losses").textContent = "LOSSES: " + response.player.record.losses
        //document.getElementById("ties").textContent = "TIES: " + response.player.record.ties       
        
    
        if(response.tournament.roundEnd != null)
        {
          tournamentObject.RoundEnd = new Date(response.tournament.roundEnd)
          clearInterval(timerFunction)
          setInterval(timerFunction, 1100)
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