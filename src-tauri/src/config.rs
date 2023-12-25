extern crate directories;
use directories::ProjectDirs;
use serde::{Serialize, Deserialize};
use std::fs::DirBuilder;
use std::fs::File;
use std::io::ErrorKind;
use std::io::{Read, Write};

use log::{info, debug};

const APP: &str = "docbasedeck";

#[derive(Serialize, Deserialize)]
pub struct Settings {
  pub api_key: String,
  pub team_name: String,
}

fn prepare(){
  // TODO: save to Keychain.app
  if let Some(config_path) = ProjectDirs::from("", "", APP) {
    let filename = "config.toml";

    DirBuilder::new()
      .recursive(true)
      .create(config_path.config_dir())
      .unwrap();

    let f = File::open(config_path.config_dir().join(filename));
    let _f = match f {
      Ok(file) => file,
      Err(ref err) if err.kind() == ErrorKind::NotFound => {
        match File::create(config_path.config_dir().join(filename)) {
          Ok(create) => create,
          Err(e) => panic!("Problem creating the config file: {:?}", e),
        }
      }
      Err(error) => {
        panic!("Problem opening the config file: {:?}", error)
      }
    };
  };
}

pub fn get() -> std::result::Result<Settings, std::io::Error> {
  prepare();
  debug!("getting config");
  if let Some(config_path) = ProjectDirs::from("", "", APP) {
    let filename = "config.toml";
    let mut file = File::open(config_path.config_dir().join(filename))?;
    debug!("file: {:?}", config_path.config_dir().join(filename))  ;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    let settings: Settings = toml::from_str(&contents).unwrap();
    debug!("settings: {:?}", settings.api_key);
    Ok(settings)
  } else {
    Err(std::io::Error::new(
      std::io::ErrorKind::NotFound,
      "Config file not found",
    ))
  }
}

pub fn store(settings: Settings) -> std::result::Result<(), std::io::Error> {
  prepare();

  if let Some(config_path) = ProjectDirs::from("", "", APP) {
    let filename = "config.toml";
    let mut file = File::create(config_path.config_dir().join(filename))?;
    let toml = toml::to_string(&settings).unwrap();
    debug!("{:?}", settings.api_key);
    file.write_all(toml.as_bytes())?;
    Ok(())
  } else {
    Err(std::io::Error::new(
      std::io::ErrorKind::NotFound,
      "Config file not found",
    ))
  }
}
