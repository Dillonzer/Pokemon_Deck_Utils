function Decklist()
{
    this.Pokemon = []
    this.Trainers = []
    this.Energy = []

    this.addPokemon = function (newObject) {
        this.Pokemon.push(newObject);
    };
    
    this.addTrainers = function (newObject) {
        this.Trainers.push(newObject);
    };
    
    this.addEnergy = function (newObject) {
        this.Energy.push(newObject);
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

function init(){
    prizeTable = document.getElementById('prizeselectortable');
}

function SubmitDecklist() {   
    resetPrizeSelectorTable();
    ResetPrizeCards()
    let decklistText = document.getElementById('decklist').value;
    CreateDecklistObject(decklistText)    
}

function CreateDecklistObject(decklistText)
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

    fetch(apiUrl+"/deckutils/generateDecklist", requestOptions)
    .then(response => {
        return response.json()
        })
    .then(data => {
        for(let i = 0; i < data["pokemon"].length; i++)
        {
            decklist.addPokemon(new Card(data["pokemon"][i].name, data["pokemon"][i].set["name"], data["pokemon"][i].number, data["pokemon"][i].imageUrlHiRes, data["pokemon"][i].deckCount))
        }
        
        for(let i = 0; i < data["trainers"].length; i++)
        {
            decklist.addTrainers(new Card(data["trainers"][i].name, data["trainers"][i].set["name"], data["trainers"][i].number, data["trainers"][i].imageUrlHiRes, data["trainers"][i].deckCount))
        }
        
        for(let i = 0; i < data["energy"].length; i++)
        {
            decklist.addEnergy(new Card(data["energy"][i].name, data["energy"][i].set["name"], data["energy"][i].number, data["energy"][i].imageUrlHiRes, data["energy"][i].deckCount))
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

    let fullList = decklist.Pokemon.concat(decklist.Trainers.concat(decklist.Energy));
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

