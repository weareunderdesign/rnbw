(function () {
  // create notification div

  let notification = document.createElement("div");
  document.body.appendChild(notification);
  notification.setAttribute(
    "style",
    `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translate(-50%, 0%);
  
        padding: 5px 15px;
        font-size: 14px;
        
        border-radius: 80px;
  
        background: rgb(0, 0, 0);
        color: white;
  
        display: flex;
        align-items: center;
        justify-content: center;
  
        transition: 0.3s;
        opacity: 0.0;
      `
  );
  // notification appear/disappear timeoutID
  let notificationAppearTimeoutID = null;

  if (!window.jQuery) {
    // load jquery js
    let script = document.createElement("SCRIPT");
    script.src =
      "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js";
    script.type = "text/javascript";
    document.getElementsByTagName("head")[0].appendChild(script);
  }

  // poll for jQuery to come into existence
  let checkReady = function (cb) {
    window.jQuery
      ? cb()
      : window.setTimeout(function () {
          checkReady(cb);
        }, 20);
  };

  // start polling...
  checkReady(() => {
    (async () => {
      /*
       *********************************************** 1. Now JQuery is loaded ********************************************************
       */

      //add click event listener to all elements with class "notification"

      $(".notification").click(function () {
        //data-clipboard-text
        let clipboardText = $(this).attr("data-clipboard-text");
        navigator.clipboard.writeText(clipboardText);

        // show notification
        clearTimeout(notificationAppearTimeoutID);
        $(notification).css("opacity", "1.0");

        //mask the clipboard text so that it doesn't render as html
        clipboardText = clipboardText
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        notification.innerHTML = `Copied - ${clipboardText}`;

        // hide notification after 3s delay
        notificationAppearTimeoutID = setTimeout(() => {
          $(notification).css("opacity", "0.0");
        }, 3 * 1000);
      });
    })();
  });
})();
