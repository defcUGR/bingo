const initialValues = ["Velocidad de la luz","Existe","Pertenece a","Derivada parcial","Para todo","Tal que","Constante gravitatoria universal","Aceleración de la gravedad","Unidad imaginaria","Entropía","Eje de abcisas","Eje de ordenadas","Unión","Intersección","Factorial","Densidad","Alfa","Beta","Gradiente","Delta","Epsilon","Theta","Lambda","Mu","Pi","Tau","Phi","Omega minúscula","Sumatorio","Constante gases ideales","Constante de Planck","Molaridad","Constante de Boltzmann","Gamma","Número de Euler","Números reales","Números racionales","Números naturales","Números enteros","Números complejos","Resistencia eléctrica","Unidad masa en SI","Julios","Número de Avogadro","Metro","Pico segundos","Nano segundos","Newtons","Kelvin","Candelas","Mili voltios","Watts"];
var remainingValues = localStorage.simbolos;

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
    delete localStorage.simbolos;
    alert('Se ha borrado el registro de resultados.');
    location.reload(); 
}

function showNext() {
    if(remainingValues.length == 0)
        alert('Ya no hay más resultados.')
    else {
        let value = remainingValues.shift();
        document.querySelector('.value').innerHTML = value;
        localStorage.simbolos = JSON.stringify(remainingValues);
    }
    
}