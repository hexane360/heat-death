const line_keyframes = [
	{name: "bang",        time: Math.log10(1e-43), start: () => bottomOf(bang) + window.innerHeight/2, length: () => 0},
	//{name: "end of expansion", temp: 1e27, time: 1e-33},
	{name: "electroweak", time: Math.log10(1.37e-20), start: () => topOfContent(electroweak), length: () => heightOfContent(electroweak)},
	{name: "quark",       time: Math.log10(1.4e-11), start: () => topOfContent(quark), length: () => heightOfContent(quark)},
	/*{name: "",          time: 1e-4},
	{name: "He",          time: 1e2},
	{name: "Dark Ages",   temp: 9e3, time: 5.6e12},
	{name: "Neutral atoms", temp: 3e3, time: 1.2e13},*/
	{name: "human",     time: Math.log10(4.3e17), start: () => topOfContent(human), length: () => heightOfContent(human)},
	{name: "blackhole",   time: Math.log10(3.156e47), start: () => topOfContent(blackhole), length: () => heightOfContent(blackhole)},
	{name: "heatdeath",   time: 1007, start: () => bottomOf(document.documentElement), length: () => 0}
];

function calc_temp(time) {
	return 10.11864255697 - 0.515696152049359*time;
}

const axes_keyframes = [
	{name: "bang", time_bounds: [-43, -6], temp_bounds: [15, 38], start: () => bottomOf(bang), length: () => topOfContent(electroweak) - bottomOf(bang)},
	{name: "electroweak", time_bounds: [-30, -6], temp_bounds: [15, 38], start: () => centerOfContent(electroweak), length: () => heightOfContent(electroweak)/2},
	{name: "quark", time_bounds: [-12, 0], temp_bounds: [10, 32], start: () => topOfContent(quark), length: () => heightOfContent(quark)},
	{name: "human",  time_bounds: [5, 20], temp_bounds: [-3, 30], start: () => topOfContent(human), length: () => heightOfContent(human)},
	{name: "blackhole", time_bounds: [0, 70], temp_bounds: [-20, 30], start: () => topOfContent(blackhole), length: () => heightOfContent(blackhole)},
	{name: "heatdeath", time_bounds: [0, 1007], temp_bounds: [-510, 30], start: () => bottomOf(document.documentElement), length: () => 0},
];

let graph, title, intro, bang, electroweak, t2, quark, t3, human, t4, blackhole;

function topOf(elem) {
	return elem.getBoundingClientRect().top + window.scrollY;
}
function bottomOf(elem) {
	return elem.getBoundingClientRect().bottom + window.scrollY;
}
function heightOfContent(elem) {
	let style = window.getComputedStyle(elem, null);
	return parseFloat(style.getPropertyValue("height"));
}
function centerOfContent(elem, frac=0.5) {
	let style = window.getComputedStyle(elem, null);
	let top = topOf(elem);
	return top + parseFloat(style.getPropertyValue("padding-top")) + frac*parseFloat(style.getPropertyValue("height"));
}
topOfContent = elem => centerOfContent(elem, 0.0);
bottomOfContent = elem => centerOfContent(elem, 1.0);

function ease(x) {
	return x < 0.5 ? 2*x*x : 1 - Math.pow(-2*x + 2, 2)/2;
}
function interpolate(frac, start, end) { return start + frac*(end - start); }

function calc_multiple(begin, end) {
	const range = Math.abs(end - begin);
	if (range > 500) {
		return 100;
	} else if (range > 200) {
		return 50;
	} else if (range > 100) {
		return 20;
	} else if (range > 20) {
		return 5;
	} else if (range > 10) {
		return 2;
	} else if (range > 5) {
		return 1;
	} else if (range > 1) {
		return 0.1;
	}
	return 0.01;
}

function multiples(multiple, begin, end) {
	let start = Math.floor(begin / multiple) * multiple;
	if (start < begin) { start += multiple; }

	let x = start;

	const invalid = multiple < 0
		|| typeof begin === 'undefined'
		|| typeof end === 'undefined';

	const iterator = {
		next: function() {
			if (x > end || invalid) {
				return { done: true };
			} else {
				const value = x;
				x += multiple;
				return { value: value, done: false };
			}
		},
		[Symbol.iterator]: function() { return this; }
	};
	return iterator;
}

function range(start, end, step) {
	let x = start;

	const invalid = end > start ? step <= 0 : step >= 0;
	
	const iterator = {
		next: function() {
			if (x > end || invalid) {
				return { done: true };
			} else {
				const value = x;
				x += step;
				return {value: value, done: false };
			}
		},
		[Symbol.iterator]: function() { return this; }
	};
	return iterator;
}

class AxesCoords {
	constructor(elem, x_begin, x_end, y_begin, y_end) {
		let rect = elem.getBoundingClientRect();
		//canvas coords
		this.rect = rect;
		this.x = rect.x;
		this.y = rect.y;
		this.width = rect.width;
		this.height = rect.height;

		//data coords
		this.x_bounds = [x_begin, x_end];
		this.y_bounds = [y_begin, y_end];
		this.tform_y_bounds = [this.tform(y_begin), this.tform(y_end)];
	}

	get left() { return this.x; }
	get top() { return this.y; }
	get bottom() { return this.y + this.height; }
	get right() { return this.x + this.width; }

	//get canvas coords from data coord
	yval(val) {
		val = this.tform(val);
		let frac = (val - this.tform_y_bounds[0]) / (this.tform_y_bounds[1] - this.tform_y_bounds[0]);
		//frac = frac*frac*Math.sign(frac);
		//frac = frac*frac;
		return frac*this.height + this.y;
	}
	xval(val) {
		let frac = (val - this.x_bounds[0]) / (this.x_bounds[1] - this.x_bounds[0]);
		//frac = frac*frac*Math.sign(frac);
		//frac = frac*frac*frac*frac;
		return frac*this.width + this.x;
	}

	tform(val) { return Math.pow(val+43, 4); }
}

function find_keyframe(keyframes, pos, log=false) {
	for (let i = 0; i < keyframes.length; i++) {
		frame = keyframes[i];
		if (typeof frame.start === 'undefined') { continue; }
		let len = typeof frame.length === 'undefined' ? 0 : frame.length();

		const gap_end = frame.start();
		if (pos > gap_end && pos < gap_end + len) {
			//inside this frame
			if (log) { console.log("Inside frame " + frame.name); }
			return [0, frame, frame];
		}
		if (pos < gap_end) {
			//interpolate between this and last frame
			let last_frame = keyframes[i-1];
			if (typeof last_frame === 'undefined') {
				if (log) { console.log("Before all frames"); }
				return [null, null, null];
			}
			let last_len = typeof last_frame.length === 'undefined' ? 0 : last_frame.length();
			//console.log("Interpolating between " + last_frame.name + " and " + frame.name);
			const gap_start = last_frame.start() + last_len;
			const frac = (pos - gap_start) / (gap_end - gap_start);
			if (log) { console.log("Interpolating: %o %o %o", frac, last_frame, frame); }
			return [frac, last_frame, frame];
		}
	}
	if (log) { console.log("After all frames"); }
	return [null, null, null];
}

var axes_coords;

var x_begin, y_begin, x_end, y_end;

function updatePos() {
	let scroll = window.scrollY;
	let scroll_height = document.body.clientHeight - window.innerHeight;
	let center_pos = window.scrollY + window.innerHeight/2;
	document.getElementById('scroll').innerHTML = scroll + '/' + scroll_height;
	let svg_height = document.getElementById('graph').scrollHeight;

	if (window.scrollY + window.innerHeight == document.body.clientHeight) {
		console.log("Reached end");
		window.setTimeout(function() { graph.classList.add('hide') }, 3000);
	}

	if (center_pos + window.innerHeight/2 > topOf(quark)) {
		graph.classList.remove('dark');
	} else {
		graph.classList.add('dark');
	}

	let [frac, last_frame, frame] = find_keyframe(line_keyframes, center_pos);
	if (frac == null) {
		graph.classList.add('hide');
		return;
	}
	graph.classList.remove('hide');
	frac = ease(frac);
	//let temp = log_interpolate(frac, last_frame.temp, frame.temp);
	let time = interpolate(frac, last_frame.time, frame.time);
	let temp = calc_temp(time);
	document.getElementById('time').innerHTML = "10^" + time.toFixed(2);
	document.getElementById('temp').innerHTML = "10^" + temp.toFixed(2);

	[frac, last_frame, frame] = find_keyframe(axes_keyframes, center_pos);
	if (frac != null) {
		frac = ease(frac);
		x_begin = interpolate(frac, last_frame.temp_bounds[0], frame.temp_bounds[0]);
		y_begin = interpolate(frac, last_frame.time_bounds[0], frame.time_bounds[0]);
		x_end = interpolate(frac, last_frame.temp_bounds[1], frame.temp_bounds[1]);
		y_end = interpolate(frac, last_frame.time_bounds[1], frame.time_bounds[1]);
	}
	axes_coords = new AxesCoords(chartarea, x_begin, x_end, y_begin, y_end);

	const clip_path = `polygon(\
${axes_coords.left} ${axes_coords.top}, \
${axes_coords.right} ${axes_coords.top}, \
${axes_coords.right} ${axes_coords.bottom}, \
${axes_coords.left} ${axes_coords.bottom}) view-box`;

	//line
	let points = Array.from(range(y_begin, y_end + 0.1, 0.1), y =>
		axes_coords.xval(calc_temp(y)) + ',' + axes_coords.yval(y)
	);
	const line = document.getElementById('line');
	line.setAttribute('points', points.join(" "));
	line.setAttribute('clip-path', clip_path);
	//line.setAttribute('clip', `rect(${axes_coords.left}, ${axes_coords.top}, ${axes_coords.right}, ${axes_coords.bottom})`);

	//fill
	points = Array.from(range(y_begin, time, 0.1), y =>
		axes_coords.xval(calc_temp(y)) + ',' + axes_coords.yval(y)
	);
	points.push(axes_coords.xval(temp) + ',' + axes_coords.yval(time));
	points.push(axes_coords.x + ',' + axes_coords.yval(time));
	points.push(axes_coords.x + ',' + axes_coords.y);
	const poly = document.getElementById('poly');
	poly.setAttribute('points', points.join(" "));
	poly.setAttribute('clip-path', clip_path);

	//ticks
	let ticks = "";
	x_multiple = calc_multiple(x_begin, x_end);
	for (const x_tick of multiples(x_multiple, x_begin, x_end)) {
		ticks += svg_tick(false, x_tick, axes_coords);
	}
	y_multiple = calc_multiple(y_begin, y_end);
	for (const y_tick of multiples(y_multiple, y_begin, y_end)) {
		ticks += svg_tick(true, y_tick, axes_coords);
	}
	document.getElementById('ticks').innerHTML = ticks;

	//axes
	document.getElementById('axes').innerHTML = svg_axes(axes_coords);

	//axis labels
	const xlabel = document.getElementById('xlabel');
	xlabel.setAttribute('transform', `translate(${axes_coords.right} ${axes_coords.top})`);
	/*document.getElementById('xunits').setAttribute('x', axes_coords.right);*/
	const ylabel = document.getElementById('ylabel');
	ylabel.setAttribute('transform', `translate(${axes_coords.left} ${axes_coords.bottom}) rotate(0)`);
	/*
	ylabel.setAttribute('x', axes_coords.left);
	ylabel.setAttribute('y', axes_coords.bottom);
	document.getElementById('yunits').setAttribute('x', axes_coords.left);*/
	

	//marker line
	let marker = document.getElementById('marker');
	marker.setAttribute('x1', axes_coords.x);
	marker.setAttribute('x2', axes_coords.xval(temp));
	marker.setAttribute('y1', axes_coords.yval(time));
	marker.setAttribute('y2', axes_coords.yval(time));
}

function initTooltips() {
	for (const elem of document.getElementsByClassName('dim')) {
		let val;
		let unit = elem.getElementsByClassName('unit')[0];
		if (elem.getElementsByTagName('sup').length > 0) {
			const sup = elem.getElementsByTagName('sup')[0];
			let mantissa = sup.previousSibling.textContent.split("×")[0];
			let exponent = sup.textContent;
			val = parseFloat(mantissa) * Math.pow(10, parseFloat(exponent));		
		} else {
			val = parseFloat(unit.previousSibling.textContent);
		}
		unit = unit.textContent.trim();
		const tooltip = elem.appendChild(document.createElement("div"));
		tooltip.className = 'tooltip';

		const base_unit = unit.slice(-1);
		const prefix = unit.charAt(0);
		if (prefix == 'q') {
			val *= 1e-30;
		} else {
			tooltip.innerHTML = "Unknown value";
			continue;
		}
		tooltip.innerHTML = `${val.toPrecision(2)} ${base_unit}`;
	}
}

window.onload = function() {
	graph = document.getElementById('graph');
	title = document.getElementById('title');
	intro = document.getElementById('intro');
	bang = document.getElementById('bang');
	electroweak = document.getElementById('electroweak');
	t2 = document.getElementById('t2');
	quark = document.getElementById('quark');
	t3 = document.getElementById('t3');
	human = document.getElementById('human');
	t4 = document.getElementById('t4');
	blackhole = document.getElementById('blackhole');

	initTooltips();

	//updateHeights();
	updatePos();
};
window.addEventListener('resize', function(e) { updatePos(); });
window.addEventListener('scroll', function(e) { updatePos(); });

//h_align: "start" | "middle" | "end"
//v_align: "baseline" | "middle" | "hanging"
function svg_text(text, x, y, attrs=null) {
	let s = `<text x="${x}" y="${y}"`;
	if (attrs) {
		for (const prop in attrs) {
			s += ` ${prop}="${attrs[prop]}"`;
		}
	}
	return `${s}>${text}</text>`;
}

function round_n(num, places=2) {
	return Math.round((num + Number.EPSILON) * Math.pow(10, places)) / Math.pow(10, places);
}

function svg_tick(y_axis, val, axes_coords, tick_l=15, text_offset=40) {
	let text = svg_text(`10<tspan class="super">${round_n(val, 2)}</tspan>`, 0, -text_offset);
	let tick = `<line x1="0" x2="0" y1="0" y2="${-tick_l}" />`
	let rotate = y_axis ? -90 : 0;
	let x = y_axis ? axes_coords.x : axes_coords.xval(val);
	let y = y_axis ? axes_coords.yval(val) : axes_coords.y;
	return `<g class="tick" transform="translate(${x} ${y}) rotate(${rotate})">\n  ${text}\n  ${tick}</g>`;
}

function svg_axes(axes_coords) {
	return `<line id="xaxis" x1="${axes_coords.left}" x2="${axes_coords.right}" y1="${axes_coords.top}" y2="${axes_coords.top}" />
<line id="yaxis" x1="${axes_coords.left}" x2="${axes_coords.left}" y1="${axes_coords.top}" y2="${axes_coords.bottom}" />`
}
