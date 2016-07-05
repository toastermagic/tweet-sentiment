(function (document) {
	var hidden = "hidden";

	// Standards:
	if (hidden in document)
		document.addEventListener("visibilitychange", onchange);
	else if ((hidden = "mozHidden") in document)
		document.addEventListener("mozvisibilitychange", onchange);
	else if ((hidden = "webkitHidden") in document)
		document.addEventListener("webkitvisibilitychange", onchange);
	else if ((hidden = "msHidden") in document)
		document.addEventListener("msvisibilitychange", onchange);
	// IE 9 and lower:
	else if ("onfocusin" in document)
		document.onfocusin = document.onfocusout = onchange;
	// All others:
	else
		window.onpageshow = window.onpagehide
			= window.onfocus = window.onblur = onchange;

	function onchange(evt) {
		var v = "visible", h = "hidden",
			evtMap = {
				focus: v, focusin: v, pageshow: v, blur: h, focusout: h, pagehide: h
			};

		evt = evt || window.event;
		var evName = "";
		if (evt.type in evtMap)
			evName = evtMap[evt.type];
		else
			evName = this[hidden] ? "hidden" : "visible";
		
		if (document && document.body)
		{
			document.body.className = evName;
			document.dispatchEvent(new CustomEvent("pagevis", { detail: evName }));
		}
	}

	// set the initial state (but only if browser supports the Page Visibility API)
	if (document[hidden] !== undefined)
		onchange({ type: document[hidden] ? "blur" : "focus" });
})(document);
