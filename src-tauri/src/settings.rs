use keyring::Entry;
use serde::{Deserialize, Serialize};
use log::{debug};
pub const APP: &str = "docbase-deck";

#[derive(Serialize, Deserialize)]
pub struct Secure{
  pub api_key: String,
  pub team_name: String,
}

impl Secure{
  pub fn store(&self) -> std::result::Result<(), keyring::Error> {
    let api_keyring = Entry::new(APP, "api_key")?;
    let team_name_keyring = Entry::new(APP, "team_name")?;

    api_keyring.set_password(&self.api_key)?;
    team_name_keyring.set_password(&self.team_name)?;

    Ok(())
  }

  pub fn get() -> Result<Self, keyring::Error> {
    let api_keyring = Entry::new(APP, "api_key")?;
    let team_name_keyring = Entry::new(APP, "team_name")?;

    let api_key = api_keyring.get_password()?;
    let team_name = team_name_keyring.get_password()?;
    debug!("api_key: {}", api_key);

    Ok(Secure { api_key, team_name })
  }
}
