function Decklist()
{
    this.Cards=[]

    this.addCards = function (newObject) {
        this.Cards.push(newObject);
    };
}

function Card(name, set, number, imageLink, deckCount)
{
    this.Name = name;
    this.Set = set;
    this.Number = number;
    this.ImageLink = imageLink;
    this.DeckCount = deckCount;
}

function PrizeCard(image, taken, position)
{
    this.Image = image;
    this.Taken = taken;
    this.Position = position;
}

function Set(name, code, ptcgo_code, releaseDate)
{
    this.Name = name;
    this.Code = code;
    this.PTCGO_Code = ptcgo_code;
    this.ReleaseDate = releaseDate;
}

function PrizeDecklists(name, decklist)
{
    this.Name = name;
    this.Decklist = decklist
}

let prizeCards = [];
let prizeTable;
let setViewTable;
let prizedCards=[];
let blankImageLocation="./images/default-card-image.png";
let apiUrl = "https://ptcg-api.herokuapp.com"
let allSets = [];
let deckWizardCopy = ""
let deckWizardMetaGameUrl = ""
var allCards = []
var recentCards = []
var prizedeckLists = []

var token;
var twitchUser;

function init(){
    prizeTable = document.getElementById('prizeselectortable');
	// Try to get the token from the URL
	token = getToken();
	// If the token has been given so change the display
	if (token) {
		document.getElementById('connectToTwitch').style.display = "none";
        GetUserInformation()
	} else { // Else we haven't been authorized yet
		document.getElementById('connectToTwitch').style.display = "block";
	}

    let recentCardsCheck = JSON.parse(localStorage.getItem("recentCards"))    
    let prizedeckListsCheck = JSON.parse(localStorage.getItem("prizecardDecks"))

    if(recentCardsCheck != null)
    {
        recentCards = recentCardsCheck
    }

    if(prizedeckListsCheck != null)
    {
        prizedeckLists = prizedeckListsCheck
        LoadDecklistsForPrizeTracker()
    }
}

//#region PrizeTracker

function SubmitDecklist() {   
    resetPrizeSelectorTable();
    ResetPrizeCards()
    let decklistText = document.getElementById('decklist').value;
    let decklistTitle = document.getElementById('decklistName').value;
    if(decklistText != "" && decklistText != null && decklistTitle != "" && decklistTitle != null)
    {                
        upsertPrizeDecks(new PrizeDecklists(decklistTitle, decklistText))
    }
    CreateDecklistObject(decklistText) 
    LoadDecklistsForPrizeTracker()   
}

function ReplaceEnergySymbols(decklist)
{
    decklist = decklist.replaceAll("Unit Energy {F}{D}{Y}", "Unit Energy FDY")
    decklist = decklist.replaceAll("Unit Energy {G}{R}{W}", "Unit Energy GRW")
    decklist = decklist.replaceAll("Unit Energy {L}{P}{M}", "Unit Energy LPM")
    decklist = decklist.replaceAll("Blend Energy {G} {R} {P} {D}", "Blend Energy GRPD")
    decklist = decklist.replaceAll("Blend Energy {W} {L} {F} {M}", "Blend Energy WLFM")
    decklist = decklist.replaceAll("{D}", "Darkness")
    decklist = decklist.replaceAll("{G}", "Grass")
    decklist = decklist.replaceAll("{M}", "Metal")
    decklist = decklist.replaceAll("{R}", "Fire")
    decklist = decklist.replaceAll("{C}", "Colorless")
    decklist = decklist.replaceAll("{F}", "Fighting")
    decklist = decklist.replaceAll("{W}", "Water")
    decklist = decklist.replaceAll("{L}", "Lightning")
    decklist = decklist.replaceAll("{P}", "Psychic")
    decklist = decklist.replaceAll(" Team Flare Gear", "")

    return decklist
}

function CreateDecklistObject(decklistText)
{
    let decklist = new Decklist()

    decklistText = ReplaceEnergySymbols(decklistText)

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    let raw = JSON.stringify({"decklist": decklistText.trim()});

    if(token)
    {
        let sendToTwitchRequst = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
            }; 
        fetch(apiUrl+"/deckutils/twitchIntegration/upsert/decklist/"+twitchUser.id, sendToTwitchRequst)
    }

    let requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
    };

    var checked = !document.getElementById('fromPTCGO').checked

    fetch(apiUrl+"/deckutils/generateDecklist?unordered="+checked, requestOptions)
    .then(response => {
        return response.json()
        })
    .then(data => {
        for(let i = 0; i < data["cards"].length; i++)
        {
            decklist.addCards(new Card(data["cards"][i].name, data["cards"][i].set["name"], data["cards"][i].number, data["cards"][i].imageUrlHiRes, data["cards"][i].deckCount))
        }    

        CreatePrizeSelectorTable(decklist)
    })
    .catch(error => console.log('error', error));
}

async function CreatePrizeSelectorTable(decklist)
{
    if(typeof decklist == 'undefined')
    {
        //show error message
        alert("The decklist is invalid.")
        return
    }   

    let fullList = decklist.Cards;
    for(let i = 0; i < fullList.length; i++)
    {
        let card = fullList[i]
        let cardDiv = document.createElement('div');
        let cardImage = document.createElement('img');//CREATE CARD IMAGE
        let cardAmountSpan = document.createElement('span');//CREATE CARD AMOUNT SPAN
        cardImage.src = card.ImageLink
        cardImage.className = "card"
        cardImage.onclick = function () {SetPrizeCards(card, cardAmountSpan)}
        cardAmountSpan.innerHTML = card.DeckCount
        cardDiv.appendChild(cardImage);
        cardDiv.appendChild(cardAmountSpan);
        prizeTable.appendChild(cardDiv);
    }
}

function SetPrizeCards(card, cardAmountSpan)
{

    if(Number(cardAmountSpan.innerHTML) == 0)
    {
        alert("Invalid Selection due to count in Deck.");
        return;
    }
    
    if(prizeCards.length < 6)
    {        
        let countInDeck = Number(cardAmountSpan.innerHTML) - 1
        cardAmountSpan.innerHTML = countInDeck
        prizeCards.push(new PrizeCard(card.ImageLink, false, prizeCards.length+1))
        prizedCards.push(cardAmountSpan);
        document.getElementsByClassName("prizeCard")[prizeCards.length-1].src = prizeCards[prizeCards.length-1]["Image"];
    }
    else
    {
        alert("Max amount of 6 Prize Cards")
        return
    }

    
    if(token && prizeCards.length == 6)
    {   
        let myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        var raw = "\{ \"Prize1\": \""+prizeCards[0].Image+"\",\"Prize2\": \""+prizeCards[1].Image+"\",\"Prize3\": \""+prizeCards[2].Image+"\",\"Prize4\": \""+prizeCards[3].Image+"\",\"Prize5\": \""+prizeCards[4].Image+"\",\"Prize6\": \""+prizeCards[5].Image+"\",\"Prize1Taken\": "+prizeCards[0].Taken+",\"Prize2Taken\": "+prizeCards[1].Taken+",\"Prize3Taken\": "+prizeCards[2].Taken+",\"Prize4Taken\": "+prizeCards[3].Taken+",\"Prize5Taken\": "+prizeCards[4].Taken+",\"Prize6Taken\": "+prizeCards[5].Taken+"\}"

        let sendToTwitchRequst = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
            }; 
        
        fetch(apiUrl+"/deckutils/twitchIntegration/upsert/prizes/"+twitchUser.id, sendToTwitchRequst)
    }
}

function TakePrizeCard(prizeCard, position)
{
    prizeCard.classList.toggle("opaque");
    if(prizeCards[position-1].Taken == true)
    {
        prizeCards[position-1].Taken = false;
    }
    else
    {        
        prizeCards[position-1].Taken = true;
    }

    if(token && prizeCards.length == 6)
    {   
        let myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        var raw = "\{ \"Prize1\": \""+prizeCards[0].Image+"\",\"Prize2\": \""+prizeCards[1].Image+"\",\"Prize3\": \""+prizeCards[2].Image+"\",\"Prize4\": \""+prizeCards[3].Image+"\",\"Prize5\": \""+prizeCards[4].Image+"\",\"Prize6\": \""+prizeCards[5].Image+"\",\"Prize1Taken\": "+prizeCards[0].Taken+",\"Prize2Taken\": "+prizeCards[1].Taken+",\"Prize3Taken\": "+prizeCards[2].Taken+",\"Prize4Taken\": "+prizeCards[3].Taken+",\"Prize5Taken\": "+prizeCards[4].Taken+",\"Prize6Taken\": "+prizeCards[5].Taken+"\}"

        let sendToTwitchRequst = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
            }; 
        
        fetch(apiUrl+"/deckutils/twitchIntegration/upsert/prizes/"+twitchUser.id, sendToTwitchRequst)
    }
}

function ResetPrizeCards()
{     
    prizeCards = [];
    prizedCards = [];
    for(let prize of document.getElementsByClassName("prizeCard")){
        prize.src=blankImageLocation;
        prize.classList.remove("opaque");
    }

    if(token)
    {   
        let myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        var raw = "\{ \"Prize1\": \"images/cardBack.png\",\"Prize2\": \"images/cardBack.png\",\"Prize3\": \"images/cardBack.png\",\"Prize4\": \"images/cardBack.png\",\"Prize5\": \"images/cardBack.png\",\"Prize6\": \"images/cardBack.png\",\"Prize1Taken\": false,\"Prize2Taken\": false,\"Prize3Taken\": false,\"Prize4Taken\": false,\"Prize5Taken\": false,\"Prize6Taken\": false\}"

        let sendToTwitchRequst = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
            }; 
        
        fetch(apiUrl+"/deckutils/twitchIntegration/upsert/prizes/"+twitchUser.id, sendToTwitchRequst)
    }
    
}

function resetPrizeSelectorTable(){
    prizeTable.innerHTML="";
}

function returnLastPrize(){
    if(prizeCards.length>0){
        prizeCards.pop();
        prizedCards.pop().innerHTML++;
        document.getElementsByClassName("prizeCard")[prizeCards.length].src=blankImageLocation;
        document.getElementsByClassName("prizeCard")[prizeCards.length].classList.remove("opaque");
    }
}

function returnPrizeCards(){
    let len = prizeCards.length;
    for(let i=0;i<len;i++){
        returnLastPrize();
    }
    
    if(token)
    {   
        let myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        var raw = "\{ \"Prize1\": \"images/cardBack.png\",\"Prize2\": \"images/cardBack.png\",\"Prize3\": \"images/cardBack.png\",\"Prize4\": \"images/cardBack.png\",\"Prize5\": \"images/cardBack.png\",\"Prize6\": \"images/cardBack.png\",\"Prize1Taken\": false,\"Prize2Taken\": false,\"Prize3Taken\": false,\"Prize4Taken\": false,\"Prize5Taken\": false,\"Prize6Taken\": false\}"

        let sendToTwitchRequst = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
            }; 
        
        fetch(apiUrl+"/deckutils/twitchIntegration/upsert/prizes/"+twitchUser.id, sendToTwitchRequst)
    }
}

function hideListInputMenu(){
    let mainBody = document.getElementById("mainBody");
    let showHideListInputLabel = document.getElementById("showHideListInputLabel");
    
    
    if(showHideListInputLabel.innerHTML=="SHOW"){
        showHideListInputLabel.innerHTML="HIDE";
        mainBody.classList.remove("menuShown");
        void mainBody.offsetWidth;
        mainBody.classList.add("menuHidden");
    }
    else{
        showHideListInputLabel.innerHTML="SHOW";
        mainBody.classList.remove("menuHidden");
        void mainBody.offsetWidth;
        mainBody.classList.add("menuShown");
    }
}

function ResetThisPrizeCard(position)
{    
    if(prizedCards.length < position)
    {
        return;
    }

    prizedCards[position-1].innerHTML++;
    prizeCards.splice(position-1,1);
    prizedCards.splice(position-1,1);

    for(let i=position-1;i<6;i++)
    {        
        if(i+1 == 6)
        {            
            document.getElementsByClassName("prizeCard")[i].src= blankImageLocation
        }
        else
        {            
            document.getElementsByClassName("prizeCard")[i].src= document.getElementsByClassName("prizeCard")[i+1].src;
        }
        
    }
    
}

function LogIntoTwitch()
{
    window.open("https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=ygoejvo56l7d6jrhsmvlix7ejv00nc&redirect_uri=https://dillonzer.github.io/Pokemon_Deck_Utils/prizetracker.html&scope=user:read:email")
}

// Parses the URL parameters and returns an object
function parseParms(str) {
	var pieces = str.split("&"), data = {}, i, parts;
	// process each query pair
	for (i = 0; i < pieces.length; i++) {
		parts = pieces[i].split("=");
		if (parts.length < 2) {
			parts.push("");
		}
		data[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
	}
	return data;
}

// Returns the token from the URL hash
function getToken() {
	//substring(1) to remove the '#'
	hash = parseParms(document.location.hash.substring(1));
	return hash.access_token;
}

function GetUserInformation()
{
    var settings = {
        "url": "https://api.twitch.tv/helix/users",
        "method": "GET",
        "timeout": 0,
        "headers": {
          "Client-Id": "ygoejvo56l7d6jrhsmvlix7ejv00nc",
          "Authorization": "Bearer "+token
        },
      };
      
      $.ajax(settings).done(function (response) {
        twitchUser = response.data[0];
		document.getElementById('connectedToTwitch').style.display = "block";
        document.getElementById('twitchPfp').src = twitchUser.profile_image_url
        document.getElementById('twitchUsername').innerText = "Welcome " + twitchUser.display_name
      });
}

function upsertPrizeDecks(prizecardDeck) {
    let foundDeck = false

    if(prizedeckLists == null)
    {
        prizedeckLists.push(prizecardDeck)
        console.log(prizedeckLists)
        localStorage.setItem('prizecardDecks', JSON.stringify(prizedeckLists))
        return
    }

    for(let i = 0; i < prizedeckLists.length; i++)
    {
        if(prizedeckLists[i].Name == prizecardDeck.Name)
        {
            prizedeckLists[i].Decklist = prizecardDeck.Decklist
            foundDeck = true
            return
        }
    }

    if(!foundDeck)
    {
        prizedeckLists.push(prizecardDeck)
        localStorage.setItem('prizecardDecks', JSON.stringify(prizedeckLists))
    }
    
}

function LoadDecklistsForPrizeTracker()
{
    let decklistList = document.getElementById("decklistList")
    decklistList.innerHTML = ""

    for(let i = 0; i < prizedeckLists.length; i++)
    {
        let decklistAnchor = document.createElement('li');
        decklistAnchor.innerHTML = prizedeckLists[i].Name
        decklistAnchor.className = "prizeTrackerDecklists"
        decklistAnchor.onclick = function () {LoadDeckForPrizeTracker(prizedeckLists[i])}
        decklistList.appendChild(decklistAnchor);
    }
}

function LoadDeckForPrizeTracker(decklist)
{    
    document.getElementById('decklistName').value = decklist.Name;
    document.getElementById('decklist').value = decklist.Decklist;
    SubmitDecklist()
}

function DeleteDeckFromLocalStorage()
{
    var newArray = prizedeckLists.filter((item) => item.Name !== document.getElementById('decklistName').value);
    prizedeckLists = newArray
    localStorage.setItem('prizecardDecks', JSON.stringify(prizedeckLists))
    LoadDecklistsForPrizeTracker()

}

//#endregion

//#region Set Viewer

function GetAllSets()
{
    setViewTable = document.getElementById('setviewtable');
    var apiCall = apiUrl+"/api/sets";
            fetch(apiCall).then(response => {
            return response.json();
            }).then(data => {
                for(index in data) {
                    allSets.push(new Set(data[index].name, data[index].code, data[index].ptcgoCode, data[index].releaseDate));
                }

                var setSelect = document.getElementById("setName")
                var sortedSets = allSets.sort((a,b) => Date.parse(b.ReleaseDate) - Date.parse(a.ReleaseDate))
                                
            
                for(var i = 0; i < sortedSets.length; i++)
                {
                    setSelect.options[setSelect.options.length] = new Option(sortedSets[i].Name + " (" + sortedSets[i].PTCGO_Code + ")", sortedSets[i].Name);
                }
                
            }).catch(err => {
                console.log(err)
            });
}

async function createAllSetTable(setName)
{ 
    setViewTable.innerHTML="";
    let cardsInSet = []
    var apiCall = apiUrl+"/api/cards/setName="+setName.value;
    fetch(apiCall).then(response => {
    return response.json();
    }).then(data => {
        for(index in data) {
            cardsInSet.push(new Card(data[index].name, data[index].setName, data[index].number, data[index].imageUrlHiRes));
        }

        for(let i = 0; i < cardsInSet.length; i++)
        {
            let card = cardsInSet[i]
            let cardImage = document.createElement('img');//CREATE CARD IMAGE
            cardImage.src = card.ImageLink            
            cardImage.onclick = function () {growCard(card)}
            cardImage.className = "card"
            setViewTable.appendChild(cardImage);
        }
    }).catch(err => {
        console.log(err)
    });
}

function growCard(card) 
{    
    var centerCard = document.getElementById("centeredCard")
    if(centerCard.style.display == "none")
    {
        centerCard.style.display = "block"
        centerCard.src = card.ImageLink
        setViewTable.className += " blur"

    }
}

function hideCenterCard()
{
    var centerCard = document.getElementById("centeredCard")
    centerCard.style.display = "none"
    setViewTable.className = "flexCardTable";
}

//#endregion

//#region DeckWizard

function GetAllDeckWizardCards()
{
    setViewTable = document.getElementById('deckWizardCardName');
    var apiCall = apiUrl+"/deckutils/deckWizard/uniqueCards";
            fetch(apiCall).then(response => {
            return response.json();
            }).then(data => {
                var cardNames = document.getElementById("deckWizardCardName")                                
            
                var sortedCards = data.sort()
                for(var i = 0; i < sortedCards.length; i++)
                {
                    cardNames.options[cardNames.options.length] = new Option(sortedCards[i], sortedCards[i]);
                }
                
            }).catch(err => {
                console.log(err)
            });
}

function CreateDeckWizardDeck()
{
    document.getElementById('loadingDeckWizard').style.visibility = 'visible'
    var card = document.getElementById('deckWizardCardName').value

    if(typeof card == 'undefined')
    {
        //show error message
        alert("No card selected")
        return
    } 

    var splitCard = card.split("|")
    var url = apiUrl+"/deckutils/deckWizard/cardName="+splitCard[0].trim()+"/cardSet="+splitCard[1].trim()+"/number="+splitCard[2].trim()
    if(splitCard[1] === "  ")
    {
        url = apiUrl+"/deckutils/deckWizard/cardName="+splitCard[0].trim()
    }
    

    var requestOptions = {
        method: 'GET'
      };
      
      fetch(url, requestOptions)
        .then(response => {
            return response.json()
        })
        .then(data => {deckWizardMetaGameUrl = data["metagameUrl"]; deckWizardCopy = data["importString"]; CreateDeckWizardDeckObjectAndPicture(data["importString"]);});
}

function CreateDeckWizardDeckObjectAndPicture(decklistText)
{
    let decklist = new Decklist()

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    let raw = JSON.stringify({"decklist": decklistText.trim()});

    let requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
    };
    fetch(apiUrl+"/deckutils/generateDecklist?unordered=true", requestOptions)
    .then(response => {
        return response.json()
        })
    .then(data => {
        for(let i = 0; i < data["cards"].length; i++)
        {
            decklist.addCards(new Card(data["cards"][i].name, data["cards"][i].set["name"], data["cards"][i].number, data["cards"][i].imageUrlHiRes, data["cards"][i].deckCount))
        }    

        CreateDeckWizardDeckPicture(decklist)
    })
    .catch(error => console.log('error', error));
}

async function CreateDeckWizardDeckPicture(decklist)
{    
    var deckWizardTable = document.getElementById('deckviewTable')
    deckWizardTable.innerHTML="";
    for(let i = 0; i < decklist.Cards.length; i++)
    {
        let card = decklist.Cards[i]
        let cardDiv = document.createElement('div');
        let cardImage = document.createElement('img');//CREATE CARD IMAGE
        let cardAmountSpan = document.createElement('span');//CREATE CARD AMOUNT SPAN
        cardImage.src = card.ImageLink
        cardImage.className = "card"
        cardAmountSpan.innerHTML = card.DeckCount
        cardDiv.appendChild(cardImage);
        cardDiv.appendChild(cardAmountSpan);
        deckWizardTable.appendChild(cardDiv);
    }
    document.getElementById('ptcgoExportButton').style.visibility = 'visible'
    document.getElementById('metagameUrl').style.visibility = 'visible'
    document.getElementById('metagameUrl').href = deckWizardMetaGameUrl
    document.getElementById('loadingDeckWizard').style.visibility = 'hidden'
}

function CopyDeckWizardToClipboard()
{
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = deckWizardCopy;
    dummy.select();
    navigator.clipboard.writeText("copy");
    //change to copied
    document.body.removeChild(dummy);
}

//#endregion

//#region StreamCardViewer

//#region OnLoad

function streamerCardViewOnload()
{
    setViewTable = document.getElementById("setviewtable")
    GetAllSetsButSetCode();
    GetAllCards();    
}

function GetAllCards()
{
    var apiCall = apiUrl+"/api/cards";
            fetch(apiCall).then(response => {
            return response.json();
            }).then(data => {
                for(index in data) {
                    allCards.push(new Card(data[index].name, data[index].set.ptcgoCode, data[index].number, data[index].imageUrlHiRes, 0));
                }  
                
                FinishLoadingStreamerCardStuff()
                
            }).catch(err => {
                console.log(err)
            });
}

function FinishLoadingStreamerCardStuff()
{
    var mainBody = document.getElementById("mainBody")
    var loading = document.getElementById("loading")
    mainBody.style.display = "flex"
    loading.style.display = "none"
}

function GetAllSetsButSetCode()
{
    var apiCall = apiUrl+"/api/sets";
            fetch(apiCall).then(response => {
            return response.json();
            }).then(data => {
                for(index in data) {
                    allSets.push(new Set(data[index].name, data[index].code, data[index].ptcgoCode, data[index].releaseDate));
                }

                var setSelect = document.getElementById("setName")
                var sortedSets = allSets.sort((a,b) => Date.parse(b.ReleaseDate) - Date.parse(a.ReleaseDate))
                                
            
                for(var i = 0; i < sortedSets.length; i++)
                {
                    setSelect.options[setSelect.options.length] = new Option(sortedSets[i].Name + " (" + sortedSets[i].PTCGO_Code + ")", sortedSets[i].PTCGO_Code);
                }
                
            }).catch(err => {
                console.log(err)
            });
}

//#endregion

//#region By Set

function GetCardsInSet()
{ 
    var setCode = document.getElementById("setName").value
    var cardSelect = document.getElementById("cardName")
    var cardsInSet = allCards.filter(cards => cards.Set === setCode)
    var sortedCardsInSet = cardsInSet.sort((a,b) => (a.Name > b.Name) ? 1 : ((b.Name > a.Name) ? -1 : 0))
    cardSelect.options.length = 0;
    for (let i = 0; i < sortedCardsInSet.length; i++)
    {
        cardSelect.options[cardSelect.options.length] = new Option(sortedCardsInSet[i].Name + " (" + sortedCardsInSet[i].Number + ")", sortedCardsInSet[i].ImageLink);
    }
    
    setCardImageForStreamerViewer()
}

function setCardImageForStreamerViewer()
{
    var imageLink = document.getElementById('cardName').value;
    var img = document.getElementById("cardImage")
    img.src = imageLink
    document.getElementById("sentToTwitch").innerHTML = ""
}

//#endregion

//#region By Card Name

function DisplayAllCardsForStreamViewer()
{
    setViewTable.innerHTML="";
    searchName = document.getElementById("cardSearchValue").value
    var cardsInSet = []
    if(searchName.toLowerCase() == "n")
    {
        cardsInSet = allCards.filter(cards => cards.Name.toLowerCase() == "n")
    }
    else if (searchName.length >= 3)
    {        
        cardsInSet = allCards.filter(cards => cards.Name.toLowerCase().includes(searchName.toLowerCase()))
    }
    else
    {
        alert("Please enter more than 3 characters when searching for a card. \nExceptions:\n- N")
        return
    }

    for(let i = 0; i < cardsInSet.length; i++)
    {
        let card = cardsInSet[i]
        let cardImage = document.createElement('img');//CREATE CARD IMAGE
        cardImage.src = card.ImageLink            
        cardImage.onclick = function () {growCardWithSetStreamerBox(card)}
        cardImage.className = "card"
        setViewTable.appendChild(cardImage);
    }
}

function DisplayAllCardsForStreamViewerKeyClick(event)
{
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        DisplayAllCardsForStreamViewer()
    }
}

function growCardWithSetStreamerBox(card) 
{    
    document.getElementById("sentToTwitchCenterScreen").innerHTML = ""
    var centerCard = document.getElementById("centeredCard")
    var centerDiv = document.getElementById("centerScreen")
    if(centerDiv.style.display == "none")
    {
        centerDiv.style.display = "block"
        centerCard.src = card.ImageLink
        setViewTable.className += " blur"

    }
}

function hideCenterCardStreamerBox()
{
    var centerDiv = document.getElementById("centerScreen")
    centerDiv.style.display = "none"
    setViewTable.className = "flexCardTable";
}

//#endregion

//#region Recent Cards

function LoadRecentCardsForPrizeViewer()
{
    var recentViewTable = document.getElementById("recentViewTable")
    recentViewTable.innerHTML = ""
    var recentCardsFromStorage = JSON.parse(localStorage.getItem('recentCards'))

    for(let i = 0; i < recentCardsFromStorage.length; i++)
    {
        let card = recentCardsFromStorage[i]
        let cardImage = document.createElement('img');//CREATE CARD IMAGE
        cardImage.src = card            
        cardImage.onclick = function () {growCardWithSetStreamerBoxForRecentCards(card)}
        cardImage.className = "card"
        recentViewTable.appendChild(cardImage);
    }
}

function growCardWithSetStreamerBoxForRecentCards(card) 
{    
    var recentViewTable = document.getElementById("recentViewTable")
    document.getElementById("sentToTwitchCenterScreenRecentView").innerHTML = ""
    var centerCard = document.getElementById("centeredRecentCard")
    var centerDiv = document.getElementById("centerScreenRecentCard")
    if(centerDiv.style.display == "none")
    {
        centerDiv.style.display = "block"
        centerCard.src = card
        recentViewTable.className += " blur"

    }
}

function hideCenterCardStreamerBoxForRecentCards()
{
    var recentViewTable = document.getElementById("recentViewTable")
    var centerDiv = document.getElementById("centerScreenRecentCard")
    centerDiv.style.display = "none"
    recentViewTable.className = "flexCardTable";
}

function ClearRecentCards()
{    
    recentCards = []
    localStorage.removeItem('recentCards')
    LoadRecentCardsForPrizeViewer()
}

//#endregion

function CopyGuidToOtherGuidFields1()
{    
    var nonSearchGuid = document.getElementById("streamerGuid")
    var searchGuid = document.getElementById("streamerGuid2")
    var reviewGuid = document.getElementById("streamerGuid3")

    searchGuid.value = nonSearchGuid.value
    reviewGuid.value = nonSearchGuid.value
}

function CopyGuidToOtherGuidFields2()
{    
    var nonSearchGuid = document.getElementById("streamerGuid")
    var searchGuid = document.getElementById("streamerGuid2")
    var reviewGuid = document.getElementById("streamerGuid3")
    
    nonSearchGuid.value = searchGuid.value
    reviewGuid.value = searchGuid.value
}

function CopyGuidToOtherGuidFields3()
{    
    var nonSearchGuid = document.getElementById("streamerGuid")
    var searchGuid = document.getElementById("streamerGuid2")
    var reviewGuid = document.getElementById("streamerGuid3")

    searchGuid.value = reviewGuid.value
    nonSearchGuid.value = reviewGuid.value
}

function SwitchCardViewerStyle()
{
    var nonSearch = document.getElementById("nonSearch")
    var search = document.getElementById("search")
    var recent = document.getElementById("recent")
    var nonSearchView = document.getElementById("search_bySet")
    var searchView = document.getElementById("search_byCard")
    var recentView = document.getElementById("search_Recent")

    if(nonSearch.checked)
    {
        searchView.style.display = "none"
        nonSearchView.style.display = "block"
        recentView.style.display = "none"
    }
    else if (search.checked)
    {
        searchView.style.display = "block"
        nonSearchView.style.display = "none"
        recentView.style.display = "none"
    }
    else if (recent.checked)
    {
        recentView.style.display = "block"
        searchView.style.display = "none"
        nonSearchView.style.display = "none"
        LoadRecentCardsForPrizeViewer()
    }



}

function SendToTwitch()
{
    var guid = document.getElementById("streamerGuid").value
    var imageLink = document.getElementById("cardImage").src
    var nonSearch = document.getElementById("nonSearch")
    var search = document.getElementById("search")
    var recent = document.getElementById("recent")

    if(search.checked)
    {
        guid = document.getElementById("streamerGuid2").value
        var imageLink = document.getElementById("centeredCard").src
        
    }
    else if(recent.checked)
    {
        guid = document.getElementById("streamerGuid3").value
        var imageLink = document.getElementById("centeredRecentCard").src

    }

    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
    "ImageLink": imageLink
    });

    var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
    };

    fetch(apiUrl+"/deckutils/streamer/setImage/"+guid, requestOptions)
    .then(response => response.text())
    .then(result => {
        if(result == 'false' || result == '')
        {            
            if(search.checked)
            {
                document.getElementById("sentToTwitchCenterScreen").innerHTML = "Error sending to Twitch. Incorrect GUID. If you believe this is incorrect please contact Dillon."
            }
            else if (nonSearch.checked)
            {

                document.getElementById("sentToTwitch").innerHTML = "Error sending to Twitch. Incorrect GUID. If you believe this is incorrect please contact Dillon."
            }
            else if(recent.checked)
            {
                document.getElementById("sentToTwitchCenterScreenRecentView").innerHTML = "Error sending to Twitch. Incorrect GUID. If you believe this is incorrect please contact Dillon."
        
            }
        
        }
        else if (result == "true")
        {
            if(!recentCards.includes(imageLink))
            {
                recentCards.push(imageLink)
                localStorage.setItem('recentCards', JSON.stringify(recentCards))
            }

            if(search.checked)
            {
                document.getElementById("sentToTwitchCenterScreen").innerHTML = "Success!"
            }
            else if (nonSearch.checked)
            {
                document.getElementById("sentToTwitch").innerHTML = "Success!"
            }
            else if(recent.checked)
            {
                document.getElementById("sentToTwitchCenterScreenRecentView").innerHTML = "Success!"
            }
        }
    })
    .catch(error =>{ 
        if(search.checked)
        {
            document.getElementById("sentToTwitchCenterScreen").innerHTML = "Error! "+error
        }
        else if (nonSearch.checked)
        {
            document.getElementById("sentToTwitch").innerHTML = "Error! "+error
        }
        else if(recent.checked)
        {
            document.getElementById("sentToTwitchCenterScreenRecentView").innerHTML = "Error! "+error
        }
    })
}

function DisplayTwitchImage()
{
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const guid = urlParams.get('guid')
    var img = document.getElementById("cardImage")

    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
      };
      
      fetch(apiUrl+"/deckutils/streamer/getImage/"+guid, requestOptions)
      .then(response => {
        return response.json();
        }).then(data => {
            img.src = data.cardImage
            
        }).catch(err => {
            console.log(err)
        });
}

//#endregion
