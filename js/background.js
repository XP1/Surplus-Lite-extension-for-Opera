/*jslint browser: true, vars: true, white: true, maxerr: 50, indent: 4 */
"use strict";

var surplusLite = (function (opera, widget)
{
    var button = null;
    var buttonProperties =
    {
        title: "Surplus Lite",
        icon: "images/icons/surplus_128x128.png",
        popup:
        {
            href: "popup.html",
            width: 440,
            height: 560
        }
    };

    var preferences = widget.preferences;
    var parseBool = window.parseBool;
    var updaterIntervalId = null;

    var options =
    {
        user:
        {
            number: 0
        },
        updater:
        {
            enabled: true,
            retryContinously: false,
            maximumNumberOfRetries: 15,
            countUpdateRequestInterval: 15 * 1000 // 15 seconds.
        }
    };

    var uris =
    {
        notifications:
        {
            count: "https://plus.google.com/u/" + options.user.number + "/_/n/guc",
            data: "https://plus.google.com/u/" + options.user.number + "/_/notifications/getnotificationsdata",
            read: "https://plus.google.com/u/" + options.user.number + "/_/notifications/updatelastreadtime",
            all: "https://plus.google.com/notifications/all"
        },
        circles: "https://plus.google.com/circles"
    };

    var counters =
    {
        notifications:
        {
            unread:
            {
                current: null,
                previous: null
            }
        },
        retries:
        {
            current: 0,
            total: 0
        }
    };

    var loadPreferences = function ()
    {
        options =
        {
            user:
            {
                number: (typeof preferences.userNumber === "string" && typeof parseInt(preferences.userNumber, 10) === "number" ? parseInt(preferences.userNumber, 10) : options.user.number)
            },
            updater:
            {
                enabled: (typeof preferences.updater === "string" && typeof parseBool(preferences.updater) === "boolean" ? parseBool(preferences.updater) : options.updater.enabled),
                retryContinously: (typeof preferences.retryContinously === "string" && typeof parseBool(preferences.retryContinously) === "boolean" ? parseBool(preferences.retryContinously) : options.updater.retryContinously),
                maximumNumberOfRetries: (typeof preferences.maximumNumberOfRetries === "string" && typeof parseInt(preferences.maximumNumberOfRetries, 10) === "number" ? parseInt(preferences.maximumNumberOfRetries, 10) : options.updater.maximumNumberOfRetries),
                countUpdateRequestInterval: (typeof preferences.countUpdateRequestInterval === "string" && typeof parseInt(preferences.countUpdateRequestInterval, 10) === "number" ? parseInt(preferences.countUpdateRequestInterval, 10) : options.updater.countUpdateRequestInterval)
            }
        };
    };

    var clearCounters = function ()
    {
        var unreadNotifications = counters.notifications.unread;
        unreadNotifications.current = null;
        unreadNotifications.previous = null;

        counters.retries.current = 0;
    };

    var updateIcon = function (numberOfNotifications)
    {
        if (button === null)
        {
            throw ("[" + buttonProperties.title + "] Cannot update icon because button is null.");
        }
        else if (typeof numberOfNotifications !== "number")
        {
            throw ("[" + buttonProperties.title + "] Cannot update icon because \"numberOfNotifications\" must be a number. Received " + (typeof numberOfNotifications) + " argument.");
        }

        var hasUnreadNotifications = (numberOfNotifications > 0);

        var canvas = document.createElement("canvas");
        canvas.setAttribute("width", 19);
        canvas.setAttribute("height", 19);
        var context = canvas.getContext("2d");

        var image = new Image();
        image.src = (hasUnreadNotifications ? "images/icons/surplusNew_19x19.png" : "images/icons/surplusOld_19x19.png");
        image.onload = function ()
        {
            context.drawImage(image, 0, 0);
            context.font = "bold 13px Arial, sans-serif";
            context.fillStyle = (hasUnreadNotifications ? "#ffffff" : "#cccccc"); /* White : Silver gray. */

            if (numberOfNotifications > 9)
            {
                context.fillText(numberOfNotifications + "+", 3, 14);
            }
            else
            {
                context.fillText(numberOfNotifications, 6, 14);
            }

            //opera.postError(canvas.toDataURL());
            button.icon = canvas.toDataURL();
        };
    };

    var countUpdateRequest = new XMLHttpRequest();
    countUpdateRequest.onload = function ()
    {
        var numberOfRetries = counters.retries;

        try
        {
            if (!(countUpdateRequest.readyState === 4 && countUpdateRequest.status === 200))
            {
                throw ("[" + buttonProperties.title + "] countUpdateRequest.onload: Unexpected readyState " + countUpdateRequest.readyState + " and status " + countUpdateRequest.status + ".");
            }

            var updater = options.updater;

            if (!updater.enabled || (!updater.retryContinously && numberOfRetries.current >= updater.maximumNumberOfRetries))
            {
                window.clearInterval(updaterIntervalId);

                updater.enabled = false;
                preferences.setItem("updater", false);
                clearCounters();
                return;
            }

            var numberOfNotifications = JSON.parse(countUpdateRequest.responseText.substr(5))[1];

            if (typeof numberOfNotifications !== "number")
            {
                // Attempt to parse number.
                var numberRegex = /[0-9]+/g;
                numberOfNotifications = numberRegex.exec(numberOfNotifications.toString())[0]; // Extract only a positive number from contaminated text.
                numberOfNotifications = parseInt(numberOfNotifications, 10);
                if (typeof numberOfNotifications !== "number")
                {
                    throw ("[" + buttonProperties.title + "] Unable to parse the number of notifications. Value is not a number.");
                }
            }

            var numberOfUnreadNotifications = counters.notifications.unread;
            numberOfUnreadNotifications.current = numberOfNotifications;
            if (numberOfUnreadNotifications.current >= 0)
            {
                if (numberOfUnreadNotifications.previous === null || numberOfUnreadNotifications.previous !== numberOfUnreadNotifications.current)
                {
                    updateIcon(numberOfUnreadNotifications.current);
                    numberOfUnreadNotifications.previous = numberOfUnreadNotifications.current; // After icon updated, store number for the next update.
                }
            }

            numberOfRetries.current = 0; // Reset the current number of retries on success.
        }
        catch (exception)
        {
            numberOfRetries.current += 1;
            numberOfRetries.total += 1;
            opera.postError("[" + buttonProperties.title + "] countUpdateRequest.onload: exception (Retry: " + numberOfRetries.current + "; Total: " + numberOfRetries.total + "): " + exception);
        }
    };

    var sendCountUpdateRequest = function ()
    {
        countUpdateRequest.open("GET", uris.notifications.count, true);
        countUpdateRequest.send(null);
    };

    var publicMembers =
    {
        getTitle: function ()
        {
            return buttonProperties.title;
        },
        getNotificationsCountUri: function ()
        {
            return uris.notifications.count;
        },
        getNotificationsDataUri: function ()
        {
            return uris.notifications.data;
        },
        getNotificationsReadUri: function ()
        {
            return uris.notifications.read;
        },
        getNotificationsAllUri: function ()
        {
            return uris.notifications.all;
        },
        getCirclesUri: function ()
        {
            return uris.circles;
        },
        runUpdater: function ()
        {
            window.clearInterval(updaterIntervalId); // Remove any existing update request intervals.
            sendCountUpdateRequest();
            updaterIntervalId = window.setInterval(sendCountUpdateRequest, options.updater.countUpdateRequestInterval);
        },
        reloadPreferences: function ()
        {
            loadPreferences();
            clearCounters();

            if (options.updater.enabled)
            {
                publicMembers.runUpdater();
            }
        },
        initialize: function ()
        {
            /* Add the toolbar button */
            var toolbar = opera.contexts.toolbar;
            button = toolbar.createItem(buttonProperties);
            toolbar.addItem(button);

            publicMembers.reloadPreferences();
        }
    };

    return publicMembers;
}(window.opera, window.widget));

(function ()
{
    window.addEventListener("DOMContentLoaded", function ()
    {
        surplusLite.initialize();
    }, false);
}());