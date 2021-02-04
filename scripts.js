function Decklist(pokemon, trainers, energy)
{
    this.Pokemon = pokemon
}


//create a function to dynamically create table with 6 columns to show cards 
function CreatePrizeSelectorTable() {    
    var table = document.getElementById('prizeselectortable');  
    var columns = table.columns.length;
    
    if(columns==6)
    {        
        var rowCnt = table.rows.length;
        var tr = table.insertRow(rowCnt);
        tr = table.insertRow(rowCnt);
    }

    for (var c = 0; c < 6; c++) {
        var td = document.createElement('td');
        td = tr.insertCell(c);
        
        var cardImage = //CREATE CARD IMAGE
        td.appendChild(button);
    }

}