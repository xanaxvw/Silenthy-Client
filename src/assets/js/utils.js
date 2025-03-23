/**
 * @author itzrauh
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */

const { ipcRenderer } = require("electron");
const { Status } = require("minecraft-java-core");
const fs = require("fs");
const pkg = require("../package.json");

import config from "./utils/config.js";
import database from "./utils/database.js";
import logger from "./utils/logger.js";
import popup from "./utils/popup.js";
import { skin2D } from "./utils/skin.js";
import slider from "./utils/slider.js";

async function changePanel(id) {
  let panel = document.querySelector(`.${id}`);
  let active = document.querySelector(`.active`);
  if (active) active.classList.toggle("active");
  panel.classList.add("active");
}

async function setBackground(theme) {
  if (typeof theme == "undefined") {
    let databaseLauncher = new database();
    let configClient = await databaseLauncher.readData("configClient");
    theme = configClient?.launcher_config?.theme || "auto";
    theme = await ipcRenderer.invoke("is-dark-theme", theme).then((res) => res);
  }
  let background;
  let body = document.body;
  body.className = theme ? "dark global" : "light global";
  background = `url(./assets/images/background/background.png)`;
  body.style.backgroundImage = background
    ? background
    : theme
    ? "#000"
    : "#fff";
  body.style.backgroundSize = "cover";
}

async function appdata() {
  return await ipcRenderer.invoke("appData").then((path) => path);
}

async function addAccount(data) {
  let skin = false;
  if (data?.profile?.skins[0]?.base64)
    skin = await new skin2D().creatHeadTexture(data.profile.skins[0].base64);
  let div = document.createElement("div");
  div.classList.add("account");
  div.id = data.ID;
  div.innerHTML = `
        <div class="profile-image" ${
          skin ? 'style="background-image: url(' + skin + ');"' : ""
        }></div>
        <div class="profile-infos">
            <div class="profile-pseudo">${data.name}</div>
            <div class="profile-uuid">${data.uuid}</div>
        </div>
        <div class="delete-profile" id="${data.ID}">
            <div class="icon-account-delete delete-profile-icon"></div>
        </div>
    `;
  return document.querySelector(".accounts-list").appendChild(div);
}

async function accountSelect(data) {
  let account = document.getElementById(`${data.ID}`);
  let activeAccount = document.querySelector(".account-select");

  if (activeAccount) activeAccount.classList.toggle("account-select");
  account.classList.add("account-select");
  if (data?.profile?.skins[0]?.base64);
}

async function setStatus(opt) {
  let nameServerElement = document.querySelector(".server-status-name");
  let iconServerElement = document.querySelector(".server-status-icon");
  let statusServerElement = document.querySelector(".server-status-text");
  let playersOnline = document.querySelector(
    ".status-player-count .player-count"
  );

  if (!opt) {
    statusServerElement.classList.add("red");
    statusServerElement.innerHTML = `Offline`;
    document.querySelector(".status-player-count").classList.add("red");
    playersOnline.innerHTML = "0";
    return;
  }

  let body = document.body;
  let { ip, port, nameServer, iconUrl, backgroundUrl } = opt;
  nameServerElement.innerHTML = nameServer;
  if (iconUrl == "default") {
    let iconUrlDefault = "./assets/images/icon.png";
    iconServerElement.src = iconUrlDefault;
  } else {
    iconServerElement.src = iconUrl;
  }
  if (backgroundUrl == "default") {
    let backgroundDefault = "url(./assets/images/background/background.png)";
    body.style.backgroundImage = backgroundDefault;
  } else {
    body.style.backgroundImage = `url(${backgroundUrl})`;
  }
  let status = new Status(ip, port);
  let statusServer = await status
    .getStatus()
    .then((res) => res)
    .catch((err) => err);

  if (!statusServer.error) {
    statusServerElement.classList.remove("red");
    document.querySelector(".status-player-count").classList.remove("red");
    statusServerElement.innerHTML = `Online`;
    playersOnline.innerHTML = statusServer.playersConnect;
  } else {
    statusServerElement.classList.add("red");
    statusServerElement.innerHTML = `Offline`;
    document.querySelector(".status-player-count").classList.add("red");
    playersOnline.innerHTML = "0";
  }
}
// Función para actualizar la visibilidad del botón "cancel-home"

export {
  appdata as appdata,
  changePanel as changePanel,
  config as config,
  database as database,
  logger as logger,
  popup as popup,
  skin2D as skin2D,
  addAccount as addAccount,
  setBackground as setBackground,
  accountSelect as accountSelect,
  slider as Slider,
  pkg as pkg,
  setStatus as setStatus
};
