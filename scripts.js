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

function init(){
    prizeTable = document.getElementById('prizeselectortable');
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
}

function TakePrizeCard(prizeCard)
{
    prizeCard.classList.toggle("opaque");
}

function ResetPrizeCards()
{     
    prizeCards = [];
    prizedCards = [];
    for(let prize of document.getElementsByClassName("prizeCard")){
        prize.src=blankImageLocation;
        prize.classList.remove("opaque");
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