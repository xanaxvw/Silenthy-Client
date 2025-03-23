/**
 * @author itzrauh
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */

const { ipcRenderer, shell } = require("electron");
const pkg = require("../package.json");
const os = require("os");
import { config, database } from "./utils.js";
const nodeFetch = require("node-fetch");

class Splash {
  constructor() {
    this.splash = document.querySelector(".splash");
    this.splashMessage = document.querySelector(".splash-message");
    this.splashAuthor = document.querySelector(".splash-author");
    this.message = document.querySelector(".message");
    this.progress = document.querySelector(".progress");
    document.addEventListener("DOMContentLoaded", async () => {
      let databaseLauncher = new database();
      let configClient = await databaseLauncher.readData("configClient");
      let theme = "dark global";
      let isDarkTheme = await ipcRenderer
        .invoke("is-dark-theme", theme)
        .then((res) => res);
      document.body.className = "dark global";
      if (process.platform == "win32")
        ipcRenderer.send("update-window-progress-load");
      this.startAnimation();
    });
  }

  async startAnimation() {
    let splashes = [{ message: "Silenthy Client", author: "hafuvw" }];
    let splash = splashes[Math.floor(Math.random() * splashes.length)];
    this.splashMessage.textContent = splash.message;
    this.splashAuthor.children[0].textContent = "@" + splash.author;
    await sleep(100);
    document.querySelector("#splash").style.display = "block";
    await sleep(500);
    this.splash.classList.add("opacity");
    await sleep(500);
    this.splash.classList.add("translate");
    this.splashMessage.classList.add("opacity");
    this.splashAuthor.classList.add("opacity");
    this.message.classList.add("opacity");
    await sleep(1000);
    this.checkUpdate();
  }

  async checkUpdate() {
    this.setStatus(`Buscando actualizaciones...`);

    ipcRenderer
      .invoke("update-app")
      .then()
      .catch((err) => {
        return this.shutdown(
          `error al buscar actualizaciones:<br>${err.message}`
        );
      });

    ipcRenderer.on("updateAvailable", () => {
      this.setStatus(`¡Actualización disponible!`);
      if (os.platform() == "win32") {
        ipcRenderer.send("start-update");
      } else return this.dowloadUpdate();
    });

    ipcRenderer.on("error", (event, err) => {
      if (err) return this.shutdown(`${err.message}`);
    });


    ipcRenderer.on("update-not-available", () => {
      console.error("Actualización no disponible.");
      this.maintenanceCheck();
    });
  }

  getLatestReleaseForOS(os, preferredFormat, asset) {
    return asset
      .filter((asset) => {
        const name = asset.name.toLowerCase();
        const isOSMatch = name.includes(os);
        const isFormatMatch = name.endsWith(preferredFormat);
        return isOSMatch && isFormatMatch;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  }

  async dowloadUpdate() {
    const repoURL = pkg.repository.url
      .replace("git+", "")
      .replace(".git", "")
      .replace("https://github.com/", "")
      .split("/");
    const githubAPI = await nodeFetch("https://api.github.com")
      .then((res) => res.json())
      .catch((err) => err);

    const githubAPIRepoURL = githubAPI.repository_url
      .replace("{owner}", repoURL[0])
      .replace("{repo}", repoURL[1]);
    const githubAPIRepo = await nodeFetch(githubAPIRepoURL)
      .then((res) => res.json())
      .catch((err) => err);

    const releases_url = await nodeFetch(
      githubAPIRepo.releases_url.replace("{/id}", "")
    )
      .then((res) => res.json())
      .catch((err) => err);
    const latestRelease = releases_url[0].assets;
    let latest;

    if (os.platform() == "darwin")
      latest = this.getLatestReleaseForOS("mac", ".dmg", latestRelease);
    else if (os == "linux")
      latest = this.getLatestReleaseForOS("linux", ".appimage", latestRelease);

    this.setStatus(
      `Actualización disponible.<br><div class="download-update">Descargar</div>`
    );
    document.querySelector(".download-update").addEventListener("click", () => {
      shell.openExternal(latest.browser_download_url);
      return this.shutdown("Descarga en curso...");
    });
  }

  async maintenanceCheck() {
    config
      .GetConfig()
      .then((res) => {
        if (res.maintenance) return this.shutdown(res.maintenance_message);
        this.startLauncher();
      })
      .catch((e) => {
        console.error(e);
        return this.shutdown(
          "No se detectó conexión a Internet,<br>por favor, inténtelo de nuevo más tarde."
        );
      });
  }

  startLauncher() {
    this.setStatus(`Iniciando el launcher`);
    ipcRenderer.send("main-window-open");
    ipcRenderer.send("update-window-close");
  }

  shutdown(text) {
    this.setStatus(`${text}<br>Cerrando en 5 segundos`);
    let i = 4;
    setInterval(() => {
      this.setStatus(`${text}<br>Cerrando en ${i--} segundos`);
      if (i < 0) ipcRenderer.send("update-window-close");
    }, 1000);
  }

  setStatus(text) {
    this.message.innerHTML = text;
  }

}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey && e.shiftKey && e.keyCode == 73) || e.keyCode == 123) {
    ipcRenderer.send("update-window-dev-tools");
  }
});
new Splash();
