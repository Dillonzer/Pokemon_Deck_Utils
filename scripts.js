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

function SubmitDecklist() {   
    
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