(function (document) {
	"use strict";

	// Grab a reference to our auto-binding template
	// and give it some initial binding values
	// Learn more about auto-binding templates at http://goo.gl/Dx1u2g
	var app = document.querySelector("#app");

	app.showProgress = false;

	app.shuffle = function () {
		app.$.tweetList._shuffle();
	};

	app.add = function () {
		app.$.tweetList._add();
	};

	app.clear = function () {
		app.$.tweetList._clear();
	};

	//  these values are needed on the client side and will be injected by the server
	app.config = {
		firebase: {
			apiKey: "<%=firebaseApiKey%>",
			domain: "<%=firebaseDomain%>",
			url: "<%=firebaseUrl%>"
		}
	};
    
	tweetSocket.visibilityStream.subscribe(function (newVisibility) {
		console.log("window visibility event", newVisibility);
		//	there are also blur and focus events, but we don't care for them
		if (newVisibility === "hidden") {
			tweetSocket.pauseTweets();
		} else if (newVisibility === "visible") {
			tweetSocket.resumeTweets();
			app.shuffle();
		}
	});

	// Sets app default base URL
	app.baseUrl = "/";
	if (window.location.port === "") {  // if production
		// Uncomment app.baseURL below and
		// set app.baseURL to "/your-pathname/" if running from folder in production
		// app.baseUrl = "/polymer-starter-kit/";
	}

	app.displayInstalledToast = function () {
		// Check to make sure caching is actually enabled—it won"t be in the dev
		// environment.
		if (!Polymer.dom(document).querySelector("platinum-sw-cache").disabled) {
			Polymer.dom(document).querySelector("#caching-complete").show();
		}
	};

	// Listen for template bound event to know when bindings
	// have resolved and content has been stamped to the page
	app.addEventListener("dom-change", function () { });

	// See https://github.com/Polymer/polymer/issues/1381
	window.addEventListener("WebComponentsReady", function () {
		// imports are loaded and elements have been registered
	});

	// Main area"s paper-scroll-header-panel custom condensing transformation of
	// the appName in the middle-container and the bottom title in the
	// bottom-container.
	// The appName is moved to top and shrunk on condensing. The bottom sub title
	// is shrunk to nothing on condensing.
	window.addEventListener("paper-header-transform", function (e) {
		var appName = Polymer.dom(document).querySelector("#mainToolbar .app-name");
		var middleContainer =
			Polymer.dom(document).querySelector("#mainToolbar .middle-container");
		var bottomContainer =
			Polymer.dom(document).querySelector("#mainToolbar .bottom-container");
		var detail = e.detail;
		var heightDiff = detail.height - detail.condensedHeight;
		var yRatio = Math.min(1, detail.y / heightDiff);
		// appName max size when condensed. The smaller the number the smaller the
		// condensed size.
		var maxMiddleScale = 0.50;
		var auxHeight = heightDiff - detail.y;
		var auxScale = heightDiff / (1 - maxMiddleScale);
		var scaleMiddle =
			Math.max(maxMiddleScale, auxHeight / auxScale + maxMiddleScale);
		var scaleBottom = 1 - yRatio;

		// Move/translate middleContainer
		Polymer.Base.transform("translate3d(0," + yRatio * 100 + "%,0)",
			middleContainer);

		// Scale bottomContainer and bottom sub title to nothing and back
		Polymer.Base.transform("scale(" + scaleBottom + ") translateZ(0)",
			bottomContainer);

		// Scale middleContainer appName
		Polymer.Base.transform("scale(" + scaleMiddle + ") translateZ(0)", appName);
	});

	// Scroll page to top and expand header
	app.scrollPageToTop = function () { app.$.headerPanelMain.scrollToTop(true); };

})(document);
