import { onRequestDelete as __api_images__id__js_onRequestDelete } from "C:\\Users\\Rares\\Documents\\harta_petrosani\\functions\\api\\images\\[id].js"
import { onRequestGet as __api_images__id__js_onRequestGet } from "C:\\Users\\Rares\\Documents\\harta_petrosani\\functions\\api\\images\\[id].js"
import { onRequestDelete as __api_pins__id__js_onRequestDelete } from "C:\\Users\\Rares\\Documents\\harta_petrosani\\functions\\api\\pins\\[id].js"
import { onRequestPatch as __api_pins__id__js_onRequestPatch } from "C:\\Users\\Rares\\Documents\\harta_petrosani\\functions\\api\\pins\\[id].js"
import { onRequestGet as __api_images_js_onRequestGet } from "C:\\Users\\Rares\\Documents\\harta_petrosani\\functions\\api\\images.js"
import { onRequestPost as __api_images_js_onRequestPost } from "C:\\Users\\Rares\\Documents\\harta_petrosani\\functions\\api\\images.js"
import { onRequestGet as __api_pins_js_onRequestGet } from "C:\\Users\\Rares\\Documents\\harta_petrosani\\functions\\api\\pins.js"
import { onRequestPost as __api_pins_js_onRequestPost } from "C:\\Users\\Rares\\Documents\\harta_petrosani\\functions\\api\\pins.js"

export const routes = [
    {
      routePath: "/api/images/:id",
      mountPath: "/api/images",
      method: "DELETE",
      middlewares: [],
      modules: [__api_images__id__js_onRequestDelete],
    },
  {
      routePath: "/api/images/:id",
      mountPath: "/api/images",
      method: "GET",
      middlewares: [],
      modules: [__api_images__id__js_onRequestGet],
    },
  {
      routePath: "/api/pins/:id",
      mountPath: "/api/pins",
      method: "DELETE",
      middlewares: [],
      modules: [__api_pins__id__js_onRequestDelete],
    },
  {
      routePath: "/api/pins/:id",
      mountPath: "/api/pins",
      method: "PATCH",
      middlewares: [],
      modules: [__api_pins__id__js_onRequestPatch],
    },
  {
      routePath: "/api/images",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_images_js_onRequestGet],
    },
  {
      routePath: "/api/images",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_images_js_onRequestPost],
    },
  {
      routePath: "/api/pins",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_pins_js_onRequestGet],
    },
  {
      routePath: "/api/pins",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_pins_js_onRequestPost],
    },
  ]