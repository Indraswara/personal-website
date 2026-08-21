module.exports = [
"[turbopack-node]/transforms/postcss.ts?config=[project]/admin/postcss.config.mjs { CONFIG => \"[project]/admin/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "chunks/1snw_17npnbd._.js",
  "chunks/[root-of-the-server]__0r3ie30._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[turbopack-node]/transforms/postcss.ts?config=[project]/admin/postcss.config.mjs { CONFIG => \"[project]/admin/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript)");
    });
});
}),
];