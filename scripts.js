function Decklist(pokemon, trainers, energy)
{
    this.Pokemon = pokemon
    this.Trainers = trainers
    this.Energy = energy
}

//create a function to dynamically create table with 6 columns to show cards 
function CreatePrizeSelectorTable() {   
    
    //CREATE DECKLIST HERE
    /*var decklistText = document.getElementById('decklist').textContent
    var decklist = CreateDecklistImages(decklistText)

    if(typeof decklist == 'undefined')
    {
        //show error message
        return
    }*/
    var decklist = new Decklist(["test","test","test","test","test","test","test","test","test","test","test","test","test","test","test","test",])

    var table = document.getElementById('prizeselectortable');
    
    while(table.rows.length > 0) {
        table.deleteRow(0);
      }
    
    
    var colCount = 0;
    var rowCnt = table.rows.length;
    var tr = table.insertRow(rowCnt);

    for(poke in decklist.Pokemon)
    {
        if(colCount==6)
        {
            colCount = 0
            rowCnt = table.rows.length;
            tr = table.insertRow(rowCnt);
        }

        var td = document.createElement('td');
        td = tr.insertCell(colCount);
        
        var cardImage = document.createElement('img');//CREATE CARD IMAGE
        var cardAmountSpan = document.createElement('span');//CREATE CARD AMOUNT SPAN
        cardImage.src = "https://pkmn-tcg-api-images.sfo2.cdn.digitaloceanspaces.com/Vivid%20Voltage/en_US/aegislash%20v%20126.png"
        cardImage.className = "card"
        cardAmountSpan.innerHTML = "4"
        td.appendChild(cardImage);
        td.appendChild(cardAmountSpan);

        colCount++
    }
}

function CreateDecklistImages(decklistText)
{
    //call API
    var decklist = new Decklist()
    return decklist
}