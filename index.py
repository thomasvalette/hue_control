#! /usr/bin/python
# -*- coding:utf-8 -*-

from flask import Flask, request, render_template
from phue import Bridge
import json

app = Flask(__name__)

b = Bridge("10.0.0.2")

@app.route('/')
def index():    
    # 0 à 65535
    # 0 à 255
    # 0 à 255
    
    return render_template('index.j2', lights= get_lights_info())


@app.route('/setLight', methods=['POST'])
def setLight():

    # input parameters
    input_json = request.get_json(force=True)

    # id
    light_id = int(input_json['light_id'])
    # state on or off
    state    = input_json['on']
    # hue
    hue      = input_json['hue']
    # sat
    sat      = input_json['sat']
    # brightness
    bri      = input_json['bri']


    if(b.get_light(light_id, 'type') == "Extended color light"):
        setColorLight(light_id, state, hue, sat, bri)
    else:
        setKelvinLight(light_id, state, hue, sat, bri)

    return "0"


def setColorLight(light_id, state, hue, sat, bri):
    # hue
    hue = int(hue * 182.54)
    # sat
    sat = int(sat * 2.54)
    # brightness
    bri = int(bri * 2.54)

    # set hue and saturation
    b.set_light(light_id, 'hue', hue)
    b.set_light(light_id, 'sat', sat)
    # set new brightness
    b.set_light(light_id, 'bri', bri)
    # toggle on or off
    b.set_light(light_id, 'on', state)


def setKelvinLight(light_id, state, hue, sat, bri):
    """
    Warm      h: 29.8 , s: 83.529    -> CT 500
    Neutral   h: 307.5, s: 3.125     -> CT 230
    Cold      h: 220.7, s: 23.137    -> CT 154

    CT [154-230-500]
    
    """
    # brightness
    bri = int(bri * 2.54)
    # calculate CT based on hue and saturation (BAD CALCULATION)
    # cold white
    if hue > 220 and hue < 308:
        ct = int(sat * -3.79 + 230) + 10
    # warm white
    else:
        ct = int(sat * 3.36 + 230) - 7
        
    b.set_light(light_id, 'ct', ct)

    # set new brightness
    b.set_light(light_id, 'bri', bri)
    # toggle on or off
    b.set_light(light_id, 'on', state)


@app.route('/getLightsInfo')
def getLightsInfo():
    return json.dumps(get_lights_info())


def get_lights_info():
    """
    """
    # building lights informations object
    lights_info = {}

    # loop on each light
    for light in b.lights:

        # doesn't add light if its name starts with 00
        if light.name[:2] == "00":
            continue

        # every light has these 3 attributes
        light_info = {
            "id": light.light_id,
            "name": light.name,
            "type": light.type,
            "on": light.on
        }
        
        # if the light is standard, it has a brightness attribute
        if light.type in ["Color temperature light", "Extended color light"]:
            light_info.update({"bri": int(light.brightness / 2.54)})
        else:
            light_info.update({"bri": 0})

        # if the light is a color one, it has color attributes
        if light.type == "Extended color light":
            light_info.update({
                "hue": int(light.hue / 182.54),
                "sat": int(light.saturation / 2.54)
            })
        else:
            light_info.update({"hue": 0})
            light_info.update({"sat": 0})


        # add the light informations to the list
        lights_info.update({light.light_id: light_info})

    # lights_info = {
    #     "5":{'id': 5, 'name': 'Couloir', 'type': 'Color temperature light', 'on': True, 'bri': 1},
    #     "7":{'id': 7, 'name': 'Lampadaire', 'type': 'Color temperature light', 'on': False, 'bri': 100}, 
    #     "8":{'id': 8, 'name': 'Table', 'type': 'Extended color light', 'on': True, 'bri': 100, 'hue':355, 'sat':100}, 
    #     "9":{'id': 9, 'name': 'Cuisine', 'type': 'Extended color light', 'on': True, 'bri': 100, 'hue':180, 'sat':50}, 
    #     "10":{'id': 10, 'name': 'Bureau', 'type': 'Extended color light', 'on': True, 'bri': 100, 'hue':90, 'sat':40}
    # }


    return lights_info


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
