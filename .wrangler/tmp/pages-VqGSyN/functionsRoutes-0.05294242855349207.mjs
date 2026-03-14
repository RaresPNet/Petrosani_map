import { onRequestGet as __api_pins_js_onRequestGet } from "C:\\Users\\Rares\\Documents\\harta_petrosani\\functions\\api\\pins.js"

export const routes = [
    {
      routePath: "/api/pins",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_pins_js_onRequestGet],
    },
  ]