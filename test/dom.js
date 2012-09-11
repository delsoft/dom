var dom = require('../src/dom.js');


exports.create = function (test) {
	var document = dom.createDocument('');
	test.equal(typeof document, "object", "dom.create shall create the object.");
	test.equal(typeof document.getElementById, "function", "DOM shall have method getElementById.");
	test.equal(typeof document.getElementsByClassName, "function", "DOM shall have method getElementsByClassName.");
	test.equal(typeof document.getElementsByTagName, "function", "DOM shall have method getElementsByTagName.");

	test.equal(typeof document.getElementById("myTest"), "object", "DOM method getElementById shall return element object");

	test.done();
};

function testTextNode(node, test) {
	test.ok(node instanceof dom.Node, "Text node shall be an instance of Node");
	test.equal(node.nodeType, dom.Node.TEXT_NODE, "Text node must have proper nodeType");
}

exports.textNode = function (test) {
	var html = 'test';
	var document = dom.createDocument(html);
	test.equal(document.childNodes.length, 1, "The HTML code shall produce one childNode of the document.");
	testTextNode(document.childNodes[0], test);
	test.equal(document.childNodes[0].nodeValue, "test");
	test.equal(document.toString(), html);

	html = '<span>A</span> - <span>B</span>';
	document = dom.createDocument(html);
	test.equal(document.toString(), html);

	test.done();
};

function testElementNode(node, test) {
	test.ok(node instanceof dom.Node, "Element shall be an instance of Node");
	test.equal(node.nodeType, dom.Node.ELEMENT_NODE, "Element node must have proper nodeType");
}

exports.simpleTag = function (test) {
	var html = '<div id="myTest" class="myBlocks testBlocks">my test</div>';
	var document = dom.createDocument(html);
	test.equal(document.childNodes.length, 1, "The HTML code shall produce one childNode of the document.");

	// test element
	var divElm = document.childNodes[0];
	testElementNode(divElm, test);
	test.equal(divElm.tagName, "div");
	test.equal(divElm.parentNode, document);

	// test attributes
	test.equal(divElm.attributes.length, 2);
	test.ok(divElm.attributes[0] instanceof dom.Node, "Attribute shall be an instance of Node");
	test.equal(divElm.attributes[0].name, "id");
	test.equal(divElm.attributes[0].value, "myTest");
	test.equal(divElm.id, "myTest");
	test.equal(divElm.getAttribute("id"), "myTest");

	// test element content
	test.equal(divElm.childNodes.length, 1);
	var textNode = divElm.childNodes[0];
	testTextNode(textNode, test);
	test.equal(textNode.nodeValue, "my test");

	// test getters
	test.equal(document.getElementsByTagName("div").length, 1);
	test.equal(document.getElementById("myTest"), divElm);
	test.equal(document.getElementsByClassName("myBlocks").length, 1, "Node.getElementsByClassName shall return a set of all elements with specified class.");
	test.equal(document.getElementsByClassName("myBlocks")[0], divElm);
	test.equal(document.getElementsByClassName("otherBlocks").length, 0, "Node.getElementsByClassName shall return empty set, if there is no element with specified class.");

	// test serialization
	test.equal(document.toString(), html);

	test.done();
};

exports.attributes = function (test) {
	var html = '<div id="myTest">my test</div>';
	var document = dom.createDocument(html);

	var divElm = document.getElementsByTagName("div")[0];
	divElm.setAttribute("class", "myClass");
	test.equal(document.toString(), '<div id="myTest" class="myClass">my test</div>');

	divElm.setAttribute("class", "otherClass");
	test.equal(document.toString(), '<div id="myTest" class="otherClass">my test</div>');

	test.done();
};


exports.innerTag = function (test) {
	var html = '<div id="myDiv"><span>test 1</span><span>test 2</span><span>test 3</span></div><span class="mySpan">test 4</span>';
	var document = dom.createDocument(html);

	var myDiv = document.childNodes[0];
	test.equal(document.childNodes.length, 2);
	test.equal(myDiv.childNodes.length, 3);
	test.equal(document.toString(), html);

	test.equal(myDiv.getElementsByTagName('span').length, 3);

	test.done();
};

exports.encapsulation = function (test) {
	var htmlA = '<div id="myTest">my test</div>';
	var documentA = dom.createDocument(htmlA);

	var htmlB = '<div id="myDiv"><span>test 1</span><span>test 2</span><span>test 3</span></div><span class="mySpan">test 4</span>';
	var documentB = dom.createDocument(htmlB);

	test.equal(documentA.childNodes.length, 1, "Separate documents shall not affect each other");
	test.equal(documentB.childNodes.length, 2, "Separate documents shall not affect each other");

	// test getters
	test.equal(documentA.getElementsByTagName("span").length, 0, "Method document.getElementsByTagName shall not return elements that belong to other documents.");
	test.equal(documentB.getElementsByTagName("span").length, 4, "Method document.getElementsByTagName shall not return elements that belong to other documents.");

	// test serialization
	test.equal(documentA.toString(), htmlA);
	test.equal(documentB.toString(), htmlB);

	test.done();
};

exports.manipulation = function (test) {
	var document = dom.createDocument();
	var divNode = document.createElement('div');
	var spanNode = document.createElement('span');

	document.appendChild(divNode);
	divNode.appendChild(spanNode);

	test.equals(document.toString(), '<div><span /></div>');

	divNode.removeChild(spanNode);
	test.equals(document.toString(), '<div />');

	dom.insertBefore(divNode.parentNode, spanNode, divNode);
	test.equals(document.toString(), '<span /><div />');

	divNode.appendChild(document.createElement('hr'));
	divNode.appendChild(document.createElement('hr'));
	var secondHr = divNode.getElementsByTagName('hr')[1];
	divNode.insertBefore(spanNode, secondHr);
	test.equals(document.toString(), '<div><hr /><span /><hr /></div>');

	test.done();
};

exports.cloning = function (test) {
	var html = '<div id="myTest">my test</div>';
	var document = dom.createDocument(html);
	var myDiv = document.getElementById("myTest");

	var cloneDivA = dom.clone(myDiv);
	var cloneDivB = dom.clone(myDiv);
	var cloneDivC = dom.clone(cloneDivA);

	document.appendChild(cloneDivA);
	document.appendChild(cloneDivB);
	document.appendChild(cloneDivC);

	test.equals(document.toString(), html + html + html + html);

	test.done();
};

exports.twoDocuments = function (test) {
	var documentA = dom.createDocument('<div id="div1">test 1</div>');
	var documentB = dom.createDocument('<div id="div2">test 2</div>');
	var div2 = documentB.getElementById('div2');
	test.equals(div2.ownerDocument, documentB);

	var div1 = documentA.getElementById('div1');
	div1.appendChild(div2);
	test.equals(div2.ownerDocument, documentA);

	dom.appendChild(documentB, div1);
	test.equals(div1.ownerDocument, documentB);

	test.done();
};

exports.commentTag = function (test) {
	var html = 'a<!-- comment -->b';
	var document = dom.createDocument(html);
	test.equal(document.childNodes.length, 3, "The HTML code shall produce one childNode of the document.");

	// test element parent
	var commentElm = document.childNodes[0];
	test.equal(commentElm.parentNode, document);

	// test serialization
	test.equal(document.toString(), html);

	// test tags inside and around
	html = '<div><!-- <a href="#"></a>  --></div>';
	document = dom.createDocument(html);
	test.equal(document.toString(), html);

	test.done();
};

exports.scriptTag = function (test) {
	var html = '<script src="/script.js" type="text/javascript"></script>';
	var document = dom.createDocument(html);
	test.equal(document.toString(), html, "Script tag must have explicit end tag, otherwise IE is unable to read it.");

	test.done();
};

exports.docType = function (test) {
	var html = '<!DOCTYPE html><html><body><h1>test</h1></body></html>';
	var document = dom.createDocument(html);
	test.equal(document.toString(), html);
	test.done();
};

exports.singletonTag = function (test) {
	var html = '<input type="text" name="singleton" />';
	var document = dom.createDocument(html);
	test.equal(document.toString(), html);

	html = '<div><input type="text" name="singleton" /></div>';
	document = dom.createDocument(html);
	test.equal(document.toString(), html);

	html = [
		'<!-- widget -->',
		'<div class="widget">',
		'	<div>',
		'   	<input type="submit" value="Add entry" />',
		'	</div>',
		'</div>',
		'<!-- /widget -->'].join('\n');
	document = dom.createDocument(html);
	test.equal(document.toString().replace(/[\n\t]*/g, ''), html.replace(/[\n\t]*/g, ''));

//	html = '<li>listItemText <li>another list item';
//	document = dom.createDocument(html);
//	test.equal(document.toString(), html);

	test.done();
};

exports.dashInAttribute = function (test) {
	// explanation: there was an error in the parser - dash was parsed incorrectly
	var html = '<meta charset="utf-8" />';
	var document = dom.createDocument(html);

	test.equal(document.toString(), html);

	test.done();
};


