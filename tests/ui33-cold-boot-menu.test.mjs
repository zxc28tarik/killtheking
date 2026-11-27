import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('UI33 boot guard is in head before first script, with permanent inline legacy display none',()=>{
 const guard=html.indexOf('<style id="ktk-ui32-boot">');
 assert.ok(guard>=0&&guard<html.indexOf('<script')&&guard<html.indexOf('</head>'));
 const css=html.slice(guard,html.indexOf('</style>',guard));
 assert.match(css,/#menu-overlay:not\(\[data-ui32-ready\]\),#menu-overlay\.hidden,\s*#menu-overlay>#ktk-original-menu\{display:none!important\}/);
 assert.match(html,/<div id="ktk-original-menu" style="display:none!important"/);
 assert.ok(html.indexOf('<div id="ktk-ui32-loading"')<html.indexOf('<div id="menu-overlay"'));
});
test('UI33 new menu releases boot cover only after readiness and error is not covered',()=>{
 const css=html.slice(html.indexOf('<style id="ktk-ui32-boot">'),html.indexOf('</style>',html.indexOf('<style id="ktk-ui32-boot">')));
 assert.match(css,/data-ui32-ready="true"/);assert.match(css,/data-ui32-ready="error"/);
 assert.match(css,/#ktk-startup-error/);
 assert.match(html,/stage\('map'\);overlay\.dataset\.ui32Ready='true';\s*\/\/[^\n]*\n\s*document\.getElementById\('ktk-ui32-loading'\)\?\.remove\(\);/);
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
