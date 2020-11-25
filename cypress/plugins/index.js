/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  "use strict";

  on('before:browser:launch', function (browser = {}, args) {

    if (browser.name === 'chrome') {
      args.push('--use-fake-ui-for-media-stream');
      args.push('--use-fake-device-for-media-stream');
      // args.push('--use-file-for-fake-audio-capture=cypress/fixtures/2020-11-25-083037.webm');
    }

    return args;
  });
}
