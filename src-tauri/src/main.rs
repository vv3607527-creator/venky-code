#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
fn main() {
    // First, while single-threaded: agents and tools inherit a PATH that finds `gh`, `node`…
    venky_lib::prepare_environment();
    if venky_lib::handle_usage_keychain_helper() {
        return;
    }
    // A cloud agent's bridge to its machine (docs/cloud-agents.md); exits when done.
    if venky_lib::handle_cloud_bridge() {
        return;
    }
    venky_lib::run()
}
