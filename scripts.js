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
}

function SubmitDecklist() {   
    resetPrizeSelectorTable();
    ResetPrizeCards()
    let decklistText = document.getElementById('decklist').value;
    CreateDecklistObject(decklistText)    
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
    setViewTable.className = "";
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
    // to avoid breaking orgain page when copying more words
    // cant copy when adding below this code
    // dummy.style.display = 'none'
    document.body.appendChild(dummy);
    //Be careful if you use texarea. setAttribute('value', value), which works with "input" does not work with "textarea". – Eduard
    dummy.value = deckWizardCopy;
    dummy.select();
    document.execCommand("copy");
    alert("Copied the deck to the clipboard!");
    document.body.removeChild(dummy);
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

function streamerCardViewOnload()
{
    setViewTable = document.getElementById("setviewtable")
    GetAllSetsButSetCode();
    GetAllCards();    
}

function FinishLoadingStreamerCardStuff()
{
    var mainBody = document.getElementById("mainBody")
    var loading = document.getElementById("loading")
    mainBody.style.display = "flex"
    loading.style.display = "none"
}

function setCardImageForStreamerViewer()
{
    var imageLink = document.getElementById('cardName').value;
    var img = document.getElementById("cardImage")
    img.src = imageLink
    document.getElementById("sentToTwitch").innerHTML = ""
}

function getGuidFromUrl()
{
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get('guid')
}

function SendToTwitch()
{
    var guid = document.getElementById("streamerGuid").value
    var imageLink = document.getElementById("cardImage").src
    var nonSearch = document.getElementById("nonSearch")
    var search = document.getElementById("search")

    if(search.checked)
    {
        guid = document.getElementById("streamerGuid2").value
        var imageLink = document.getElementById("centeredCard").src
        
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
        if(result == 'false')
        {            
            if(search.checked)
            {
                document.getElementById("sentToTwitchCenterScreen").innerHTML = "Error sending to Twitch. Incorrect GUID. If you believe this is incorrect please contact Dillon."
            }
            else if (nonSearch.checked)
            {

                document.getElementById("sentToTwitch").innerHTML = "Error sending to Twitch. Incorrect GUID. If you believe this is incorrect please contact Dillon."
            }
        }
        else if (result == "true")
        {
            if(search.checked)
            {
                document.getElementById("sentToTwitchCenterScreen").innerHTML = "Success!"
            }
            else if (nonSearch.checked)
            {
                document.getElementById("sentToTwitch").innerHTML = "Success!"
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

function SwitchCardViewerStyle()
{
    var nonSearch = document.getElementById("nonSearch")
    var search = document.getElementById("search")
    var nonSearchView = document.getElementById("search_bySet")
    var searchView = document.getElementById("search_byCard")

    if(nonSearch.checked)
    {
        searchView.style.display = "none"
        nonSearchView.style.display = "block"
    }
    else if (search.checked)
    {
        searchView.style.display = "block"
        nonSearchView.style.display = "none"
    }


}

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
    setViewTable.className = "";
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