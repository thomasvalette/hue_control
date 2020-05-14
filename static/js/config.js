export const colorPickerConf = {
    wheelLightness: false,
    width: 320,
    sliderMargin: 20,
    borderWidth: 1,
    borderColor: "#000000",
    layout: [
        {
            component: iro.ui.Wheel,
            options: {}
        },
        {   // Temperature slider:
            component: iro.ui.Slider,
            options: {
                sliderType: 'kelvin',
            }
        },
        {   // Regular slider:
            component: iro.ui.Slider,
            options: {}
        } 
      ]
};


export const kelvinPickerConf = {
    wheelLightness: false,
    width: 320,
    sliderMargin: 20,
    borderWidth: 1,
    borderColor: "#000000",
    layout: [
        // Temperature slider:
        {
            component: iro.ui.Slider,
            options: {
              sliderType: 'kelvin',
              sliderShape: 'circle'
            }
        },
        // Regular slider:
        {
          component: iro.ui.Slider,
          options: {}
        } 
      ]
};


function issou(){
    let currentX = document.getElementsByClassName("IroHandle")[0].x["baseVal"].value;
    // the X values spread from 14 to 304 for a 320 width circle
    // after substraction it goes from 0 to 290
    currentX = parseInt(currentX) - 14;
    // calculate the approximate percentage, and convert it to custom color index : 
    //  0-4=warm  /  5=white  /  6-10=cold
    currentX = parseInt(currentX / 290 * 11);

    let colorTemp;
    switch(currentX){
        // WARM WHITE
        case 0:
            colorTemp = 500;
            break;
        case 1:
            colorTemp = 446;
            break;
        case 2:
            colorTemp = 382;
            break;
        case 3:
            colorTemp = 338;
            break;
        case 4:
            colorTemp = 284;
            break;
        // WHITE
        case 5:
            colorTemp = 230;
            break;
        case 6:
            colorTemp = 215;
            break;
        case 7:
            colorTemp = 200;
            break;
        case 8:
            colorTemp = 185;
            break;
        case 9:
            colorTemp = 170;
            break;
        case 10:
            colorTemp = 154;
            break;
    }
}