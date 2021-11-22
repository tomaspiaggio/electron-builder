import { Arch } from "builder-util"
import { configureRequestOptions, HttpExecutor } from "builder-util-runtime"
import { GitlabOptions } from "builder-util-runtime/out/publishOptions"
import { httpExecutor } from "builder-util/out/nodeHttpExecutor"
import { InvalidConfigurationError, isEmptyOrSpaces } from "builder-util"
import { HttpPublisher, PublishContext } from "electron-publish"
import { createReadStream } from "fs"
import { ClientRequest, RequestOptions } from "http"
import path from "path"

export class GitlabPublisher extends HttpPublisher {
  readonly providerName = "gitlab"
  readonly hostname = "https://gitlab.com"

  private readonly info: GitlabOptions
  private readonly buildUrl: (arch: Arch, name: string) => string
  private readonly token: string

  constructor(context: PublishContext, info: GitlabOptions) {
    super(context)

    const token = info.deployToken || process.env.GITLAB_DEPLOY_TOKEN || null
    const projectId = `${info.projectId}` || process.env.GITLAB_PROJECT_ID || null

    if (isEmptyOrSpaces(token)) {
      throw new InvalidConfigurationError('Gitlab deployToken is not set using env "GITLAB_DEPLOY_TOKEN" (see https://www.electron.build/configuration/publish#GitlabOptions)')
    }

    if (isEmptyOrSpaces(projectId)) {
      throw new InvalidConfigurationError('Gitlab projectId is not set using env "GITLAB_PROJECT_ID" (see https://www.electron.build/configuration/publish#GitlabOptions)')
    }

    this.info = info
    this.buildUrl = (arch: Arch, name: string) => `${info.hostname || this.hostname}/api/v4/projects/${projectId}/packages/generic/${process.platform}-${arch}/latest/${name}`
    this.token = token
  }

  protected doUpload(
    fileName: string,
    _arch: Arch,
    _dataLength: number,
    _requestProcessor: (request: ClientRequest, reject: (error: Error) => void) => void,
    file: string
  ): Promise<any> {
    return HttpExecutor.retryOnServerError(async () => {
      const stream = createReadStream(fileName)
      const upload: RequestOptions = {
        hostname: this.hostname,
        path: this.buildUrl(_arch, path.basename(fileName)),
        headers: { "DEPLOY-TOKEN": this.token },
      }
      await httpExecutor.doApiRequest(configureRequestOptions(upload, null, "PUT"), this.context.cancellationToken, it => stream.pipe(it))
      return fileName
    })
  }

  toString(): string {
    const { projectId, hostname } = this.info
    return `GitlabProvider(projectId: ${projectId}, hostname: ${hostname})`
  }
}
