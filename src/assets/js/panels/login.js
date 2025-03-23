/**
 * @author itzrauh
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */
const { AZauth, Mojang } = require("minecraft-java-core");
const { ipcRenderer } = require("electron");

import {
  popup,
  database,
  changePanel,
  accountSelect,
  addAccount,
  config,
  setStatus,
} from "../utils.js";

class Login {
  static id = "login";
  async init(config) {
    this.config = config;
    this.db = new database();
    this.getMicrosoft();
    this.actualizarBotonCancelar();
    let mainLogin = document.querySelector(".login-home");
    mainLogin.style.display = "block";
    document
      .querySelector(".connect-button-offline")
      .addEventListener("click", () => {
        this.getCrack();
        document.querySelector(".cancel-return").style.display = "";
        let loginOffline = document.querySelector(".login-offline");
        document
          .querySelector(".cancel-return")
          .addEventListener("click", () => {
            loginOffline.style.display = "none";
            mainLogin.style.display = "block";
          });
      });
  }

  async actualizarBotonCancelar() {
    let configClient = await this.db.readData("configClient");
    let auth = await this.db.readData(
      "accounts",
      configClient.account_selected
    );
    let cancelBtn = document.querySelector(".cancel-home");
    if (!auth) {
      cancelBtn.style.display = "none";
    } else {
      cancelBtn.style.display = "";
      cancelBtn.addEventListener("click", () => {
        changePanel("settings");
      });
    }
  }
  async getMicrosoft() {
    let configClient = await this.db.readData("configClient");
    let auth = await this.db.readData(
      "accounts",
      configClient.account_selected
    );
    let popupLogin = new popup();
    let loginHome = document.querySelector(".login-home");
    let microsoftBtn = document.querySelector(".connect-home");
    loginHome.style.display = "block";

    microsoftBtn.addEventListener("click", () => {
      popupLogin.openPopup({
        title: "Conexión",
        content: "Por favor, espera...",
        color: "var(--color)",
      });

      ipcRenderer
        .invoke("Microsoft-window", this.config.client_id)
        .then(async (account_connect) => {
          if (account_connect == "cancel" || !account_connect) {
            popupLogin.closePopup();
            return;
          } else {
            await this.saveData(account_connect);
            popupLogin.closePopup();
          }
        })
        .catch((err) => {
          popupLogin.openPopup({
            title: "Error",
            content: err,
            options: true,
          });
        });
    });
  }

  async getCrack() {
    let configClient = await this.db.readData("configClient");
    let auth = await this.db.readData(
      "accounts",
      configClient.account_selected
    );
    let popupLogin = new popup();
    let loginOffline = document.querySelector(".login-offline");
    let mainLogin = document.querySelector(".login-home");
    let emailOffline = document.querySelector(".email-offline");
    let connectOffline = document.querySelector(".connect-offline");
    loginOffline.style.display = "block";
    mainLogin.style.display = "none";

    connectOffline.addEventListener("click", async () => {
      connectOffline.style.display = "none";
      if (emailOffline.value.length < 3) {
        popupLogin.openPopup({
          title: "Error",
          content: "Tu nombre de usuario no puede tener menos de 3 caracteres.",
          options: true,
        });
        connectOffline.style.display = "";
        return;
      }

      if (emailOffline.value.match(/ /g)) {
        popupLogin.openPopup({
          title: "Error",
          content: "Tu nombre de usuario no puede contener espacios.",
          options: true,
        });
        connectOffline.style.display = "";
        return;
      }

      // revisar
      try {
        const pkg = require("../package.json");

        let response = await fetch(
          `http://102.129.137.139:14155/main/launcher/config-launcher/blacklist.json`
        );
        let data = await response.json();
        let blacklist = data.blacklist_users.map((user) => user.toLowerCase());

        // Convertir el nombre ingresado a minúsculas antes de comparar
        let emailLowerCase = emailOffline.value.toLowerCase();

        if (blacklist.includes(emailLowerCase)) {
          popupLogin.openPopup({
            title: "Error",
            content: "No puedes escoger ese nick, elige otro.",
            options: true,
          });
          connectOffline.style.display = "";
          return;
        }
      } catch (err) {
        console.error("Failed to fetch blacklist:", err);
        popupLogin.openPopup({
          title: "Error",
          content:
            "No se ha podido contactar con el servidor, prueba más tarde.",
          options: true,
        });
        connectOffline.style.display = "";
        return;
      }

      let MojangConnect = await Mojang.login(emailOffline.value);

      if (MojangConnect.error) {
        popupLogin.openPopup({
          title: "Error",
          content: MojangConnect.message,
          options: true,
        });
        connectOffline.style.display = "";
        return;
      }
      popupLogin.closePopup();
      await this.saveData(MojangConnect);
      connectOffline.style.display = "";
    });
  }

  async getAZauth() {
    let AZauthClient = new AZauth(this.config.online);
    let PopupLogin = new popup();
    let loginAZauth = document.querySelector(".login-AZauth");
    let loginAZauthA2F = document.querySelector(".login-AZauth-A2F");

    let AZauthEmail = document.querySelector(".email-AZauth");
    let AZauthPassword = document.querySelector(".password-AZauth");
    let AZauthA2F = document.querySelector(".A2F-AZauth");
    let connectAZauthA2F = document.querySelector(".connect-AZauth-A2F");
    let AZauthConnectBTN = document.querySelector(".connect-AZauth");
    let AZauthCancelA2F = document.querySelector(".cancel-AZauth-A2F");

    loginAZauth.style.display = "block";

    AZauthConnectBTN.addEventListener("click", async () => {
      PopupLogin.openPopup({
        title: "Conectando...",
        content: "Por favor, espere...",
        color: "var(--color)",
      });

      if (AZauthEmail.value == "" || AZauthPassword.value == "") {
        PopupLogin.openPopup({
          title: "Error",
          content: "Por favor, complete todos los campos.",
          options: true,
        });
        return;
      }

      let AZauthConnect = await AZauthClient.login(
        AZauthEmail.value,
        AZauthPassword.value
      );

      if (AZauthConnect.error) {
        PopupLogin.openPopup({
          title: "Error",
          content: AZauthConnect.message,
          options: true,
        });
        return;
      } else if (AZauthConnect.A2F) {
        loginAZauthA2F.style.display = "block";
        loginAZauth.style.display = "none";
        PopupLogin.closePopup();

        AZauthCancelA2F.addEventListener("click", () => {
          loginAZauthA2F.style.display = "none";
          loginAZauth.style.display = "block";
        });

        connectAZauthA2F.addEventListener("click", async () => {
          PopupLogin.openPopup({
            title: "Conectando",
            content: "Por favor, espere...",
            color: "var(--color)",
          });

          if (AZauthA2F.value == "") {
            PopupLogin.openPopup({
              title: "Error",
              content: "Veuillez entrer le code A2F.",
              options: true,
            });
            return;
          }

          AZauthConnect = await AZauthClient.login(
            AZauthEmail.value,
            AZauthPassword.value,
            AZauthA2F.value
          );

          if (AZauthConnect.error) {
            PopupLogin.openPopup({
              title: "Error",
              content: AZauthConnect.message,
              options: true,
            });
            return;
          }

          await this.saveData(AZauthConnect);
          PopupLogin.closePopup();
        });
      } else if (!AZauthConnect.A2F) {
        await this.saveData(AZauthConnect);
        PopupLogin.closePopup();
      }
    });
  }

  async saveData(connectionData) {
    let configClient = await this.db.readData("configClient");
    let account = await this.db.createData("accounts", connectionData);
    let instanceSelect = configClient.instance_selct;
    let instancesList = await config.getInstanceList();
    configClient.account_selected = account.ID;

    for (let instance of instancesList) {
      if (instance.whitelistActive) {
        let whitelist = instance.whitelist.find(
          (whitelist) => whitelist == account.name
        );
        if (whitelist !== account.name) {
          if (instance.name == instanceSelect) {
            let newInstanceSelect = instancesList.find(
              (i) => i.whitelistActive == false
            );
            configClient.instance_selct = newInstanceSelect.name;
            await setStatus(newInstanceSelect.status);
          }
        }
      }
    }

    await this.db.updateData("configClient", configClient);
    await addAccount(account);
    await accountSelect(account);
    changePanel("home");
    let instance = await config.getInstanceList();
    let auth = await this.db.readData(
      "accounts",
      configClient.account_selected
    );
    let options = instance.find((i) => i.name == configClient.instance_selct);
    ipcRenderer.send(
      "new-status-discord-username",
      `${auth.name}`,
      `${options.status.iconUrl}`,
      `${options.status.nameServer}`
    );
  }
}
export default Login;
