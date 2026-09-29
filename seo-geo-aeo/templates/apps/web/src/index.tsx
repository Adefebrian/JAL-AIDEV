// apps/web/src/index.tsx - the public entrypoint.
//
// A content page hydrates over the body the server already put inside #root
// (the same SitePage the build rendered into dist/seo.json), so the first
// paint and the crawler's text are one text. /app keeps the scaffold's App;
// anything else is the 404 body, hydrated in the path's language. The admin
// view is a separate entrypoint (src/admin/index.tsx) and never ships here.
import type { ReactElement } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
import { findPage, langOfPath, siteCopy } from "./content";
import { NotFoundPage, SitePage } from "./pages/SitePage";
import "./styles.css";
import "./pages/site.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root element not found");

const path = location.pathname;
const page = findPage(path);
let view: ReactElement;
if (page) view = <SitePage page={page} site={siteCopy(page.lang)} />;
else if (path === "/app") view = <App />;
else view = <NotFoundPage site={siteCopy(langOfPath(path))} />;

if (root.hasChildNodes()) hydrateRoot(root, view);
else createRoot(root).render(view);
