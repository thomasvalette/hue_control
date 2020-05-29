from waitress import serve
import hue_control
serve(hue_control.app, host='0.0.0.0', port=5000)