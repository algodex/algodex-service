/* 
 * Algodex Service 
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

#[macro_use]
extern crate lazy_static;
use axum::{
    routing::{get, post},
    http::StatusCode,
    response::IntoResponse,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
mod query_couch;
use query_couch::query_couch_db;
use axum::extract::Path;
use std::collections::HashMap;
use tokio::sync::RwLock;

lazy_static!{
    static ref ENV: RwLock<HashMap<String, String>> = {
        let mut m = HashMap::new();
        RwLock::new(m)
    };
}

#[tokio::main]
async fn main() {
    dotenv::from_filename(".env").expect(".env file can't be found!");
    {
        let mut env = ENV.write().await;
        dotenv::vars().for_each(|val| {
            env.insert(val.0, val.1);
        });
    }

    // initialize tracing
    tracing_subscriber::fmt::init();

    // build our application with a route
    let app = Router::new()
        .route("/rewards/:wallet", get(rewards));


    let addr = SocketAddr::from(([0, 0, 0, 0], 4000));
    tracing::debug!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn rewards(Path(wallet): Path<String>) -> String {
    let keys:Vec<String> = vec![wallet];
    let env = ENV.read().await;

    let couchBaseUrl = env.get("COUCHDB_BASE_URL").expect("COUCHDB_BASE_URL is not set in .env!");
    let res = query_couch_db(&couchBaseUrl, &"rewards".to_string(),
    &"rewards".to_string(),&"rewards".to_string(),&keys,false).await.unwrap();

    serde_json::to_string(&res.rows).unwrap()
}
