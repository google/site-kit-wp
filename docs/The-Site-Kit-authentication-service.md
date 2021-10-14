[Back to overview](./README.md)

# The Site Kit authentication service

## Introduction

While Site Kit is a plugin by Google, it still runs in an arbitrary WordPress site and thus outside of Google's own infrastructure. Because of that, any user of Site Kit needs to explicitly grant the plugin on their WordPress site access to the data from the specific services which Site Kit integrates with. While one might argue that metrics and insights about a site are not user data, access permissions on the Google service side are managed at an account level, i.e. Site Kit needs to request the data from Google services on behalf of a specific user (typically the currently authenticated user).

The [OAuth 2.0 flow for Web Server Applications](https://developers.google.com/identity/protocols/OAuth2WebServer) is the industry standard for this, it is considered secure and widely used by web platforms. However, using OAuth 2.0 in an open-source CMS ecosystem like WordPress comes with serious UX hurdles: Every website owner would need to create their site's own Google Cloud Platform project, enable specific APIs, and configure OAuth credentials for it - which already is a challenging task for a less tech-savvy user. They would afterwards also need to request their OAuth application to be verified, which involves providing technical clarification on the requirements and a time-consuming review process, and eventually they would need to copy and paste their OAuth credentials into some input fields in the WordPress plugin.

Since one of the [goals of Site Kit](./Site-Kit-goals-and-features.md) is to make the onboarding as seamless as possible, using out-of-the-box OAuth 2.0 is infeasible for the plugin. This is where the Site Kit authentication service comes into play.

## The purpose of the Site Kit authentication service

The Site Kit authentication service (also referred to as "Site Kit Service", or "SKS") is a centralized web service that lives outside of the Site Kit plugin, alongside the Site Kit website at [sitekit.withgoogle.com](https://sitekit.withgoogle.com), hosted on Google infrastructure. The Site Kit Service essentially sits in between each website using the Site Kit plugin and the Google OAuth 2.0 infrastructure, acting as a proxy for communication between the two. Behind the Site Kit Service sits a centralized Google Cloud Platform project that the service connects to using OAuth 2.0.

There are two main limitations of the OAuth 2.0 flow which Site Kit Service solves:
1. Every OAuth application needs to have a "client ID" and "client secret", the latter of which must be, as the name states, kept secret. Because the plugin is open-source though, there is no way for the client credentials to be stored in the plugin without also allowing anyone to see (and use!) them. Site Kit Service solves this, simply because it is a (closed-source) web service which lives outside of the plugin, in a controlled infrastructure. In other words, the service is a safe place to store the client ID and client secret. In order to communicate with each WordPress site, Site Kit Service issues its own set of credentials, called "site ID" and "site secret".
2. Every OAuth application must predefine one or more redirect URIs to be allowlisted. Because the Site Kit plugin is used by lots of decoupled WordPress sites though, their individual URIs are unknown ahead of time, so they cannot be specified. Site Kit Service solves this by proxying all parts of the OAuth communication between the plugin and Google's OAuth authorization servers, and it uses a single redirect URI on the service, from where it then can redirect onwards to the individual WordPress site that is currently connecting.

The following figure shows how Site Kit Service proxies the communication between the individual WordPress site and Google's OAuth authorization servers:
![Site Kit Service intercepts the redirect from the plugin to the OAuth consent screen, replacing the site credentials with the OAuth client credentials. It then intercepts the callback redirect from OAuth and redirects onwards, back to the plugin. The plugin then calls Site Kit service's token endpoint (instead of Google's OAuth token endpoint), where the service then proxies through the request to Google's OAuth endpoint.](./assets/The-Site-Kit-authentication-service/site-kit-service-as-a-proxy.png)

For a more detailed deep dive into the underlying problems with using OAuth in a CMS (using Site Kit Service as an example), watch [the "Accessing APIs using OAuth on the Federated (WordPress) web" presentation on wordpress.tv](https://wordpress.tv/2021/06/28/felix-arntz-accessing-apis-using-oauth-on-the-federated-wordpress-web/) ([presentation slides](https://www.slideshare.net/FelixArntz/accessing-apis-using-oauth-on-the-federated-wordpress-web)).

## Responsibilities during setup and authentication

### Requirements for the plugin to receive an OAuth token

## Revoking access on the service

## Additional features of the service
