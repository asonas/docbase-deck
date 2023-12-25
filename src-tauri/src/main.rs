#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
mod config;
use config::Settings;

use log::{info, debug};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
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
