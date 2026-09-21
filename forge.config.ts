import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { MakerZIP } from "@electron-forge/maker-zip";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

// Code signing is entirely optional and only activates if the relevant
// certificate/credentials are actually present in the environment. Without
// a paid code-signing certificate, Windows SmartScreen may show an
// "unrecognized publisher" warning on install - that's expected and safe to
// click through; it does not affect whether the app works.
const hasWindowsCert = !!process.env.WINDOWS_CERT_SHA1;
const hasMacSigningCreds =
  !!process.env.APPLE_IDENTITY && !!process.env.APPLE_ID && !!process.env.APPLE_PASSWORD && !!process.env.APPLE_TEAM_ID;

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: "./src/assets/icon",
    ...(hasMacSigningCreds
      ? {
          osxSign: {
            identity: `Developer ID Application: ${process.env.APPLE_IDENTITY}`,
          },
          osxNotarize: {
            appleId: process.env.APPLE_ID!,
            appleIdPassword: process.env.APPLE_PASSWORD!,
            teamId: process.env.APPLE_TEAM_ID!,
          },
        }
      : {}),
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      ...(hasWindowsCert
        ? {
            signWithParams: `/sha1 ${process.env.WINDOWS_CERT_SHA1} /tr http://time.certum.pl /td sha256 /fd sha256`,
          }
        : {}),
    }),
    new MakerDMG({}),
    new MakerZIP({}),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      devContentSecurityPolicy: "connect-src 'self' * 'unsafe-eval'",
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: "./src/main/index.html",
            js: "./src/main/renderer.ts",
            name: "main_window",
            preload: {
              js: "./src/preload.ts",
            },
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "spartainman64",
          name: "dispatch-panel-pro",
        },
        prerelease: false,
      },
    },
  ],
};

export default config;
