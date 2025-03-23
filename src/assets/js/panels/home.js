/**
 * @author itzrauh
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */
import {
  config,
  database,
  logger,
  changePanel,
  appdata,
  pkg,
  setStatus,
} from "../utils.js";
const { Launch } = require("minecraft-java-core");
const { shell, ipcRenderer } = require("electron");
const Swal = require("sweetalert2");

class Home {
  static id = "home";
  async init(config) {
    this.config = config;
    this.db = new database();
    this.instancesSelect();
    this.socialLick();
    this.IniciarEstadoDiscord();
  }

  
  async IniciarEstadoDiscord() {
    let configClient = await this.db.readData("configClient");
    let instance = await config.getInstanceList();
    let auth = await this.db.readData(
      "accounts",
      configClient.account_selected
    );
    let options = instance.find((i) => i.name == configClient.instance_selct);
    if (auth !== undefined) {
      ipcRenderer.send(
        "new-status-discord-username",
        `${auth.name}`,
        `${options.status.iconUrl}`,
        `${options.status.nameServer}`
      );
    } else ipcRenderer.send("new-status-discord-login");
    document
      .querySelector(".settings-btn")
      .addEventListener("click", (e) => changePanel("settings"));
  }

  async instanceselect(instance) {
    const Toast = Swal.mixin({
      toast: true,
      showCloseButton: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    });
    Toast.fire({
      icon: "success",
      title: "Instancia seleccionada.",
    });
  }

  async iniciarinstancia() {
    const Toast = Swal.mixin({
      toast: true,
      showCloseButton: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    });
    Toast.fire({
      icon: "success",
      title: "¡Iniciando Instancia!",
    });
  }

  socialLick() {
    let socials = document.querySelectorAll(".social-block");

    socials.forEach((social) => {
      social.addEventListener("click", (e) => {
        shell.openExternal(e.target.dataset.url);
      });
    });
  }

  async instancesSelect() {
    let configClient = await this.db.readData("configClient");
    let auth = await this.db.readData(
      "accounts",
      configClient.account_selected
    );
    let instancesList = await config.getInstanceList();
    let instanceSelect = instancesList.find(
      (i) => i.name == configClient?.instance_selct
    )
      ? configClient?.instance_selct
      : null;
    let instanceBTN = document.querySelector(".play-instance");
    let instancePopup = document.querySelector(".instance-popup");
    let instancesListPopup = document.querySelector(".instances-List");
    let instanceCloseBTN = document.querySelector(".close-popup");
    if (instancesList.length === 1) {
      document.querySelector(".instance-select").style.display = "none";
      instanceBTN.style.paddingRight = "0";
    }

    if (!instanceSelect) {
      let newInstanceSelect = instancesList.find(
        (i) => i.whitelistActive == false
      );
      let configClient = await this.db.readData("configClient");
      configClient.instance_selct = newInstanceSelect.name;
      instanceSelect = newInstanceSelect.name;
      await this.db.updateData("configClient", configClient);
    }
    for (let instance of instancesList) {
      if (instance.whitelistActive) {
        let whitelist = instance.whitelist.find(
          (whitelist) => whitelist == auth?.name
        );
        if (whitelist !== auth?.name) {
          if (instance.name == instanceSelect) {
            let newInstanceSelect = instancesList.find(
              (i) => i.whitelistActive == false
            );
            let configClient = await this.db.readData("configClient");
            configClient.instance_selct = newInstanceSelect.name;
            instanceSelect = newInstanceSelect.name;
            setStatus(newInstanceSelect.status);
            await this.db.updateData("configClient", configClient);
          }
        }
      }
      if (instance.name == instanceSelect) setStatus(instance.status);
    }
    instancePopup.addEventListener("click", async (e) => {
      let configClient = await this.db.readData("configClient");

      if (e.target.classList.contains("instance-elements")) {
        let newInstanceSelect = e.target.id;
        let activeInstanceSelect = document.querySelector(".active-instance");

        if (activeInstanceSelect)
          activeInstanceSelect.classList.toggle("active-instance");
        e.target.classList.add("active-instance");
        let actualInstance = newInstanceSelect;
        this.instanceselect(actualInstance);

        configClient.instance_selct = newInstanceSelect;
        await this.db.updateData("configClient", configClient);
        instanceSelect = instancesList.filter(
          (i) => i.name == newInstanceSelect
        );
        instancePopup.style.display = "none";
        let instance = await config.getInstanceList();
        let options = instance.find(
          (i) => i.name == configClient.instance_selct
        );
        let auth = await this.db.readData(
          "accounts",
          configClient.account_selected
        );
        if (auth !== null) {
          ipcRenderer.send(
            "new-status-discord-username",
            `${auth.name}`,
            `${options.status.iconUrl}`,
            `${options.status.nameServer}`
          );
        }
        await setStatus(options.status);
      }
    });

    instanceBTN.addEventListener("click", async (e) => {
      let configClient = await this.db.readData("configClient");
      let instanceSelect = configClient.instance_selct;
      let auth = await this.db.readData(
        "accounts",
        configClient.account_selected
      );

      if (e.target.classList.contains("instance-select")) {
        instancesListPopup.innerHTML = "";
        for (let instance of instancesList) {
          if (instance.whitelistActive) {
            instance.whitelist.map((whitelist) => {
              if (whitelist == auth?.name) {
                if (instance.name == instanceSelect) {
                  instancesListPopup.innerHTML += `<div id="${instance.name}" class="instance-elements active-instance">${instance.name}</div>`;
                } else {
                  instancesListPopup.innerHTML += `<div id="${instance.name}" class="instance-elements">${instance.name}</div>`;
                }
              }
            });
          } else {
            if (instance.name == instanceSelect) {
              instancesListPopup.innerHTML += `<div id="${instance.name}" class="instance-elements active-instance">${instance.name}</div>`;
            } else {
              instancesListPopup.innerHTML += `<div id="${instance.name}" class="instance-elements">${instance.name}</div>`;
            }
          }
        }
        instancePopup.style.display = "flex";
      }

      instanceCloseBTN.addEventListener(
        "click",
        () => (instancePopup.style.display = "none")
      );
    });
    let instance = await config.getInstanceList();
    let options = instance.find((i) => i.name == configClient.instance_selct);
    let playBTN = document.querySelector(".play-btn");
    playBTN.addEventListener("click", async (e) => {
      if (
        e.target.classList.contains("play-btn") 
      ) {
        instancePopup.style.display = "";
        this.startGame();
        playBTN.style.display = "";
        instanceBTN.style.display = "";
      }
    });
  }

  async startGame() {
    let launch = new Launch();
    let configClient = await this.db.readData("configClient");
    let instance = await config.getInstanceList();
    let authenticator = await this.db.readData(
      "accounts",
      configClient.account_selected
    );
    let auth = await this.db.readData(
      "accounts",
      configClient.account_selected
    );
    let options = instance.find((i) => i.name == configClient.instance_selct);

    let playInstanceBTN = document.querySelector(".play-btn");
    let elements = document.querySelector(".play-instance");
    this.iniciarinstancia();
    let infoStartingBOX = document.querySelector(".info-starting-game");
    let infoStarting = document.querySelector(".info-starting-game-text");
    let progressBar = document.querySelector(".progress-bar");

    let opt = {
      url: options.url,
      authenticator: authenticator,
      timeout: 10000,
      path: `${await appdata()}/${
        process.platform == "darwin"
          ? this.config.dataDirectory
          : `.${this.config.dataDirectory}`
      }`,
      instance: options.name,
      version: options.loadder.minecraft_version,
      detached:
        configClient.launcher_config.closeLauncher == "close-all"
          ? false
          : true,
      downloadFileMultiple: configClient.launcher_config.download_multi,
      intelEnabledMac: configClient.launcher_config.intelEnabledMac,

      loader: {
        type: options.loadder.loadder_type,
        build: options.loadder.loadder_version,
        enable: options.loadder.loadder_type == "none" ? false : true,
      },

      verify: options.verify,

      ignored: [...options.ignored],

      javaPath: configClient.java_config.java_path,

      screen: {
        width: configClient.game_config.screen_size.width,
        height: configClient.game_config.screen_size.height,
      },

      memory: {
        min: `${configClient.java_config.java_memory.min * 1024}M`,
        max: `${configClient.java_config.java_memory.max * 1024}M`,
      },
    };

    launch.Launch(opt);

    elements.style.display = "none";
    playInstanceBTN.style.display = "none";
    infoStartingBOX.style.display = "block";
    playInstanceBTN.style.top = "20%";
    progressBar.style.display = "";
    ipcRenderer.send("main-window-progress-load");

    launch.on("extract", (extract) => {
      ipcRenderer.send("main-window-progress-load");
    });

    launch.on("progress", (progress, size) => {
      infoStarting.innerHTML = `Descargando: ${(
        (progress / size) *
        100
      ).toFixed(
        0
      )}% <img style="width:28px;float:right;vertical-align: middle;margin-left: 5px;">`;
      ipcRenderer.send("main-window-progress", { progress, size });
      progressBar.value = progress;
      progressBar.max = size;
    });

    launch.on("check", (progress, size) => {
      infoStarting.innerHTML = `Verificando: ${(
        (progress / size) *
        100
      ).toFixed(
        0
      )}% <img style="width:28px;float:right;vertical-align: middle;margin-left: 5px;">`;
      ipcRenderer.send("main-window-progress", { progress, size });
      progressBar.value = progress;
      progressBar.max = size;
    });

    launch.on("estimated", (time) => {
      let hours = Math.floor(time / 3600);
      let minutes = Math.floor((time - hours * 3600) / 60);
      let seconds = Math.floor(time - hours * 3600 - minutes * 60);
      console.log(`Tiempo estimado: ${hours}h ${minutes}m ${seconds}s`);
    });

    launch.on("speed", (speed) => {
      console.log(
        `Velocidad de descarga: ${(speed / 1067008).toFixed(2)} Mb/s`
      );
    });

    launch.on("patch", (patch) => {
      ipcRenderer.send("main-window-progress-load");
      infoStarting.innerHTML = `Extrayendo Loader... <img style="width:28px;float:right;vertical-align: middle;margin-left: 5px;"`;
    });

    launch.on("data", (e) => {
      progressBar.style.display = "none";
      if (configClient.launcher_config.closeLauncher == "close-launcher") {
        ipcRenderer.send("main-window-hide");
      }
      new logger("Minecraft", "#36b030");

      ipcRenderer.send(
        "new-status-discord-play",
        `${options.status.iconUrl}`,
        `${options.name}`,
        `${auth.name}`
      );

      ipcRenderer.send("main-window-progress-load");
      infoStarting.innerHTML = `Jugando a '${options.name}...`;
    });

    launch.on("close", (code) => {
      if (configClient.launcher_config.closeLauncher == "close-launcher") {
        ipcRenderer.send("main-window-show");
      }
      ipcRenderer.send(
        "new-status-discord-username",
        `${auth.name}`,
        `${options.status.iconUrl}`,
        `${options.status.nameServer}`
      );
      ipcRenderer.send("main-window-progress-reset");
      infoStartingBOX.style.display = "none";
      elements.style.display = "flex";
      playInstanceBTN.style.display = "flex";
      infoStarting.innerHTML = `Launcher en espera...`;
      new logger(pkg.name, "#7289da");
    });

    launch.on("error", (err) => {
      ipcRenderer.send("main-window-progress-reset");
      infoStartingBOX.style.display = "none";
      elements.style.display = "flex";
      playInstanceBTN.style.display = "flex";
      console.log("Error:", err);
      const Toast = Swal.mixin({
        toast: true,
        showCloseButton: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        },
      });
      Toast.fire({
        icon: "error",
        title: "Ha ocurrido un error al iniciar la instancia.",
      });
    });
  }
}
export default Home;
