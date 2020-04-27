var title_h = 2000;
var first_h = 2000;
var second_h = 2000;

function centerOf(elem) {
	let style = window.getComputedStyle(elem, null);
	let top = elem.getBoundingClientRect().top + window.scrollY;
	return top + parseFloat(style.getPropertyValue("padding-top")) + parseFloat(style.getPropertyValue("height")) / 2;
}

function updateHeights() {
	title_h = centerOf(document.getElementById('title'));
	first_h = centerOf(document.getElementById('first'));
	second_h = centerOf(document.getElementById('second'));

	document.getElementById('titlepos').innerHTML = title_h;
	document.getElementById('firstpos').innerHTML = first_h;
	document.getElementById('secondpos').innerHTML = second_h;
}

function updatePos() {
	let total_height = document.body.clientHeight - window.innerHeight;
	document.getElementById('scroll').innerHTML = window.scrollY + '/' + total_height;
	let svg_height = document.getElementById('graph').scrollHeight;

	let marker = document.getElementById('marker');
	marker.setAttribute('y1', svg_height * window.scrollY / total_height);
	marker.setAttribute('y2', svg_height * window.scrollY / total_height);
}

window.onload = function() {
	updateHeights();
	updatePos();
};
window.addEventListener('scroll', function(e) { updatePos(); });
window.addEventListener('resize', function(e) { updateHeights(); });
