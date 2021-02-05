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

var prizeCards = []

function SubmitDecklist() {   
    
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

    fetch("https://dev-ptcg-api.herokuapp.com/prizeTracker/generateDecklist", requestOptions)
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
    if(typeof decklist == 'undefined')
    {
        //show error message
        alert("The decklist is invalid.")
        return
    }
    var table = document.getElementById('prizeselectortable');
    
    while(table.rows.length > 0) {
        table.deleteRow(0);
      }
    
    
    var colCount = 0;
    var rowCnt = table.rows.length;
    var tr = table.insertRow(rowCnt);

    for(var i = 0; i < decklist.Pokemon.length; i++)
    {
        if(colCount==9)
        {
            colCount = 0
            rowCnt = table.rows.length;
            tr = table.insertRow(rowCnt);
        }

        var td = document.createElement('td');
        td = tr.insertCell(colCount);
        await GetDecklistCardInformation(decklist.Pokemon[i].Info)
        .then(card => {
            var cardImage = document.createElement('img');//CREATE CARD IMAGE
            var cardAmountSpan = document.createElement('span');//CREATE CARD AMOUNT SPAN
            cardImage.src = card.ImageLink
            cardImage.className = "card"
            cardImage.onclick =  function () {SetPrizeCards(card, cardAmountSpan)}
            cardAmountSpan.innerHTML = decklist.Pokemon[i].Number
            td.appendChild(cardImage);
            td.appendChild(cardAmountSpan);
    
            colCount++
        })
    }

    for(var i = 0; i < decklist.Trainers.length; i++)
    {
        if(colCount==9)
        {
            colCount = 0
            rowCnt = table.rows.length;
            tr = table.insertRow(rowCnt);
        }

        var td = document.createElement('td');
        td = tr.insertCell(colCount);
        await GetDecklistCardInformation(decklist.Trainers[i].Info)
        .then(card => {
            var cardImage = document.createElement('img');//CREATE CARD IMAGE
            var cardAmountSpan = document.createElement('span');//CREATE CARD AMOUNT SPAN
            cardImage.src = card.ImageLink
            cardImage.className = "card"
            cardImage.onclick =  function () {SetPrizeCards(card, cardAmountSpan)}
            cardAmountSpan.innerHTML = decklist.Trainers[i].Number
            td.appendChild(cardImage);
            td.appendChild(cardAmountSpan);
    
            colCount++
        })
    }

    for(var i = 0; i < decklist.Energy.length; i++)
    {
        if(colCount==9)
        {
            colCount = 0
            rowCnt = table.rows.length;
            tr = table.insertRow(rowCnt);
        }

        var td = document.createElement('td');
        td = tr.insertCell(colCount);
        await GetDecklistCardInformation(decklist.Energy[i].Info)
        .then(card => {
            var cardImage = document.createElement('img');//CREATE CARD IMAGE
            var cardAmountSpan = document.createElement('span');//CREATE CARD AMOUNT SPAN
            cardImage.src = card.ImageLink
            cardImage.className = "card"
            cardImage.onclick = function () {SetPrizeCards(card, cardAmountSpan)}
            cardAmountSpan.innerHTML = decklist.Energy[i].Number
            td.appendChild(cardImage);
            td.appendChild(cardAmountSpan);
    
            colCount++
        })
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

    return fetch("https://dev-ptcg-api.herokuapp.com/prizeTracker/getCardInformation", requestOptions)
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
        alert("Invalid Selection due to count in Deck.")
        return;
    }
    
    if(prizeCards.length < 6)
    {        
        var countInDeck = Number(cardAmountSpan.innerHTML) - 1
        cardAmountSpan.innerHTML = countInDeck
        prizeCards.push(new PrizeCard(card.ImageLink, false))
    }
    else
    {
        alert("Max amount of 6 Prize Cards")
        return
    }

    var prizeCard1 = document.getElementById('prize1');
    var prizeCard2 = document.getElementById('prize2');
    var prizeCard3 = document.getElementById('prize3');
    var prizeCard4 = document.getElementById('prize4');
    var prizeCard5 = document.getElementById('prize5');
    var prizeCard6 = document.getElementById('prize6');

    if (prizeCards.length == 1)
    {
        prizeCard1.src = prizeCards[0]["Image"]
    }
    else if (prizeCards.length == 2)
    {
        prizeCard2.src = prizeCards[1]["Image"]
    }
    if (prizeCards.length == 3)
    {
        prizeCard3.src = prizeCards[2]["Image"]
    }
    else if (prizeCards.length == 4)
    {
        prizeCard4.src = prizeCards[3]["Image"]
    }
    if (prizeCards.length == 5)
    {
        prizeCard5.src = prizeCards[4]["Image"]
    }
    else if (prizeCards.length == 6)
    {
        prizeCard6.src = prizeCards[5]["Image"]
    }
}

function TakePrizeCard(prizeCardId)
{
    var prizeCard = document.getElementById(prizeCardId)

    if(prizeCard.style.opacity == 0.15)
    {
        prizeCard.style.opacity = ""
    }
    else
    {
        prizeCard.style.opacity= "15%"
    }
}

function ResetPrizeCards()
{     
    var prizeCard1 = document.getElementById('prize1');
    var prizeCard2 = document.getElementById('prize2');
    var prizeCard3 = document.getElementById('prize3');
    var prizeCard4 = document.getElementById('prize4');
    var prizeCard5 = document.getElementById('prize5');
    var prizeCard6 = document.getElementById('prize6');

    prizeCard1.src = "./images/default-card-image.png"
    prizeCard1.style.opacity = ""
    prizeCard2.src = "./images/default-card-image.png"
    prizeCard2.style.opacity = ""
    prizeCard3.src = "./images/default-card-image.png"
    prizeCard3.style.opacity = ""
    prizeCard4.src = "./images/default-card-image.png"
    prizeCard4.style.opacity = ""
    prizeCard5.src = "./images/default-card-image.png"
    prizeCard5.style.opacity = ""
    prizeCard6.src = "./images/default-card-image.png"
    prizeCard6.style.opacity = ""
}