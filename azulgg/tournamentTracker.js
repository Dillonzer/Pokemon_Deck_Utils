function Tournament(name, format, round) {
  this.Name = name;
  this.Format = format;
  this.Round = round;
  this.RoundEnd = new Date(0);
  this.Ongoing = true;
}

let playerName = "azulgg";
let tournamentId, tournamentObject, wins, losses, ties, timerInterval, countdownInterval;
let tournamentStartingObject;
let standingsObject;
let intervalCleared = true;
let topcutStarted = false;
let topcut = false;
let topcutAddition = false;
let topcutNumber = -1;
let top16 = true;
let top8 = true;
let top4 = true;
let finals = true;
let tournamentStarted = false;
let matchOver = false;
let totalRounds = 0;
let tStartDate;

function setTournament() {
  url = "https://play.limitlesstcg.com/ext/dillonzer/init?username=" + playerName + "&tournamentId=" + tournamentId;

  var settings = {
    url: url,
    method: "GET",
    timeout: 0,
  };

  $.ajax(settings).done(function (response) {
    tournamentObject = new Tournament(response.tournament.name, response.tournament.format);

    setTournamentInformation();
  });
}

function AreWeInTopcut() {
  var settings = {
    url: "https://play.limitlesstcg.com/ext/live/tournament/" + tournamentId,
    method: "GET",
    timeout: 0,
  };

  $.ajax(settings).done(function (response) {
    if (response.phaseType == "SINGLE_ELIMINATION" || response.phaseType == "SINGLE_BRACKET") {
      topcut = true;
      if (!topcutStarted) {
        standings();
        topcutStarted = true;
      }
    } else {
      topcut = false;
    }
  });
}

function GetTotalRounds() {
  var settings = {
    url: "https://play.limitlesstcg.com/ext/live/tournament/" + tournamentId,
    method: "GET",
    timeout: 0,
  };

  $.ajax(settings).done(function (response) {
    totalRounds = response.totalRounds;
  });
}

function WhatTopCutRound(usernameCheck, topNumber) {
  var settings = {
    url: "https://play.limitlesstcg.com/ext/dillonzer/update?username=" + usernameCheck + "&tournamentId=" + tournamentId,
    method: "GET",
    timeout: 0,
  };

  $.ajax(settings).done(function (response) {
    switch (topNumber) {
      case 16:
        top16 = response.player.active;
        topcutNumber = 16;
        break;
      case 8:
        top8 = response.player.active;
        topcutNumber = 8;
        break;
      case 4:
        top4 = response.player.active;
        topcutNumber = 4;
        break;
      case 2:
        finals = response.player.active;
        topcutNumber = 2;
        break;
      default:
    }
  });
}

function standings() {
  var settings = {
    url: "https://play.limitlesstcg.com/ext/dillonzer/standings?tournamentId=" + tournamentId,
    method: "GET",
    timeout: 0,
  };

  $.ajax(settings).done(async function (response) {
    standingsObject = response;
    WhatTopCutRound(standingsObject.find((s) => s.placing == 16).username, 16);
    WhatTopCutRound(standingsObject.find((s) => s.placing == 8).username, 8);
    WhatTopCutRound(standingsObject.find((s) => s.placing == 4).username, 4);
    WhatTopCutRound(standingsObject.find((s) => s.placing == 2).username, 2);
  });
}

function start() {
  var settings = {
    url: "https://play.limitlesstcg.com/ext/dillonzer/registrations?username=" + playerName,
    method: "GET",
    timeout: 0,
  };

  $.ajax(settings).done(function (response) {
    $.each(response, function (index, value) {
      if (value.status == "ONGOING") {
        tournamentId = value.id;
        document.getElementById("record").textContent = "W/L/T 0-0-0";
        GetTotalRounds();
        setTournament();
        tournamentStarted = true;
        return;
      }

      if (!tournamentStarted) {
        if (value.status == "UPCOMING") {
          if (tStartDate === undefined) {
            tStartDate = new Date(value.date);
            tournamentStartingObject = value;
          }

          if (tStartDate > new Date(value.date)) {
            tStartDate = new Date(value.date);
            tournamentStartingObject = value;
          }
        }
      }
    });
    if (!tournamentStarted) {
      countdownInterval = setInterval(countDownFunction, 1100);
    }
  });
}

function setTournamentInformation() {
  updateInformation();
  setInterval(updateInformation, 30000);
}

var timerFunction = async function () {
  if (intervalCleared) {
    clearInterval(timerInterval);
    return;
  }

  if (typeof tournamentObject.RoundEnd != "undefined") {
    var now = new Date().getTime();
    var roundEnd = tournamentObject.RoundEnd;
    var currentRound = tournamentObject.Round;
    var timeleft = roundEnd - now;

    var minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((timeleft % (1000 * 60)) / 1000);
    var stringSeconds = "";
    if (seconds.toString().length == 1) {
      stringSeconds = "0" + seconds;
    } else {
      stringSeconds = seconds;
    }

    if (topcut) {
      document.getElementById("round").textContent = "Topcut";
      // Waiting for fix from Robin
      // if(topcutNumber == 2)
      // {
      //   document.getElementById("round").textContent = "Finals"
      // }
      // else
      // {
      //   document.getElementById("round").textContent = "Top " + topcutNumber
      // }
    } else {
      if (matchOver) {
        document.getElementById("round").textContent = "Round " + (currentRound + 1) + "/" + totalRounds + " in " + minutes + "m";
      } else {
        document.getElementById("round").textContent = "Round " + currentRound + "/" + totalRounds + " - " + minutes + ":" + stringSeconds;
      }
    }

    if (timeleft <= 0 && !topcut) {
      clearInterval(timerInterval);
      document.getElementById("round").textContent = "ROUND OVER";
    }
  }
};

var countDownFunction = async function () {
  if (tournamentStarted) {
    clearInterval(countdownInterval);
    return;
  }

  var now = new Date();
  var now_utc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
  var startTime = new Date(tournamentStartingObject.date).getTime();
  var timeleft = startTime - now_utc;

  var hours = Math.floor((timeleft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((timeleft % (1000 * 60)) / 1000);
  console.log(hours);
  if (hours <= 0 && minutes <= 0 && seconds <= 0) {
    clearInterval(countdownInterval);
    start();
  } else {
    document.getElementById("round").textContent = "!Tournament in: " + hours + "h " + minutes + "m";
  }
};

var updateInformation = function () {
  console.log("Update Info");
  url = "https://play.limitlesstcg.com/ext/dillonzer/update?username=" + playerName + "&tournamentId=" + tournamentId;

  var settings = {
    url: url,
    method: "GET",
    timeout: 0,
  };

  if (!topcutStarted) {
    AreWeInTopcut();
  }

  $.ajax(settings).done(function (response) {
    tournamentObject.Round = response.tournament.round;
    tournamentObject.Ongoing = response.tournament.ongoing;

    matchOver = response.match.completed;

    if (topcut) {
      document.getElementById("record").textContent = "!Tournament for current round stats";
      //document.getElementById("record").textContent = "Match Score: " + response.match.playerScore + "-" + response.match.oppScore
    } else {
      if (!response.match.completed) {
        document.getElementById("record").textContent = "W/L/T: " + response.player.record.wins + "-" + response.player.record.losses + "-" + response.player.record.ties;
      } else {
        if (response.player.record.wins + response.player.record.losses + response.player.record.ties != response.tournament.round) {
          if (response.match.playerScore > response.match.oppScore) {
            document.getElementById("record").textContent = "W/L/T: " + (response.player.record.wins + 1) + "-" + response.player.record.losses + "-" + response.player.record.ties;
          } else if (response.match.playerScore < response.match.oppScore) {
            document.getElementById("record").textContent = "W/L/T: " + response.player.record.wins + "-" + (response.player.record.losses + 1) + "-" + response.player.record.ties;
          } else if (response.match.playerScore == response.match.oppScore) {
            document.getElementById("record").textContent = "W/L/T: " + response.player.record.wins + "-" + response.player.record.losses + "-" + (response.player.record.ties + 1);
          }
        }
      }
    }

    if (response.tournament.roundEnd != null) {
      tournamentObject.RoundEnd = new Date(response.tournament.roundEnd);

      if (response.match.completed) {
        console.log("Match Completed");

        if (topcut) {
          // document.getElementById("round").textContent = "Top " + topcutNumber + " Finished"
          // if(!topcutAddition)
          // {
          //   topcutAddition = true
          //   switch(topcutNumber) {
          //     case 16:
          //       topcutNumber = 8
          //       break;
          //     case 8:
          //       topcutNumber = 4
          //       break;
          //     case 4:
          //       topcutNumber = 2
          //       break;
          //     default:
          //   }
          // }
        }
      } else {
        topcutAddition = false;
        tournamentObject.RoundEnd = new Date(response.tournament.roundEnd);
        clearInterval(timerInterval);
        intervalCleared = false;
        timerInterval = setInterval(timerFunction, 1100);
      }
    } else {
      if (!topcut) {
        document.getElementById("round").textContent = "Round " + tournamentObject.Round;
      }
    }
  });
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
