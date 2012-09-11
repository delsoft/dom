function createDocument(xml) {
	var document = createDocumentNode();

	var elements = []; // all elements in the document

	document.createElement = function (tagName) {
		var node = createElementNode(tagName, document);
		elements.push(node);
		return node;
	};

	document.createComment = function (text) {
		return createCommentNode(text, document);
	};

	document.createTextNode = function (text) {
		return createTextNode(text, document);
	};

	document.createAttribute = function (name) {
		return createAttributeNode(name, document);
	};

	document.getElementById = function (id) {
		// TODO: performance could be probably much better
		for (var i = 0, l = elements.length; i < l; i++) {
			if (elements[i].id === id) {
				return elements[i];
			}
		}
		return null;
	};

	if (xml) {
		parseXml(xml, document);
	}
	return document;
}

function create(xml) {
	var helperDocument = createDocument(xml);
	var newNode = helperDocument.childNodes[0];
	newNode.parentNode = null;
	newNode.ownerDocument = null;
	helperDocument = null; // TODO: destructor shall be called here
	return newNode;
}

function hasClass(elementNode, className) {
	var classRegExp = new RegExp("[^ ]?" + className + "[ $]?", "g");
	return classRegExp.test(elementNode.className);
}

function getElementsByTagName(parentElement, tagName) {
	var nodes = [], childNodes;
	for (var i = 0, l = parentElement.childNodes.length; i < l; i++) {
		if (parentElement.childNodes[i].tagName && parentElement.childNodes[i].tagName === tagName) {
			nodes.push(parentElement.childNodes[i]);
		}
		childNodes = getElementsByTagName(parentElement.childNodes[i], tagName);
		nodes = nodes.concat(childNodes);
	}
	return nodes;
}

function getElementsByClassName(parentElement, className) {
	var nodes = [], childNodes;
	for (var i = 0, l = parentElement.childNodes.length; i < l; i++) {
		if (hasClass(parentElement.childNodes[i], className)) {
			nodes.push(parentElement.childNodes[i]);
		}
		childNodes = getElementsByClassName(parentElement.childNodes[i], className);
		nodes = nodes.concat(childNodes);
	}
	return nodes;
}

function appendChild(parentNode, childNode) {
	parentNode.childNodes.push(childNode);
	childNode.parentNode = parentNode;
	childNode.ownerDocument = getOwnerDocument(parentNode);
}

function getOwnerDocument(node) {
	if (node.nodeType === Node.DOCUMENT_NODE) {
		return node;
	} else {
		return node.ownerDocument;
	}
}

function removeChild(parentNode, childNode) {
	var idx = parentNode.childNodes.indexOf(childNode); // Find the index
	if(idx != -1) {
		parentNode.childNodes.splice(idx, 1);
	}
	childNode.parentNode = null;
	childNode.ownerDocument = null;
	return childNode;
}

/**
 * Inserts the node newChild before the existing child node refChild. If refChild is null, insert newChild at the end of the list of children.
 * If the newChild is already in the tree, it is first removed.
 * Not implemented: If newChild is a DocumentFragment object, all of its children are inserted, in the same order, before refChild.
 * @param parentNode
 * @param newChildNode
 * @param refChildNode
 */
function insertBefore(parentNode, newChildNode, refChildNode) {
	if (refChildNode === null) {
		appendChild(parentNode, newChildNode);
	} else {
		if (newChildNode.parentNode !== null) {
			removeChild(newChildNode.parentNode, newChildNode);
		}
		var idx = parentNode.childNodes.indexOf(refChildNode); // Find the index
		if (idx != -1) {
			parentNode.childNodes.splice(idx, 0, newChildNode);
			newChildNode.parentNode = parentNode;
			newChildNode.ownerDocument = getOwnerDocument(parentNode);
		}
	}
}

function parseXml(xml, parentNode) {
	var inTag = false, inComment = false, closingTag = false;
	var tagBuffer = [], commentBuffer = [], textBuffer = [];
	var newNode;
	for (var i = 0, l = xml.length; i < l; i++) {
		switch(xml[i]) {
			case "<":
				if (inComment) {
					// comment content, just continue
					commentBuffer.push(xml[i]);
				} else if (inTag) {
					// this is malformed XML
				} else {
					// start a new tag
					createNodeFromTextBuffer(textBuffer, parentNode);
					textBuffer = [];

					if ( xml.substring(i, i + 4) === '<!--') { // comment?
						inComment = true;
						i = i + 4;
					} else { // tag?
						inTag = true;
						if (xml[i + 1] === '/') {
							closingTag = true;
						}
					}
				}
				break;
			case "-":
				if (inComment) {
					if (xml.substring(i, i + 3) === '-->') {
						createNodeFromCommentBuffer(commentBuffer, parentNode);
						commentBuffer = [];
						inComment = false;
						i = i + 2;
					} else {
						commentBuffer.push(xml[i]);
					}
				} else if (inTag) {
					tagBuffer.push(xml[i]);
				} else {
					textBuffer.push(xml[i]);
				}
				break;
			case ">":
				if (inComment) {
					// do nothing special, comment end solved in case "-"
					commentBuffer.push(xml[i]);
				} else if (inTag) {
					// tag end
					if (!closingTag) {
						newNode = createNodeFromTagBuffer(tagBuffer, parentNode);
						parentNode = newNode;
					}
					if (xml[i - 1] == '/') {
						closingTag = true;
					}
					if (closingTag) {
						parentNode = parentNode.parentNode;
					}
					tagBuffer = [];
					inTag = false;
					closingTag = false;
				} else {
					// this is malformed XML
				}
				break;
			default:
				if (inComment) {
					commentBuffer.push(xml[i]);
				} else if (inTag) {
					tagBuffer.push(xml[i]);
				} else {
					textBuffer.push(xml[i]);
				}
		}
	}
	createNodeFromTextBuffer(textBuffer, parentNode); // add text following after the last tag
}

/**
 * Private utility function to create a text node from the buffer,
 * if there is any text in the buffer
 * @param textBuffer
 * @param parentNode
 */
function createNodeFromTextBuffer(textBuffer, parentNode) {
	var document = parentNode.ownerDocument || parentNode;
	if (textBuffer.length > 0) {
		var node = document.createTextNode(textBuffer.join(''));
		node.parentNode = parentNode;
		parentNode.childNodes.push(node);
		return node;
	}
	return null;
}

/**
 * Private utility function to create a text node from the buffer,
 * if there is any text in the buffer
 * @param commentBuffer
 * @param parentNode
 */
function createNodeFromCommentBuffer(commentBuffer, parentNode) {
	var document = parentNode.ownerDocument || parentNode;
	if (commentBuffer.length > 0) {
		var node = document.createComment(commentBuffer.join(''));
		node.parentNode = parentNode;
		parentNode.childNodes.push(node);
		return node;
	}
	return null;
}

function parseTag(tagStr) {
	var result = {
		tagName: '',
		attr: []
	};
	var buffer = [];
	var name = null, value = null;
	var inTag = true, inAttr = false, inValue = false, startDelimiter = null;
	for (var i = 0, l = tagStr.length; i < l; i++) {
		switch(tagStr[i]) {
			case '"':
			case "'":
				if (inValue) {
					if (startDelimiter === null) {
						startDelimiter = tagStr[i];
					} else if (tagStr[i] != startDelimiter) {
						buffer.push(tagStr[i]);
					} else {
						inValue = false;
						startDelimiter = null;
						value = buffer.join('');
						buffer = [];
						result.attr.push({ "name": name, "value": value });
					}
				}
				break;
			case "=":
				if (inAttr) {
					inAttr = false;
					inValue = true;
					name = buffer.join('');
					buffer = [];
				}
				break;
			case " ":
			case "\n":
			case "\r":
			case "\t":
				if (inTag) {
					inTag = false;
					result.tagName = buffer.join('');
					buffer = [];
				} else if (inAttr) {
					inAttr = false;
					name = buffer.join('');
					buffer = [];
					result.attr.push({ "name": name, "value": null });
				} else if (inValue) {
					buffer.push(tagStr[i]);
				}
				break;
			default:
				if (!inTag && !inValue) {
					inAttr = true;
				}
				buffer.push(tagStr[i]);
		}
	}
	if (inTag) {
		result.tagName = buffer.join('');
	} else if (inAttr) {
		name = buffer.join('');
		result.attr.push({ "name": name, "value": null });
	}
	return result;
}

function createNodeFromTagBuffer(tagBuffer, parentNode) {
	var document = parentNode.ownerDocument || parentNode;
	if (tagBuffer.length > 0) {
		var tagStr = tagBuffer.join('');
		if (tagStr[tagStr.length - 1] === "/") {
			tagStr = tagStr.slice(0, -2); // strip last "/" in singletons
		}
		var tagObj = parseTag(tagStr);
		var node = document.createElement(tagObj.tagName);
		node.parentNode = parentNode;
		var name, value;
//		var attributes = tagStr.match(/[^\s]+(="[^"]*)?"/gi);
		var attr = tagObj.attr;
		for (var i = 0, l = attr.length; i < l; i++) {
			node.setAttribute(attr[i].name, attr[i].value);
		}
		parentNode.childNodes.push(node);
		updateAttributeMappings(node);
		return node;
	}
	return null;
}

function updateAttributeMappings(elementNode) {
	for (var i = 0, l = elementNode.attributes.length; i < l; i++) {
		var attrNode = elementNode.attributes[i];
		switch(attrNode.name) {
			case 'id': elementNode.id = attrNode.value; break;
			case 'class': elementNode.className = attrNode.value; break;
		}
	}
}

function createElementNode(tagName, ownerDocument) {
	var node = new Node();
	node.nodeType = Node.ELEMENT_NODE;
	node.tagName = tagName;
	node.parentNode = null;
	node.ownerDocument = ownerDocument;
	node.childNodes = [];
	node.attributes = [];
	node.getAttribute = function (name) {
		return getAttribute(node, name);
	};
	node.setAttribute = function (name, value) {
		setAttribute(node, name, value);
	};
	node.getElementsByTagName = function (tagName) {
		return getElementsByTagName(this, tagName);
	};
	node.getElementsByClassName = function (tagName) {
		return getElementsByClassName(this, tagName);
	};
	node.appendChild = function(childNode) {
		appendChild(node, childNode);
	};
	node.removeChild = function(childNode) {
		removeChild(node, childNode);
	};
	node.insertBefore = function(newChildNode, refChildNode) {
		insertBefore(node, newChildNode, refChildNode);
	};
	return node;
}

function createCommentNode(text, ownerDocument) {
	var node = new Node();
	node.nodeType = Node.COMMENT_NODE;
	node.nodeValue = text;
	node.parentNode = null;
	node.ownerDocument = ownerDocument;
	return node;
}

function getAttributeNode(elementNode, name) {
	for (var i = 0, l = elementNode.attributes.length; i < l; i++) {
		if (elementNode.attributes[i].name === name) {
			return elementNode.attributes[i];
		}
	}
	return null;
}

function getAttribute(elementNode, name) {
	var node = getAttributeNode(elementNode, name);
	if (typeof node.value != "undefined") {
		return node.value;
	}
	return null;
}

function setAttribute(elementNode, name, value) {
	var attrNode = getAttributeNode(elementNode, name);
	if (attrNode === null) {
		attrNode = elementNode.ownerDocument.createAttribute(name);
		attrNode.ownerElement = elementNode;
		elementNode.attributes.push(attrNode);
	}
	attrNode.value = value;
	attrNode.specified = (value != null); // true if value is not null
	updateAttributeMappings(elementNode);
}

function createTextNode(text, ownerDocument) {
	var node = new Node();
	node.nodeType = Node.TEXT_NODE;
	node.nodeValue = text;
	node.parentNode = null;
	node.ownerDocument = ownerDocument;
	return node;
}

function createAttributeNode(name, ownerDocument) {
	var node = new Node();
	node.nodeType = Node.ATTRIBUTE_NODE;
	node.name = name;
	node.value = null;
	node.ownerElement = null;
	node.ownerDocument = ownerDocument;
	return node;
}

function createDocumentNode() {
	var node = new Node();
	node.nodeType = Node.DOCUMENT_NODE;
	node.childNodes = [];
	node.getElementsByTagName = function (tagName) {
		return getElementsByTagName(this, tagName);
	};
	node.getElementsByClassName = function (tagName) {
		return getElementsByClassName(this, tagName);
	};
	node.appendChild = function(childNode) {
		appendChild(node, childNode);
	};
	return node;
}

function clone(originalParentNode) {
	return create(originalParentNode.toString());
}

function Node() {
	if (!(this instanceof Node)) {
		return new Node();
	}
}

Node.ELEMENT_NODE = 1;
Node.ATTRIBUTE_NODE = 2;
Node.TEXT_NODE = 3;
Node.COMMENT_NODE = 8;
Node.DOCUMENT_NODE = 9;

Node.prototype = {
	nodeType: null,
	nodeValue: null,

	parentNode: null,
	childNodes: [],
//	firstChild: null,
//	lastChild: null,
//	previousSibling: null,
//	nextSibling: null,
	attributes: [],
	ownerDocument: null,

	toString: nodeToString
};

function nodeToString() {
	var node, i, l, htmlBuffer;
	if (this instanceof Node) {
		node = this;
	} else {
		node = arguments[0];
	}
	switch (node.nodeType) {
		case Node.TEXT_NODE:
			return node.nodeValue;
		case Node.ATTRIBUTE_NODE:
			if (node.specified) {
				return node.name + '="' + node.value + '"';
			} else {
				return node.name;
			}
		case Node.DOCUMENT_NODE:
			htmlBuffer = [];
			for (i = 0, l = node.childNodes.length; i < l; i++) {
				htmlBuffer.push(node.childNodes[i].toString());
			}
			return htmlBuffer.join('');
		case Node.COMMENT_NODE:
			return '<!-- ' + node.nodeValue + '-->';
		case Node.ELEMENT_NODE:
			return elementNodeToString(node);
	}
	return "";
}

function elementNodeToString(node) {
	var htmlBuffer = [];
	htmlBuffer.push('<');
	htmlBuffer.push(node.tagName);
	if (node.attributes.length > 0) {
		for (var i = 0, l = node.attributes.length; i < l; i++) {
			htmlBuffer.push(' ');
			htmlBuffer.push(node.attributes[i].toString());
		}
	}
	if ( (node.childNodes.length === 0)
			&& (node.tagName !== 'script')
			&& (node.tagName != 'textarea')
		) {
			htmlBuffer.push(' />');
	} else {
		htmlBuffer.push('>');
		for (i = 0, l = node.childNodes.length; i < l; i++) {
			htmlBuffer.push(node.childNodes[i].toString());
		}
		if (node.tagName != '!DOCTYPE') {
			htmlBuffer.push('</');
			htmlBuffer.push(node.tagName);
			htmlBuffer.push('>');
		}
	}
	return htmlBuffer.join('');
}

// API
exports.Node = Node;
exports.createDocument = createDocument;

// utility functions
exports.create = create;
exports.hasClass = hasClass;
exports.getElementsByTagName = getElementsByTagName;
exports.getElementsByClassName = getElementsByClassName;
exports.appendChild = appendChild;
exports.insertBefore = insertBefore;
exports.removeChild = removeChild;
exports.clone = clone;