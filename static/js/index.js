import {colorPickerConf, kelvinPickerConf} from './config.js';

/**
 * Base javascript file, containing the base logic of the page
 */

let colorPicker = new iro.ColorPicker('#color-picker-container', {
    width: 320
});

function setColorPicker(mode){
    document.getElementById("color-picker-container").style.opacity = "0%";
    document.getElementById("color-picker-container").style.pointerEvents = "none";
    document.getElementById("color-picker-container").innerHTML = "";
    setTimeout(() => {
        switch(mode){
            case "color":
                colorPicker = new iro.ColorPicker(
                    '#color-picker-container', 
                    colorPickerConf
                );

                colorPicker.color.set({
                    h: lightsInfo[selectedLight].hue,
                    s: lightsInfo[selectedLight].sat,
                    v: lightsInfo[selectedLight].bri
                });
                
                document.getElementById("color-picker-container").style.opacity = "100%";
                document.getElementById("color-picker-container").style.pointerEvents = "auto";

                break;
            case "kelvin":
                colorPicker = new iro.ColorPicker(
                    '#color-picker-container', 
                    kelvinPickerConf
                );

                document.getElementById("color-picker-container").style.opacity = "100%";
                document.getElementById("color-picker-container").style.pointerEvents = "auto";

                break;
        }
        colorPicker.on('color:change', onColorChange);
    }, 250);
}

let lightsInfo = {};


// Init a timeout variable to be used below
let lastChange = new Date().getTime();
let timeoutSendCommandLight = null;

// the currently selected light
let selectedLight = null;


/**
 * Send a maximum of 5 change commands per second to avoid spamming hue bridge
 * @param color   Contains the current color values
 */
function onColorChange(color) {
    console.log(color.hsv);

    // prevent the periodic update to run when the user is choosing the color
    clearInterval(intervalUpdate);
    intervalUpdate = setInterval(updateLightsInfo, 10000);

    let newChange = new Date().getTime()
    let selectedLightDiv = document.getElementById("light_"+selectedLight)

    lightsInfo[selectedLight].on = true;
    updateDivColorLight(
        selectedLight,
        true,
        color.hsv.h,
        color.hsv.s,
        color.hsv.v
    );
    updateDivOnOff();
    let light = selectedLightDiv.id.replace("light_", "");;

    if ((lastChange + 200) < newChange) {
        clearTimeout(timeoutSendCommandLight);

        let state = true;
        console.log(color.hsv.v < 2);
        if (color.hsv.v < 2){
            state = false;
        }

        sendCommandLight(light, state, color.hsv.h, color.hsv.s, color.hsv.v);

        lastChange = newChange
        timeoutSendCommandLight = setTimeout(function () {
            sendCommandLight(light, state, color.hsv.h, color.hsv.s, color.hsv.v);
        }, 250);
    }
}


/**
 * Send to the server the light values
 */
function sendCommandLight(light, state, hue, sat, bri) {
    let xmlHttp = new XMLHttpRequest();

    xmlHttp.open("POST", "/setLight", true);
    xmlHttp.send(JSON.stringify({
        light_id: light,
        on: state,
        hue: hue,
        sat: sat,
        bri: bri
    }));
}



/**
 * Set an click event listener on every light
 */
let lights = document.getElementsByClassName("light");
for (let i = 0; i < lights.length; i++) {
    lights[i].addEventListener('click', lightSelection);
}

/**
 * Trigger on every click on lights
 */
function lightSelection(){
    removeBackgroundLights();
    
    this.style.backgroundColor = "#505050";
    
    // set the selected light variable
    selectedLight = this.firstElementChild.id.replace("light_","");

    updateColorPanel(this.firstElementChild);
}

/**
 * Set an click event listener on every quick control
 */
let quickControls = document.getElementsByClassName("quick_control");
for (let i = 0; i < quickControls.length; i++) {
    quickControls[i].addEventListener('click', quickControlsMap);
}

/**
 * Perform various actions depending on the action clicked
 */
function quickControlsMap(){
    switch (this.firstElementChild.id){
        // ON OFF button toggle
        case "on_off":
            toggleOnOff();
            break;
        case "jour":
            colorPicker.color.set({h:0 ,s:0 ,v:100});
            break;
        case "stim":
            colorPicker.color.set({h:221 ,s:23 ,v:100});
            break;
        case "soir":
            colorPicker.color.set({h:29 ,s:83 ,v:80});
            break;
        case "veille":
            colorPicker.color.set({h:23 ,s:83 ,v:2});
            break;
        default:
            break;
    }
}


function toggleOnOff(){
    if(lightsInfo[selectedLight].on == true){
        console.log("OFF");
        lightsInfo[selectedLight].on = false;
    }else{
        console.log("ON");
        lightsInfo[selectedLight].on = true;
    }
    sendCommandLight(
        selectedLight, 
        lightsInfo[selectedLight].on, 
        lightsInfo[selectedLight].hue, 
        lightsInfo[selectedLight].sat, 
        lightsInfo[selectedLight].bri
    );
    updateDivColorLight(
        selectedLight, 
        lightsInfo[selectedLight].on,
        lightsInfo[selectedLight].hue,
        lightsInfo[selectedLight].sat,
        lightsInfo[selectedLight].bri
    );
    updateDivOnOff();
}


/**
 * Remove selected background from all lights
 */
function removeBackgroundLights() {
    for (let i = 0; i < lights.length; i++) {
        lights[i].style.backgroundColor = "#1C1C1C";
    } 
}


function updateColorPanel(){
    switch(lightsInfo[selectedLight]['type']){
        case "Extended color light":
            setColorPicker("color");

            break;
        case "Color temperature light":
            setColorPicker("kelvin");
            break;
        case "":
            break;
        default:
    }
    updateDivOnOff()

}

/**
 * Get the current light statuses from the server
 */
function getLightsInfo(){
    return new Promise(resolve => {
        let xmlHttp = new XMLHttpRequest();
        // when server response is OK
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
                // parse light info string to json
                resolve(JSON.parse(xmlHttp.responseText));
            }   
        }
        xmlHttp.open("GET", "/getLightsInfo", true);
        xmlHttp.send(); 
    });
}


/**
 * Updates the DOM with current light informations
 */
async function updateLightsInfo(){
    console.log("UPDATE");
    lightsInfo = await getLightsInfo();

    // loop for every light
    for (let [id, lightInfo] of Object.entries(lightsInfo)) {
        // update
        switch (lightInfo.type) {
            case "Extended color light":
                updateDivColorLight(
                    lightInfo.id,
                    lightInfo.on,
                    lightInfo.hue,
                    lightInfo.sat,
                    lightInfo.bri
                );
                break;
            case "Color temperature light":
                updateDivKelvinLight(lightInfo.id,
                    lightInfo.on,
                    lightInfo.hue,
                    lightInfo.sat,
                    lightInfo.bri
                );
                break;
            case "TODO":
                break;
            default:
        }
        if(selectedLight !== null){
            updateDivOnOff();
        }

    }
}
updateLightsInfo();
let intervalUpdate = setInterval(updateLightsInfo, 10000);


function updateDivColorLight(id, on ,hue, sat, bri) {

    let currentLight = document.getElementById("light_" + id)

    // the light is on
    if (on){
        hue = hue / 359;
        sat = sat / 100;
        bri = bri / 100;

        if (bri < 0.7) {
            bri = 0.7;
        }

        let rgb = hsvToRgb(hue, sat, bri);

        currentLight.style.backgroundColor = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
    }
    // the light is off
    else{
        currentLight.style.backgroundColor = "#7a7a7a";
    }

    
}

function updateDivKelvinLight(id, on, hue, sat, bri) {
    
}

function updateDivOnOff(){
    let currentLight = document.getElementById("light_" + selectedLight)
    let onOffButton = document.getElementById("on_off");

    onOffButton.style.backgroundColor = currentLight.style.backgroundColor;
}




/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  v       The value
 * @return  Object          The RGB representation
 */
function hsvToRgb(h, s, v) {
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return {  r: r * 255, g: g * 255, b: b * 255 };
}






function test(){
    console.warn("TEST BUTTON");
    console.info(lightsInfo[selectedLight]);
    console.info(lightsInfo);
    colorPicker.color.set({h:12 ,s:100 ,v:80});
}
document.getElementById("test").addEventListener("click", test);