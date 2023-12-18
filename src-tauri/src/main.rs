// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// use serde_json::{Result, Value};
use tauri::Manager;
// use tokio::runtime::Handle;
mod config;
use config::Config;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
  format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
  tauri::Builder::default()
    .setup(move |app| {
      let window = app.get_window("main").unwrap();
      let window_ = window.clone();
      let window_2 = window.clone();
      window.listen("get-config", move |_| {
        let conf = config::get().unwrap();
        let _ = window_2.emit(
          "get-config-callback",
          serde_json::to_string(&conf).unwrap(),
        );
      });
      window.listen("set-config", move |event| match &event.payload() {
        Some(s) => {
          let c: Config = serde_json::from_str(&s).unwrap();
          let _ = config::store(c);
        }
        None => todo!(),
      });
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![greet])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
