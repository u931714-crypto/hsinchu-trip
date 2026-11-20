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

## 檢查與部署

推送至 `main` 時，GitHub Actions 會先執行輕量 QA：
- HTML 結構與必要 UI 元素檢查
- 重複／缺漏 ID 檢查
- Inline JavaScript 語法檢查

檢查通過後才會部署 GitHub Pages。這些自動檢查不等同於實際瀏覽器互動測試。

需要較完整的功能檢查時，依照 [Lightweight QA 指引](docs/QA.md)，由 ChatGPT 協助檢視最新程式碼與變更，並明確區分 PASS、FAIL、NOT VERIFIED。

本專案不需要 OpenAI API，也不會自動修改正式程式碼。
