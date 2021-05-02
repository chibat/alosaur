import { TcpServer, TcpServerConfig } from "./server/server.ts";
import { registerAreas } from "../utils/register-areas.ts";
import { MetadataArgsStorage } from "../metadata/metadata.ts";
import {
  container as defaultContainer,
  DependencyContainer,
} from "../injection/index.ts";
import { getMetadataArgsStorage, ObjectKeyAny } from "../mod.ts";
import { registerAppProviders } from "../utils/register-providers.ts";
import { ProviderDeclaration } from "../types/provider-declaration.ts";
import { registerControllers } from "../utils/register-controllers.ts";
import { RouteMetadata } from "../metadata/route.ts";

export enum MicroserviceType {
  TCP,
}

export interface MicroserviceSettings {
  areas: Function[];
  type: MicroserviceType;
  config: TcpServerConfig;

  /**
     * Custom DI container
     */
  container?: DependencyContainer;

  /**
     * Providers declared in microservice
     */
  providers?: ProviderDeclaration[];
}

export class Microservice<TState> {
  private readonly metadata: MetadataArgsStorage<TState>;
  private readonly server: TcpServer;
  private readonly classes: ObjectKeyAny[] = [];
  private readonly actions: RouteMetadata[] = [];
  private readonly delimeter = "#";

  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder();

  constructor(settings: MicroserviceSettings) {
    this.metadata = getMetadataArgsStorage();

    this.metadata.container = settings.container || defaultContainer;

    // Register all areas routes
    registerAppProviders(settings, this.metadata.container);
    registerAreas(this.metadata);

    // TODO add action decorators, Event and
    // Register actions
    registerControllers(
      this.metadata,
      this.classes,
      (route) => this.actions.push(route),
      false,
    );

    // create server, TCP by default
    this.server = new TcpServer(settings.config);
  }

  public async listen() {
    // listen server and run actions by event
    console.log("Start listen");
    return this.server.listen((rid: number, r: BufferSource) =>
      this.handler(rid, r)
    );
  }

  private async handler(rid: number, r: BufferSource) {
    const req = this.decoder.decode(r);
    const [pattern, data] = req.split(this.delimeter);

    const action = this.actions.find((action) =>
      action.eventOrPattern === pattern
    );

    // TODO add hooks
    if (action) {
      const serializedObject = JSON.parse(data);
      const result = JSON.stringify(
        await action.target[action.action](serializedObject),
      );
      const response = this.encoder.encode(pattern + this.delimeter + result);

      await this.server.send(rid, response);

      console.log(await action.target[action.action]());
    }

    // console.log(pattern, data)
  }
}
