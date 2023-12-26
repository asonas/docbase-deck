#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::f32::consts::E;

use tauri::Manager;
mod config;
mod docbase;
use config::Settings;
use serde_json::{Result, Value};
use tokio::runtime::Handle;

use log::{info, debug};

#[tauri::command]
fn greet(name: &str) -> String {
  format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
  env_logger::init();
  tauri::Builder::default()
    .setup(move |app| {
      let window = app.get_window("main").unwrap();
      window.open_devtools();
      debug!("setup...........");

      let window_1 = window.clone();
      window.listen("find-memo", move |_| {
        debug!("find-memo");
        let handle = Handle::current();
        let (tx, rx) = std::sync::mpsc::channel();
        std::thread::spawn(move || {
          handle.block_on(async {
            let config = config::get().unwrap();
            match docbase::handle_docbase_request(config).await {
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
        let recv = rx.recv().unwrap();
        let _ = window_1.emit("find-memo-callback", &recv);

      });

      let window_2 = window.clone();
      window.listen("get-setting", move |_| {
        let conf = config::get().unwrap();
        let _ = window_2.emit(
          "get-setting-callback",
          serde_json::to_string(&conf).unwrap(),
        );
      });
      window.listen("set-setting", move |event| match &event.payload() {
        Some(s) => {
          info!("set-setting");
          let settings: Settings = serde_json::from_str(&s).unwrap();
          info!("settings: {:?}", settings.api_key);
          config::store(settings);
        }
        None => todo!(),
      });
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      greet,

    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
