// server.ts
import http from "http";
import path2 from "path";
import fs2 from "fs";
import { createServer as createViteServer } from "vite";

// serverTrips.ts
import fs from "fs";
import path from "path";

// src/data/defaultExpedition.ts
var initialExpeditionData = {
  id: "exp-central-peak-2026",
  title: "\u4E2D\u592E\u5C16\u5C71 \u56DB\u65E5\u7E31\u8D70\u5718\u52D9\u7E3D\u8868",
  subtitle: "10/9(\u56DB)-10/12(\u65E5)\uFF0C10/8(\u4E09) D0",
  dates: "10/9(\u56DB)-10/12(\u65E5)\uFF0C10/8(\u4E09) D0",
  d0Date: "10/8(\u4E09)",
  mountain: "\u4E2D\u592E\u5C16\u5C71 (\u6D77\u62D4 3,705\u516C\u5C3A\uFF0C\u53F0\u7063\u4E09\u5C16\u4E4B\u9996)",
  trailhead: "\u52DD\u5149\u767B\u5C71\u53E3 (\u53F07\u7532\u7DDA 49.5K)",
  leader: {
    name: "\u6797\u88D5\u5F65",
    phone: "0972-573495",
    emergencyContact: "\u6797\u88D5\u5D27",
    emergencyPhone: "0911-989786"
  },
  stayBehindPerson: {
    name: "\u674E\u541B\u5C71",
    phone: "0937-717741",
    deadlineTime: "10/12(\u65E5) 14:30",
    instructions: "\u9810\u8A08\u65BC 10/12(\u65E5) 13:30 \u8FD4\u62B5\u52DD\u5149\u767B\u5C71\u53E3\u3002\u82E5\u8D85\u904E 14:30 \u672A\u80FD\u62B5\u9054\u767B\u5C71\u53E3\u6216\u672A\u80FD\u8207\u7559\u5B88\u4EBA\u53D6\u5F97\u806F\u7E6B\uFF0C\u7559\u5B88\u4EBA\u5373\u523B\u555F\u52D5\u641C\u6551\u901A\u5831\u7A0B\u5E8F\u3002"
  },
  radioFrequency: "145.520 MHz",
  satelliteDevice: "Garmin inReach mini2 \u885B\u661F\u901A\u8A0A\u8A2D\u5099",
  parkPermitNumber: "TYP-2026-1008-042",
  gpxUrl: "https://drive.google.com/file/d/central-point-peak-gpx-sample/view",
  lineGroupUrl: "https://line.me/R/ti/g/yb4st9QZhA",
  sheets: [
    { id: "sheet-overview", name: "\u884C\u7A0B\u6982\u89BD\u8207\u6D3B\u52D5\u8AAA\u660E", sheetType: "overview" },
    { id: "sheet-progress", name: "\u5718\u52D9\u7C4C\u5099\u9032\u5EA6\u7E3D\u8868", sheetType: "progress" },
    { id: "sheet-pii", name: "\u7DCA\u6025\u806F\u7D61\u4EBA\u540D\u518A", sheetType: "pii", rawHeaders: [
      "\u59D3\u540D",
      "\u968A\u54E1\u96FB\u8A71",
      "\u7DCA\u6025\u806F\u7D61\u4EBA",
      "\u7DCA\u6025\u806F\u7D61\u4EBA\u96FB\u8A71"
    ], rawRows: [
      ["\u6797\u88D5\u5F65", "0972-573495", "\u6797\u88D5\u5D27 (\u5F1F\u5F1F)", "0911-989786"],
      ["\u5289\u6C9B\u59A4", "0912-345678", "\u5289\u5FD7\u660E (\u7236\u89AA)", "0933-112233"],
      ["\u963F\u8C6A", "0922-888999", "\u9673\u7F8E\u9CF3 (\u914D\u5076)", "0988-665544"],
      ["\u754C\u932B", "0935-123789", "\u738B\u79C0\u82F1 (\u6BCD\u89AA)", "0921-334455"],
      ["Shawn", "0955-667788", "\u5F35\u5EFA\u83EF (\u7236\u89AA)", "0910-889900"],
      ["\u6C88\u5B97\u6E90", "0966-223344", "\u6C88\u5EFA\u5FE0 (\u54E5\u54E5)", "0928-776655"],
      ["\u859B\u5104\u5B87", "0970-112233", "\u859B\u570B\u5B89 (\u7236\u89AA)", "0937-665544"],
      ["\u6E05\u8CAB", "0919-445566", "\u674E\u96C5\u96EF (\u914D\u5076)", "0920-112233"],
      ["\u963F\u5E06", "0988-334455", "\u6797\u5EFA\u5B8F (\u7236\u89AA)", "0932-556677"],
      ["\u6CCA", "0963-778899", "\u5433\u9E97\u83EF (\u914D\u5076)", "0918-990011"],
      ["\u6797\u975C\u5B9C", "0925-667788", "\u6797\u51A0\u5B87 (\u54E5\u54E5)", "0952-334455"],
      ["\u5433\u528D\u6B66", "0939-556677", "\u5433\u653F\u9053 (\u7236\u89AA)", "0926-889900"],
      ["Q\u4ED4", "0978-990011", "\u9EC3\u96C5\u5A77 (\u914D\u5076)", "0987-112233"]
    ] },
    { id: "sheet-survey", name: "\u767B\u5C71\u7D93\u6B77\u8ABF\u67E5", sheetType: "survey", rawHeaders: [
      "\u6642\u9593\u6233\u8A18",
      "\u7A31\u547C",
      "\u662F\u5426\u53EF\u4EE5\u4E92\u76F8\u7167\u9867\u968A\u54E1\u4EE5\u53CA\u9075\u5B88\u5927\u5BB6\u5171\u540C\u6C7A\u5B9A\u7684\u4E8B\u60C5",
      "\u662F\u5426\u6709\u9577\u7A0B\u7E31\u8D70\u7D93\u6B77(\u82E5\u6709\u8ACB\u56DE\u5FA9\u884C\u7A0B\u53CA\u662F\u5426\u81EA\u7406)",
      "\u662F\u5426\u78BA\u5BE6\u77E5\u9053\u6240\u524D\u5F80\u7684\u8DEF\u7DDA\u7684\u57FA\u672C\u8CC7\u6599\u53CA\u96E3\u5EA6\u7B49\u7D1A",
      "\u662F\u5426\u80FD\u5920\u5224\u8B80\u96E2\u7DDA\u5730\u5716\u4EE5\u53CA\u767C\u5831\u4F4D\u7F6E\u5EA7\u6A19",
      "\u662F\u5426\u53EF\u4EE5\u63A5\u53D7\u6709\u6642\u5019\u5FC5\u9808\u65BC\u96E8\u4E2D\u884C\u8D70\u7684\u72C0\u6CC1",
      "\u662F\u5426\u53EF\u4EE5\u914D\u5408\u968A\u4F0D\u884C\u9032\u5927\u7D04\u4E00\u5C0F\u6642\u4F11\u606F\u4E00\u6B21\u7684\u7BC0\u594F",
      "\u662F\u5426\u5177\u5099\u4E00\u5929\u81F3\u5C11\u80FD\u91CD\u88DD\u884C\u8D7010\u5C0F\u6642\u7684\u80FD\u529B",
      "\u6709\u7121\u9AD8\u5C71\u53CD\u61C9\uFF0C\u6216\u5176\u4ED6\u5F71\u97FF\u767B\u5C71\u5B89\u5168\u7684\u75C5\u53F2\uFF0C\u4EE5\u53CA\u6709\u7121\u85E5\u7269\u904E\u654F\u72C0\u6CC1",
      "\u6500\u767B\u767E\u5CB3\u5C24\u5176\u9577\u7A0B\u7E31\u8D70\u662F\u5426\u53EF\u914D\u5408\u9810\u7559\u4E00\u5929\u9810\u5099\u65E5",
      "\u662F\u5426\u53EF\u5728\u51FA\u767C\u524D\u4E00\u500B\u6708\uFF0C\u65BC\u6BCF\u9031\u65E5\u7D50\u7B97\u4E00\u6B21\u8A72\u9031\u7684\u904B\u52D5\u72C0\u6CC1\u516C\u5E03\u65BC\u7FA4\u7D44",
      "\u662F\u5426\u6709\u7DCA\u6025\u6551\u8B77\u76F8\u95DC\u8B49\u7167",
      "\u767E\u5CB3\u6578(\u50C5\u4F9B\u53C3\u8003)"
    ], rawRows: [
      ["2026/9/1 \u4E0A\u5348 11:00:44", "\u6E05\u8CAB", "\u662F", "\u99AC\u535A", "\u4E2D\u77E5\u9053", "\u662F", "\u662F", "\u662F", "\u662F", "\u7121", "\u53EF\u4EE5", "\u662F", "\u7121", 70],
      ["2026/9/1 \u4E0A\u5348 11:02:04", "\u5289\u6C9B\u59A4", "\u662F", "\u662F\uFF08\u5357\u4E09\u6BB5\u81EA\u7406\uFF09", "\u662F", "\u662F", "\u662F", "\u662F", "\u662F", "\u7121", "\u662F", "\u662F", "\u5426", 66],
      ["2026/9/1 \u4E0A\u5348 11:03:08", "\u963F\u8C6A", "\u662F", "\u5947\u840A\u6771\u7A1C\u5168\u81EA\u7406", "\u78BA\u8A8D\u77E5\u9053", "\u662F", "\u53EF\u63A5\u53D7", "\u53EF\u914D\u5408", "\u5DF2\u5177\u5099", "\u7121", "\u53EF\u914D\u5408", "\u662F", "\u7121", 86],
      ["2026/9/1 \u4E0A\u5348 11:03:59", "\u754C\u932B", "\u53EF\u4EE5\u6709", "\u6709\uFF0C\u5357\u4E00\u6BB5", "\u77E5\u9053", "\u53EF\u4EE5", "\u53EF\u4EE5", "\u53EF\u4EE5", "\u53EF\u4EE5", "\u7121", "\u53EF\u4EE5", "\u53EF\u4EE5", "\u6709", 28],
      ["2026/9/1 \u4E0A\u5348 11:38:05", "Shawn", "\u53EF\u4EE5", "\u662F\uFF0C\u81EA\u7406", "\u662F", "\u662F", "\u662F", "\u662F", "\u662F", "\u5426", "\u662F", "\u662F", "BLS", 50],
      ["2026/9/1 \u4E0A\u5348 11:40:35", "\u6C88\u5B97\u6E90", "\u662F", "\u662F\uFF0C\u5357\u4E8C\u6BB5\uFF0C\u81EA\u7406", "\u662F", "\u662F", "\u662F", "\u662F", "\u662F", "\u7121", "\u662F", "\u662F", "\u7121", 56],
      ["2026/9/1 \u4E0A\u5348 11:52:35", "\u963F\u5E06", "\u53EF\u4EE5", "\u6709(\u5927\u5C0F\u9738\u3001\u5927\u5C0F\u528D\u81EA\u7406\uFF09", "\u77E5\u9053", "\u53EF\u4EE5", "\u63A5\u53D7", "\u53EF\u4EE5", "\u6709", "\u7121", "\u53EF\u4EE5", "\u53EF\u4EE5", "\u7121", 48],
      ["2026/9/1 \u4E0B\u5348 12:01:02", "\u859B\u5104\u5B87", "\u53EF\u4EE5", "\u5357\u4E09\u6BB5\u5168\u7A0B\u81EA\u7406", "\u77E5\u9053", "\u6703", "\u53EF\u4EE5", "\u53EF\u4EE5", "\u53EF\u4EE5", "\u7121", "\u53EF\u4EE5", "\u53EF\u4EE5", "\u7121", 53],
      ["2026/9/1 \u4E0B\u5348 12:12:14", "\u6CCA", "\u662F", "\u99AC\u535A\u81EA\u7406", "\u662F", "\u662F", "\u662F", "\u662F", "\u662F", "\u6709\u9AD8\u53CD\u7121\u904E\u654F", "\u662F", "\u662F", "\u7121", 62],
      ["2026/9/1 \u4E0B\u5348 12:12:21", "\u6797\u975C\u5B9C", "\u662F", "\u6700\u591A\u53EA\u6709\u5230\u4E09\u5929(\u8056\u9675\u7DDAO\u53CA\u5317\u4E8C\u6BB5\u7518\u85AF\u7121\u540D),\u81EA\u7406", "\u662F", "\u662F", "\u662F", "\u662F", "\u662F", "\u662F", "\u662F", "\u662F", "\u662F", 39],
      ["2026/9/1 \u4E0B\u5348 12:30:00", "\u5433\u528D\u6B66", "\u53EF", "\u6709", "\u77E5\u9053", "\u53EF", "\u53EF", "\u53EF", "\u53EF", "\u7121", "\u53EF", "\u53EF", "\u7121", 78],
      ["2026/9/1 \u4E0B\u5348 12:45:58", "Q\u4ED4", "\u662F", "\u662F\uFF0C\u5357\u4E09\u6BB5", "\u662F", "\u662F", "\u662F", "\u662F", "\u8AAA", "\u90FD\u6709\uFF0C\u6703\u81EA\u5099\u91AB\u85E5\u5305", "\u662F", "\u662F", "WAFA", 60]
    ] },
    { id: "sheet-itinerary", name: "\u6BCF\u65E5\u8A73\u7D30\u884C\u7A0B\u8207\u6642\u9593\u7BC0\u9EDE", sheetType: "itinerary" },
    { id: "sheet-mutual-aid", name: "\u4E92\u52A9\u7D44\u7DE8\u5217", sheetType: "mutualAid", rawHeaders: [
      "\u9818\u968A\u7D44",
      "\u4E2D\u7E7C\u7D44",
      "\u58D3\u5F8C\u7D44"
    ], rawRows: [
      ["\u6797\u88D5\u5F65", "\u6E05\u8CAB", "\u754C\u932B"],
      ["\u963F\u8C6A", "\u60E0\u771F", "\u5289\u6C9B\u59A4"],
      ["\u674E\u4F73\u6B23", "\u91AC\u83DC", "\u859B\u5104\u5B87"],
      ["\u6C88\u5B97\u6E90", "\u6797\u975C\u5B9C", ""],
      ["Shawn", "\u6CCA", ""],
      ["\u5433\u528D\u6B66", "\u963F\u5E06", ""],
      ["\u838A\u58EB\u6FA4", "", ""],
      ["\u7D44\u5167\u4E92\u76F8\u7167\u61C9\uFF1A\u6BCF\u4EBA\u90FD\u8981\u89C0\u5BDF\u81EA\u5DF1\u5C0F\u7D44\u6210\u54E1\u7684\u72C0\u6CC1\uFF08\u9AD4\u529B\u3001\u88DD\u5099\u3001\u7CBE\u795E\u3001\u610F\u5916\u7B49\uFF09", "", ""],
      ["\u5404\u7D44\u96A8\u6642\u638C\u63E1\u5C0F\u7D44\u4EBA\u6578", "", ""],
      ["\u9075\u5B88\u968A\u4F0D\u6574\u9AD4\u7BC0\u594F\uFF1A\u4E0D\u53EF\u8D85\u524D\u9818\u968A\u7D44\u3001\u4EA6\u4E0D\u53EF\u843D\u5F8C\u58D3\u5F8C\u7D44\u3002", "", ""],
      ["\u7D44\u5167\u5FC5\u9808\u5168\u54E1\u65BC\u8996\u7DDA\u7BC4\u570D\u4E4B\u5167", "", ""],
      ["\u62C6\u968A\u539F\u5247\uFF0C\u6700\u5C0F\u55AE\u4F4D\u70BA\u4E92\u52A9\u7D44\u3002", "", ""],
      ["\u82E5\u6709\u767C\u73FE\u7570\u5E38\u96A8\u6642\u901A\u5831\u7D44\u9577\u53CA\u9818\u968A\u3002", "", ""]
    ] },
    { id: "sheet-shuttle", name: "D0 \u4EA4\u901A\u63A5\u99C1\u8207\u4E0A\u8ECA\u96C6\u5408\u9EDE", sheetType: "shuttle" },
    { id: "sheet-equipment", name: "\u767B\u5C71\u88DD\u5099\u6E05\u55AE\u8207\u81EA\u4E3B\u6AA2\u67E5\u8868", sheetType: "equipment", rawHeaders: [
      "\u5206\u985E",
      "\u88DD\u5099\u54C1\u540D",
      "\u5FC5\u5099/\u9078\u914D",
      "\u5099\u8A3B\u8207\u6AA2\u67E5\u91CD\u9EDE"
    ], rawRows: [
      ["\u500B\u4EBA\u7167\u660E\u8207\u96FB\u529B", "\u9AD8\u6D41\u660E\u982D\u71C8 (\u542B\u5145\u6EFF\u96FB\u92F0\u96FB\u6C60/\u5099\u4EFD\u96FB\u6C60)", "\u5FC5\u5099", "\u4E0D\u53EF\u7528\u624B\u6A5F\u624B\u96FB\u7B52\u4EE3\u66FF"],
      ["\u500B\u4EBA\u7167\u660E\u8207\u96FB\u529B", "\u884C\u52D5\u96FB\u6E90 (\u81F3\u5C11 10,000mAh) \u8207\u5145\u96FB\u7DDA", "\u5FC5\u5099", "\u4F4E\u6EAB\u74B0\u5883\u8ACB\u4FDD\u6696\u4FDD\u5B58"],
      ["\u9632\u96E8\u8207\u4FDD\u6696\u7CFB\u7D71", "\u767B\u5C71\u5C08\u7528\u5169\u622A\u5F0F\u900F\u6C23\u96E8\u8863\u3001\u96E8\u8932 (\u5982 Gore-Tex)", "\u5FC5\u5099", "\u56B4\u7981\u8F15\u4FBF\u96E8\u8863"],
      ["\u9632\u96E8\u8207\u4FDD\u6696\u7CFB\u7D71", "\u4E2D\u5C64\u7FBD\u7D68\u8863/\u5316\u7E96\u4FDD\u6696\u8863 + \u4FDD\u6696\u6BDB\u5E3D + \u624B\u5957", "\u5FC5\u5099", "\u6D0B\u8525\u5F0F\u7A7F\u642D"],
      ["\u9632\u96E8\u8207\u4FDD\u6696\u7CFB\u7D71", "\u5099\u7528\u8863\u7269\u8932\u896A (\u9632\u6C34\u888B\u5BC6\u5C01)", "\u5FC5\u5099", "\u653E\u80CC\u5305\u6700\u5E95\u5C64"],
      ["\u767B\u5C71\u7761\u7720\u8207\u4F4F\u5BBF", "\u9AD8\u5C71\u7761\u888B (\u8212\u9069\u6EAB\u5EA6 -5\u2103 ~ 0\u2103)", "\u5FC5\u5099", ""],
      ["\u767B\u5C71\u7761\u7720\u8207\u4F4F\u5BBF", "\u86CB\u5DE2\u7761\u588A / \u5145\u6C23\u9632\u6F6E\u7761\u588A (R\u503C 3.0 \u4EE5\u4E0A)", "\u5FC5\u5099", ""],
      ["\u884C\u9032\u8207\u6EAF\u6EAA\u88DD\u5099", "\u9AD8\u7B52\u767B\u5C71\u978B / \u96E8\u978B (\u52A0\u539A\u7F8A\u6BDB\u896A\u8207\u8B77\u8E1D)", "\u5FC5\u5099", ""],
      ["\u884C\u9032\u8207\u6EAF\u6EAA\u88DD\u5099", "\u9632\u6ED1\u6EAF\u6EAA\u978B / \u6EAF\u6EAA\u896A (\u904E\u6EAA\u6BB5\u5FC5\u5099)", "\u5FC5\u5099", "\u904E\u6EAA\u9632\u6ED1\u4FDD\u8B77\u8173\u8E1D"],
      ["\u884C\u9032\u8207\u6EAF\u6EAA\u88DD\u5099", "\u767B\u5C71\u6756 (\u5EFA\u8B70\u96D9\u6756)", "\u5FC5\u5099", ""],
      ["\u98F2\u98DF\u8207\u708A\u4E8B", "\u4FDD\u6EAB\u6C34\u74F6 + \u8010\u71B1\u6C34\u888B (\u5EFA\u8B70 2.5L~3.0L)", "\u5FC5\u5099", ""],
      ["\u98F2\u98DF\u8207\u708A\u4E8B", "\u500B\u4EBA\u74B0\u4FDD\u7897\u7B77\u3001\u9AD8\u5C71\u7210\u982D\u3001\u74E6\u65AF\u7F50\u3001\u6253\u706B\u6A5F", "\u5FC5\u5099", ""],
      ["\u91AB\u7642\u8207\u5B89\u5168", "\u500B\u4EBA\u5E38\u5099\u85E5\u3001\u9AD8\u5C71\u75C7\u7528\u85E5 (\u4E39\u6728\u65AF)\u3001\u6B62\u75DB\u85E5", "\u5FC5\u5099", "\u5099\u9F4A\u5929\u6578+\u9810\u5099\u65E5"],
      ["\u91AB\u7642\u8207\u5B89\u5168", "\u624B\u6A5F\u5B89\u88DD\u96E2\u7DDA\u5730\u5716\u4E26\u8F09\u597D GPX", "\u5FC5\u5099", "\u51FA\u767C\u524D\u78BA\u8A8D\u8F09\u5165"],
      ["\u8B49\u4EF6\u8207\u8CB4\u91CD\u7269", "\u5065\u4FDD\u5361\u3001\u8EAB\u5206\u8B49\u6B63\u672C", "\u5FC5\u5099", "\u67E5\u9A57\u8EAB\u5206\u7528"]
    ] },
    { id: "sheet-notices", name: "\u767B\u5C71\u884C\u7A0B\u5B89\u5168\u5B88\u5247\u8207\u5404\u9805\u9808\u77E5", sheetType: "notices", rawHeaders: [
      "\u9808\u77E5\u985E\u5225",
      "\u8A73\u7D30\u5B88\u5247\u5167\u5BB9"
    ], rawRows: [
      ["\u51FA\u5718\u9808\u77E5\u8207\u9000\u8CBB\u898F\u5B9A", "\u53C3\u52A0\u6D3B\u52D5\u8ACB\u5148\u78BA\u8A8D\u6D3B\u52D5\u65E5\u671F\u6709\u7121\u7279\u6B8A\u7BC0\u65E5\u4EE5\u53CA\u5176\u4ED6\u500B\u4EBA\u884C\u7A0B\u3002"],
      ["\u51FA\u5718\u9808\u77E5\u8207\u9000\u8CBB\u898F\u5B9A", "\u51FA\u767C\u524D 30 \u5929\u524D\u6536\u8CBB\u5B8C\u7562\uFF0C15-30 \u5929\u7121\u6CD5\u524D\u5F80\u9000\u8CBB 50%\uFF0C5-14 \u5929\u7121\u6CD5\u524D\u5F80\u9000\u8CBB 25%\uFF0C4 \u65E5\u4EE5\u5167\u4EE5\u53CA\u5DF2\u51FA\u767C\u6055\u4E0D\u9000\u8CBB\u3002"],
      ["\u51FA\u5718\u9808\u77E5\u8207\u9000\u8CBB\u898F\u5B9A", "\u7D93\u6C23\u8C61\u55AE\u4F4D\u53CA\u570B\u5BB6\u516C\u5712\u767C\u5E03\u5C01\u5712\uFF0C\u6216\u767C\u5E03\u8C6A\u5927\u96E8\u3001\u98B1\u98A8\u3001\u5929\u707D\u9053\u8DEF\u7BA1\u5236\u5247\u76F4\u63A5\u53D6\u6D88\u6D3B\u52D5\u5EF6\u671F\u8FA6\u7406\uFF0C\u6216\u5168\u984D\u9000\u6B3E\u4E0D\u6263\u4EFB\u4F55\u8CBB\u7528\u3002"],
      ["\u51FA\u5718\u9808\u77E5\u8207\u9000\u8CBB\u898F\u5B9A", "\u5DF2\u652F\u51FA\u4E4B\u7533\u8ACB\u898F\u8CBB\uFF0C\u9664\u570B\u5BB6\u516C\u5712\u4F11\u5712\u516C\u544A\u5F8C\uFF0C\u6309\u5176\u898F\u5B9A\u4E88\u4EE5\u9000\u8CBB\u3002\u672A\u9054\u4F11\u5712\u6A19\u6E96\uFF0C\u65BC\u516C\u544A\u524D\u9000\u5718\uFF0C\u4E0D\u4E88\u9000\u8CBB\u3002"],
      ["\u4EA4\u901A\u63A5\u99C1\u8207\u96C6\u5408\u7D00\u5F8B", "\u524D\u4E00\u665A\u8ACB\u5B9A\u597D\u9B27\u9418\uFF0C\u4E26\u78BA\u8A8D\u597D\u9694\u5929\u65E9\u4E0A\u6703\u97FF\uFF0C\u6D3B\u52D5\u7576\u5929\u8ACB\u52D9\u5FC5\u6E96\u6642\u4E0A\u8ECA\uFF0C\u4EE5\u514D\u5EF6\u8AA4\u884C\u7A0B\uFF0C\u903E\u6642\u82E5\u96FB\u806F\u4E0D\u4E0A\u5C31\u4E0D\u7B49\u5019\uFF0C\u8CBB\u7528\u4E0D\u9000\u3002"],
      ["\u4EA4\u901A\u63A5\u99C1\u8207\u96C6\u5408\u7D00\u5F8B", "\u6703\u6688\u8ECA\u7684\u968A\u54E1\u8ACB\u81EA\u884C\u5099\u59A5\u76F8\u95DC\u85E5\u54C1\uFF0C\u82E5\u6709\u9700\u8981\u5B89\u6392\u5EA7\u4F4D\u8ACB\u4E3B\u52D5\u544A\u77E5\uFF0C\u53F8\u6A5F\u5927\u54E5\u6703\u5354\u52A9\u5206\u914D\u3002"],
      ["\u4EA4\u901A\u63A5\u99C1\u8207\u96C6\u5408\u7D00\u5F8B", "\u6BCF\u500B\u7AD9\u9EDE\u4E0A\u8ECA\u7684\u4EBA\u54E1\uFF0C\u4E3B\u52D5\u65BC LINE \u6D3B\u52D5\u7FA4\u7D44\u56DE\u5831\u3002"],
      ["\u98DF\uFF1A\u7CE7\u98DF\u8207\u6C34\u6E90", "\u6240\u6709\u88DC\u7D66\u7269\u8CC7\u51FA\u767C\u524D\u65E5\u5099\u59A5\uFF0C\u5207\u52FF\u6D3B\u52D5\u7576\u5929\u624D\u88DC\u7D66\u3002\u9910\u98DF\u90E8\u5206\u8ACB\u78BA\u5BE6\u5C0D\u7167\u5929\u6578\u53CA\u6240\u9700\u7CE7\u98DF\uFF0C\u884C\u9032\u9593\u4E0D\u716E\u98DF\uFF0C\u4E0D\u505A\u7121\u8B02\u6D6A\u8CBB\u3002"],
      ["\u98DF\uFF1A\u7CE7\u98DF\u8207\u6C34\u6E90", "\u4EFB\u4F55\u884C\u7A0B\u8ACB\u52D9\u5FC5\u505A\u300C\u9810\u5099\u65E5\u53CA\u9810\u5099\u7CE7\u4E00\u65E5\u300D\u4E4B\u6E96\u5099\u3002\u6C34\u7684\u90E8\u5206\u8996\u500B\u4EBA\u98F2\u6C34\u72C0\u6CC1\u78BA\u5BE6\u6E96\u5099\u3002"],
      ["\u8863\uFF1A\u96E8\u5099\u8207\u4FDD\u6696", "\u6D0B\u8525\u5F0F\u7A7F\u6CD5\u4E09\u5C64\u7CFB\u7D71\uFF1A\u5E95\u5C64\u6392\u6C57\u3001\u4E2D\u5C64\u4FDD\u6696\u3001\u5916\u5C64\u9632\u6C34\u3002\u907F\u514D\u68C9\u8CEA\u8863\u7269\u3002\u5169\u622A\u5F0F\u96E8\u8863\u8932\u5FC5\u9808\u9F4A\u5168\u3002"],
      ["\u4F4F\uFF1A\u71DF\u5730\u8207\u5E33\u7BF7", "\u540C\u5E33\u8005\u5FC5\u9808\u5171\u540C\u642D\u5E33\u6536\u5E33\uFF0C\u5927\u7A7A\u5730\u7559\u7D66\u5927\u71DF\u5E33\uFF0C\u5C0F\u7A7A\u5730\u7559\u7D66\u5C0F\u71DF\u5E33\u3002\u56B4\u683C\u9075\u5B88\u7121\u75D5\u5C71\u6797\u539F\u5247\u3002"],
      ["\u884C\uFF1A\u884C\u9032\u7D00\u5F8B", "\u8868\u5B9A\u51FA\u767C\u6642\u9593\u5168\u968A\u6E96\u6642\u51FA\u767C\u3002\u9818\u968A\u8207\u62BC\u968A\u5404\u6301\u7121\u7DDA\u96FB\u901A\u806F\u3002\u5168\u7A0B\u6309\u8868\u64CD\u8AB2\uFF0C\u56B4\u7981\u50AC\u4FC3\u968A\u53CB\u3002"]
    ] },
    { id: "sheet-safety", name: "\u6C23\u8C61\u9810\u5831\u8207\u81EA\u4E3B\u5B89\u5168\u7BA1\u7406", sheetType: "safety", rawHeaders: [
      "\u6C23\u8C61\u89C0\u6E2C\u8207\u9810\u5831\u9805\u76EE",
      "\u9810\u5831\u9023\u7D50\u8207\u5716\u8CC7",
      "\u5373\u6642\u6307\u6A19 / \u8AAA\u660E"
    ], rawRows: [
      ["\u4E2D\u592E\u6C23\u8C61\u7F72 \u767B\u5C71\u6C23\u8C61\u5C08\u5340 (\u4E2D\u592E\u5C16\u5C71)", "https://www.cwa.gov.tw/V8/C/L/Mountain/Mountain.html?PID=D082", "\u6EAB\u5EA6\u3001\u9AD4\u611F\u3001\u98A8\u901F\u8207\u90103\u5C0F\u6642\u964D\u96E8\u6A5F\u7387"],
      ["Windy \u5C08\u696D\u6C23\u8C61\u6578\u503C\u9810\u5831 (ECMWF)", "https://www.windy.com", "\u96F2\u5C64\u8986\u84CB\u3001\u964D\u96E8\u7D2F\u7A4D\u3001\u7D50\u51B0\u9AD8\u5EA6\u8207 600hPa \u9AD8\u7A7A\u6C23\u6D41"],
      ["\u4E2D\u592E\u6C23\u8C61\u7F72 \u8C6A\u5927\u96E8\u7279\u5831", "https://www.cwa.gov.tw/V8/C/P/Warning/W26.html", "\u964D\u96E8\u8B66\u6212\u8207\u5F37\u98A8\u7279\u5831\u5373\u6642\u793A\u8B66"],
      ["NCDR \u570B\u5BB6\u707D\u5BB3\u9632\u6551\u79D1\u6280\u4E2D\u5FC3 (\u98B1\u98A8/\u8C6A\u96E8)", "https://watch.ncdr.nat.gov.tw/watch_typhoon", "\u98B1\u98A8\u52D5\u614B\u8207\u9053\u8DEF\u963B\u65B7\u793A\u8B66"],
      ["\u4E2D\u592E\u6C23\u8C61\u7F72 \u5B9A\u91CF\u964D\u6C34\u9810\u5831 (QPF)", "https://www.cwa.gov.tw/V8/C/P/QPF.html", "\u672A\u4F86 12/24 \u5C0F\u6642\u7D2F\u7A4D\u964D\u96E8\u8DA8\u52E2"],
      ["\u5929\u5019\u72C0\u6CC1\u60E1\u52A3\u4E0D\u5982\u9810\u671F\u6642\u555F\u52D5\u64A4\u9000", "", "\u81EA\u4E3B\u64A4\u9000\u6642\u6A5F\uFF1A\u8C6A\u5927\u96E8\u7279\u5831\u3001\u98B1\u98A8\u8B66\u6212\u6216\u9053\u8DEF\u574D\u65B9\u7BA1\u5236"],
      ["\u5404\u6642\u9593\u7BC0\u9EDE\u8D85\u51FA\u8868\u5B9A 1 \u5C0F\u6642\u4EE5\u4E0A\u555F\u52D5\u64A4\u9000", "", "\u81EA\u4E3B\u64A4\u9000\u6642\u6A5F\uFF1A\u7D93\u5B89\u5168\u907F\u96E3\u5F8C\u555F\u52D5\u64A4\u9000\u6A5F\u5236"],
      ["\u968A\u54E1\u51FA\u73FE\u6025\u6027\u9AD8\u5C71\u75C7\u6216\u9AD4\u529B\u8870\u7AED\u555F\u52D5\u64A4\u9000", "", "\u81EA\u4E3B\u64A4\u9000\u6642\u6A5F\uFF1AAMS/HAPE/HACE \u6216\u5931\u6EAB\u50B7\u60A3\u4E0B\u64A4"],
      ["\u5168\u968A\u4EE5\u5B89\u5168\u907F\u96E3\u3001\u56DE\u6EAF\u539F\u8DEF\u70BA\u539F\u5247", "", "\u64A4\u9000\u884C\u52D5\u6E96\u5247\uFF1A\u4E0D\u9017\u7559\u3001\u4E0D\u53CD\u6094\uFF0C\u56DE\u6EAF\u539F\u8DEF\u4E0B\u64A4\u81F3\u6700\u8FD1\u767B\u5C71\u53E3"]
    ] }
  ],
  pricing: {
    generalPrice: "NT$ 5,000 / \u4EBA",
    regionalPricing: [
      { region: "\u53F0\u4E2D(\u542B)\u4EE5\u5317", price: "NT$ 5,000 / \u4EBA" },
      { region: "\u5F70\u5316\u4EE5\u5357", price: "NT$ 5,500 / \u4EBA" }
    ],
    includedServices: [
      "\u5404\u7E23\u5E02\u4F86\u56DE\u5C08\u696D\u63A5\u99C1\u5C08\u8ECA",
      "\u570B\u5BB6\u516C\u5712\u5165\u5712\u8B49\u8207\u5165\u5C71\u7533\u8ACB\u624B\u7E8C",
      "\u9AD8\u5C71\u56AE\u5C0E\u8207\u5C08\u696D\u9818\u968A\u5168\u7A0B\u5E36\u968A\u5E36\u9818",
      "\u9AD8\u984D\u767B\u5C71\u7D9C\u5408\u4FDD\u96AA (\u542B\u7DCA\u6025\u6551\u63F4\u91AB\u7642)",
      "\u885B\u661F\u901A\u8A0A\u8A2D\u5099\u8207\u6025\u6551\u91AB\u7642\u5099\u54C1\u652F\u63F4"
    ],
    mealAddons: [
      { label: "DAY1 \u5357\u6E56\u6EAA\u5C71\u5C4B\u4F9B\u9910 (\u65E9/\u665A)", price: "NT$ 1,000 / \u4EBA" },
      { label: "DAY2 \u4E2D\u592E\u5C16\u6EAA\u5C71\u5C4B\u4F9B\u9910 (\u65E9/\u665A)", price: "NT$ 1,600 / \u4EBA" },
      { label: "DAY3 \u9999\u83C7\u5BEE\u71DF\u5730\u4F9B\u9910 (\u65E9/\u665A)", price: "NT$ 1,300 / \u4EBA" }
    ]
  },
  customHeaders: {
    overviewTitle: "\u884C\u7A0B\u6982\u89BD\u8207\u6D3B\u52D5\u8AAA\u660E",
    progressTitle: "\u5718\u52D9\u7C4C\u5099\u9032\u5EA6\u7E3D\u8868",
    piiTitle: "\u968A\u54E1\u540D\u518A\u8207\u7533\u8ACB\u500B\u8CC7\u7E3D\u8868 (\u6A5F\u5BC6\u5F8C\u53F0)",
    shuttleTitle: "D0 \u4EA4\u901A\u63A5\u99C1\u8207\u4E0A\u8ECA\u96C6\u5408\u9EDE",
    itineraryTitle: "\u6BCF\u65E5\u8A73\u7D30\u884C\u7A0B\u8207\u6642\u9593\u7BC0\u9EDE (\u6309\u8868\u64CD\u8AB2)",
    equipmentTitle: "\u767B\u5C71\u88DD\u5099\u6E05\u55AE\u8207\u884C\u524D\u81EA\u4E3B\u6AA2\u67E5\u8868",
    noticesTitle: "\u767B\u5C71\u884C\u7A0B\u5B89\u5168\u5B88\u5247\u8207\u5404\u9805\u9808\u77E5",
    surveyTitle: "\u968A\u54E1\u767B\u5C71\u7D93\u6B77\u8207\u4E92\u52A9\u8ABF\u67E5\u554F\u5377",
    safetyPlanTitle: "\u81EA\u4E3B\u5B89\u5168\u7BA1\u7406\u8207\u61C9\u8B8A\u64A4\u9000\u8A08\u756B"
  },
  customColumns: [
    {
      tableKey: "pii",
      key: "diet",
      label: "\u98F2\u98DF\u7FD2\u6163/\u7981\u5FCC",
      isPII: false,
      type: "text"
    },
    {
      tableKey: "pii",
      key: "medicalHistory",
      label: "\u7528\u85E5/\u75C5\u53F2\u5099\u8A3B",
      isPII: true,
      type: "text"
    },
    {
      tableKey: "progress",
      key: "insuranceSigned",
      label: "\u6295\u4FDD\u5207\u7D50\u66F8",
      isPII: false,
      type: "checkbox"
    }
  ],
  progressTasks: [
    { id: "t1", key: "dateConfirmed", label: "\u6D3B\u52D5\u65E5\u671F\u78BA\u8A8D" },
    { id: "t2", key: "hikeExpSurvey", label: "\u767B\u5C71\u7D93\u6B77\u8ABF\u67E5" },
    { id: "t3", key: "parkDataSubmitted", label: "\u7E73\u5165\u5712\u8CC7\u6599" },
    { id: "t4", key: "shuttleSurvey", label: "\u4E0A\u8ECA\u5730\u9EDE\u8ABF\u67E5" },
    { id: "t5", key: "routeBriefing", label: "\u884C\u7A0B\u8DEF\u7DDA\u8AAA\u660E" },
    { id: "t6", key: "emergencyToFamily", label: "\u7DCA\u6025\u806F\u7D61\u8CC7\u8A0A\u50B3\u7D66\u5BB6\u4EBA" },
    { id: "t7", key: "buddyGroupAssigned", label: "\u4E92\u52A9\u7D44\u7DE8\u5217" },
    { id: "t8", key: "foodPlanList", label: "\u7CE7\u98DF\u8A08\u756B\u6E05\u55AE" },
    { id: "t9", key: "safetyBriefing", label: "\u6CE8\u610F\u4E8B\u9805\u5BA3\u5C0E" },
    { id: "t10", key: "paymentDone", label: "\u4ED8\u6B3E\u72C0\u614B" },
    { id: "t11", key: "weeklyWorkout", label: "\u6BCF\u9031\u904B\u52D5\u7D50\u7B97" }
  ],
  shuttleRoutes: [
    {
      id: "route-north",
      title: "D0 \u4E0A\u8ECA\u6642\u9593\u5730\u9EDE (\u5317\u90E8\u51FA\u767C\u7DDA)",
      departureDate: "D0",
      stops: [
        { id: "s1", time: "16:00", locationName: "\u53F0\u96FB\u5927\u6A13\u6377\u904B\u7AD91\u865F\u51FA\u53E3", passengers: ["Andy Liu"], notes: "\u6E96\u6642\u767C\u8ECA" },
        { id: "s2", time: "17:20", locationName: "\u7AF9\u5317homebox", passengers: ["\u738B\u51A0\u7FA4"] },
        { id: "s3", time: "17:45", locationName: "7-11 \u92F8\u5C71\u9580\u5E02", passengers: ["\u6CCA"] },
        { id: "s4", time: "18:00", locationName: "\u897F\u6E56\u4F11\u606F\u7AD9", passengers: ["\u6797\u88D5\u5F65"] },
        { id: "s5", time: "18:45", locationName: "\u5BCC\u4EC1\u6A5F\u8ECA\u884C", passengers: ["\u6797\u4F73\u745C", "Ivan", "\u6C88\u5B97\u6E90"] },
        { id: "s6", time: "20:00", locationName: "\u53F0\u4E2D\u9AD8\u9435-7-11\u7AD9\u524D\u9580\u5E02", passengers: ["Lance Chang \u4EBA\u5F18", "Ivan", "\u937E\u7F8E\u73B2", "\u6C88\u5B97\u6E90"] },
        { id: "s7", time: "23:50", locationName: "\u74B0\u5C71\u90E8\u843D", passengers: [], notes: "\u524D\u7F6E\u591C\u5BBF\u9EDE" }
      ]
    },
    {
      id: "route-south",
      title: "D0 \u4E0A\u8ECA\u6642\u9593\u5730\u9EDE (\u5357\u90E8\u51FA\u767C\u7DDA)",
      departureDate: "D0",
      stops: [
        { id: "s8", time: "17:30", locationName: "\u840A\u723E\u5BCC\u4FBF\u5229\u5546\u5E97 \u9AD8\u5E02\u9AD8\u9032\u5E97", passengers: ["Hsin Huang"] },
        { id: "s9", time: "18:20", locationName: "\u5065\u8EAB\u5DE5\u5EE0 \u4EC1\u5FB7\u5EE0", passengers: ["\u99AC\u71D5\u5C4F", "huichen lin\uFF08\u60E0\u771F\uFF09"] },
        { id: "s10", time: "18:50", locationName: "\u65B0\u71DF\u4EA4\u6D41\u9053 \u9EA5\u7576\u52DE", passengers: ["\u674E\u754C\u932B"] },
        { id: "s11", time: "20:00", locationName: "\u53F0\u4E2D\u9AD8\u9435-7-11\u7AD9\u524D\u9580\u5E02", passengers: ["Lance Chang \u4EBA\u5F18", "Ivan", "\u937E\u7F8E\u73B2", "\u6C88\u5B97\u6E90"] },
        { id: "s12", time: "23:50", locationName: "\u74B0\u5C71\u90E8\u843D", passengers: [], notes: "\u8207\u5317\u8ECA\u6703\u5408" }
      ]
    }
  ],
  itinerary: [
    {
      id: "d0",
      dayLabel: "D0",
      title: "\u524D\u7F6E\u591C\u5BBF\u8207\u5168\u53F0\u63A5\u99C1",
      estimatedTime: "\u8ECA\u7A0B\u7D04 4.5 \u5C0F\u6642",
      milestones: [
        { time: "16:00 \u8D77", location: "\u5168\u53F0\u5404\u7E23\u5E02\u63A5\u99C1\u9EDE\u96C6\u5408\u4E0A\u8ECA" },
        { time: "20:30", location: "\u62B5\u9054\u6771\u57D4\u958B\u9AD8\u5DF7/\u767B\u5C71\u53E3\u524D\u7F6E\u6C11\u5BBF", notes: "\u5206\u767C\u516C\u88DD\u3001\u5206\u914D\u5E33\u7BF7\u3001\u6AA2\u8996\u88DD\u5099\u91CD\u91CF" },
        { time: "21:30", location: "\u5C31\u5BE2\u7184\u71C8\uFF0C\u7DAD\u6301\u826F\u597D\u9AD4\u80FD\u72C0\u614B" }
      ],
      waterAndCamp: "\u591C\u5BBF\u5408\u6CD5\u6C11\u5BBF\u6216\u5C71\u838A\uFF0C\u6709\u5145\u8DB3\u6C34\u96FB\u4F9B\u61C9"
    },
    {
      id: "d1",
      dayLabel: "DAY1",
      title: "\u52DD\u5149\u767B\u5C71\u53E3 \u2192 \u591A\u52A0\u5C6F \u2192 \u6728\u6746\u978D\u90E8 \u2192 \u5357\u6E56\u6EAA\u5C71\u5C4B",
      estimatedTime: "06:30 (\u91CD\u88DD\u6B65\u884C)",
      distance: "\u7D04 11.5 km",
      altitudeGain: "+1100m / -450m",
      milestones: [
        { time: "09:00", location: "\u52DD\u5149\u767B\u5C71\u53E3\u8D77\u767B (\u53F07\u7532 49.5K)", notes: "\u9EDE\u540D\u5718\u62CD\u3001\u6AA2\u67E5\u982D\u71C8\u8207\u96E2\u7DDA\u5730\u5716" },
        { time: "10:30", location: "\u52DD\u5149\u9AD8\u7E5E\u8655\u958B\u59CB", notes: "\u83DC\u5712\u63A5\u6797\u9053" },
        { time: "12:00", location: "\u677E\u98A8\u5DBA", notes: "\u677E\u91DD\u92EA\u5730\uFF0C\u4EAB\u7528\u5348\u9910\u8207\u884C\u52D5\u7CE7" },
        { time: "12:30", location: "\u591A\u52A0\u5C6F\u5C71\u5C94\u8DEF\u53E3", notes: "\u6A19\u9AD8 2,795m" },
        { time: "14:30", location: "\u6728\u6746\u978D\u90E8", notes: "\u5206\u5C94\u8DEF\u53E3\uFF0C\u7A0D\u4F5C\u4F11\u606F\u559D\u6C34" },
        { time: "15:30", location: "\u62B5\u9054\u5357\u6E56\u6EAA\u5C71\u5C4B", notes: "\u6574\u7406\u71DF\u5730\u3001\u53D6\u6C34\u716E\u98DF\u3001\u5206\u914D\u5E8A\u4F4D/\u5E33\u4F4D" }
      ],
      waterAndCamp: "\u5357\u6E56\u6EAA\u5C71\u5C4B\u65C1\u5357\u6E56\u6EAA\u6C34\u6E90\u5145\u6C9B\u6E05\u6F88\uFF1B\u5C71\u5C4B\u6216\u5468\u570D\u5E73\u5766\u71DF\u5730\u7D2E\u71DF"
    },
    {
      id: "d2",
      dayLabel: "DAY2",
      title: "\u5357\u6E56\u6EAA\u5C71\u5C4B \u2192 \u8D8A\u5DBA\u9AD8\u7E5E \u2192 \u9999\u83C7\u5BEE\u71DF\u5730 \u2192 \u4E2D\u592E\u5C16\u6EAA\u5C71\u5C4B",
      estimatedTime: "07:00 (\u91CD\u88DD\u6EAF\u6EAA\u8207\u6500\u722C)",
      distance: "\u7D04 8.5 km",
      altitudeGain: "+600m / -550m",
      milestones: [
        { time: "07:00", location: "\u5357\u6E56\u6EAA\u5C71\u5C4B\u6E96\u6642\u8D77\u767B", notes: "\u5168\u54E1\u6574\u88DD\u5B8C\u7562\u51FA\u767C" },
        { time: "11:00", location: "\u9999\u83C7\u5BEE\u71DF\u5730", notes: "\u5DE8\u6728\u6797\u5340\uFF0C\u63DB\u88DD\u6EAF\u6EAA\u978B\u6216\u9632\u6C34\u914D\u7F6E" },
        { time: "14:00", location: "\u4E2D\u592E\u5C16\u6EAA\u5C71\u5C4B", notes: "\u6EAF\u884C\u4E2D\u592E\u5C16\u6EAA\u62B5\u9054\u5C71\u5C4B\uFF0C\u78BA\u8A8D\u660E\u65E5\u653B\u9802\u88DD\u5099" }
      ],
      waterAndCamp: "\u4E2D\u592E\u5C16\u6EAA\u6D3B\u6C34\u6E90\u6975\u4F73\uFF1B\u5C71\u5C4B\u5E8A\u4F4D\u6216\u6EAA\u7554\u9AD8\u7058\u5730\u7D2E\u71DF"
    },
    {
      id: "d3",
      dayLabel: "DAY3",
      title: "\u4E2D\u592E\u5C16\u6EAA\u5C71\u5C4B \u2192 \u788E\u77F3\u5761 \u2192 \u4E3B\u978D\u90E8 \u2192 \u767B\u9802\u4E2D\u592E\u5C16\u5C71 \u2192 \u9999\u83C7\u5BEE\u71DF\u5730",
      estimatedTime: "11:30 (\u6975\u9650\u9577\u7A0B\u653B\u9802\u65E5)",
      distance: "\u7D04 14.2 km",
      altitudeGain: "+1300m / -1500m",
      milestones: [
        { time: "05:00", location: "\u4E2D\u592E\u5C16\u6EAA\u5C71\u5C4B\u8F15\u88DD\u8D77\u767B", notes: "\u982D\u71C8\u7167\u660E\u3001\u6EAF\u6EAA\u6BB5\u6CE8\u610F\u8E0F\u9EDE" },
        { time: "09:00", location: "\u4E2D\u592E\u5C16\u5C71\u4E3B\u978D\u90E8", notes: "\u6700\u5F8C\u788E\u77F3\u5927\u9661\u5761\uFF0C\u98A8\u5927\u6CE8\u610F\u4FDD\u6696" },
        { time: "10:00", location: "\u25B2 \u4E2D\u592E\u5C16\u5C71\u5C71\u9802 (3,705m)", notes: "\u767B\u9802\u5718\u62CD\uFF01\u5305\u5305\u4E0D\u7F6E\u65BC\u4E09\u89D2\u9EDE" },
        { time: "14:00", location: "\u8FD4\u62B5\u4E2D\u592E\u5C16\u6EAA\u5C71\u5C4B", notes: "\u6574\u9813\u91CD\u88DD\u3001\u5FEB\u901F\u88DC\u5145\u96FB\u89E3\u8CEA" },
        { time: "16:30", location: "\u62B5\u9054\u9999\u83C7\u5BEE\u71DF\u5730\u7D2E\u71DF", notes: "\u591C\u5BBF\u9999\u83C7\u5BEE\uFF0C\u5099\u59A5\u7FCC\u65E5\u56DE\u7A0B\u9AD4\u80FD" }
      ],
      waterAndCamp: "\u9999\u83C7\u5BEE\u71DF\u5730\u65C1\u6709\u6E05\u6F88\u6EAA\u6D41\u6D3B\u6C34\uFF1B\u68EE\u6797\u67D4\u8EDF\u71DF\u5730\u7D2E\u71DF"
    },
    {
      id: "d4",
      dayLabel: "DAY4",
      title: "\u9999\u83C7\u5BEE\u71DF\u5730 \u2192 \u5357\u6E56\u6EAA\u6728\u6746\u978D\u90E8 \u2192 \u591A\u52A0\u5C6F \u2192 \u52DD\u5149\u767B\u5C71\u53E3 (\u5E73\u5B89\u8CE6\u6B78)",
      estimatedTime: "08:30 (\u91CD\u88DD\u8FD4\u7A0B)",
      distance: "\u7D04 12.8 km",
      altitudeGain: "+650m / -1350m",
      milestones: [
        { time: "05:00", location: "\u9999\u83C7\u5BEE\u71DF\u5730\u62D4\u71DF\u8D77\u767B", notes: "\u7121\u75D5\u5C71\u6797\u5783\u573E\u5168\u6578\u5E36\u4E0B\u5C71" },
        { time: "08:00", location: "\u5357\u6E56\u6EAA\u5C71\u5C4B", notes: "\u904E\u6EAA\u9EDE\u5C0F\u4F11" },
        { time: "09:15", location: "\u6728\u6746\u978D\u90E8", notes: "\u63A5\u56DE\u4E3B\u7DDA\u6B65\u9053" },
        { time: "11:00", location: "\u591A\u52A0\u5C6F\u5C71\u6C34\u5229\u4E09\u89D2\u9EDE" },
        { time: "12:40", location: "4.8K \u767B\u5C71\u53E3\u52DD\u5149\u5C94\u8DEF" },
        { time: "13:30", location: "\u52DD\u5149\u767B\u5C71\u53E3\u63A5\u99C1\u9EDE", notes: "\u62B5\u9054\u7D42\u9EDE\uFF01\u9EDE\u540D\u63DB\u88DD\u3001\u6176\u529F\u5BB4\u5E73\u5B89\u8CE6\u6B78" }
      ],
      waterAndCamp: "\u4E0B\u5C71\u5F8C\u65BC\u5B9C\u862D/\u7901\u6EAA\u6176\u529F\u5BB4\u8207\u76E5\u6D17\u6C90\u6D74"
    }
  ],
  equipmentList: [
    { id: "eq1", category: "\u500B\u4EBA\u7167\u660E\u8207\u96FB\u529B", name: "\u9AD8\u6D41\u660E\u982D\u71C8 (\u542B\u5145\u6EFF\u96FB\u92F0\u96FB\u6C60/\u5099\u4EFD\u96FB\u6C60)", required: true, notes: "\u5FC5\u5099\uFF01\u4E0D\u53EF\u7528\u624B\u6A5F\u624B\u96FB\u7B52\u4EE3\u66FF" },
    { id: "eq2", category: "\u500B\u4EBA\u7167\u660E\u8207\u96FB\u529B", name: "\u884C\u52D5\u96FB\u6E90 (\u81F3\u5C11 10,000mAh) \u8207\u5145\u96FB\u7DDA", required: true, notes: "\u4F4E\u6EAB\u74B0\u5883\u96FB\u6C60\u6613\u6389\u96FB\uFF0C\u8ACB\u4FDD\u6696\u4FDD\u5B58" },
    { id: "eq3", category: "\u9632\u96E8\u8207\u4FDD\u6696\u7CFB\u7D71", name: "\u767B\u5C71\u5C08\u7528\u5169\u622A\u5F0F\u900F\u6C23\u96E8\u8863\u3001\u96E8\u8932 (\u5982 Gore-Tex)", required: true, notes: "\u56B4\u7981\u8F15\u4FBF\u96E8\u8863" },
    { id: "eq4", category: "\u9632\u96E8\u8207\u4FDD\u6696\u7CFB\u7D71", name: "\u4E2D\u5C64\u7FBD\u7D68\u8863/\u5316\u7E96\u4FDD\u6696\u8863 + \u4FDD\u6696\u6BDB\u5E3D + \u624B\u5957", required: true, notes: "\u5C71\u9802\u978D\u90E8\u98A8\u5F37\u6EAB\u4F4E\uFF0C\u6D0B\u8525\u5F0F\u7A7F\u642D" },
    { id: "eq5", category: "\u9632\u96E8\u8207\u4FDD\u6696\u7CFB\u7D71", name: "\u5099\u7528\u8863\u7269\u8932\u896A (\u4EE5\u9632\u6C34\u888B\u6216\u593E\u93C8\u888B\u5BC6\u5C01)", required: true, notes: "\u81F3\u5C11\u4E00\u5957\u653E\u80CC\u5305\u6700\u5E95\u90E8" },
    { id: "eq6", category: "\u767B\u5C71\u7761\u7720\u8207\u4F4F\u5BBF", name: "\u9AD8\u5C71\u7761\u888B (\u8212\u9069\u6EAB\u5EA6 -5\u2103 ~ 0\u2103 \u7FBD\u7D68\u7761\u888B)", required: true },
    { id: "eq7", category: "\u767B\u5C71\u7761\u7720\u8207\u4F4F\u5BBF", name: "\u86CB\u5DE2\u7761\u588A / \u5145\u6C23\u9632\u6F6E\u7761\u588A (R\u503C 3.0 \u4EE5\u4E0A)", required: true },
    { id: "eq8", category: "\u884C\u9032\u8207\u6EAF\u6EAA\u88DD\u5099", name: "\u9AD8\u7B52\u767B\u5C71\u978B / \u96E8\u978B (\u52A0\u539A\u7F8A\u6BDB\u896A\u8207\u8B77\u8E1D)", required: true },
    { id: "eq9", category: "\u884C\u9032\u8207\u6EAF\u6EAA\u88DD\u5099", name: "\u9632\u6ED1\u6EAF\u6EAA\u978B / \u6EAF\u6EAA\u896A (\u4E2D\u592E\u5C16\u6EAA\u904E\u6EAA\u6BB5\u5FC5\u5099)", required: true, notes: "\u904E\u6EAA\u6642\u9632\u6ED1\u4FDD\u8B77\u8173\u8E1D" },
    { id: "eq10", category: "\u884C\u9032\u8207\u6EAF\u6EAA\u88DD\u5099", name: "\u767B\u5C71\u6756 (\u5EFA\u8B70\u96D9\u6756\u8F14\u52A9\u652F\u6490)", required: true },
    { id: "eq11", category: "\u98F2\u98DF\u8207\u708A\u4E8B", name: "\u4FDD\u6EAB\u6C34\u74F6 + \u8010\u71B1\u6C34\u888B (\u7E3D\u6C34\u91CF\u5EFA\u8B70 2.5L~3.0L)", required: true },
    { id: "eq12", category: "\u98F2\u98DF\u8207\u708A\u4E8B", name: "\u500B\u4EBA\u74B0\u4FDD\u7897\u7B77\u3001\u9AD8\u5C71\u7210\u982D\u3001\u74E6\u65AF\u7F50\u3001\u6253\u706B\u6A5F", required: true },
    { id: "eq13", category: "\u91AB\u7642\u8207\u5B89\u5168", name: "\u500B\u4EBA\u5E38\u5099\u85E5\u3001\u9AD8\u5C71\u75C7\u9810\u9632\u7528\u85E5 (\u4E39\u6728\u65AF)\u3001\u6B62\u75DB\u85E5", required: true, notes: "\u500B\u4EBA\u75BE\u75C5\u85E5\u54C1\u52D9\u5FC5\u5099\u9F4A\u5929\u6578+\u9810\u5099\u65E5" },
    { id: "eq14", category: "\u91AB\u7642\u8207\u5B89\u5168", name: "\u624B\u6A5F\u5B89\u88DD\u96E2\u7DDA\u5730\u5716 (\u7DA0\u91CE\u904A\u8E64/Hikingbook) \u4E26\u8F09\u597D GPX", required: true },
    { id: "eq15", category: "\u8B49\u4EF6\u8207\u8CB4\u91CD\u7269", name: "\u5065\u4FDD\u5361\u3001\u8EAB\u5206\u8B49\u6B63\u672C (\u570B\u5BB6\u516C\u5712\u67E5\u9A57\u8EAB\u5206\u7528)", required: true }
  ],
  notices: [
    {
      id: "n1",
      title: "\u51FA\u5718\u9808\u77E5\u8207\u9000\u8CBB\u898F\u5B9A",
      content: [
        "\u53C3\u52A0\u6D3B\u52D5\u8ACB\u5148\u78BA\u8A8D\u6D3B\u52D5\u65E5\u671F\u6709\u7121\u7279\u6B8A\u7BC0\u65E5\u4EE5\u53CA\u5176\u4ED6\u500B\u4EBA\u884C\u7A0B\u3002",
        "\u51FA\u767C\u524D 30 \u5929\u524D\u6536\u8CBB\u5B8C\u7562\uFF0C15-30 \u5929\u7121\u6CD5\u524D\u5F80\u9000\u8CBB 50%\uFF0C5-14 \u5929\u7121\u6CD5\u524D\u5F80\u9000\u8CBB 25%\uFF0C4 \u65E5\u4EE5\u5167\u4EE5\u53CA\u5DF2\u51FA\u767C\u6055\u4E0D\u9000\u8CBB\u3002",
        "\u7D93\u6C23\u8C61\u55AE\u4F4D\u53CA\u570B\u5BB6\u516C\u5712\u767C\u5E03\u5C01\u5712\uFF0C\u6216\u767C\u5E03\u8C6A\u5927\u96E8\u3001\u98B1\u98A8\u3001\u5929\u707D\u9053\u8DEF\u7BA1\u5236\u5247\u76F4\u63A5\u53D6\u6D88\u6D3B\u52D5\u5EF6\u671F\u8FA6\u7406\uFF0C\u6216\u5168\u984D\u9000\u6B3E\u4E0D\u6263\u4EFB\u4F55\u8CBB\u7528\u3002",
        "\u5DF2\u652F\u51FA\u4E4B\u7533\u8ACB\u898F\u8CBB\uFF0C\u9664\u570B\u5BB6\u516C\u5712\u4F11\u5712\u516C\u544A\u5F8C\uFF0C\u6309\u5176\u898F\u5B9A\u4E88\u4EE5\u9000\u8CBB\u3002\u672A\u9054\u4F11\u5712\u6A19\u6E96\uFF0C\u65BC\u516C\u544A\u524D\u9000\u5718\uFF0C\u4E0D\u4E88\u9000\u8CBB\u3002",
        "\u884C\u7A0B\u4E2D\u767C\u5E03\u7684\u5C01\u5712\u6216\u8B66\u5831\uFF0C\u7531\u9818\u968A\u6C7A\u5B9A\u8D70\u7E8C\u884C\u3001\u64A4\u9000\u6216\u6539\u8D70\u5176\u4ED6\u8DEF\u7DDA\uFF0C\u6055\u4E0D\u9000\u8CBB\u3002",
        "\u5929\u6C23\u9810\u5831\u7684\u5224\u65B7\u662F\u5426\u6210\u884C\u4EE5\u4E3B\u8FA6\u65B9\u89E3\u8B80\u70BA\u6E96\u3002",
        "\u6436\u4E2D\u5C71\u5C4B\u6216\u662F\u71DF\u5730\u4EE5\u5BE6\u969B\u72C0\u6CC1\u70BA\u6E96\uFF0C\u8ACB\u5927\u5BB6\u914D\u5408\u4E26\u9075\u5B88\u3002",
        "\u884C\u7A0B\u4E0D\u662F\u5831\u540D\u5C31\u80FD\u53C3\u52A0\uFF0C\u4EE5\u5168\u968A\u5B89\u5168\u70BA\u91CD\uFF0C\u6703\u4F9D\u662F\u5426\u6709\u5718\u9AD4\u4E92\u52A9\u89C0\u5FF5\u70BA\u512A\u5148\u5BE9\u6838\uFF0C\u518D\u4F9D\u767B\u5C71\u96E3\u5EA6\u53CA\u500B\u4EBA\u767B\u5C71\u7D93\u9A57\u7BE9\u9078\u3002",
        "\u5165\u7FA4\u53C3\u5718\uFF0C\u4EA6\u8868\u8A73\u95B1\u5404\u6CE8\u610F\u4E8B\u9805\u4E26\u540C\u610F\u76F8\u95DC\u7D30\u9805\u898F\u5B9A\u3002"
      ]
    },
    {
      id: "n2",
      title: "\u4EA4\u901A\u63A5\u99C1\u8207\u96C6\u5408\u7D00\u5F8B",
      content: [
        "\u524D\u4E00\u665A\u8ACB\u5B9A\u597D\u9B27\u9418\uFF0C\u4E26\u78BA\u8A8D\u597D\u9694\u5929\u65E9\u4E0A\u6703\u97FF\uFF0C\u6D3B\u52D5\u7576\u5929\u8ACB\u52D9\u5FC5\u6E96\u6642\u4E0A\u8ECA\uFF0C\u4EE5\u514D\u5EF6\u8AA4\u884C\u7A0B\uFF0C\u903E\u6642\u82E5\u96FB\u806F\u4E0D\u4E0A\u5C31\u4E0D\u7B49\u5019\uFF0C\u8CBB\u7528\u4E0D\u9000\u3002",
        "\u6703\u6688\u8ECA\u7684\u968A\u54E1\u8ACB\u81EA\u884C\u5099\u59A5\u76F8\u95DC\u85E5\u54C1\uFF0C\u82E5\u6709\u9700\u8981\u5B89\u6392\u5EA7\u4F4D\u8ACB\u4E3B\u52D5\u544A\u77E5\uFF0C\u53F8\u6A5F\u5927\u54E5\u6703\u5354\u52A9\u5206\u914D\u3002",
        "\u6BCF\u500B\u7AD9\u9EDE\u4E0A\u8ECA\u7684\u4EBA\u54E1\uFF0C\u4E3B\u52D5\u65BC LINE \u6D3B\u52D5\u7FA4\u7D44\u56DE\u5831\u3002",
        "\u4E0A\u8ECA\u524D\u8ACB\u5148\u4E0A\u904E\u5EC1\u6240\uFF0C\u9014\u4E2D\u8981\u4E0A\u5EC1\u6240\u8ACB\u544A\u77E5\u53F8\u6A5F\u5927\u54E5\uFF0C\u4EE5\u9AD8\u901F\u516C\u8DEF\u4F11\u606F\u7AD9\u70BA\u4E3B\uFF0C\u4E0D\u9032\u4FBF\u5229\u5546\u5E97\u6392\u968A\u3002",
        "\u9322\u5305\u53CA\u8CB4\u91CD\u7269\u54C1\u4E0D\u8981\u5E36\u4E0A\u5C71\uFF0C\u67E5\u9A57\u8B49\u4EF6\u90E8\u5206\uFF0C\u651C\u5E36\u5065\u4FDD\u5361\u6216\u8EAB\u5206\u8B49\u5373\u53EF\u3002\u96F6\u9322\u8ACB\u5728\u4E0A\u5C71\u524D\u7528\u5B8C\u6216\u5132\u503C\uFF0C\u4E0D\u8981\u5E36\u4E0A\u5C71\u589E\u52A0\u91CD\u91CF\u3002",
        "\u4E0B\u5C71\u5F8C\u7684\u76E5\u6D17\u8863\u7269\uFF0C\u70BA\u907F\u514D\u62FF\u932F\u6216\u4EA4\u63A5\u6DF7\u4E82\uFF0C\u8ACB\u7528\u53EF\u5C01\u9589\u7684\u888B\u5B50\u88DD\u597D\u7559\u65BC\u63A5\u99C1\u8ECA\u4E0A\uFF0C\u6BCF\u4EBA\u4EE5\u4E00\u4EF6\u70BA\u9650\u3002",
        "\u62B5\u9054\u767B\u5C71\u53E3\u6642\uFF0C\u53F8\u6A5F\u5927\u54E5\u6703\u8FC5\u901F\u628A\u88DD\u5099\u79FB\u4E0B\u8ECA\u7D66\u5927\u5BB6\u8A8D\u9818\u300210 \u5206\u9418\u5F8C\u9EDE\u540D\u5718\u62CD\u5F8C\u7ACB\u5373\u8D77\u767B\u3002"
      ]
    },
    {
      id: "n3",
      title: "\u98DF\uFF1A\u7CE7\u98DF\u3001\u9810\u5099\u7CE7\u8207\u91CD\u91CF\u63A7\u7BA1",
      content: [
        "\u6240\u6709\u88DC\u7D66\u7269\u8CC7\u51FA\u767C\u524D\u65E5\u5099\u59A5\uFF0C\u5207\u52FF\u6D3B\u52D5\u7576\u5929\u624D\u88DC\u7D66\u3002",
        "\u9910\u98DF\u90E8\u5206\u8ACB\u78BA\u5BE6\u5C0D\u7167\u5929\u6578\u53CA\u6240\u9700\u7CE7\u98DF\uFF0C\u884C\u9032\u9593\u4E0D\u716E\u98DF\uFF0C\u4E0D\u505A\u7121\u8B02\u6D6A\u8CBB\u3002",
        "\u8ACB\u52FF\u651C\u5E36\u660E\u986F\u8D85\u904E\u9AD4\u80FD\u8CA0\u8377\u7684\u751F\u9BAE\u852C\u679C\uFF0C\u4EE5\u53CA\u5B8C\u5168\u4F7F\u7528\u4E0D\u5230\u7684\u7269\u54C1\u3002",
        "\u4EFB\u4F55\u884C\u7A0B\u8ACB\u52D9\u5FC5\u505A\u300C\u9810\u5099\u65E5\u53CA\u9810\u5099\u7CE7\u4E00\u65E5\u300D\u4E4B\u6E96\u5099\u3002",
        "\u6C34\u7684\u90E8\u5206\uFF0C\u8996\u500B\u4EBA\u98F2\u6C34\u72C0\u6CC1\u5C0D\u7167\u884C\u9032\u72C0\u6CC1\u78BA\u5BE6\u6E96\u5099\uFF0C\u884C\u524D\u6703\u8ABF\u67E5\u8FD1\u671F\u6C34\u6E90\u72C0\u6CC1\u4EE5\u4F9B\u53C3\u8003\u3002\u4E0D\u8981\u611F\u5230\u53E3\u6E34\u624D\u559D\u6C34\uFF0C\u4E5F\u4E0D\u53EF\u72C2\u98F2\u3002",
        "\u71B1\u91CF\u5EFA\u8B70\uFF1A\u6BCF\u65E5\u9AD8\u5C71\u884C\u7A0B\u5EFA\u8B70\u6BCF\u5C0F\u6642\u88DC\u5145 120-240kcal \u884C\u52D5\u7CE7\uFF08\u5805\u679C\u3001\u679C\u4E7E\u3001\u80FD\u91CF\u68D2\u3001\u8089\u4E7E\u3001\u5DE7\u514B\u529B\uFF09\uFF0C\u7DAD\u6301\u8840\u7CD6\u8207\u8010\u529B\u3002"
      ]
    },
    {
      id: "n4",
      title: "\u8863\uFF1A\u96E8\u5099\u3001\u4E09\u5C64\u7A7F\u642D\u8207\u8DB3\u90E8\u9632\u8B77",
      content: [
        "\u6BCF\u500B\u4EBA\u90FD\u8981\u4E8B\u5148\u78BA\u8A8D\u6C23\u8C61\u9810\u5831\u6EAB\u6FD5\u5EA6\u3001\u98A8\u901F\u53CA\u96E8\u6CC1\u3002",
        "\u6D0B\u8525\u5F0F\u7A7F\u6CD5\u4E09\u5C64\u7CFB\u7D71\uFF1A\u5E95\u5C64\uFF08\u5438\u6FD5\u6392\u6C57\u3001\u7F8A\u6BDB/\u6DF7\u7D21\uFF09\u3001\u4E2D\u5C64\uFF08\u4FDD\u6696\u5316\u7E96/\u7FBD\u7D68\uFF09\u3001\u5916\u5C64\uFF08\u9632\u98A8\u9632\u6C34 Gore-Tex\uFF09\u3002",
        "\u907F\u514D\u68C9\u8CEA\u8863\u7269\uFF01\u68C9\u8CEA\u5438\u6C34\u4E0D\u6613\u4E7E\u6975\u6613\u5C0E\u81F4\u5931\u6EAB\u3002",
        "\u7121\u8AD6\u9810\u5831\u662F\u5426\u6709\u96E8\uFF0C\u5169\u622A\u5F0F\u96E8\u8863\u8932\u5FC5\u9808\u9F4A\u5168\uFF0C\u5099\u7528\u4FDD\u6696\u8863\u7269\u52D9\u5FC5\u4EE5\u9632\u6C34\u888B\u6EF4\u6C34\u4E0D\u6CBE\u5BC6\u5C01\u3002",
        "\u8ACB\u52FF\u7A7F\u5168\u65B0\u3001\u4E0D\u5408\u8173\u6216\u591A\u5E74\u672A\u7A7F\u7684\u6C34\u89E3\u767B\u5C71\u978B\u53C3\u52A0\u591A\u5929\u6578\u884C\u7A0B\u3002"
      ]
    },
    {
      id: "n5",
      title: "\u4F4F\uFF1A\u5E33\u7BF7\u3001\u642D\u5E33\u719F\u7DF4\u8207\u7121\u75D5\u5C71\u6797",
      content: [
        "\u71DF\u5730\u4F4F\u5BBF\u90E8\u5206\u6703\u5206\u914D\u597D\u5E33\u7BF7\uFF0C\u5171\u5E33\u5206\u63F9\u90E8\u5206\u6703\u5206\u914D\u597D\u63F9\u5E33\u8005\u53CA\u5206\u63F9\u91CD\u91CF\u3002",
        "\u540C\u5E33\u8005\u5FC5\u9808\u5171\u540C\u642D\u5E33\u6536\u5E33\uFF0C\u5C24\u5176\u98A8\u96E8\u4E2D\u5171\u540C\u9032\u884C\u3002",
        "\u5927\u7A7A\u5730\u7559\u7D66\u5927\u71DF\u5E33\uFF0C\u5C0F\u7A7A\u5730\u7559\u7D66\u5C0F\u71DF\u5E33\u3002\u71DF\u5730\u7A7A\u9593\u4E0D\u8DB3\u6642\u7531\u9818\u968A\u7D71\u7C4C\u5206\u914D\u3002",
        "\u5C71\u5C4B\u5E8A\u4F4D\uFF0C\u4E0B\u8216\u6700\u63A5\u8FD1\u9580\u53E3\u7684\u4F4D\u7F6E\u9810\u7559\u7D66\u9818\u968A\u53CA\u62BC\u968A\u4EBA\u54E1\u4EE5\u5229\u7DCA\u6025\u61C9\u8B8A\u3002",
        "\u56B4\u683C\u9075\u5B88\u7121\u75D5\u5C71\u6797 (LNT) \u539F\u5247\uFF0C\u6240\u6709\u5783\u573E\u3001\u5EDA\u9918\u3001\u885B\u751F\u7D19\u5168\u6578\u81EA\u884C\u80CC\u4E0B\u5C71\u3002"
      ]
    },
    {
      id: "n6",
      title: "\u884C\uFF1A\u884C\u9032\u7D00\u5F8B\u3001\u5C0D\u8B1B\u6A5F\u8207\u56DE\u5831\u6A5F\u5236",
      content: [
        "\u8868\u5B9A\u597D\u7684\u51FA\u767C\u6642\u9593\uFF0C\u5168\u968A\u6E96\u6642\u51FA\u767C\u3002\u4F11\u606F\u9EDE\u5230\u9EDE\u4E4B\u9593\u4E0D\u8981\u6709\u591A\u9918\u7684\u505C\u9813\u52D5\u4F5C\u3002",
        "\u884C\u9032\u9593\u56E0\u500B\u4EBA\u56E0\u7D20\u505C\u4E0B\uFF0C\u8ACB\u8B93\u9053\u7D66\u5F8C\u9762\u968A\u54E1\u5148\u884C\uFF0C\u4E26\u7531\u4E92\u52A9\u7D44\u966A\u540C\u8DDF\u4E0A\u968A\u4F0D\uFF0C\u52FF\u5411\u524D\u968A\u547C\u558A\u64FE\u4E82\u968A\u4F0D\u7BC0\u594F\u4E4B\u8A00\u8A5E\u3002",
        "\u968A\u4F0D\u6700\u524D\u9762\uFF08\u9818\u968A\uFF09\u8207\u6700\u5F8C\u9762\uFF08\u62BC\u968A\uFF09\u5404\u6301\u6709\u4E00\u652F\u7121\u7DDA\u96FB\uFF0C\u901A\u806F\u4EE5\u4EBA\u54E1\u6578\u3001\u72C0\u6CC1\u3001\u4F4D\u7F6E\u70BA\u4E3B\uFF0C\u56B4\u7981\u9592\u804A\u3002",
        "\u5168\u7A0B\u6309\u8868\u64CD\u8AB2\uFF0C\u56B4\u7981\u50AC\u4FC3\u968A\u53CB\u884C\u9032\u901F\u5EA6\u6216\u6253\u65B7\u8868\u5B9A\u4F11\u606F\u6642\u9593\uFF0C\u66F4\u7981\u6B62\u60E1\u8A00\u76F8\u5411\u3002",
        "\u767B\u9802\u5F8C\u767B\u5C71\u5305\u8ACB\u52FF\u653E\u5728\u4E09\u89D2\u9EDE\u9644\u8FD1\uFF0C\u4EE5\u5229\u968A\u53CB\u62CD\u7167\u3002\u904E\u5730\u5F62\u6642\u7981\u6B62\u5E72\u64FE\u6307\u63EE\u6216\u558A\u53E3\u865F\u64FA POSE\u3002"
      ]
    },
    {
      id: "n7",
      title: "\u767B\u5C71\u91AB\u7642\u8207\u7528\u85E5\u5B89\u5168\u5B88\u5247",
      content: [
        "\u534A\u5E74\u5167\u958B\u904E\u5200\u3001\u91CD\u5927\u75C5\u53F2\u3001\u5FC3\u8840\u7BA1\u75BE\u75C5\u3001\u61F7\u5B55\u7B49\uFF0C\u8ACB\u4E3B\u52D5\u544A\u77E5\u8A55\u4F30\u3002",
        "\u9AD8\u5C71\u75C7\u9810\u9632\u6027\u7528\u85E5\uFF08\u4E39\u6728\u65AF Acetazolamide\uFF09\uFF0C\u9032\u5165\u9AD8\u6D77\u62D4 2500m \u524D 12 \u5C0F\u6642\u958B\u59CB\u670D\u7528\uFF0C\u6BCF 12 \u5C0F\u6642 125mg\uFF08\u7528\u85E5\u8ACB\u4E8B\u5148\u8AEE\u8A62\u91AB\u5E2B\uFF09\u3002",
        "\u5C71\u4E0A\u56B4\u7981\u8DF3\u5165\u6EAA\u6C34\u6E38\u6CF3\u6D17\u6FA1\uFF0C\u4EE5\u514D\u53D7\u5BD2\u9032\u800C\u5F15\u767C\u6025\u6027\u9AD8\u5C71\u75C7\u6216\u5931\u6EAB\u3002",
        "\u3010\u81EA\u5DF1\u7684\u85E5\u81EA\u5DF1\u8CA0\u8CAC\u3011\uFF1A\u4E0D\u53EF\u96A8\u610F\u5728\u5C71\u4E0A\u5403\u968A\u53CB\u7684\u85E5\u7269\uFF0C\u4EA6\u4E0D\u53EF\u96A8\u610F\u63D0\u4F9B\u8655\u65B9\u85E5\u7D66\u4ED6\u4EBA\uFF0C\u5404\u4EBA\u5FC5\u9808\u5099\u9F4A\u5929\u6578+\u9810\u5099\u65E5\u7528\u85E5\u3002"
      ]
    }
  ],
  members: [
    {
      id: "m1",
      role: "\u9818\u968A",
      name: "\u6797\u88D5\u5F65",
      nickname: "\u6797\u5927",
      gender: "\u7537",
      idNumber: "K120659670",
      birthDate: "1977-10-03",
      phone: "0972-573495",
      email: "Yy661003@gmail.com",
      emergencyContact: "\u6797\u88D5\u5D27",
      emergencyPhone: "0911-989786",
      address: "\u82D7\u6817\u7E23\u7AF9\u5357\u93AE\u535A\u611B\u8857120\u865F",
      bloodType: "O",
      medicalHistory: "\u7121\u7279\u6B8A\u75BE\u75C5\uFF0C\u6709\u9AD8\u5C71\u56AE\u5C0E\u8207 EMT-1 \u6551\u8B77\u8B49\u7167",
      diet: "\u8477\u98DF (\u7121\u5FCC\u53E3)",
      customFields: {
        peaksCount: "78\u5EA7\u767E\u5CB3",
        gearWeight: "17.5 kg",
        tentAssignment: "\u4E3B\u5E33 1 \u865F (\u9818\u968A\u5E33)"
      }
    },
    {
      id: "m2",
      role: "\u968A\u54E1",
      name: "Andy Liu",
      nickname: "Andy",
      gender: "\u7537",
      idNumber: "A123456789",
      birthDate: "1985-05-12",
      phone: "0912-345678",
      email: "andyliu.hike@gmail.com",
      emergencyContact: "\u5289\u654F\u83EF (\u914D\u5076)",
      emergencyPhone: "0922-111222",
      address: "\u53F0\u5317\u5E02\u5927\u5B89\u5340\u65B0\u751F\u5357\u8DEF\u4E8C\u6BB5",
      bloodType: "A",
      medicalHistory: "\u7121",
      diet: "\u8477\u98DF",
      customFields: {
        peaksCount: "32\u5EA7\u767E\u5CB3",
        gearWeight: "15.0 kg",
        tentAssignment: "\u5171\u5E33 A \u7D44"
      }
    },
    {
      id: "m3",
      role: "\u968A\u54E1",
      name: "\u738B\u51A0\u7FA4",
      nickname: "\u51A0\u7FA4",
      gender: "\u7537",
      idNumber: "J198765432",
      birthDate: "1990-11-20",
      phone: "0933-445566",
      email: "kuanchun.wang@gmail.com",
      emergencyContact: "\u738B\u5EFA\u7ACB (\u7236\u89AA)",
      emergencyPhone: "0910-888999",
      address: "\u65B0\u7AF9\u7E23\u7AF9\u5317\u5E02\u5149\u660E\u516D\u8DEF",
      bloodType: "B",
      medicalHistory: "\u8F15\u5FAE\u82B1\u7C89\u904E\u654F",
      diet: "\u8477\u98DF",
      customFields: {
        peaksCount: "18\u5EA7\u767E\u5CB3",
        gearWeight: "16.2 kg",
        tentAssignment: "\u5171\u5E33 A \u7D44"
      }
    },
    {
      id: "m4",
      role: "\u968A\u54E1",
      name: "\u6797\u4F73\u745C",
      nickname: "Fish",
      gender: "\u5973",
      idNumber: "B221144335",
      birthDate: "1992-03-15",
      phone: "0928-776655",
      email: "chiayu.lin92@gmail.com",
      emergencyContact: "\u6797\u653F\u5B8F (\u7236\u89AA)",
      emergencyPhone: "0935-123789",
      address: "\u53F0\u4E2D\u5E02\u897F\u5340\u516C\u76CA\u8DEF",
      bloodType: "O",
      medicalHistory: "\u6709\u5099\u4E39\u6728\u65AF\u8207\u500B\u4EBA\u80C3\u85E5",
      diet: "\u86CB\u5976\u7D20",
      customFields: {
        peaksCount: "25\u5EA7\u767E\u5CB3",
        gearWeight: "13.5 kg",
        tentAssignment: "\u5973\u5B50\u96D9\u4EBA\u5E33 B \u7D44"
      }
    },
    {
      id: "m5",
      role: "\u968A\u54E1",
      name: "\u5289\u6C9B\u59A4",
      nickname: "\u6C9B\u6C9B",
      gender: "\u5973",
      idNumber: "Q229876123",
      birthDate: "1994-08-08",
      phone: "0955-667788",
      email: "peiyu.liu@gmail.com",
      emergencyContact: "\u5289\u570B\u5F37 (\u7236\u89AA)",
      emergencyPhone: "0988-332211",
      address: "\u5609\u7FA9\u7E23\u6C11\u96C4\u9109\u5EFA\u570B\u8DEF",
      bloodType: "AB",
      medicalHistory: "\u7121",
      diet: "\u8477\u98DF (\u4E0D\u5403\u725B\u8089)",
      customFields: {
        peaksCount: "12\u5EA7\u767E\u5CB3",
        gearWeight: "12.8 kg",
        tentAssignment: "\u5973\u5B50\u96D9\u4EBA\u5E33 B \u7D44"
      }
    },
    {
      id: "m6",
      role: "\u968A\u54E1",
      name: "\u9673\u6E05\u8CAB",
      nickname: "\u8CAB\u54E5",
      gender: "\u7537",
      idNumber: "L120998877",
      birthDate: "1980-02-18",
      phone: "0919-887766",
      email: "chingkuan.chen@gmail.com",
      emergencyContact: "\u9673\u7F8E\u9E97 (\u59CA\u59CA)",
      emergencyPhone: "0921-998877",
      address: "\u53F0\u4E2D\u5E02\u8C50\u539F\u5340\u4E2D\u6B63\u8DEF",
      bloodType: "O",
      medicalHistory: "\u820A\u819D\u50B7 (\u884C\u9032\u5FC5\u6234\u8B77\u819D)",
      diet: "\u8477\u98DF",
      customFields: {
        peaksCount: "45\u5EA7\u767E\u5CB3",
        gearWeight: "16.5 kg",
        tentAssignment: "\u5171\u5E33 C \u7D44"
      }
    },
    {
      id: "m7",
      role: "\u968A\u54E1",
      name: "\u859B\u5104\u5B87",
      nickname: "\u5104\u5B87",
      gender: "\u7537",
      idNumber: "E123321456",
      birthDate: "1988-09-24",
      phone: "0970-112233",
      email: "yiyu.hsueh@gmail.com",
      emergencyContact: "\u859B\u570B\u5B89 (\u7236\u89AA)",
      emergencyPhone: "0937-665544",
      address: "\u9AD8\u96C4\u5E02\u8DEF\u7AF9\u5340\u5927\u793E\u8DEF",
      bloodType: "A",
      medicalHistory: "\u7121",
      diet: "\u8477\u98DF",
      customFields: {
        peaksCount: "28\u5EA7\u767E\u5CB3",
        gearWeight: "15.8 kg",
        tentAssignment: "\u5171\u5E33 C \u7D44"
      }
    }
  ],
  progressData: {
    m1: {
      memberId: "m1",
      tasks: {
        dateConfirmed: true,
        hikeExpSurvey: true,
        parkDataSubmitted: true,
        shuttleSurvey: true,
        routeBriefing: true,
        emergencyToFamily: true,
        buddyGroupAssigned: true,
        foodPlanList: true,
        safetyBriefing: true,
        paymentDone: "\u4E3B\u8FA6\u9818\u968A",
        weeklyWorkout: "\u6BCF\u9031\u6162\u8DD1 25km",
        insuranceSigned: true
      },
      paidAmount: 0,
      paidStatus: "\u5DF2\u7D50\u6E05",
      notes: "\u5168\u7A0B\u7E3D\u6307\u63EE\uFF0C\u914D\u5099\u885B\u661F\u96FB\u8A71\u8207\u6025\u6551\u5305"
    },
    m2: {
      memberId: "m2",
      tasks: {
        dateConfirmed: true,
        hikeExpSurvey: true,
        parkDataSubmitted: true,
        shuttleSurvey: true,
        routeBriefing: true,
        emergencyToFamily: true,
        buddyGroupAssigned: true,
        foodPlanList: true,
        safetyBriefing: true,
        paymentDone: "\u5DF2\u5168\u984D\u8F49\u5E33 5,000",
        weeklyWorkout: "\u6BCF\u9031\u8CA0\u91CD 10kg \u722C\u6A13\u68AF 3 \u6B21",
        insuranceSigned: true
      },
      paidAmount: 5e3,
      paidStatus: "\u5DF2\u7D50\u6E05",
      notes: "\u53F0\u96FB\u5927\u6A13\u4E0A\u8ECA\uFF0C\u78BA\u8A8D\u642D\u4E58\u5317\u8ECA"
    },
    m3: {
      memberId: "m3",
      tasks: {
        dateConfirmed: true,
        hikeExpSurvey: true,
        parkDataSubmitted: true,
        shuttleSurvey: true,
        routeBriefing: true,
        emergencyToFamily: true,
        buddyGroupAssigned: true,
        foodPlanList: true,
        safetyBriefing: true,
        paymentDone: "\u5DF2\u8F49\u5E33 5,000",
        weeklyWorkout: "\u6BCF\u9031\u91CD\u8A13\u5169\u6B21+\u6162\u8DD1",
        insuranceSigned: true
      },
      paidAmount: 5e3,
      paidStatus: "\u5DF2\u7D50\u6E05",
      notes: "\u7AF9\u5317 Homebox \u4E0A\u8ECA"
    },
    m4: {
      memberId: "m4",
      tasks: {
        dateConfirmed: true,
        hikeExpSurvey: true,
        parkDataSubmitted: true,
        shuttleSurvey: true,
        routeBriefing: true,
        emergencyToFamily: true,
        buddyGroupAssigned: true,
        foodPlanList: true,
        safetyBriefing: true,
        paymentDone: "\u5DF2\u8F49\u5E33 5,000 + \u5305\u9910 3,900",
        weeklyWorkout: "\u6BCF\u9031\u6DF1\u8E72\u8207\u6709\u6C27\u55AE\u8ECA",
        insuranceSigned: true
      },
      paidAmount: 8900,
      paidStatus: "\u5DF2\u7D50\u6E05",
      notes: "\u5BCC\u4EC1\u6A5F\u8ECA\u884C\u4E0A\u8ECA\uFF0C\u52A0\u8CFC\u5168\u5929\u5305\u9910"
    },
    m5: {
      memberId: "m5",
      tasks: {
        dateConfirmed: true,
        hikeExpSurvey: true,
        parkDataSubmitted: true,
        shuttleSurvey: true,
        routeBriefing: true,
        emergencyToFamily: true,
        buddyGroupAssigned: true,
        foodPlanList: true,
        safetyBriefing: true,
        paymentDone: "\u5DF2\u8F49\u5E33 5,500",
        weeklyWorkout: "\u6BCF\u9031\u745C\u73C8+\u6162\u8DD1 15km",
        insuranceSigned: true
      },
      paidAmount: 5500,
      paidStatus: "\u5DF2\u7D50\u6E05",
      notes: "\u6C11\u96C4\u4E0A\u8ECA\uFF0C\u5357\u8ECA\u51FA\u767C"
    },
    m6: {
      memberId: "m6",
      tasks: {
        dateConfirmed: true,
        hikeExpSurvey: true,
        parkDataSubmitted: true,
        shuttleSurvey: true,
        routeBriefing: true,
        emergencyToFamily: true,
        buddyGroupAssigned: true,
        foodPlanList: true,
        safetyBriefing: true,
        paymentDone: "\u5DF2\u8F49\u5E33 5,000",
        weeklyWorkout: "\u9031\u672B\u90CA\u5C71\u5065\u884C",
        insuranceSigned: true
      },
      paidAmount: 5e3,
      paidStatus: "\u5DF2\u7D50\u6E05",
      notes: "\u8C50\u539F\u4EA4\u6D41\u9053\u4E0A\u8ECA"
    },
    m7: {
      memberId: "m7",
      tasks: {
        dateConfirmed: true,
        hikeExpSurvey: true,
        parkDataSubmitted: true,
        shuttleSurvey: true,
        routeBriefing: true,
        emergencyToFamily: true,
        buddyGroupAssigned: true,
        foodPlanList: true,
        safetyBriefing: true,
        paymentDone: "\u5DF2\u8F49\u5E33 5,500",
        weeklyWorkout: "\u6BCF\u9031\u6E38\u6CF3\u8207\u55AE\u8ECA",
        insuranceSigned: true
      },
      paidAmount: 5500,
      paidStatus: "\u5DF2\u7D50\u6E05",
      notes: "\u8DEF\u7AF9\u6CB9\u6A5F\u4E0A\u8ECA"
    }
  },
  surveyData: {
    s1: {
      memberId: "s1",
      name: "\u6E05\u8CAB",
      timestamp: "2026/9/1 \u4E0A\u5348 11:00:44",
      mutualCareAgreement: "\u662F",
      longHikeExp: "\u99AC\u535A",
      routeKnowledgeConfirmed: "\u4E2D\u77E5\u9053",
      offlineMapSkill: "\u662F",
      rainHikingAcceptable: "\u662F",
      paceAgreement: "\u662F",
      heavyPackStamina: "\u662F",
      medicalAndAltitudeHistory: "\u7121",
      spareDayAgreement: "\u53EF\u4EE5",
      weeklyExerciseReport: "\u662F",
      firstAidCert: "\u7121",
      peaksCount: 70
    },
    s2: {
      memberId: "s2",
      name: "\u5289\u6C9B\u59A4",
      timestamp: "2026/9/1 \u4E0A\u5348 11:02:04",
      mutualCareAgreement: "\u662F",
      longHikeExp: "\u662F\uFF08\u5357\u4E09\u6BB5\u81EA\u7406\uFF09",
      routeKnowledgeConfirmed: "\u662F",
      offlineMapSkill: "\u662F",
      rainHikingAcceptable: "\u662F",
      paceAgreement: "\u662F",
      heavyPackStamina: "\u662F",
      medicalAndAltitudeHistory: "\u7121",
      spareDayAgreement: "\u662F",
      weeklyExerciseReport: "\u662F",
      firstAidCert: "\u5426",
      peaksCount: 66
    },
    s3: {
      memberId: "s3",
      name: "\u963F\u8C6A",
      timestamp: "2026/9/1 \u4E0A\u5348 11:03:08",
      mutualCareAgreement: "\u662F",
      longHikeExp: "\u5947\u840A\u6771\u7A1C\u5168\u81EA\u7406",
      routeKnowledgeConfirmed: "\u78BA\u8A8D\u77E5\u9053",
      offlineMapSkill: "\u662F",
      rainHikingAcceptable: "\u53EF\u63A5\u53D7",
      paceAgreement: "\u53EF\u914D\u5408",
      heavyPackStamina: "\u5DF2\u5177\u5099",
      medicalAndAltitudeHistory: "\u7121",
      spareDayAgreement: "\u53EF\u914D\u5408",
      weeklyExerciseReport: "\u662F",
      firstAidCert: "\u7121",
      peaksCount: 86
    },
    s4: {
      memberId: "s4",
      name: "\u754C\u932B",
      timestamp: "2026/9/1 \u4E0A\u5348 11:03:59",
      mutualCareAgreement: "\u53EF\u4EE5\u6709",
      longHikeExp: "\u6709\uFF0C\u5357\u4E00\u6BB5",
      routeKnowledgeConfirmed: "\u77E5\u9053",
      offlineMapSkill: "\u53EF\u4EE5",
      rainHikingAcceptable: "\u53EF\u4EE5",
      paceAgreement: "\u53EF\u4EE5",
      heavyPackStamina: "\u53EF\u4EE5",
      medicalAndAltitudeHistory: "\u7121",
      spareDayAgreement: "\u53EF\u4EE5",
      weeklyExerciseReport: "\u53EF\u4EE5",
      firstAidCert: "\u6709",
      peaksCount: 28
    },
    s5: {
      memberId: "s5",
      name: "Shawn",
      timestamp: "2026/9/1 \u4E0A\u5348 11:38:05",
      mutualCareAgreement: "\u53EF\u4EE5",
      longHikeExp: "\u662F\uFF0C\u81EA\u7406",
      routeKnowledgeConfirmed: "\u662F",
      offlineMapSkill: "\u662F",
      rainHikingAcceptable: "\u662F",
      paceAgreement: "\u662F",
      heavyPackStamina: "\u662F",
      medicalAndAltitudeHistory: "\u5426",
      spareDayAgreement: "\u662F",
      weeklyExerciseReport: "\u662F",
      firstAidCert: "BLS",
      peaksCount: 50
    },
    s6: {
      memberId: "s6",
      name: "\u6C88\u5B97\u6E90",
      timestamp: "2026/9/1 \u4E0A\u5348 11:40:35",
      mutualCareAgreement: "\u662F",
      longHikeExp: "\u662F\uFF0C\u5357\u4E8C\u6BB5\uFF0C\u81EA\u7406",
      routeKnowledgeConfirmed: "\u662F",
      offlineMapSkill: "\u662F",
      rainHikingAcceptable: "\u662F",
      paceAgreement: "\u662F",
      heavyPackStamina: "\u662F",
      medicalAndAltitudeHistory: "\u7121",
      spareDayAgreement: "\u662F",
      weeklyExerciseReport: "\u662F",
      firstAidCert: "\u7121",
      peaksCount: 56
    },
    s7: {
      memberId: "s7",
      name: "\u963F\u5E06",
      timestamp: "2026/9/1 \u4E0A\u5348 11:52:35",
      mutualCareAgreement: "\u53EF\u4EE5",
      longHikeExp: "\u6709(\u5927\u5C0F\u9738\u3001\u5927\u5C0F\u528D\u81EA\u7406\uFF09",
      routeKnowledgeConfirmed: "\u77E5\u9053",
      offlineMapSkill: "\u53EF\u4EE5",
      rainHikingAcceptable: "\u63A5\u53D7",
      paceAgreement: "\u53EF\u4EE5",
      heavyPackStamina: "\u6709",
      medicalAndAltitudeHistory: "\u7121",
      spareDayAgreement: "\u53EF\u4EE5",
      weeklyExerciseReport: "\u53EF\u4EE5",
      firstAidCert: "\u7121",
      peaksCount: 48
    },
    s8: {
      memberId: "s8",
      name: "\u859B\u5104\u5B87",
      timestamp: "2026/9/1 \u4E0B\u5348 12:01:02",
      mutualCareAgreement: "\u53EF\u4EE5",
      longHikeExp: "\u5357\u4E09\u6BB5\u5168\u7A0B\u81EA\u7406",
      routeKnowledgeConfirmed: "\u77E5\u9053",
      offlineMapSkill: "\u6703",
      rainHikingAcceptable: "\u53EF\u4EE5",
      paceAgreement: "\u53EF\u4EE5",
      heavyPackStamina: "\u53EF\u4EE5",
      medicalAndAltitudeHistory: "\u7121",
      spareDayAgreement: "\u53EF\u4EE5",
      weeklyExerciseReport: "\u53EF\u4EE5",
      firstAidCert: "\u7121",
      peaksCount: 53
    },
    s9: {
      memberId: "s9",
      name: "\u6CCA",
      timestamp: "2026/9/1 \u4E0B\u5348 12:12:14",
      mutualCareAgreement: "\u662F",
      longHikeExp: "\u99AC\u535A\u81EA\u7406",
      routeKnowledgeConfirmed: "\u662F",
      offlineMapSkill: "\u662F",
      rainHikingAcceptable: "\u662F",
      paceAgreement: "\u662F",
      heavyPackStamina: "\u662F",
      medicalAndAltitudeHistory: "\u6709\u9AD8\u53CD\u7121\u904E\u654F",
      spareDayAgreement: "\u662F",
      weeklyExerciseReport: "\u662F",
      firstAidCert: "\u7121",
      peaksCount: 62
    },
    s10: {
      memberId: "s10",
      name: "\u6797\u975C\u5B9C",
      timestamp: "2026/9/1 \u4E0B\u5348 12:12:21",
      mutualCareAgreement: "\u662F",
      longHikeExp: "\u6700\u591A\u53EA\u6709\u5230\u4E09\u5929(\u8056\u9675\u7DDAO\u53CA\u5317\u4E8C\u6BB5\u7518\u85AF\u7121\u540D),\u81EA\u7406",
      routeKnowledgeConfirmed: "\u662F",
      offlineMapSkill: "\u662F",
      rainHikingAcceptable: "\u662F",
      paceAgreement: "\u662F",
      heavyPackStamina: "\u662F",
      medicalAndAltitudeHistory: "\u662F",
      spareDayAgreement: "\u662F",
      weeklyExerciseReport: "\u662F",
      firstAidCert: "\u662F",
      peaksCount: 39
    },
    s11: {
      memberId: "s11",
      name: "\u5433\u528D\u6B66",
      timestamp: "2026/9/1 \u4E0B\u5348 12:30:00",
      mutualCareAgreement: "\u53EF",
      longHikeExp: "\u6709",
      routeKnowledgeConfirmed: "\u77E5\u9053",
      offlineMapSkill: "\u53EF",
      rainHikingAcceptable: "\u53EF",
      paceAgreement: "\u53EF",
      heavyPackStamina: "\u53EF",
      medicalAndAltitudeHistory: "\u7121",
      spareDayAgreement: "\u53EF",
      weeklyExerciseReport: "\u53EF",
      firstAidCert: "\u7121",
      peaksCount: 78
    },
    s12: {
      memberId: "s12",
      name: "Q\u4ED4",
      timestamp: "2026/9/1 \u4E0B\u5348 12:45:58",
      mutualCareAgreement: "\u662F",
      longHikeExp: "\u662F\uFF0C\u5357\u4E09\u6BB5",
      routeKnowledgeConfirmed: "\u662F",
      offlineMapSkill: "\u662F",
      rainHikingAcceptable: "\u662F",
      paceAgreement: "\u662F",
      heavyPackStamina: "\u8AAA",
      medicalAndAltitudeHistory: "\u90FD\u6709\uFF0C\u6703\u81EA\u5099\u91AB\u85E5\u5305",
      spareDayAgreement: "\u662F",
      weeklyExerciseReport: "\u662F",
      firstAidCert: "WAFA",
      peaksCount: 60
    }
  },
  safetyAndRetreatPlan: {
    title: "\u81EA\u4E3B\u5B89\u5168\u7BA1\u7406\u8207\u61C9\u8B8A\u64A4\u9000\u8A08\u756B",
    criteria: [
      "\u5929\u5019\u72C0\u6CC1\u60E1\u52A3\u4E0D\u5982\u9810\u671F\uFF08\u8C6A\u5927\u96E8\u7279\u5831\u3001\u98B1\u98A8\u8B66\u6212\u6216\u9053\u8DEF\u574D\u65B9\u7BA1\u5236\uFF09\u3002",
      "\u5404\u6642\u9593\u7BC0\u9EDE\u8D85\u51FA\u8868\u5B9A\u6642\u9593 1 \u5C0F\u6642\u4EE5\u4E0A\uFF0C\u7D93\u5B89\u5168\u907F\u96E3\u5F8C\u555F\u52D5\u64A4\u9000\u6A5F\u5236\u3002",
      "\u968A\u54E1\u51FA\u73FE\u6025\u6027\u9AD8\u5C71\u75C7\uFF08AMS/HAPE/HACE\uFF09\u3001\u5931\u6EAB\u3001\u56B4\u91CD\u5916\u50B7\u6216\u9AD4\u529B\u8870\u7AED\u8005\u3002",
      "\u6C34\u6E90\u67AF\u7AED\u6216\u7CE7\u98DF\u56B4\u91CD\u77ED\u7F3A\uFF0C\u7121\u6CD5\u652F\u6490\u5F8C\u7E8C\u884C\u7A0B\u3002",
      "\u51E1\u65BC\u884C\u9032\u9014\u4E2D\uFF0C\u9818\u968A\u57FA\u65BC\u5B89\u5168\u7406\u7531\u6C7A\u5B9A\u64A4\u9000\u6642\uFF0C\u5168\u9AD4\u968A\u54E1\u61C9\u56B4\u683C\u9075\u5F9E\uFF0C\u4E0D\u5F97\u7570\u8B70\u3002"
    ],
    procedures: [
      "\u555F\u52D5\u64A4\u9000\u6A5F\u5236\u6642\uFF0C\u5168\u968A\u4EE5\u300C\u5B89\u5168\u907F\u96E3\u3001\u56DE\u6EAF\u539F\u8DEF\u3001\u8FC5\u901F\u4E0B\u64A4\u81F3\u6700\u8FD1\u767B\u5C71\u53E3\u300D\u70BA\u539F\u5247\uFF0C\u4E0D\u9017\u7559\u3001\u4E0D\u53CD\u6094\u3002",
      "\u9047\u968A\u54E1\u57F7\u610F\u524D\u5F80\u6216\u9055\u53CD\u9818\u968A\u6C7A\u7B56\u8005\uFF0C\u9818\u968A\u5C07\u516C\u958B\u9304\u5F71\u5B58\u6A94\uFF0C\u5F8C\u7E8C\u5B89\u5168\u81EA\u8CA0\uFF0C\u4E26\u8981\u6C42\u5176\u5168\u7A0B\u958B\u6A5F\u901A\u806F\u3002",
      "\u4F3A\u6A5F\u901A\u77E5\u7559\u5B88\u4EBA\u8207\u5404\u5718\u54E1\u7DCA\u6025\u806F\u7D61\u4EBA\uFF0C\u56DE\u5831\u73FE\u6CC1\u8207\u9810\u8A08\u64A4\u9000\u8DEF\u7DDA\u3002",
      "\u82E5\u6709\u8FF7\u822A\u7591\u616E\u6216\u843D\u55AE\uFF0C\u7ACB\u5373\u5C31\u5730\u907F\u96E3\uFF0C\u5207\u63DB\u624B\u6A5F\u81F3\u53EF\u901A\u8A0A\u72C0\u614B\uFF0C\u4E26\u4EE5\u7C21\u8A0A/LINE \u767C\u9001 GPS \u7D93\u7DEF\u5EA6\u5EA7\u6A19\u3002"
    ],
    individualVsGroup: [
      "\u3010\u96C6\u9AD4\u64A4\u9000\u3011\uFF1A\u7576\u906D\u9047\u5929\u5019\u9A5F\u8B8A\u3001\u8DEF\u5F91\u4E2D\u65B7\u6216\u6574\u9AD4\u968A\u6CC1\u4E0D\u4F73\u6642\uFF0C\u9818\u968A\u5BA3\u5E03\u5168\u968A\u7D71\u4E00\u4F9D\u539F\u8DEF\u64A4\u9000\u3002",
      "\u3010\u500B\u4EBA\u64A4\u9000\u3011\uFF1A\u500B\u5225\u968A\u54E1\u8EAB\u9AD4\u4E0D\u9069\u7121\u6CD5\u7E8C\u884C\u6642\uFF0C\u7531\u9818\u968A\u6307\u6D3E\u4E92\u52A9\u7D44\uFF08\u81F3\u5C11\u4E00\u4EBA\u4EE5\u4E0A\u966A\u540C\uFF09\u5171\u540C\u64A4\u9000\uFF0C\u56B4\u7981\u55AE\u7368\u843D\u55AE\u4E0B\u5C71\u3002"
    ],
    waterAndFoodSOP: [
      "\u6C34\u6E90\u77ED\u7F3A\u6642\uFF0C\u7531\u9818\u968A\u7D71\u4E00\u96C6\u4E2D\u7BA1\u5236\u73FE\u5B58\u98F2\u7528\u6C34\u8207\u884C\u52D5\u6C34\u6E90\uFF0C\u56B4\u683C\u4F9D\u9AD4\u80FD\u9700\u6C42\u6309\u6642\u914D\u767C\u3002",
      "\u98DF\u7269\u77ED\u7F3A\u6642\uFF0C\u555F\u52D5\u9810\u5099\u7CE7\u4E00\u65E5\u8A08\u756B\uFF0C\u6E1B\u5C11\u6BCF\u9910\u6D88\u8017\u91CF\uFF0C\u5C0B\u6C42\u5C71\u5C4B\u5099\u7CE7\u4E26\u76E1\u901F\u4E0B\u64A4\u3002"
    ]
  },
  weatherCheckLinks: [
    { name: "\u4E2D\u592E\u6C23\u8C61\u7F72 \u767B\u5C71\u6C23\u8C61\u5C08\u5340 (\u4E2D\u592E\u5C16\u5C71)", url: "https://www.cwa.gov.tw/V8/C/L/Mountain/Mountain.html?PID=D082", description: "\u89C0\u5BDF\u6EAB\u5EA6\u3001\u98A8\u901F\u3001\u9AD4\u611F\u8207\u964D\u96E8\u6A5F\u7387" },
    { name: "NCDR \u570B\u5BB6\u707D\u5BB3\u9632\u6551\u79D1\u6280\u4E2D\u5FC3 (\u98B1\u98A8/\u8C6A\u96E8)", url: "https://watch.ncdr.nat.gov.tw/watch_typhoon", description: "\u78BA\u8A8D\u98B1\u98A8\u52D5\u614B\u8207\u9053\u8DEF\u963B\u65B7\u793A\u8B66" },
    { name: "\u4E2D\u592E\u6C23\u8C61\u7F72 \u8C6A\u5927\u96E8\u7279\u5831", url: "https://www.cwa.gov.tw/V8/C/P/Warning/W26.html", description: "\u964D\u96E8\u8B66\u6212\u8207\u5F37\u98A8\u7279\u5831" },
    { name: "Windy \u5C08\u696D\u6C23\u8C61\u6578\u503C\u9810\u5831 (ECMWF)", url: "https://www.windy.com", description: "\u96F2\u5C64\u3001\u964D\u96E8\u7D2F\u7A4D\u3001\u7D50\u51B0\u9AD8\u5EA6\u8207 600hPa \u9AD8\u7A7A\u6C23\u6D41" },
    { name: "\u4E2D\u592E\u6C23\u8C61\u7F72 \u5B9A\u91CF\u964D\u6C34\u9810\u5831 (QPF)", url: "https://www.cwa.gov.tw/V8/C/P/QPF.html", description: "\u672A\u4F86 12/24 \u5C0F\u6642\u7D2F\u7A4D\u964D\u96E8\u8DA8\u52E2" }
  ]
};

// serverTrips.ts
var DATA_DIR = path.join(process.cwd(), "data");
var TRIPS_DIR = path.join(DATA_DIR, "trips");
var DEFAULT_PLAN_FILE = path.join(DATA_DIR, "expedition_plan.json");
function cleanPhone(phone) {
  if (!phone) return "";
  return phone.replace(/[^\d]/g, "");
}
function normalizeName(name) {
  if (!name) return "";
  return name.replace(/[\s\u3000]+/g, " ").trim();
}
function compareNames(a, b) {
  if (!a || !b) return false;
  const cleanA = a.replace(/[\s\u3000]+/g, "").toLowerCase();
  const cleanB = b.replace(/[\s\u3000]+/g, "").toLowerCase();
  return cleanA.length > 0 && cleanA === cleanB;
}
function maskEmail(email) {
  if (!email || !email.includes("@")) return "";
  const parts = email.split("@");
  const user = parts[0];
  const domain = parts.slice(1).join("@");
  if (user.length <= 2) {
    return `${user[0] || "*"}***@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}
function maskPhone(phone) {
  if (!phone) return "";
  const digits = cleanPhone(phone);
  if (digits.length < 7) return phone;
  const prefix = digits.slice(0, 4);
  const suffix = digits.slice(-3);
  return `${prefix}-***${suffix}`;
}
function memberMatches(member, identifier) {
  if (!member || !identifier) return false;
  const idEmail = identifier.email ? identifier.email.trim().toLowerCase() : "";
  const idPhone = identifier.phone ? cleanPhone(identifier.phone) : "";
  const idName = identifier.name ? identifier.name.trim() : "";
  const idMemberId = identifier.memberId ? identifier.memberId.trim() : "";
  if (idMemberId && member.id && member.id.trim() === idMemberId) {
    return true;
  }
  if (idEmail && member.email && member.email.trim().toLowerCase() === idEmail) {
    return true;
  }
  if (idPhone && member.phone && cleanPhone(member.phone) === idPhone) {
    return true;
  }
  if (idName && member.name && compareNames(member.name, idName)) {
    return true;
  }
  return false;
}
function lookupMemberTrips(rawName, disambiguateKey) {
  const normName = normalizeName(rawName);
  if (!normName) {
    return {
      found: false,
      error: "\u8ACB\u8F38\u5165\u59D3\u540D\u4EE5\u67E5\u8A62\u60A8\u7684\u6240\u5C6C\u5718\u52D9",
      allowedTripIds: [],
      trips: []
    };
  }
  const allTrips = getAllTrips();
  const records = [];
  for (const trip of allTrips) {
    if (!trip.members || !Array.isArray(trip.members)) continue;
    for (const member of trip.members) {
      if (compareNames(member.name, normName)) {
        records.push({ trip, member });
      }
    }
  }
  if (records.length === 0) {
    return {
      found: false,
      error: `\u627E\u4E0D\u5230\u3010${normName}\u3011\u7684\u5718\u52D9\u8CC7\u6599\uFF0C\u8ACB\u78BA\u8A8D\u59D3\u540D\u662F\u5426\u6B63\u78BA\u3002`,
      allowedTripIds: [],
      trips: []
    };
  }
  const candidateGroups = [];
  for (const rec of records) {
    const pPhone = cleanPhone(rec.member.phone);
    const pEmail = (rec.member.email || "").trim().toLowerCase();
    let matchedGroup = candidateGroups.find((g) => {
      const gPhone = cleanPhone(g.phone);
      const gEmail = (g.email || "").trim().toLowerCase();
      if (pPhone && gPhone && pPhone === gPhone) return true;
      if (pEmail && gEmail && pEmail === gEmail) return true;
      if (!pPhone && !gPhone && !pEmail && !gEmail) return true;
      return false;
    });
    if (!matchedGroup) {
      const hasConflict = candidateGroups.some((g) => {
        const gPhone = cleanPhone(g.phone);
        const gEmail = (g.email || "").trim().toLowerCase();
        if (pPhone && gPhone && pPhone !== gPhone) return true;
        if (pEmail && gEmail && pEmail !== gEmail) return true;
        return false;
      });
      if (hasConflict || candidateGroups.length === 0) {
        matchedGroup = {
          key: rec.member.id || pPhone || pEmail || `cand_${candidateGroups.length + 1}`,
          name: rec.member.name,
          email: rec.member.email,
          phone: rec.member.phone,
          idNumber: rec.member.idNumber,
          trips: [],
          members: []
        };
        candidateGroups.push(matchedGroup);
      } else {
        matchedGroup = candidateGroups[0];
      }
    }
    if (!matchedGroup.trips.some((t) => t.tripId === rec.trip.tripId)) {
      matchedGroup.trips.push(rec.trip);
    }
    matchedGroup.members.push(rec.member);
  }
  if (candidateGroups.length > 1) {
    if (disambiguateKey) {
      const chosen = candidateGroups.find((c) => c.key === disambiguateKey);
      if (chosen) {
        const allowedTripIds2 = chosen.trips.map((t) => t.tripId || t.id);
        return {
          found: true,
          ambiguous: false,
          name: chosen.name,
          allowedTripIds: allowedTripIds2,
          trips: chosen.trips.map(toTripSummary),
          member: {
            name: chosen.name,
            email: chosen.email,
            phone: chosen.phone,
            memberId: chosen.key
          }
        };
      }
    }
    return {
      found: true,
      ambiguous: true,
      name: records[0].member.name,
      allowedTripIds: [],
      trips: [],
      candidates: candidateGroups.map((c) => ({
        identifier: c.key,
        name: c.name,
        maskedEmail: maskEmail(c.email),
        maskedPhone: maskPhone(c.phone),
        allowedTripIds: c.trips.map((t) => t.tripId || t.id),
        trips: c.trips.map(toTripSummary)
      }))
    };
  }
  const targetGroup = candidateGroups[0];
  const allowedTripIds = targetGroup.trips.map((t) => t.tripId || t.id);
  return {
    found: true,
    ambiguous: false,
    name: targetGroup.name,
    allowedTripIds,
    trips: targetGroup.trips.map(toTripSummary),
    member: {
      name: targetGroup.name,
      email: targetGroup.email,
      phone: targetGroup.phone,
      memberId: targetGroup.key
    }
  };
}
function ensureTripsDir() {
  if (!fs.existsSync(TRIPS_DIR)) {
    fs.mkdirSync(TRIPS_DIR, { recursive: true });
  }
}
function toTripSummary(plan) {
  const tripId = plan.tripId || plan.id || "TRIP-UNKNOWN";
  return {
    tripId,
    id: tripId,
    title: plan.title || "\u672A\u547D\u540D\u767B\u5C71\u5718\u52D9",
    subtitle: plan.subtitle || "",
    dates: plan.dates || "",
    mountain: plan.mountain || "",
    route: plan.route || plan.trailhead || "",
    status: plan.status || "active",
    memberCount: plan.members ? plan.members.length : 0,
    leaderName: plan.leader ? plan.leader.name : "",
    createdAt: plan.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: plan.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
  };
}
function getTrip(tripId) {
  ensureTripsDir();
  const filePath = path.join(TRIPS_DIR, `${tripId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const plan = JSON.parse(content);
      plan.tripId = plan.tripId || tripId;
      return plan;
    } catch (e) {
      console.error(`Error reading trip ${tripId}:`, e);
    }
  }
  return null;
}
function getAllTrips() {
  ensureTripsDir();
  const files = fs.readdirSync(TRIPS_DIR).filter((f) => f.endsWith(".json"));
  const trips = [];
  for (const file of files) {
    try {
      const filePath = path.join(TRIPS_DIR, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const plan = JSON.parse(content);
      plan.tripId = plan.tripId || file.replace(/\.json$/, "");
      trips.push(plan);
    } catch (e) {
      console.error(`Error parsing trip file ${file}:`, e);
    }
  }
  trips.sort((a, b) => (a.tripId || "").localeCompare(b.tripId || ""));
  return trips;
}
function saveTrip(plan) {
  ensureTripsDir();
  const tripId = plan.tripId || plan.id || "TRIP-001";
  plan.tripId = tripId;
  plan.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  if (!plan.createdAt) {
    plan.createdAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  const filePath = path.join(TRIPS_DIR, `${tripId}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(plan, null, 2), "utf-8");
    fs.writeFileSync(DEFAULT_PLAN_FILE, JSON.stringify(plan, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error(`Error saving trip ${tripId}:`, e);
    return false;
  }
}
function deleteTrip(tripId) {
  ensureTripsDir();
  const filePath = path.join(TRIPS_DIR, `${tripId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (e) {
      console.error(`Error deleting trip ${tripId}:`, e);
      return false;
    }
  }
  return false;
}
function initializeAndMigrateTrips() {
  ensureTripsDir();
  const existingFiles = fs.readdirSync(TRIPS_DIR).filter((f) => f.endsWith(".json"));
  if (existingFiles.length > 0) {
    console.log(`Multi-trip storage active with ${existingFiles.length} trips.`);
    return;
  }
  console.log("Initializing multi-trip storage and running first-time data migration...");
  let migratedPlan = null;
  if (fs.existsSync(DEFAULT_PLAN_FILE)) {
    try {
      const data = fs.readFileSync(DEFAULT_PLAN_FILE, "utf-8");
      migratedPlan = JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse existing expedition_plan.json:", e);
    }
  }
  const memberWang = {
    id: "M-WANG-001",
    role: "\u9818\u968A",
    name: "\u738B\u5C0F\u660E",
    nickname: "\u5C0F\u660E",
    gender: "\u7537",
    idNumber: "A123456789",
    birthDate: "1988/06/15",
    phone: "0910-111222",
    email: "wang@example.com",
    emergencyContact: "\u738B\u5927\u5C71 (\u7236\u89AA)",
    emergencyPhone: "0911-222333",
    diet: "\u8477\u98DF",
    medicalHistory: "\u7121"
  };
  const memberLin = {
    id: "M-LIN-002",
    role: "\u968A\u54E1",
    name: "\u6797\u5C0F\u83EF",
    nickname: "\u5C0F\u83EF",
    gender: "\u5973",
    idNumber: "B223456789",
    birthDate: "1992/08/20",
    phone: "0920-222333",
    email: "lin@example.com",
    emergencyContact: "\u6797\u5ABD\u5ABD",
    emergencyPhone: "0922-333444",
    diet: "\u86CB\u5976\u7D20",
    medicalHistory: "\u8F15\u5FAE\u82B1\u7C89\u904E\u654F"
  };
  const memberChen = {
    id: "M-CHEN-003",
    role: "\u968A\u54E1",
    name: "\u9673\u5927\u5C71",
    nickname: "\u5927\u5C71",
    gender: "\u7537",
    idNumber: "C123456789",
    birthDate: "1985/03/10",
    phone: "0930-333444",
    email: "chen@example.com",
    emergencyContact: "\u9673\u592A\u592A (\u914D\u5076)",
    emergencyPhone: "0933-444555",
    diet: "\u8477\u98DF (\u5FCC\u725B\u8089)",
    medicalHistory: "\u7121"
  };
  const memberChang = {
    id: "M-CHANG-004",
    role: "\u968A\u54E1",
    name: "\u5F35\u5C0F\u7F8E",
    nickname: "\u5C0F\u7F8E",
    gender: "\u5973",
    idNumber: "D223456789",
    birthDate: "1995/11/05",
    phone: "0950-555666",
    email: "chang@example.com",
    emergencyContact: "\u5F35\u7238\u7238",
    emergencyPhone: "0955-666777",
    diet: "\u8477\u98DF",
    medicalHistory: "\u7121"
  };
  const trip1 = {
    ...initialExpeditionData,
    id: "TRIP-001",
    tripId: "TRIP-001",
    title: "\u99AC\u535A\u62C9\u65AF\u6A6B\u65B7 \u516B\u65E5\u6975\u9650\u7E31\u8D70",
    subtitle: "2026/09/15(\u4E8C)-09/22(\u4E8C) \u516B\u5929\u4E03\u591C\uFF0C09/14 D0",
    dates: "2026/09/15(\u4E8C)-09/22(\u4E8C) \u516B\u5929\u4E03\u591C",
    d0Date: "09/14(\u4E00)",
    mountain: "\u99AC\u535A\u62C9\u65AF\u5C71\u3001\u79C0\u59D1\u5DD2\u5C71\u3001\u76C6\u99D2\u5C71\u3001\u99AC\u5229\u52A0\u5357\u5C71\u3001\u99AC\u5E03\u8C37",
    route: "\u6771\u57D4\u9032\u3001\u4E2D\u5E73\u6797\u9053\u51FA (\u99AC\u535A\u6A6B\u65B7\u5168\u6BB5)",
    trailhead: "\u5357\u6295\u6771\u57D4\u767B\u5C71\u53E3\u9032\uFF0C\u82B1\u84EE\u7389\u91CC\u7389\u91CC\u6797\u9053\u51FA",
    status: "active",
    leader: {
      name: "\u738B\u5C0F\u660E",
      phone: "0910-111222",
      emergencyContact: "\u738B\u5927\u5C71",
      emergencyPhone: "0911-222333"
    },
    members: [
      memberWang,
      memberLin,
      {
        id: "M-005",
        role: "\u56AE\u5C0E",
        name: "\u5289\u6C9B\u59A4",
        gender: "\u5973",
        idNumber: "F223344556",
        birthDate: "1990/04/12",
        phone: "0912-345678",
        email: "liu@example.com",
        emergencyContact: "\u5289\u5FD7\u660E",
        emergencyPhone: "0933-112233"
      },
      {
        id: "M-006",
        role: "\u968A\u54E1",
        name: "\u963F\u8C6A",
        gender: "\u7537",
        idNumber: "E123344556",
        birthDate: "1987/12/03",
        phone: "0922-888999",
        email: "hao@example.com",
        emergencyContact: "\u9673\u7F8E\u9CF3",
        emergencyPhone: "0988-665544"
      }
    ]
  };
  let trip2;
  if (migratedPlan) {
    trip2 = {
      ...migratedPlan,
      id: "TRIP-002",
      tripId: "TRIP-002",
      title: migratedPlan.title || "\u4E2D\u592E\u5C16\u5C71 \u56DB\u65E5\u7E31\u8D70\u5718\u52D9\u7E3D\u8868",
      status: "active",
      route: migratedPlan.trailhead || "\u52DD\u5149\u767B\u5C71\u53E3\u4F86\u56DE"
    };
    const existingNames = new Set(trip2.members.map((m) => m.name.trim()));
    if (!existingNames.has("\u738B\u5C0F\u660E")) {
      trip2.members.unshift(memberWang);
    }
    if (!existingNames.has("\u9673\u5927\u5C71")) {
      trip2.members.push(memberChen);
    }
  } else {
    trip2 = {
      ...initialExpeditionData,
      id: "TRIP-002",
      tripId: "TRIP-002",
      title: "\u4E2D\u592E\u5C16\u5C71 \u56DB\u65E5\u7E31\u8D70\u5718\u52D9\u7E3D\u8868",
      subtitle: "2026/10/08(\u56DB)-10/11(\u65E5) \u56DB\u5929\u4E09\u591C\uFF0C10/07 D0",
      dates: "2026/10/08(\u56DB)-10/11(\u65E5) \u56DB\u5929\u4E09\u591C",
      d0Date: "10/07(\u4E09)",
      mountain: "\u4E2D\u592E\u5C16\u5C71 (\u6D77\u62D4 3,705\u516C\u5C3A\uFF0C\u53F0\u7063\u4E09\u5C16\u4E4B\u9996)",
      route: "\u52DD\u5149\u767B\u5C71\u53E3 - \u5357\u6E56\u6EAA - \u4E2D\u592E\u5C16\u6EAA\u6728\u5C4B - \u4E2D\u592E\u5C16\u5C71\u9802",
      trailhead: "\u52DD\u5149\u767B\u5C71\u53E3 (\u53F07\u7532\u7DDA 49.5K)",
      status: "active",
      leader: {
        name: "\u738B\u5C0F\u660E",
        phone: "0910-111222",
        emergencyContact: "\u738B\u5927\u5C71",
        emergencyPhone: "0911-222333"
      },
      members: [
        memberWang,
        memberChen,
        ...initialExpeditionData.members.filter((m) => m.name !== "\u738B\u5C0F\u660E" && m.name !== "\u9673\u5927\u5C71")
      ]
    };
  }
  const trip3 = {
    ...initialExpeditionData,
    id: "TRIP-003",
    tripId: "TRIP-003",
    title: "\u5947\u840A\u6771\u7A1C \u516D\u65E5\u9EC3\u91D1\u5927\u8349\u539F\u7E31\u8D70",
    subtitle: "2026/11/05(\u56DB)-11/10(\u4E8C) \u516D\u5929\u4E94\u591C\uFF0C11/04 D0",
    dates: "2026/11/05(\u56DB)-11/10(\u4E8C) \u516D\u5929\u4E94\u591C",
    d0Date: "11/04(\u4E09)",
    mountain: "\u5947\u840A\u5317\u5CF0\u3001\u78D0\u77F3\u5C71\u3001\u592A\u9B6F\u95A3\u5927\u5C71\u3001\u7ACB\u9727\u4E3B\u5C71\u3001\u5E15\u6258\u9B6F\u5C71",
    route: "\u5947\u840A\u767B\u5C71\u53E3\u9032\u3001\u5CB3\u738B\u4EAD\u51FA (\u767E\u5CB3\u56DB\u5927\u969C\u7919\u4E4B\u4E00)",
    trailhead: "\u5408\u6B61\u5C71\u677E\u96EA\u6A13\u9032\uFF0C\u4E2D\u6A6B\u516C\u8DEF\u5CB3\u738B\u4EAD\u540A\u6A4B\u51FA",
    status: "active",
    leader: {
      name: "\u738B\u5C0F\u660E",
      phone: "0910-111222",
      emergencyContact: "\u738B\u5927\u5C71",
      emergencyPhone: "0911-222333"
    },
    members: [
      memberWang,
      memberChang,
      {
        id: "M-007",
        role: "\u56AE\u5C0E",
        name: "\u6E05\u8CAB",
        gender: "\u7537",
        idNumber: "G123344556",
        birthDate: "1984/07/21",
        phone: "0919-445566",
        email: "qing@example.com",
        emergencyContact: "\u674E\u96C5\u96EF",
        emergencyPhone: "0920-112233"
      },
      {
        id: "M-008",
        role: "\u968A\u54E1",
        name: "\u963F\u5E06",
        gender: "\u7537",
        idNumber: "H123344556",
        birthDate: "1989/09/14",
        phone: "0988-334455",
        email: "fan@example.com",
        emergencyContact: "\u6797\u5EFA\u5B8F",
        emergencyPhone: "0932-556677"
      }
    ]
  };
  saveTrip(trip1);
  saveTrip(trip2);
  saveTrip(trip3);
  console.log("Successfully seeded 3 isolated trips: TRIP-001 (\u99AC\u535A), TRIP-002 (\u4E2D\u592E\u5C16), TRIP-003 (\u5947\u840A\u6771\u7A1C)");
}

// server.ts
var PORT = parseInt(process.env.PORT || "3000", 10);
initializeAndMigrateTrips();
function checkIsAdmin(req, searchParams) {
  const adminHeader = req.headers["x-admin-auth"];
  const adminQuery = searchParams.get("adminAuth");
  return adminHeader === "true" || adminQuery === "true";
}
function extractMemberIdentity(req, searchParams) {
  const email = req.headers["x-member-email"] || searchParams.get("email");
  const phone = req.headers["x-member-phone"] || searchParams.get("phone");
  const name = req.headers["x-member-name"] || searchParams.get("name");
  const memberId = req.headers["x-member-id"] || searchParams.get("memberId");
  if (!email && !phone && !name && !memberId) {
    return null;
  }
  return {
    email: email ? decodeURIComponent(email).trim() : void 0,
    phone: phone ? decodeURIComponent(phone).trim() : void 0,
    name: name ? decodeURIComponent(name).trim() : void 0,
    memberId: memberId ? decodeURIComponent(memberId).trim() : void 0
  };
}
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-auth, x-member-email, x-member-phone, x-member-name, x-member-id"
  });
  res.end(JSON.stringify(data));
}
async function getJsonBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}
async function startServer() {
  const isDev = process.env.NODE_ENV !== "production";
  let vite = null;
  if (isDev) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
  }
  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url || "/", `http://localhost:${PORT}`);
      let pathname = parsedUrl.pathname;
      if (pathname.startsWith("/tool01/")) {
        pathname = pathname.slice("/tool01".length);
      } else if (pathname === "/tool01") {
        pathname = "/";
      }
      const searchParams = parsedUrl.searchParams;
      const method = (req.method || "GET").toUpperCase();
      if (method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-auth, x-member-email, x-member-phone, x-member-name, x-member-id"
        });
        res.end();
        return;
      }
      if (pathname === "/api/health" && method === "GET") {
        return sendJson(res, 200, { status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
      }
      if (pathname === "/api/members/lookup") {
        const body = method === "POST" ? await getJsonBody(req) : {};
        const name = body?.name || searchParams.get("name");
        const disambiguateKey = body?.disambiguateKey || searchParams.get("disambiguateKey");
        if (!name || typeof name !== "string" || !name.trim()) {
          return sendJson(res, 400, {
            success: false,
            error: "\u8ACB\u8F38\u5165\u60A8\u7684\u59D3\u540D",
            allowedTripIds: [],
            trips: []
          });
        }
        const result = lookupMemberTrips(name, disambiguateKey);
        if (!result.found) {
          return sendJson(res, 404, {
            success: false,
            error: result.error || "\u627E\u4E0D\u5230\u60A8\u7684\u5718\u52D9\u8CC7\u6599\uFF0C\u8ACB\u78BA\u8A8D\u59D3\u540D\u662F\u5426\u6B63\u78BA",
            allowedTripIds: [],
            trips: []
          });
        }
        return sendJson(res, 200, {
          success: true,
          ...result
        });
      }
      if (pathname === "/api/trips") {
        if (method === "GET") {
          const isAdmin = checkIsAdmin(req, searchParams);
          const memberIden = extractMemberIdentity(req, searchParams);
          const allTrips = getAllTrips();
          if (isAdmin) {
            const summaries = allTrips.map(toTripSummary);
            return sendJson(res, 200, {
              success: true,
              role: "admin",
              trips: summaries,
              allowedTripIds: allTrips.map((t) => t.tripId || t.id)
            });
          }
          if (memberIden && (memberIden.name || memberIden.email || memberIden.phone)) {
            const result = lookupMemberTrips(memberIden.name || "", memberIden.memberId);
            if (result.found && !result.ambiguous) {
              return sendJson(res, 200, {
                success: true,
                role: "member",
                memberQuery: memberIden,
                trips: result.trips,
                allowedTripIds: result.allowedTripIds
              });
            }
            const matchingTrips = allTrips.filter((trip) => {
              if (!trip.members || !Array.isArray(trip.members)) return false;
              return trip.members.some((m) => memberMatches(m, memberIden));
            });
            const summaries = matchingTrips.map(toTripSummary);
            return sendJson(res, 200, {
              success: true,
              role: "member",
              memberQuery: memberIden,
              trips: summaries,
              allowedTripIds: matchingTrips.map((t) => t.tripId || t.id)
            });
          }
          return sendJson(res, 200, {
            success: true,
            role: "guest",
            trips: [],
            allowedTripIds: [],
            prompt: "\u8ACB\u8F38\u5165\u59D3\u540D\u4EE5\u67E5\u8A62\u60A8\u6240\u5C6C\u4E4B\u5718\u52D9"
          });
        }
        if (method === "POST") {
          if (!checkIsAdmin(req, searchParams)) {
            return sendJson(res, 403, { success: false, error: "\u6B0A\u9650\u4E0D\u8DB3\uFF1A\u50C5\u6709\u7BA1\u7406\u8005\u53EF\u5EFA\u7ACB\u5718\u52D9" });
          }
          const body = await getJsonBody(req);
          const { trip } = body || {};
          if (!trip || !trip.title) {
            return sendJson(res, 400, { success: false, error: "\u8ACB\u63D0\u4F9B\u6709\u6548\u7684\u5718\u52D9\u8CC7\u6599\u8207\u6D3B\u52D5\u540D\u7A31" });
          }
          let tripId = trip.tripId || trip.id;
          if (!tripId || tripId.startsWith("exp_")) {
            const all = getAllTrips();
            tripId = `TRIP-${String(all.length + 1).padStart(3, "0")}`;
          }
          trip.tripId = tripId;
          trip.id = tripId;
          const success = saveTrip(trip);
          if (success) {
            return sendJson(res, 200, {
              success: true,
              tripId,
              message: `\u5718\u52D9\u3010${trip.title}\u3011(${tripId}) \u5EFA\u7ACB\u6210\u529F\uFF01`,
              trip
            });
          } else {
            return sendJson(res, 500, { success: false, error: "\u5132\u5B58\u65B0\u5718\u52D9\u81F3\u786C\u789F\u5931\u6557" });
          }
        }
      }
      if (pathname === "/api/trips/reset" && method === "POST") {
        if (!checkIsAdmin(req, searchParams)) {
          return sendJson(res, 403, { success: false, error: "\u6B0A\u9650\u4E0D\u8DB3" });
        }
        try {
          const TRIPS_DIR2 = path2.join(process.cwd(), "data", "trips");
          if (fs2.existsSync(TRIPS_DIR2)) {
            const files = fs2.readdirSync(TRIPS_DIR2);
            for (const f of files) {
              fs2.unlinkSync(path2.join(TRIPS_DIR2, f));
            }
          }
          initializeAndMigrateTrips();
          return sendJson(res, 200, { success: true, message: "\u5718\u52D9\u7CFB\u7D71\u5DF2\u91CD\u8A2D\u70BA\u6A19\u6E96\u4E09\u5718\u6E2C\u8A66\u7BC4\u4F8B" });
        } catch (e) {
          console.error("Reset error:", e);
          return sendJson(res, 500, { success: false, error: "\u91CD\u8A2D\u5718\u52D9\u5931\u6557" });
        }
      }
      const tripMatch = pathname.match(/^\/api\/trips\/([^/]+)$/);
      if (tripMatch) {
        const tripId = decodeURIComponent(tripMatch[1]);
        if (method === "GET") {
          const trip = getTrip(tripId);
          if (!trip) {
            return sendJson(res, 404, { success: false, error: `\u627E\u4E0D\u5230\u5718\u52D9\u7DE8\u865F ${tripId}` });
          }
          const isAdmin = checkIsAdmin(req, searchParams);
          if (isAdmin) {
            return sendJson(res, 200, { success: true, role: "admin", trip });
          }
          const memberIden = extractMemberIdentity(req, searchParams);
          if (memberIden && trip.members && Array.isArray(trip.members)) {
            const isMember = trip.members.some((m) => memberMatches(m, memberIden));
            if (isMember) {
              return sendJson(res, 200, { success: true, role: "member", trip });
            }
            return sendJson(res, 403, {
              success: false,
              error: `\u5B58\u53D6\u53D7\u9650\uFF1A\u60A8\u4E26\u672A\u5728\u6B64\u5718\u52D9\u3010${trip.title}\u3011\u7684\u540D\u518A\u4E2D\uFF0C\u7121\u6CD5\u67E5\u770B\u6B64\u5718\u52D9\u3002`
            });
          }
          return sendJson(res, 403, {
            success: false,
            error: "\u8ACB\u5148\u8F38\u5165\u59D3\u540D\u4EE5\u67E5\u770B\u60A8\u7684\u6240\u5C6C\u5718\u52D9\u9032\u5EA6\u8868\u3002"
          });
        }
        if (method === "PUT") {
          if (!checkIsAdmin(req, searchParams)) {
            return sendJson(res, 403, { success: false, error: "\u6B0A\u9650\u4E0D\u8DB3\uFF1A\u50C5\u6709\u7BA1\u7406\u8005\u53EF\u4FEE\u6539\u5718\u52D9" });
          }
          const body = await getJsonBody(req);
          const { trip } = body || {};
          if (!trip) {
            return sendJson(res, 400, { success: false, error: "\u7F3A\u5C11\u5718\u52D9\u66F4\u65B0\u8CC7\u6599" });
          }
          trip.tripId = tripId;
          trip.id = tripId;
          const success = saveTrip(trip);
          if (success) {
            return sendJson(res, 200, {
              success: true,
              tripId,
              message: `\u5718\u52D9\u3010${trip.title}\u3011(${tripId}) \u8CC7\u6599\u5DF2\u5373\u6642\u66F4\u65B0\u81F3\u4F3A\u670D\u5668`,
              updatedAt: (/* @__PURE__ */ new Date()).toISOString()
            });
          } else {
            return sendJson(res, 500, { success: false, error: "\u66F4\u65B0\u5718\u52D9\u8CC7\u6599\u81F3\u786C\u789F\u5931\u6557" });
          }
        }
        if (method === "DELETE") {
          if (!checkIsAdmin(req, searchParams)) {
            return sendJson(res, 403, { success: false, error: "\u6B0A\u9650\u4E0D\u8DB3\uFF1A\u50C5\u6709\u7BA1\u7406\u8005\u53EF\u522A\u9664\u5718\u52D9" });
          }
          const success = deleteTrip(tripId);
          if (success) {
            return sendJson(res, 200, { success: true, message: `\u5718\u52D9 (${tripId}) \u5DF2\u6210\u529F\u522A\u9664` });
          } else {
            return sendJson(res, 500, { success: false, error: `\u522A\u9664\u5718\u52D9 ${tripId} \u5931\u6557` });
          }
        }
      }
      if (pathname === "/api/plan") {
        if (method === "GET") {
          const planId = searchParams.get("id");
          if (planId) {
            const trip = getTrip(planId);
            if (trip) {
              return sendJson(res, 200, { success: true, hasSavedData: true, plan: trip });
            }
          }
          const all = getAllTrips();
          if (all.length > 0) {
            return sendJson(res, 200, { success: true, hasSavedData: true, plan: all[0] });
          }
          return sendJson(res, 200, { success: true, hasSavedData: false, plan: null });
        }
        if (method === "POST") {
          const body = await getJsonBody(req);
          const { plan, planId } = body || {};
          if (!plan) {
            return sendJson(res, 400, { success: false, error: "Missing plan payload" });
          }
          const targetId = planId || plan.tripId || plan.id || "TRIP-001";
          plan.tripId = targetId;
          plan.id = targetId;
          const success = saveTrip(plan);
          if (success) {
            return sendJson(res, 200, {
              success: true,
              message: "\u8CC7\u6599\u5DF2\u6210\u529F\u5132\u5B58\u81F3\u4F3A\u670D\u5668\uFF01",
              updatedAt: (/* @__PURE__ */ new Date()).toISOString()
            });
          } else {
            return sendJson(res, 500, { success: false, error: "Failed to write plan to storage" });
          }
        }
      }
      if (pathname === "/api/plan/reset" && method === "POST") {
        try {
          initializeAndMigrateTrips();
          return sendJson(res, 200, { success: true, message: "\u4F3A\u670D\u5668\u7AEF\u8CC7\u6599\u5DF2\u91CD\u8A2D" });
        } catch (e) {
          return sendJson(res, 500, { success: false, error: "Failed to reset" });
        }
      }
      const MIME_TYPES = {
        ".html": "text/html; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".mjs": "application/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".ico": "image/x-icon",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".webp": "image/webp"
      };
      if (isDev && vite) {
        vite.middlewares(req, res);
      } else {
        const distPath = path2.join(process.cwd(), "dist");
        const tool01Path = path2.join(distPath, "tool01");
        let candidatePath = null;
        const candidates = [
          path2.join(tool01Path, pathname),
          path2.join(distPath, pathname),
          path2.join(distPath, parsedUrl.pathname)
        ];
        for (const p of candidates) {
          if (fs2.existsSync(p) && fs2.statSync(p).isFile()) {
            candidatePath = p;
            break;
          }
        }
        if (candidatePath) {
          const ext = path2.extname(candidatePath).toLowerCase();
          const contentType = MIME_TYPES[ext] || "application/octet-stream";
          res.writeHead(200, { "Content-Type": contentType });
          fs2.createReadStream(candidatePath).pipe(res);
        } else {
          const hasFileExt = path2.extname(pathname).length > 0;
          if (hasFileExt) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("File Not Found");
            return;
          }
          const tool01Index = path2.join(tool01Path, "index.html");
          const distIndex = path2.join(distPath, "index.html");
          const indexHtml = fs2.existsSync(tool01Index) ? tool01Index : fs2.existsSync(distIndex) ? distIndex : null;
          if (indexHtml) {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            fs2.createReadStream(indexHtml).pipe(res);
          } else {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Not Found");
          }
        }
      }
    } catch (err) {
      console.error("Unhandled request error:", err);
      sendJson(res, 500, { success: false, error: "Internal Server Error" });
    }
  });
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}
startServer();
