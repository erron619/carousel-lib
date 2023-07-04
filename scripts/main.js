import "./../styles/main.scss";
import Carousel from "./Carousel";

function random(max)  { return Math.trunc(Math.random() * max) }
function jamble(text) {
    const array = [...text.split(" ")];
    const length = array.length;
    const half = Math.floor(length/2);
    for(let i = 0; i < length; i++) {
        const a = random(length);
        const b = random(length);
        const value_a = array[a];
        const value_b = array[b];
        array[a] = value_b;
        array[b] = value_a;
    }
    for(let i = 0; i < random(half); i++) {
        const at = random(length);
        array.splice(at, 1);
    }
    return array.join(" ");
}

const cards = document.querySelectorAll(".card");
cards.forEach(item => {
    const p = item.querySelector("p");
    const text = p.textContent;
    const mutant = jamble(text) + ".";
    const content = mutant[0].toUpperCase() + mutant.slice(1);
    p.textContent = content;
});

const carousel = new Carousel("#carousel", {
    arrows: true,
    dots: true,
    frame: 3,
    scroll: 1,
    current: 0,
    // grid: true,
    gridCols: 2,
    gridRows: 2,
    speed: 750
});
