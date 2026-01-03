# Remove Blocks (Phaser 3 Match-3 Game)

A simple Match-3 game built with Phaser 3, featuring a web version and a WeChat Mini Game adaptation.

## Project Structure

*   `game.js`: Main game logic for the web version.
*   `index.html`: Entry point for the web version.
*   `minigame/`: Directory containing the WeChat Mini Game project.
    *   `game.js`: Adapted game logic for WeChat Mini Game.
    *   `libs/`: Contains `phaser.min.js` and a custom `weapp-adapter.js`.

## How to Run

### Web Version

1.  Clone the repository.
2.  Serve the root directory using a local web server (e.g., `python -m http.server`, `live-server`, or VS Code Live Server extension).
3.  Open `index.html` in your browser.

### WeChat Mini Game Version

1.  Download and install [WeChat Developer Tools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html).
2.  Open WeChat Developer Tools and select **Mini Game**.
3.  Click **Import** and select the `minigame` directory within this project.
4.  (Optional) If you encounter a "base library version not found" error, go to **Details (详情) -> Local Settings (本地设置)** and select a valid base library version (e.g., 3.x.x).
5.  The game should run in the simulator.

## Features

*   **Core Gameplay**: Swap tiles to match 3 or more of the same color.
*   **Animations**: Smooth swapping and clearing animations using Phaser Tweens.
*   **Touch/Mouse Support**: Works on both desktop (mouse) and mobile (touch) devices.
*   **WeChat Adaptation**: Includes a custom `weapp-adapter.js` to simulate the browser environment (window, document, navigator, etc.) required by Phaser 3 on the WeChat Mini Game platform.

## License

MIT
