"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/is-wsl";
exports.ids = ["vendor-chunks/is-wsl"];
exports.modules = {

/***/ "(rsc)/./node_modules/is-wsl/index.js":
/*!**************************************!*\
  !*** ./node_modules/is-wsl/index.js ***!
  \**************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var node_process__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! node:process */ \"node:process\");\n/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! node:os */ \"node:os\");\n/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! node:fs */ \"node:fs\");\n/* harmony import */ var is_inside_container__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! is-inside-container */ \"(rsc)/./node_modules/is-inside-container/index.js\");\n\n\n\n\n\nconst isWsl = () => {\n\tif (node_process__WEBPACK_IMPORTED_MODULE_0__.platform !== 'linux') {\n\t\treturn false;\n\t}\n\n\tif (node_os__WEBPACK_IMPORTED_MODULE_1__.release().toLowerCase().includes('microsoft')) {\n\t\tif ((0,is_inside_container__WEBPACK_IMPORTED_MODULE_3__[\"default\"])()) {\n\t\t\treturn false;\n\t\t}\n\n\t\treturn true;\n\t}\n\n\ttry {\n\t\tif (node_fs__WEBPACK_IMPORTED_MODULE_2__.readFileSync('/proc/version', 'utf8').toLowerCase().includes('microsoft')) {\n\t\t\treturn !(0,is_inside_container__WEBPACK_IMPORTED_MODULE_3__[\"default\"])();\n\t\t}\n\t} catch {}\n\n\t// Fallback for custom kernels: check WSL-specific paths.\n\tif (\n\t\tnode_fs__WEBPACK_IMPORTED_MODULE_2__.existsSync('/proc/sys/fs/binfmt_misc/WSLInterop')\n\t\t|| node_fs__WEBPACK_IMPORTED_MODULE_2__.existsSync('/run/WSL')\n\t) {\n\t\treturn !(0,is_inside_container__WEBPACK_IMPORTED_MODULE_3__[\"default\"])();\n\t}\n\n\treturn false;\n};\n\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (node_process__WEBPACK_IMPORTED_MODULE_0__.env.__IS_WSL_TEST__ ? isWsl : isWsl());\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvaXMtd3NsL2luZGV4LmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQW1DO0FBQ1Y7QUFDQTtBQUMyQjs7QUFFcEQ7QUFDQSxLQUFLLGtEQUFnQjtBQUNyQjtBQUNBOztBQUVBLEtBQUssNENBQVU7QUFDZixNQUFNLCtEQUFpQjtBQUN2QjtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSxNQUFNLGlEQUFlO0FBQ3JCLFdBQVcsK0RBQWlCO0FBQzVCO0FBQ0EsR0FBRzs7QUFFSDtBQUNBO0FBQ0EsRUFBRSwrQ0FBYTtBQUNmLEtBQUssK0NBQWE7QUFDbEI7QUFDQSxVQUFVLCtEQUFpQjtBQUMzQjs7QUFFQTtBQUNBOztBQUVBLGlFQUFlLDZDQUFXLGtDQUFrQyxFQUFDIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXGxhbWExXFxEb2N1bWVudHNcXEdpdEh1Ylxcc2lhYS1zdG9yYWdlLXN5c3RlbVxcbm9kZV9tb2R1bGVzXFxpcy13c2xcXGluZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwcm9jZXNzIGZyb20gJ25vZGU6cHJvY2Vzcyc7XG5pbXBvcnQgb3MgZnJvbSAnbm9kZTpvcyc7XG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgaXNJbnNpZGVDb250YWluZXIgZnJvbSAnaXMtaW5zaWRlLWNvbnRhaW5lcic7XG5cbmNvbnN0IGlzV3NsID0gKCkgPT4ge1xuXHRpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gJ2xpbnV4Jykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdGlmIChvcy5yZWxlYXNlKCkudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnbWljcm9zb2Z0JykpIHtcblx0XHRpZiAoaXNJbnNpZGVDb250YWluZXIoKSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0dHJ5IHtcblx0XHRpZiAoZnMucmVhZEZpbGVTeW5jKCcvcHJvYy92ZXJzaW9uJywgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdtaWNyb3NvZnQnKSkge1xuXHRcdFx0cmV0dXJuICFpc0luc2lkZUNvbnRhaW5lcigpO1xuXHRcdH1cblx0fSBjYXRjaCB7fVxuXG5cdC8vIEZhbGxiYWNrIGZvciBjdXN0b20ga2VybmVsczogY2hlY2sgV1NMLXNwZWNpZmljIHBhdGhzLlxuXHRpZiAoXG5cdFx0ZnMuZXhpc3RzU3luYygnL3Byb2Mvc3lzL2ZzL2JpbmZtdF9taXNjL1dTTEludGVyb3AnKVxuXHRcdHx8IGZzLmV4aXN0c1N5bmMoJy9ydW4vV1NMJylcblx0KSB7XG5cdFx0cmV0dXJuICFpc0luc2lkZUNvbnRhaW5lcigpO1xuXHR9XG5cblx0cmV0dXJuIGZhbHNlO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgcHJvY2Vzcy5lbnYuX19JU19XU0xfVEVTVF9fID8gaXNXc2wgOiBpc1dzbCgpO1xuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/is-wsl/index.js\n");

/***/ })

};
;