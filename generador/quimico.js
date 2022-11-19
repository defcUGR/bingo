const initialValues = ["Hidrogeno","Litio","Sodio","Potasio","Cesio","Rubidio","Francio","Berilio","Magnesio","Calcio","Estroncio","Bario","Radio","Escandio","Silicio","Titanio","Vanadio","Cromo","Manganeso","Hierro","Cobalto","Niquel","Cobre","Cinc","Boro","Carbono","Nitrogeno","Oxigeno","Fluor","Neon","Helio","Aluminio","Fosforo","Azufre","Cloro","Argon","Galio","Germanio","Arsenico","Selenio","Bromo","Cripton","Indio","Antimonio","Telurio","Yodo","Xenon","Talio","Plomo","Bismuto","Polonio","Astato","Radon","Cadmio","Mercurio","Plata","Oro","Itrio","Tantalo","Wolframio","Renio","Osmio","Iridio","Platino","Niobio","Molibdeno","Tecnecio","Lantano","Actinio"];
var remainingValues = localStorage.quimico;

function shuffle(arr){
    return arr.reduce( 
        (newArr, _, i) => {
            var rand = i + ( Math.floor( Math.random() * (newArr.length - i) ) );
            [newArr[rand], newArr[i]] = [newArr[i], newArr[rand]]
            return newArr
        }, [...arr]
    )
}

document.addEventListener("DOMContentLoaded", function(){
    remainingValues = remainingValues == undefined ? initialValues : JSON.parse(remainingValues);
    remainingValues = shuffle(remainingValues);
});

function resetValues() {
    delete localStorage.quimico;
    alert('Se ha borrado el registro de resultados.');
    location.reload(); 
}

function showNext() {
    if(remainingValues.length == 0)
        alert('Ya no hay más resultados.')
    else {
        let value = remainingValues.shift();
        document.querySelector('.value').innerHTML = value;
        localStorage.quimico = JSON.stringify(remainingValues);
    }
    
}