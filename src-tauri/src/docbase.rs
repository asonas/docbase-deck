use reqwest;
use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use log::debug;
use crate::config::Settings;

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
    screen_name: String,
    profile_image_url: String,
}

fn build_docbase_search_url(request: DocBaseRequest, config: Settings) -> String {
    let mut query_params = request.tags.into_iter()
        .map(|tag| format!("tag={}", tag.name))
        .collect::<Vec<String>>()
        .join("&");

    if !query_params.is_empty() {
        query_params.insert(0, '?');
    }

    debug!("query_params: {:?}", query_params);
    let url = format!("https://api.docbase.io/teams/{:?}/posts?q={}", config.team_name, query_params);
    debug!("url: {:?}", url);

    url
}

pub async fn handle_docbase_request(message_json: String, config: Settings) -> Vec<DocBaseResponse> {
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

    // let client = reqwest::Client::builder()
    //     .default_headers(headers)
    //     .build();
    let client = reqwest::Client::new();

    // TODO: Search `nikki` tag by default
    //       when subscribe to some tags, search by tags
    // let url = build_docbase_search_url(
    //     tags.unwrap_or_else(|| vec!(Tag { name: "nikki".to_string()} )),
    //     config
    // );
    let url = build_docbase_search_url(
        DocBaseRequest {
            tags: vec!(Tag { name: "nikki".to_string()} )
        },
        config
    );


    let res = client.get(url).headers(headers).send().await.unwrap();
    let parsed = res.json::<Vec<DocBaseResponse>>().await.unwrap();
    debug!("res: {:?}", parsed);
    // Ok(parsed)
    return parsed;
}
