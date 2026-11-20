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

## 開發與品質檢查

本專案由 ChatGPT 負責修改、Code Review、必要測試與錯誤修復。執行方式請參閱根目錄的 [checkMaps.skill](checkMaps.skill)。

使用者可直接要求「執行 checkMaps」或提出網站修改需求；ChatGPT 應自行完成適當檢查、修復與 GitHub 提交，不要求使用者手動跑測試或核准部署。

## 部署

推送至 `main` 分支後，GitHub Actions 只負責自動部署 GitHub Pages，不設置 CI／QA 閘門，也不需要手動啟動部署。

本專案不需要 OpenAI API，也不會由 GitHub Actions 自動修改正式程式碼。
