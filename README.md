# 澶╄1.0 / AgentX 1.0

涓€涓嫭绔嬩簬鐖簯鐨?Phase 4 椤圭洰锛岀敤鏉ユ妸鈥滀汉浣撴櫤鑳戒綋鍗忎綔妯″紡鈥濈殑寮€鍙戣鍒掓寮忓懡鍚嶄负 **澶╄1.0**锛屽苟鍏堝仛鎴愬彲杩愯绯荤粺锛屽啀鑰冭檻鍚庣画骞跺叆 ClawCloud銆?
> 褰撳墠绾﹀畾锛?*璁″垝鍚?/ 瀵瑰鍚嶇О = 澶╄1.0**锛涗唬鐮佺洰褰曚笌鍐呴儴鎶€鏈?slug 鏆傛椂浠嶄繚鐣?`agentx-1.0`锛岄伩鍏嶅奖鍝嶇幇鏈夎繍琛屼笌璋冭瘯閾捐矾銆?
## 褰撳墠鑳藉姏

- TaskCard 浠诲姟鍗忚
- 缁熶竴鐘舵€佹満
- Event Bus 浜嬩欢鎬荤嚎
- Meta Core锛圡ission / Policy / Persona / Preference锛?- Interpreter / Planner / Decider / Reflex Matcher / Verifier / Responder / Reflector
- Memory / Guardrail / Processor / Router / Executor / Tool Registry
- Tool Adapter 鎶借薄锛坅dapter selection + artifact generation锛?- 瀛愪换鍔¤嚜鍔ㄦ媶鍒?+ 渚濊禆闃熷垪鎵ц
- Task Timeline / Graph / Queue 瑙嗗浘
- Background Worker锛圕onsolidation锛?- HTTP API
- 绠€鍗?Web 鎺у埗鍙?- 鏂囦欢鎸佷箙鍖栵紙`.data/`锛?- Bundle 瀵煎嚭锛圧EADME / index / markdown / manifest / zip锛夛紝鏀寔鏇村儚瀹㈡埛浜や粯鍖?/ 鍥㈤槦浜ゆ帴鍖呯殑鍏ュ彛鏂囦欢
- Node 鍐呯疆娴嬭瘯

## 蹇€熷惎鍔?
```bash
cd tianyan-1.0
npm start
```

榛樿鍦板潃锛歚http://localhost:4317`

## API

### `GET /api/health`
鍋ュ悍妫€鏌?
### `GET /api/tasks`
浠诲姟鍒楄〃

### `POST /api/tasks`
鍒涘缓骞惰繍琛屼换鍔?
### `GET /api/tasks/:taskId`
鑾峰彇浠诲姟璇︽儏锛堝惈 subtasks锛?
### `GET /api/tasks/:taskId/events`
鑾峰彇浠诲姟浜嬩欢

### `GET /api/tasks/:taskId/timeline`
鑾峰彇浠诲姟鏃堕棿绾?
### `GET /api/tasks/:taskId/graph`
鑾峰彇浠诲姟鍥剧粨鏋勶紙task/subtask/dependency锛?
### `GET /api/tasks/:taskId/queue`
鑾峰彇瀛愪换鍔′緷璧栭槦鍒?
### `GET /api/tasks/:taskId/files`
鑾峰彇浠诲姟鐢熸垚鏂囦欢鍒楄〃

### `GET /api/tasks/:taskId/file?path=...`
棰勮浠诲姟鐢熸垚鏂囦欢鍐呭

### `GET /api/tasks/:taskId/download-file?path=...`
涓嬭浇鍗曚釜鐢熸垚鏂囦欢

### `GET /api/tasks/:taskId/download-bundle`
涓嬭浇浠诲姟 bundle markdown 瀵煎嚭鏂囦欢

### `GET /api/tasks/:taskId/download-bundle-zip`
涓嬭浇浠诲姟涓€閿墦鍖?zip 瀵煎嚭鏂囦欢锛坺ip 鍐呬互 `task_id/` 涓烘牴鐩綍锛屽苟闄勫甫 `README.md` / `index.json` 鍏ュ彛鏂囦欢锛?
### `POST /api/tasks/:taskId/approve`
鎵瑰噯楂橀闄╀换鍔″苟缁х画鎵ц

### `POST /api/tasks/:taskId/retry`
閲嶈瘯浠诲姟

### `POST /api/tasks/:taskId/run-subtasks`
鎵嬪姩瑙﹀彂瀛愪换鍔℃墽琛?
### `GET /api/memory?q=xxx`
鎼滅储璁板繂

### `GET /api/background/runs`
鏌ョ湅鍚庡彴 consolidation 杩愯璁板綍

### `POST /api/background/run`
瑙﹀彂涓€娆″悗鍙?consolidation

## 褰撳墠涓婚摼璺?
`input -> interpreter -> memory -> processor -> planner -> decider -> guardrail -> executor -> subtask-queue -> verifier -> responder -> reflector -> close`

## 褰撳墠闃舵

### 宸插疄鐜帮紙Phase 5 璧锋锛?- 鍗曚綋 orchestrator
- deliberate / reflex 涓ょ涓绘祦绋?- 浠诲姟鍙璁°€佸彲鍥炴斁銆佸彲鎵瑰噯
- 鑷姩鍒嗘瀽 deliverables / complexity
- adapter runtime contract锛坅rtifact + actions锛?- 鐪熷疄 adapter 鍔ㄤ綔锛氬啓 artifact 鍒扮鐩樸€佽繍琛屽彈鎺?node/npm 鎺㈡祴鍛戒护銆佸鍑?markdown/text 鏂囦欢
- generated files API
- verification gate
- background consolidation
- subtask dependency queue + wave execution
- timeline / graph / queue data builders
- 鏇村彲璇荤殑鍓嶇 timeline / graph / queue / files 闈㈡澘

### 涓嬩竴姝?- 鎵╂洿澶氱湡姝ｅ彲鎵ц鐨勫閮?tool adapters
- 澧炲姞 IO / Processor / Cleaner 鎻掍欢灞?- 澧炲姞 Federation / delegation manager
- 澧炲姞 graph 浜や簰涓庤妭鐐硅鎯呴潰鏉?- 璇︾粏闃舵璺嚎瑙侊細`docs/agentx-1.0-plan.md`



## 开源发布资料
- docs/launch-kit/ 目录包含 README / Release / 宣传 / 结构蓝图 / 发布检查清单。
