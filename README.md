# Site Kit by Google

Site Kit is a one-stop solution for WordPress users to use everything Google has to offer to make them successful on the web.

Learn more: [https://sitekit.withgoogle.com](https://sitekit.withgoogle.com)

## Contributing

Any kind of contribution to Site Kit by Google is welcome. Head over to the [Contributor Handbook](https://github.com/google/site-kit-wp/wiki) to get started, or directly to the [Engineering set up quickstart](https://github.com/google/site-kit-wp/wiki/Engineering#set-up-site-kit-project) to set up Site Kit locally. :wink:

## Requirements

* WordPress >= 5.2
* PHP >= 7.4

## Relative imports in PHPStorm

PHPStorm does not support our VSCode config that prefers relative imports. To make sure you are using relative imports in your automatic imports, go to **Preferences/Settings > Editor > Code Style > JavaScript (or TypeScript if needed) > Imports** tab and perform the following steps:

1. 🚫 Uncheck "Use paths relative to the project, resource or sources roots"
2. ✅ Select "Never" for the "Use path aliases" option 
3. 🔁 Optionally turn off "Use directory imports" if enabled
