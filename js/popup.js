/*jslint browser: true, vars: true, white: true, maxerr: 50, indent: 4 */
"use strict";

(function (opera, localStorage)
{
    var background = opera.extension.bgProcess;
    var surplusLite = background.surplusLite;

    var title = surplusLite.getTitle();
    var notificationsAllUri = surplusLite.getNotificationsAllUri();

    var problemSuggestionTimeoutId = null;

    var notifications = document.getElementById("notifications");

    var loadNotificationsLocally = function ()
    {
        var notificationsHtml = localStorage.getItem("notificationsHtml");
        if (typeof notificationsHtml === "string")
        {
            notifications.innerHTML = notificationsHtml;
            window.clearTimeout(problemSuggestionTimeoutId);
        }
    };

    var loadNotifications = function ()
    {
        try
        {
            var notificationsRequest = new XMLHttpRequest();
            notificationsRequest.onload = function ()
            {
                if (!(notificationsRequest.readyState === 4 && notificationsRequest.status === 200))
                {
                    throw ("[" + title + "] notificationsRequest.onload: Unexpected readyState " + notificationsRequest.readyState + " and status " + notificationsRequest.status + ".");
                }

                var notificationItems = window.parseNotifications(eval(notificationsRequest.responseText.substr(5))); // TODO: use something other than EVAL to parse the malformed JSON.
                notifications.innerHTML = "";
                window.clearTimeout(problemSuggestionTimeoutId);

                var circlesUri = surplusLite.getCirclesUri();

                var i = null;
                for (i = 0; i < notificationItems.length; i += 1)
                {
                    var item = document.createElement("a");
                    var uri = notificationItems[i].url;
                    var isUriString = (typeof uri === "string");

                    var div = document.createElement("div");
                    var isUnread = notificationItems[i].unread;
                    div.setAttribute("class", ("item " + (i === 0 ? "firstItem " : "") + (typeof isUnread === "boolean" && isUnread ? "unread" : "")));

                    var img = document.createElement("img");
                    img.setAttribute("src", notificationItems[i].pic);
                    div.appendChild(img);

                    var chevron = document.createElement("div");
                    chevron.setAttribute("class", "chevron");
                    div.appendChild(chevron);

                    var icon = document.createElement("span");
                    icon.setAttribute("class", "icon " + (isUriString ? "stream" : "circles"));
                    div.appendChild(icon);

                    var text = document.createElement("div");
                    text.innerHTML = notificationItems[i].html;
                    div.appendChild(text);

                    item.setAttribute("href", (isUriString ? uri : circlesUri));
                    item.appendChild(div);

                    notifications.appendChild(item);
                }

                localStorage.setItem("notificationsHtml", notifications.innerHTML);
            };

            notificationsRequest.open("GET", surplusLite.getNotificationsDataUri(), true);
            notificationsRequest.send(null);
        }
        catch (exception)
        {
            opera.postError("[" + title + "] loadNotifications(): exception : " + exception);
        }
    };

    var markAllRead = function ()
    {
        try
        {
            var notificationsAllRequest = new XMLHttpRequest();
            notificationsAllRequest.onload = function ()
            {
                if (!(notificationsAllRequest.readyState === 4 && notificationsAllRequest.status === 200))
                {
                    throw ("[" + title + "] notificationsAllRequest.onload: Unexpected readyState " + notificationsAllRequest.readyState + " and status " + notificationsAllRequest.status + ".");
                }

                var code = notificationsAllRequest.responseText.match(/"https:\/\/www\.google\.com\/csi"\,"([A-Za-z0-9\-_:]+)"\,\,\,/)[1];
                var readUpdateRequest = new XMLHttpRequest();
                readUpdateRequest.onload = function ()
                {
                    if (!(readUpdateRequest.readyState === 4 && readUpdateRequest.status === 200))
                    {
                        throw ("[" + title + "] readUpdateRequest.onload: Unexpected readyState " + readUpdateRequest.readyState + " and status " + readUpdateRequest.status + ".");
                    }

                    loadNotifications();
                };
                readUpdateRequest.open("POST", surplusLite.getNotificationsReadUri(), true);
                readUpdateRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                readUpdateRequest.send("time=" + (1000 * new Date()) + "&at=" + code);
            };

            notificationsAllRequest.open("GET", notificationsAllUri, true);
            notificationsAllRequest.send(null);
        }
        catch (exception)
        {
            opera.postError("[" + title + "] markAllRead(): exception : " + exception);
        }
    };

    window.addEventListener("DOMContentLoaded", function ()
    {
        problemSuggestionTimeoutId = window.setTimeout(function ()
        {
            var problemSuggestion = document.getElementById("problemSuggestion");

            if (problemSuggestion instanceof HTMLElement && problemSuggestion.hasAttribute("class"))
            {
                problemSuggestion.setAttribute("class", problemSuggestion.getAttribute("class").replace(/\bhide\b/, ""));
            }
        }, 5 * 1000);

        loadNotificationsLocally();
        loadNotifications();

        document.getElementById("markAllRead").addEventListener("click", markAllRead, false);
        document.getElementById("viewAll").setAttribute("href", notificationsAllUri);
    }, false);
}(window.opera, window.localStorage));