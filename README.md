# 新竹一日遊行程規劃

以 GitHub Pages 發布的單頁行程工具。

## 網站

https://u931714-crypto.github.io/hsinchu-trip/

## 功能

- Leaflet / OpenStreetMap 行程地圖
- 行程時間動態計算
- 拖曳調整順序、抵達紀錄、復原
- 景點開放時間與衝突提醒
- 行動裝置版面

## 部署

推送至 `main` 分支後，GitHub Actions 會直接部署 GitHub Pages，不設置 QA／CI 閘門，也不需要手動啟動測試。

如需了解非必要的 ChatGPT 輔助檢查方式，請參閱 [Lightweight QA 指引](docs/QA.md)。

本專案不需要 OpenAI API，也不會自動修改正式程式碼。
