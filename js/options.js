/*jslint browser: true, vars: true, white: true, maxerr: 50, indent: 4 */
"use strict";

(function (opera, widget)
{
    var background = opera.extension.bgProcess;
    var surplusLite = background.surplusLite;

    var title = surplusLite.getTitle();

    var preferences = widget.preferences;
    var parseBool = window.parseBool;

    var preferenceElements = null;

    var loadPreferences = function ()
    {
        preferenceElements = document.querySelectorAll("input[type=\"number\"], input[type=\"radio\"]");

        // Load preference elements by name.
        var i = null;
        for (i = 0; i < preferenceElements.length; i += 1)
        {
            try
            {
                var preferenceElement = preferenceElements[i];
                if (preferenceElement.hasAttribute("name"))
                {
                    var preferenceValue = preferences[preferenceElement.getAttribute("name")]; // Use the name of the element to get the value.

                    if (typeof preferenceValue === "string") // All preferences are stored as strings.
                    {
                        var type = preferenceElement.getAttribute("type");
                        if (type === "radio" || type === "checkbox")
                        {
                            if (preferenceElement.hasAttribute("value"))
                            {
                                var elementBoolean = parseBool(preferenceElement.value);
                                var preferenceBoolean = parseBool(preferenceValue);

                                if (typeof elementBoolean === "boolean" && typeof preferenceBoolean === "boolean")
                                {
                                    if (preferenceBoolean === elementBoolean)
                                    {
                                        preferenceElement.checked = true;
                                    }
                                }
                                else
                                {
                                    preferenceElement.setAttribute("value", preferenceValue); // If invalid boolean, set string anyway.
                                }
                            }
                        }
                        else // Neither radiobox nor checkbox.
                        {
                            preferenceElement.setAttribute("value", preferenceValue);
                        }
                    }
                }
            }
            catch (exception)
            {
                opera.postError("[" + title + "] loadPreferences(): exception : " + exception);
            }
        }
    };

    var savePreferences = function ()
    {
        preferenceElements = document.querySelectorAll("input[type=\"number\"], input[type=\"radio\"]:checked"); // Only need to save checked radioboxes.

        // Save preference elements by name.
        var i = null;
        for (i = 0; i < preferenceElements.length; i += 1)
        {
            try
            {
                var preferenceElement = preferenceElements[i];
                if (preferenceElement.hasAttribute("name"))
                {
                    var preferenceName = preferenceElement.getAttribute("name");

                    if (preferenceElement.hasAttribute("value")) // Can only save if the element has a value.
                    {
                        var preferenceValue = preferenceElement.value;

                        if (preferenceElement.checked) // Radiobox or checkbox. HTMLInputElement: http://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-6043025
                        {
                            var preferenceBoolean = parseBool(preferenceValue);

                            if (typeof preferenceBoolean === "boolean")
                            {
                                preferences.setItem(preferenceName, preferenceBoolean);
                            }
                            else
                            {
                                preferences.setItem(preferenceName, preferenceValue); // If invalid boolean, save it as string anyway.
                            }
                        }
                        else // Uncheckable element.
                        {
                            preferences.setItem(preferenceName, preferenceValue);
                        }
                    }
                }
            }
            catch (exception)
            {
                opera.postError("[" + title + "] savePreferences(): exception : " + exception);
            }
        }
    };

    var resetPreferences = function ()
    {
        preferences.clear();
    };

    var validateForm = function (event)
    {
        event.preventDefault();
        event.stopPropagation();

        var isValidForm = event.target.checkValidity();
        if (isValidForm)
        {
            savePreferences();
            surplusLite.reloadPreferences();
        }
    };

    window.addEventListener("DOMContentLoaded", function ()
    {
        loadPreferences();

        document.getElementById("optionsForm").addEventListener("submit", validateForm, false);
        document.getElementById("reset").addEventListener("click", resetPreferences, false);
    }, false);
}(window.opera, window.widget));