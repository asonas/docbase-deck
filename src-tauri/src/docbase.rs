use reqwest;
use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use log::debug;
use crate::settings;

#[derive(Serialize, Deserialize, Debug)]
pub struct DocBaseRequest {
    tags: Vec<Tag>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Tag {
    name: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DocBaseResponse {
    id: i32,
    title: String,
    body: String,
    draft: bool,
    archived: bool,
    url: String,
    created_at: String,
    updated_at: String,
    scope: String,
    tags: Vec<Tag>,
    user: User
}

#[derive(Serialize, Deserialize, Debug)]
pub struct User {
    id: i32,
    name: String,
    profile_image_url: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ApiResponse {
    posts: Vec<DocBaseResponse>,
}

fn build_docbase_search_url(request: DocBaseRequest, config: settings::Secure) -> String {
    let mut query_params = request.tags.into_iter()
        .map(|tag| format!("tag:{}", tag.name))
        .collect::<Vec<String>>()
        .join("&");

    debug!("query_params: {:?}", query_params);
    debug!("config.team_name: {}", config.team_name.to_string());
    let url = format!("https://api.docbase.io/teams/{}/posts?desc:created_at&per_page=100&q={}", config.team_name.to_string(), query_params);
    debug!("url: {:?}", url);

    url
}

pub async fn handle_docbase_request(message_json: String, config: settings::Secure) -> Result<Vec<DocBaseResponse>, Box<dyn std::error::Error>> {
    let mut headers = HeaderMap::new();
    headers.insert(
        "X-DocBaseToken",
        HeaderValue::from_str(&config.api_key).unwrap()
    );
    headers.insert(
        CONTENT_TYPE,
        HeaderValue::from_static("application/json")
    );
    headers.insert(
        "User-Agent",
        HeaderValue::from_static("DocbaseDeck from asonas/docbase-deck")
    );
    debug!("headers: {:?}", headers);

    let tag = serde_json::from_str::<Tag>(&message_json).unwrap();
    debug!("tag: {}", tag.name);

    let client = reqwest::Client::new();

    // TODO: Search `nikki` tag by default
    //       when subscribe to some tags, search by tags
    // let url = build_docbase_search_url(
    //     tags.unwrap_or_else(|| vec!(Tag { name: "nikki".to_string()} )),
    //     config
    // );
    let url = build_docbase_search_url(
        DocBaseRequest {
            tags: vec!(tag)
        },
        config
    );

    let res = client.get(&url).headers(headers).send().await?;

    if !res.status().is_success() {
        debug!("Error response status: {:?}", res.status());
        return Err(Box::new(std::io::Error::new(
            std::io::ErrorKind::Other,
            format!("Server responded with status: {}", res.status()),
        )));
    }

    let api_response: ApiResponse = res.json().await?;
    Ok(api_response.posts)
}

pub fn parse(json: String) -> Result<Tag, serde_json::Error> {
    match serde_json::from_str(&json) {
        Ok(tag) => Ok(tag),
        Err(e) => {
            log::error!("Failed to parse JSON: {}", e);
            Err(e)
        },
    }
}
