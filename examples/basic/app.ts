import { App } from "alosaur/mod.ts";
import { settings } from "./app-settings.ts";
import { AlosaurOpenApiBuilder, OpenApiMiddleware } from "../../openapi/mod.ts";

// create application
const app = new App(settings);

const builder = AlosaurOpenApiBuilder.create(settings)
    .registerControllers()
    .addTitle("API Specification")
    .addDescription("")
    .addVersion("")

app.use(/^.*$/, new OpenApiMiddleware(builder));

app.listen();
