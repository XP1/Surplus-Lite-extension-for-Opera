/*jslint browser: true, vars: true, white: true, maxerr: 50, indent: 4 */
"use strict";

var surplusLite = (function (operaWindow)
{
    var button = null;
    var buttonProperties =
    {
        title: "Surplus Lite",
        icon: "img/128.png",
        popup:
        {
            href: "popup.html",
            width: 440,
            height: 560
        }
    };

    var options =
    {
        user:
        {
            number: 0
        },
        updater:
        {
            enabled: true,
            countUpdateRequestInterval: 15 * 1000 // 15 seconds.
        }
    };

    var numberOfNotifications =
    {
        unread:
        {
            current: null,
            previous: null
        }
    };

    var updateIcon = function (numberOfNotifications)
    {
        if (button === null)
        {
            return;
        }

        numberOfNotifications = numberOfNotifications.toString();

        var canvas = document.createElement("canvas");
        canvas.setAttribute("width", 19);
        canvas.setAttribute("height", 19);
        var context = canvas.getContext("2d");

        var hasUnreadNotifications = (numberOfNotifications.replace(/[\s0]/g, "") !== "");

        var image = new Image();
        image.src = (hasUnreadNotifications ? "img/new.png" : "img/old.png");
        image.onload = function ()
        {
            context.drawImage(image, 0, 0);
            context.font = "bold 13px arial,sans-serif";
            context.fillStyle = (hasUnreadNotifications ? "#ffffff" : "#cccccc");

            if (parseInt(numberOfNotifications, 10) > 9 || numberOfNotifications === "9+")
            {
                context.fillText("9+", 3, 14);
            }
            else
            {
                context.fillText(numberOfNotifications, 6, 14);
            }

            //operaWindow.postError(canvas.toDataURL());
            button.icon = canvas.toDataURL();
        };
    };

    var xmlHttpRequest = new XMLHttpRequest();
    xmlHttpRequest.onload = function ()
    {
        var numberOfNotificationsText = JSON.parse(xmlHttpRequest.responseText.substr(5))[1];
        //operaWindow.postError("[Surplus Lite] xmlHttpRequest.onload: numberOfNotificationsText: " + numberOfNotificationsText);

        var numberOfUnreadNotifications = numberOfNotifications.unread;

        var current = numberOfUnreadNotifications.current;
        var previous = numberOfUnreadNotifications.previous;
        current = parseInt(numberOfNotificationsText, 10);
        if (current >= 0)
        {
            if (previous === null || previous !== current)
            {
                updateIcon(current);
                previous = current; // After icon updated, store number for the next update.
            }
        }
    };

    var sendCountUpdateRequest = function ()
    {
        xmlHttpRequest.open("GET", "https://plus.google.com/u/" + options.user.number + "/_/n/guc", true);
        xmlHttpRequest.send(null);
    };

    var publicMembers =
    {
        initialize: function ()
        {
            window.addEventListener("DOMContentLoaded", function ()
            {
                /* Add the toolbar button */
                var toolbar = operaWindow.contexts.toolbar;
                button = toolbar.createItem(buttonProperties);
                toolbar.addItem(button);

                if (options.updater.enabled)
                {
                    sendCountUpdateRequest.call(this);
                    window.setInterval(sendCountUpdateRequest, options.updater.countUpdateRequestInterval);
                }
            }, false);
        }
    };

    return publicMembers;
}(window.opera));

(function ()
{
    surplusLite.initialize.call(this);
}());