window.addEventListener('scroll', scrollHandler);

function centerOf(element) {
	let r = element.getBoundingClientRect();
	return r.y + r.height / 2;
}

function scrollHandler(e) {
	let marker = document.getElementById('marker');
	let total_height = $(document).height() - window.innerHeight;
	document.getElementById('scroll').innerHTML = window.scrollY + '/' + total_height;
	let svg_height = document.getElementById('graph').scrollHeight;
	marker.setAttribute('y1', (svg_height * window.scrollY / total_height));
	marker.setAttribute('y2', (svg_height * window.scrollY / total_height));

	document.getElementById('firstpos').innerHTML = centerOf(document.getElementById('first')) - window.innerHeight / 2;
	document.getElementById('secondpos').innerHTML = centerOf(document.getElementById('second')) - window.innerHeight / 2;
}

window.onload = function() {
	scrollHandler(null);
};
