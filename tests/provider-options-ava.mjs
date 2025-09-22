import test from "ava";
import GithubProvider from "github-repository-provider";

const ENV = {
  GH_TOKEN: "abc",
  GITHUB_SERVER_URL: "https://mygithub.com",
  GITHUB_API_URL: "https://mygithub.com/api/v3/"
};

test("provider from env HOST", async t => {
  const provider = GithubProvider.initialize(undefined, {
    GH_TOKEN: "abc",
    GITHUB_HOST: "myserver"
  });

  t.is(provider.host, "myserver");
  t.is(provider.api, "https://api.myserver");
  t.is(provider.url, "https://myserver/");
});

test("provider properties from env options", async t => {
  const provider = GithubProvider.initialize(undefined, ENV);

  t.is(provider.api, "https://mygithub.com/api/v3");
  t.is(provider.url, "https://mygithub.com/");
});

/*
test(
  providerOptionsFromEnvironmentTest,
  GithubProvider,
  ENV,
  {
    "authentication.type": "token",
    "authentication.token": "abc",
    url: "https://mygithub.com",
    api: "https://mygithub.com/api/v3/"
  },
  true
);

test(
  providerOptionsFromEnvironmentTest,
  GithubProvider,
  { GH_TOKEN: "abc" },
  {
    "authentication.type": "token",
    "authentication.token": "abc"
  },
  true
);
test(
  providerOptionsFromEnvironmentTest,
  GithubProvider,
  { GITHUB_TOKEN: "abc" },
  {
    "authentication.type": "token",
    "authentication.token": "abc"
  },
  true
);

const ENV2 = {
  NODE_ENV: "test",
  DOTNET_NOLOGO: '"1"',
  DEPLOYMENT_BASEPATH: "/opt/runner",
  USER: "runner",
  CI: "true",
  PIPX_HOME: '"/opt/pipx"',
  GITHUB_ENV:
    "/home/runner/work/_temp/_runner_file_commands/set_env_b2324ef1-b02d-49d4-aa55-8f63ca129397",
  JAVA_HOME_7_X64: "/usr/lib/jvm/zulu-7-azure-amd64",
  JAVA_HOME_8_X64: "/usr/lib/jvm/adoptopenjdk-8-hotspot-amd64",
  SHLVL: "1",
  HOME: "/home/runner",
  RUNNER_TEMP: "/home/runner/work/_temp",
  GITHUB_EVENT_PATH: "/home/runner/work/_temp/_github_workflow/event.json",
  JAVA_HOME_11_X64: "/usr/lib/jvm/adoptopenjdk-11-hotspot-amd64",
  GITHUB_REPOSITORY_OWNER: "Kronos-Integration",
  PIPX_BIN_DIR: '"/opt/pipx_bin"',
  JAVA_HOME_12_X64: "/usr/lib/jvm/adoptopenjdk-12-hotspot-amd64",
  GRADLE_HOME: "/usr/share/gradle",
  GITHUB_RETENTION_DAYS: "90",
  HOMEBREW_PREFIX: '"/home/linuxbrew/.linuxbrew"',
  AZURE_EXTENSION_DIR: "/opt/az/azcliextensions",
  POWERSHELL_DISTRIBUTION_CHANNEL: "GitHub-Actions-ubuntu18",
  GITHUB_HEAD_REF: "",
  GOROOT: "/opt/hostedtoolcache/go/1.14.12/x64",
  GITHUB_GRAPHQL_URL: "https://api.github.com/graphql",
  BOOST_ROOT_1_72_0: "/opt/hostedtoolcache/boost/1.72.0/x64",
  ImageVersion: "20201129.1",
  DOTNET_SKIP_FIRST_TIME_EXPERIENCE: '"1"',
  GITHUB_API_URL: "https://api.github.com",
  SWIFT_PATH: "/usr/share/swift/usr/bin",
  GOROOT_1_13_X64: "/opt/hostedtoolcache/go/1.13.15/x64",
  RUNNER_OS: "Linux",
  JOURNAL_STREAM: "9:21819",
  GOROOT_1_14_X64: "/opt/hostedtoolcache/go/1.14.12/x64",
  CHROMEWEBDRIVER: "/usr/local/share/chrome_driver",
  RUNNER_USER: "runner",
  GITHUB_WORKFLOW: "CI",
  _: "/opt/hostedtoolcache/node/14.15.1/x64/bin/npm",
  GOROOT_1_15_X64: "/opt/hostedtoolcache/go/1.15.5/x64",
  GITHUB_RUN_ID: "423439391",
  ImageOS: "ubuntu18",
  GITHUB_BASE_REF: "",
  GITHUB_ACTION_REPOSITORY: "actions/setup-node",
  PERFLOG_LOCATION_SETTING: "RUNNER_PERFLOG",
  PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin",
  INVOCATION_ID: "cff0cd8dbdc74aea96050673081ca69c",
  RUNNER_TOOL_CACHE: "/opt/hostedtoolcache",
  RUNNER_TRACKING_ID: "github_292b7624-94c6-47fa-90ce-551a4c36ad9f",
  DOTNET_MULTILEVEL_LOOKUP: '"0"',
  ANT_HOME: "/usr/share/ant",
  HOMEBREW_CELLAR: '"/home/linuxbrew/.linuxbrew/Cellar"',
  NODE: "/opt/hostedtoolcache/node/14.15.1/x64/bin/node",
  AGENT_TOOLSDIRECTORY: "/opt/hostedtoolcache",
  GITHUB_ACTION: "run3",
  GITHUB_RUN_NUMBER: "654",
  LANG: "C.UTF-8",
  VCPKG_INSTALLATION_ROOT: "/usr/local/share/vcpkg",
  CONDA: "/usr/share/miniconda",
  GITHUB_REPOSITORY: "Kronos-Integration/service-repositories",
  GITHUB_ACTION_REF: "v1",
  DEBIAN_FRONTEND: "noninteractive",
  GITHUB_ACTIONS: "true",
  GITHUB_JOB: "test",
  RUNNER_PERFLOG: "/home/runner/perflog",
  GITHUB_WORKSPACE:
    "/home/runner/work/service-repositories/service-repositories",
  GITHUB_SHA: "5a3d7d20e9357901b2dfa6c2d77901735c2bb32e",
  ANDROID_SDK_ROOT: "/usr/local/lib/android/sdk",
  GITHUB_ACTOR: "arlac77",
  GITHUB_REF: "refs/heads/master",
  LEIN_HOME: "/usr/local/lib/lein",
  JAVA_HOME: "/usr/lib/jvm/adoptopenjdk-8-hotspot-amd64",
  PWD: "/home/runner/work/service-repositories/service-repositories",
  RUNNER_WORKSPACE: "/home/runner/work/service-repositories",
  GITHUB_PATH:
    "/home/runner/work/_temp/_runner_file_commands/add_path_b2324ef1-b02d-49d4-aa55-8f63ca129397",
  ANDROID_HOME: "/usr/local/lib/android/sdk",
  GITHUB_SERVER_URL: "https://github.com",
  GECKOWEBDRIVER: "/usr/local/share/gecko_driver",
  GITHUB_EVENT_NAME: "push",
  LEIN_JAR: "/usr/local/lib/lein/self-installs/leiningen-2.9.4-standalone.jar",
  M2_HOME: "/usr/share/apache-maven-3.6.3",
  HOMEBREW_REPOSITORY: '"/home/linuxbrew/.linuxbrew/Homebrew"',
  CHROME_BIN: "/usr/bin/google-chrome",
  SELENIUM_JAR_PATH: "/usr/share/java/selenium-server-standalone.jar",
  INIT_CWD: "/home/runner/work/service-repositories/service-repositories"
};

test(
  providerOptionsFromEnvironmentTest,
  GithubProvider,
  ENV2,
  {
    url: "https://github.com",
    api: "https://api.github.com"
  },
  false
);
*/
