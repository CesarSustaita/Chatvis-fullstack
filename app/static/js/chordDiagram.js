/**
 * This file contains the implementation of a chord diagram visualization.
 * It defines functions for creating and interacting with the chord diagram.
 * The chord diagram represents relationships between different entities.
 * @file FILEPATH: /Semantic-ChatVis-with-Flask/app/static/js/chordDiagram.js
 */
var Names;
var svg;
var colors;
var opacityDefault;
var enablePopover = false;

//Function to create the id for each chord gradient
/**
 * Returns the gradient ID for a given link.
 * @param {Object} d - The link object.
 * @returns {string} The gradient ID.
 */
function getGradID(d) { return "linkGrad-" + d.source.index + "-" + d.target.index; }

//Returns an event handler for fading a given chord group.
/**
 * Fades the chords in the chord diagram based on the specified opacity.
 * @param {number} opacity - The opacity value to apply to the chords.
 * @param {object} d - The data object associated with the chord.
 * @param {number} i - The index of the chord.
 * @returns {function} - A function that applies the opacity to the chords.
 */
function fade(opacity, d, i) {
	if (enablePopover != true)
		return;
	return function (d, i) {
		svg.selectAll("path.chord")
			.filter(function (d) { return d.source.index !== i && d.target.index !== i; })
			.transition()
			.style("opacity", opacity);
	};
}//fade

//Highlight hovered over chord
/**
 * Handles the mouseover event for a chord in the chord diagram.
 * @param {Object} d - The data object associated with the chord.
 * @param {number} i - The index of the chord.
 */
function mouseoverChord(d, i) {
	if (enablePopover != true)
		return;

	//Decrease opacity to all
	svg.selectAll("path.chord")
		.transition()
		.style("opacity", 0.1);
	//Show hovered over chord with full opacity
	d3.select(this)
		.transition()
		.style("opacity", 1);

	//Define and show the tooltip over the mouse location
	// $(this).popover({
	// 	placement: 'auto top',
	// 	container: 'body',
	// 	mouseOffset: 10,
	// 	followMouse: true,
	// 	trigger: 'hover',
	// 	html: true,
	// 	content: function () {
	// 		return `<p style='font-size: 11px; text-align: center;'>
	// 					<span style='font-weight:900; color: ${colors[d.source.index % colors.length]}'> ${Names[d.source.index] + (Names.length < 99 ? "" : " [" + (d.source.index + 1) + "]")} </span> envió <span style='font-weight:900'> ${d.source.value} </span> mensaje(s). <br>
	// 					<span style='font-weight:900; color: ${colors[d.target.index % colors.length]}'> ${Names[d.target.index] + (Names.length < 99 ? "" : " [" + (d.target.index + 1) + "]")} </span> envió <span style='font-weight:900'> ${d.target.value} </span> mensaje(s).
	// 				</p>`;
	// 	}
	// });
	// $(this).popover('show');
}//mouseoverChord

//Bring all chords back to default opacity
/**
 * Handles the mouseout event for the chord diagram.
 * Hides the tooltip and sets the opacity back to default for all paths.
 * 
 * @param {Object} d - The data object associated with the chord.
 */
function mouseoutChord(d) {
	//Hide the tooltip
	$('.popover').each(function () {
		$(this).remove();
	});
	//Set opacity back to default for all
	svg.selectAll("path.chord")
		.transition()
		.style("opacity", opacityDefault);
}//function mouseoutChord

/**
 * Creates a chord diagram asynchronously.
 * 
 * @param {Array<Array<number>>} matrix - The matrix representing the chord diagram.
 * @param {Array<string>} newNames - The names for the diagram elements.
 * @param {Array<string>} newColors - The colors for the diagram elements.
 * @param {boolean} bindEvents - Indicates whether to bind events to the diagram elements.
 * @param {string} parentID - The ID of the parent element to append the diagram to.
 * @returns {Promise<void>} A promise that resolves when the chord diagram is created successfully.
 * @throws {Error} If an error occurs while creating the chord diagram.
 */
async function makeChordDiagram(matrix, newNames, newColors, bindEvents, parentID) {
	return new Promise((resolve, reject) => {
		try {
			makeChordDiagramSync(matrix, newNames, newColors, bindEvents, parentID);
			resolve();
		}
		catch (err) {
			reject(err);
		}
	});
}

// Receives a matrix with the relationships
/**
 * Creates a chord diagram synchronously.
 *
 * @param {Array<Array<number>>} matrix - The matrix representing the chord diagram.
 * @param {Array<string>} newNames - The names for the outer arcs.
 * @param {Array<string>} newColors - The colors for the outer arcs.
 * @param {boolean} bindEvents - Indicates whether to bind mouseover and mouseout events to the chords.
 * @param {string} parentID - The ID of the parent element to append the diagram to.
 * @returns {void}
 */
function makeChordDiagramSync(matrix, newNames, newColors, bindEvents, parentID) {
	// var size = newNames.length<99?500:window.innerHeight;
	var parentWidth = d3.select(parentID).node().getBoundingClientRect().width;
	var parentHeight = d3.select(parentID).node().getBoundingClientRect().height;

	var size = Math.min(parentWidth, parentHeight);

	var width = parentWidth,
		height = parentHeight,
		innerRadius = Math.min(width, height) * .3,
		outerRadius = innerRadius * 1.1;

	Names = newNames;
	colors = newColors;
	opacityDefault = 0.8;

	////////////////////////////////////////////////////////////
	/////////// Create scale and layout functions //////////////
	////////////////////////////////////////////////////////////

	var colors = d3.scale.ordinal()
		.domain(d3.range(Names.length))
		.range(colors);

	//A "custom" d3 chord function that automatically sorts the order of the chords in such a manner to reduce overlap	
	var chord = customChordLayout()
		//.padding(.15)
		.sortChords(d3.descending) //which chord should be shown on top when chords cross. Now the biggest chord is at the bottom
		.matrix(matrix);

	var arc = d3.svg.arc()
		.innerRadius(innerRadius * 1.01)
		.outerRadius(outerRadius);

	var path = d3.svg.chord()
		.radius(innerRadius);

	////////////////////////////////////////////////////////////
	////////////////////// Create SVG //////////////////////////
	////////////////////////////////////////////////////////////

	svg = d3.select(parentID).append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

	////////////////////////////////////////////////////////////
	/////////////// Create the gradient fills //////////////////
	////////////////////////////////////////////////////////////

	//Create the gradients definitions for each chord
	var grads = svg.append("defs").selectAll("linearGradient")
		.data(chord.chords())
		.enter().append("linearGradient")
		.attr("id", getGradID)
		.attr("gradientUnits", "userSpaceOnUse")
		.attr("x1", function (d, i) { return innerRadius * Math.cos((d.source.endAngle - d.source.startAngle) / 2 + d.source.startAngle - Math.PI / 2); })
		.attr("y1", function (d, i) { return innerRadius * Math.sin((d.source.endAngle - d.source.startAngle) / 2 + d.source.startAngle - Math.PI / 2); })
		.attr("x2", function (d, i) { return innerRadius * Math.cos((d.target.endAngle - d.target.startAngle) / 2 + d.target.startAngle - Math.PI / 2); })
		.attr("y2", function (d, i) { return innerRadius * Math.sin((d.target.endAngle - d.target.startAngle) / 2 + d.target.startAngle - Math.PI / 2); })

	//Set the starting color (at 0%)
	grads.append("stop")
		.attr("offset", "0%")
		.attr("stop-color", function (d) { return colors(d.source.index); });

	//Set the ending color (at 100%)
	grads.append("stop")
		.attr("offset", "100%")
		.attr("stop-color", function (d) { return colors(d.target.index); });

	////////////////////////////////////////////////////////////
	////////////////// Draw outer Arcs /////////////////////////
	////////////////////////////////////////////////////////////

	var outerArcs = svg.selectAll("g.group")
		.data(chord.groups)
		.enter().append("g")
		.attr("class", "group")
		.on("mouseover", (d, i) => { fade(.1)(d, i); })
		.on("mouseout", (d, i) => { fade(opacityDefault)(d, i); });

	outerArcs.append("path")
		.style("fill", function (d) { return colors(d.index); })
		.attr("d", arc)
		.each(function (d, i) {
			//Search pattern for everything between the start and the first capital L
			var firstArcSection = /(^.+?)L/;

			if (firstArcSection.exec(d3.select(this).attr("d")) == null)
				return;

			//Grab everything up to the first Line statement
			var newArc = firstArcSection.exec(d3.select(this).attr("d"))[1];
			//Replace all the comma's so that IE can handle it
			newArc = newArc.replace(/,/g, " ");

			//If the end angle lies beyond a quarter of a circle (90 degrees or pi/2) 
			//flip the end and start position
			if (d.endAngle > 90 * Math.PI / 180 & d.startAngle < 270 * Math.PI / 180) {
				var startLoc = /M(.*?)A/,		//Everything between the first capital M and first capital A
					middleLoc = /A(.*?)0 0 1/,	//Everything between the first capital A and 0 0 1
					endLoc = /0 0 1 (.*?)$/;	//Everything between the first 0 0 1 and the end of the string (denoted by $)

				if (endLoc.exec(newArc) == null)
					return;

				//Flip the direction of the arc by switching the start en end point (and sweep flag)
				//of those elements that are below the horizontal line
				var newStart = endLoc.exec(newArc)[1];
				var newEnd = startLoc.exec(newArc)[1];
				var middleSec = middleLoc.exec(newArc)[1];

				//Build up the new arc notation, set the sweep-flag to 0
				newArc = "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;
			}//if

			//Create a new invisible arc that the text can flow along
			svg.append("path")
				.attr("class", "hiddenArcs")
				.attr("id", "arc" + i)
				.attr("d", newArc)
				.style("fill", "none");
		});

	////////////////////////////////////////////////////////////
	////////////////// Append Names ////////////////////////////
	////////////////////////////////////////////////////////////

	//Append the label names on the outside
	outerArcs.append("text")
		.each(function (d) { d.angle = (d.startAngle + d.endAngle) / 2; })
		/*.attr("dy", ".15em")*/

		.attr("class", "chordLabel")
		.attr("text-anchor", function (d) { return d.angle > Math.PI ? "end" : null; })
		.attr("transform", function (d) {
			return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
				+ "translate(" + (outerRadius + 10) + ")"
				+ (d.angle > Math.PI ? "rotate(180)" : "");
		})
		.text(function (d, i) { return Names[i]; });
	/*outerArcs.append("text")
		.attr("class", "titles")
		.attr("dy", function(d,i) { return (d.endAngle > 90*Math.PI/180 & d.startAngle < 270*Math.PI/180 ? 25 : -16); })
		.append("textPath")
		.attr("startOffset","50%")
		.attr("font-size", (newNames.length<99?16:12)+"px")
		.style("text-anchor","middle")
		.attr("xlink:href",function(d,i){return "#arc"+i;})
		.text(function(d,i){ return Names.length<99?Names[i]:i+1; });
		*/
	/*group.selectAll(".group-tick-label")
	.data(function(d) { return groupTicks(d, 25); })
	.enter()
	.filter(function(d) { return d.value % 25 === 0; })
	.append("g")
	  .attr("transform", function(d) { return "rotate(" + (d.angle * 180 / Math.PI - 90) + ") translate(" + 200 + ",0)"; })
	.append("text")
		.attr("x", 8)
		.attr("dy", ".35em")
		.attr("transform", function(d) { return d.angle > Math.PI ? "rotate(180) translate(-16)" : null; })
		.style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
		.text(function(d) { return d.value })
		.style("font-size", 9)*/
	////////////////////////////////////////////////////////////
	////////////////// Draw inner chords ///////////////////////
	////////////////////////////////////////////////////////////

	svg.selectAll("path.chord")
		.data(chord.chords)
		.enter().append("path")
		.attr("class", "chord")
		.style("fill", function (d) { return "url(#" + getGradID(d) + ")"; })
		.style("opacity", opacityDefault)
		.attr("d", path)
		.on("mouseover", mouseoverChord)
		.on("mouseout", mouseoutChord);
	if (bindEvents === true)
		enablePopover = true;
}

/**
 * Disables the popover functionality.
 */
function disablePopover() {
	enablePopover = false;
}
