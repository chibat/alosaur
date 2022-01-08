import { AppSettings, HttpContext, Middleware, MiddlewareTarget } from "../../mod.ts";
import { AlosaurOpenApiBuilder } from "../mod.ts";

@Middleware(/^.*$/)
export class OpenApiMiddleware implements MiddlewareTarget<unknown> {
  #jsonPath = "/api.json";
  #htmlPath = "/swagger-ui.html";
  #json: string | unknown;
  #html: string | unknown;

  constructor(
    options?: {
      alosaurOpenApiBuilder?: AlosaurOpenApiBuilder<unknown>;
      jsonPath?: string;
      htmlPath?: string;
    },
  ) {
    if (options) {
      if (options.alosaurOpenApiBuilder) {
        this.#json = JSON.stringify(options.alosaurOpenApiBuilder.getSpec());
      }
      if (options.jsonPath) {
        this.#jsonPath = options.jsonPath;
      }
      if (options.htmlPath) {
        this.#htmlPath = options.htmlPath;
      }
    }
  }

  onPreRequest(_context: HttpContext<unknown>) {
    return new Promise<void>((resolve, _reject) => {
      resolve();
    });
  }

  onPostRequest(context: HttpContext<unknown>) {
    switch (context.request.parserUrl.pathname) {
      case this.#jsonPath:
        if (!this.#json) {
          const parserUrl = context.request.parserUrl;
          const url = parserUrl.protocol + "//" + parserUrl.host;
          this.#initializeDefaultJson(url);
        }
        context.response.headers.set(
          "content-type",
          "application/json; charset=utf-8",
        );
        context.response.body = this.#json;
        break;

      case this.#htmlPath:
        if (!this.#html) {
          const parserUrl = context.request.parserUrl;
          const url = parserUrl.protocol + "//" + parserUrl.host +
            this.#jsonPath;
          this.#initializeHtml(url);
        }
        context.response.headers.set(
          "content-type",
          "text/html; charset=utf-8",
        );
        context.response.body = this.#html;
        break;
      default:
        break;
    }

    return new Promise<void>((resolve, _reject) => {
      resolve();
    });
  }

  #initializeDefaultJson(url: string) {
    const unusedParameter: AppSettings = {areas: []};
    this.#json = JSON.stringify(
      AlosaurOpenApiBuilder.create(unusedParameter)
        .registerControllers()
        .addTitle("API Specification")
        .addServer({
          url: url,
        })
        .getSpec(),
    );
  }

  #initializeHtml(url: string) {
    const resourceBase = "https://unpkg.com/swagger-ui-dist@4.1.3/";
    // base: https://unpkg.com/browse/swagger-ui-dist@4.1.3/index.html
    this.#html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Swagger UI</title>
            <link rel="stylesheet" type="text/css" href="${resourceBase}/swagger-ui.css" />
            <link rel="icon" type="image/png" href="${resourceBase}/favicon-32x32.png" sizes="32x32" />
            <link rel="icon" type="image/png" href="${resourceBase}/favicon-16x16.png" sizes="16x16" />
            <style>
              html
              {
                box-sizing: border-box;
                overflow: -moz-scrollbars-vertical;
                overflow-y: scroll;
              }

              *,
              *:before,
              *:after
              {
                box-sizing: inherit;
              }

              body
              {
                margin:0;
                background: #fafafa;
              }
            </style>
          </head>

          <body>
            <div id="swagger-ui"></div>

            <script src="${resourceBase}/swagger-ui-bundle.js" charset="UTF-8"> </script>
            <script src="${resourceBase}/swagger-ui-standalone-preset.js" charset="UTF-8"> </script>
            <script>
            window.onload = function() {
              const ui = SwaggerUIBundle({
                url: "${url}",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIStandalonePreset
                ],
                plugins: [
                  SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
              });

              window.ui = ui;
            };
          </script>
          </body>
        </html>
    `;
  }
}
