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

function DecklistItem(info, number)
{
    this.Info = info
    this.Number = number
}

function Card(name, set, number, imageLink)
{
    this.Name = name
    this.Set = set
    this.Number = number
    this.ImageLink = imageLink
}

function PrizeCard(image, taken)
{
    this.Image = image
    this.Taken = taken
}

var prizeCards = [];
var table;
var prizedCards=[];
var blankImageLocation="./images/default-card-image.png";

function init(){
    table = document.getElementById('prizeselectortable');
}

function SubmitDecklist() {   
    resetPrizeSelectorTable();
    ResetPrizeCards()
    var decklistText = document.getElementById('decklist').value;
    CreateDecklistObject(decklistText)    
}

function CreateDecklistObject(decklistText)
{
    var decklist = new Decklist()

    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({"decklist": decklistText});

    var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
    };

    fetch("https://ptcg-api.herokuapp.com/prizeTracker/generateDecklist", requestOptions)
    .then(response => {
        return response.json()
        })
    .then(data => {
        for(var i = 0; i < data["pokemon"].length; i++)
        {
            decklist.addPokemon(new DecklistItem(data["pokemon"][i].info, data["pokemon"][i].number))
        }
        
        for(var i = 0; i < data["trainers"].length; i++)
        {
            decklist.addTrainers(new DecklistItem(data["trainers"][i].info, data["trainers"][i].number))
        }
        
        for(var i = 0; i < data["energy"].length; i++)
        {
            decklist.addEnergy(new DecklistItem(data["energy"][i].info, data["energy"][i].number))
        }        

        CreatePrizeSelectorTable(decklist)
    })
    .catch(error => console.log('error', error));
}

async function CreatePrizeSelectorTable(decklist)
{
    console.log(decklist);
    if(typeof decklist == 'undefined')
    {
        //show error message
        alert("The decklist is invalid.")
        return
    }   

    let fullList = decklist.Pokemon.concat(decklist.Trainers.concat(decklist.Energy));
    for(var i = 0; i < fullList.length; i++)
    {
        var cardDiv = document.createElement('div');
        await GetDecklistCardInformation(fullList[i].Info)
        .then(card => {
            var cardImage = document.createElement('img');//CREATE CARD IMAGE
            var cardAmountSpan = document.createElement('span');//CREATE CARD AMOUNT SPAN
            cardImage.src = card.ImageLink
            cardImage.className = "card"
            cardImage.onclick = function () {SetPrizeCards(card, cardAmountSpan)}
            cardAmountSpan.innerHTML = fullList[i].Number
            cardDiv.appendChild(cardImage);
            cardDiv.appendChild(cardAmountSpan);
            table.appendChild(cardDiv);
        });
    }
}

function GetDecklistCardInformation(decklistCard)
{
    var card = new Card()
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({"card":decklistCard});

    var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
    };

    return fetch("https://ptcg-api.herokuapp.com/prizeTracker/getCardInformation", requestOptions)
    .then(response => {
        return response.json()
        })
    .then(data => {
        card.Name = data["name"]
        card.Number = data["number"]
        card.Set = data["set"]["name"]
        card.ImageLink = data["imageUrlHiRes"]

        return card        
    })
    .catch(error => console.log('error', error));
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
        var countInDeck = Number(cardAmountSpan.innerHTML) - 1
        cardAmountSpan.innerHTML = countInDeck
        prizeCards.push(new PrizeCard(card.ImageLink, false))
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
    table.innerHTML="";
}

function returnLastPrize(){
    if(prizeCards.length>0){
        prizeCards.pop();
        prizedCards.pop().innerHTML++;
        document.getElementsByClassName("prizeCard")[prizeCards.length].src=blankImageLocation;
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