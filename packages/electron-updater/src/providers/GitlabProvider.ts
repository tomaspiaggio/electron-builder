import { GitlabOptions } from "builder-util-runtime"
import { AppUpdater } from "../AppUpdater"
import { GenericProvider } from "./GenericProvider"
import { ProviderRuntimeOptions } from "./Provider"

export class GitlabProvider extends GenericProvider {
  constructor(configuration: GitlabOptions, updater: AppUpdater, runtimeOptions: ProviderRuntimeOptions) {
    super(
      {
        provider: "generic",
        url: `${configuration.hostname || "https://gitlab.com"}/api/v4/projects/${configuration.projectId}/packages/generic/${process.platform}-${process.arch}/latest`,
      },
      updater,
      runtimeOptions
    )
    updater.requestHeaders = { "DEPLOY-TOKEN": configuration.deployToken }
  }
}
