const initialValues = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90];
var remainingValues = localStorage.numeros;

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
    delete localStorage.numeros;
    alert('Se ha borrado el registro de resultados.');
    location.reload(); 
}

function showNext() {
    if(remainingValues.length  == 0)
        alert('Ya no hay más resultados.')
    else {
        let value = remainingValues.shift();
        document.querySelector('.value').innerHTML = value;
        localStorage.numeros = JSON.stringify(remainingValues);
    }
    
}