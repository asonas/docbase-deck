#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
mod docbase;
mod settings;
use serde::{Deserialize, Serialize};
use serde_json::{Result, Value, json};
use tokio::runtime::Handle;

use log::{info, debug};

#[derive(Serialize, Deserialize)]
struct DocbaseApiArgs {
  api_key: String,
  team_name: String,
}

#[tauri::command]
async fn call_docbase_api(args: DocbaseApiArgs) -> std::result::Result<String, String> {
  let client = reqwest::Client::new();
  let url = format!("https://api.docbase.io/teams/{}/posts?per_page=1", args.team_name);

  let response = client
    .get(url)
    .header("X-DocBaseToken", args.api_key)
    .header("Content-Type", "application/json")
    .send()
    .await;

  match response {
    Ok(resp) => {
      if resp.status() == reqwest::StatusCode::OK {
        Ok(json!({"status": 200, "message": "Success"}).to_string())
      } else {
        Err(format!("Failed with status {}", resp.status()))
      }
    }
    Err(e) => Err(format!("Failed to send request: {}", e)),
  }
}


fn main() {
  env_logger::init();
  tauri::Builder::default()
    .setup(move |app| {
      let window = app.get_window("main").unwrap();
      let env = std::env::var("TAURI_ENV").unwrap_or_default();
      // window.open_devtools();

      debug!("setup...........");

      let window_1 = window.clone();
      window.listen("find-memo", move |event| match &event.payload() {
        Some(s) => {
          // let v: Result<Value> = serde_json::from_str(&s);
          let v: Result<Value> = serde_json::from_str(&s);

          if let Ok(v)= v {
            debug!("find-memo");
            debug!("v: {}", v);
            let handle = Handle::current();
            let (tx, rx) = std::sync::mpsc::channel();
            std::thread::spawn(move || {
              handle.block_on(async {
                let config = settings::Secure::get().unwrap();
                match docbase::handle_docbase_request(v.to_string(), config).await {
                  Ok(resp) => {
                    let resp = serde_json::to_string(&resp).expect("JSON serialization error");
                    tx.send(resp).unwrap();
                  },
                  Err(e) => {
                    debug!("Error: {:?}", e);
                  }
                }
              });
            });
            match rx.recv() {
              Ok(recv) => {
                let _ = window_1.emit("find-memo-callback", &recv);
              },
              Err(e) => {
                debug!("Error: {:?}", e);
              }
            }
          }
        }
        None => todo!(),
      });

      let window_2 = window.clone();
      window.listen("get-setting", move |_| {
        match settings::Secure::get() {
          Ok(settings) => {
            let _ = window_2.emit(
              "get-setting-callback",
              serde_json::to_string(&settings).unwrap(),
            );
          }
          Err(e) => {
            info!("Error: {:?}", e);
          }
        }
      });
      window.listen("set-setting", move |event| match &event.payload() {
        Some(s) => {
          info!("set-setting");
          match serde_json::from_str::<settings::Secure>(&s) {
            Ok(settings) => {
              info!("settings: {:?}", settings.api_key);
              settings.store();
            }
            Err(e) => {
              info!("Error: {:?}", e);
            }
          }
        }
        None => todo!(),
      });
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![call_docbase_api])
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
