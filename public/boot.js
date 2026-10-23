// Shows a readable message instead of a blank screen if the app fails to start.
(function () {
  var app = function () { return document.getElementById("app"); };
  function show(msg) {
    var a = app();
    if (!a || a.childNodes.length) return;
    var p = document.createElement("pre");
    p.textContent = "BAT could not start.\n\n" + msg + "\n\nTake a screenshot of this screen and send it to the developer.";
    p.style.cssText = "color:#ececec;padding:1.2rem;white-space:pre-wrap;word-break:break-word;font:14px/1.5 ui-monospace,Menlo,Consolas,monospace";
    a.append(p);
  }
  window.addEventListener("error", function (e) { show(e.message || "Unknown error"); });
  window.addEventListener("unhandledrejection", function (e) { show(String((e.reason && e.reason.message) || e.reason)); });
  setTimeout(function () {
    var a = app();
    if (a && !a.childNodes.length) show("Nothing was drawn. One of the app files may be incomplete or in the wrong folder.");
  }, 4000);
})();
