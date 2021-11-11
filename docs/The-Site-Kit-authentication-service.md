[Back to overview](./README.md)

# The Site Kit authentication service

## Introduction

While Site Kit is a plugin by Google, it still runs in decoupled WordPress sites and thus outside of Google's own infrastructure. Because of that, any user of Site Kit needs to explicitly grant the plugin on their WordPress site access to the data from the specific services which Site Kit integrates with. While one might argue that metrics and insights about a site are not user data, access permissions on the Google service side are managed at an account level, i.e. Site Kit needs to request the data from Google services on behalf of a specific user (typically the currently authenticated user). In order to do that, Site Kit needs to provide a user-specific access token with all Google API requests.

The [OAuth 2.0 flow for Web Server Applications](https://developers.google.com/identity/protocols/OAuth2WebServer) is the industry standard for this, it is considered secure and widely used by web platforms. However, using OAuth 2.0 in an open-source CMS ecosystem like WordPress comes with serious UX hurdles: Every website owner would need to create their site's own Google Cloud Platform project, enable specific APIs, and configure OAuth credentials for it - which already is a challenging task for a less tech-savvy user. They would afterwards also need to request their OAuth application to be verified, which involves providing technical clarification on the requirements and a time-consuming review process, and eventually they would need to copy and paste their OAuth credentials into some input fields in the WordPress plugin.

Since one of the [goals of Site Kit](./Site-Kit-goals-and-features.md) is to make the onboarding as seamless as possible, using out-of-the-box OAuth 2.0 is infeasible for the plugin. This is where the Site Kit authentication service comes into play.

## The purpose of the Site Kit authentication service

The Site Kit authentication service (also referred to as "Site Kit Service", or "SKS") is a centralized web service that lives outside of the Site Kit plugin, alongside the Site Kit website at [sitekit.withgoogle.com](https://sitekit.withgoogle.com), hosted on Google infrastructure. The Site Kit Service essentially sits in between each website using the Site Kit plugin and the Google OAuth 2.0 infrastructure, acting as a proxy for communication between the two. Behind the Site Kit Service sits a centralized Google Cloud Platform project that the service connects to using OAuth 2.0.

There are two main limitations of the OAuth 2.0 flow which Site Kit Service solves:
1. Every OAuth application needs to have a "client ID" and "client secret", the latter of which must be, as the name states, kept secret. Because the plugin is open-source though, there is no way for the client credentials to be stored in the plugin without also allowing anyone to see (and use!) them. Site Kit Service solves this, simply because it is a (closed-source) web service which lives outside of the plugin, in a controlled infrastructure. In other words, the service is a safe place to store the client ID and client secret. In order to communicate with each WordPress site, Site Kit Service issues its own set of credentials, called "site ID" and "site secret" (or together: "site credentials"). Note that while tokens are user-specific, site credentials apply to an entire site.
1. Every OAuth application must predefine one or more redirect URIs to be allowlisted. Because the Site Kit plugin is used by lots of decoupled WordPress sites though, their individual URIs are unknown ahead of time, so they cannot be specified. Site Kit Service solves this by proxying all parts of the OAuth communication between the plugin and Google's OAuth authorization servers, and it uses a single redirect URI on the service, from where it then can redirect onwards to the individual WordPress site that is currently connecting.

The following figure shows how Site Kit Service proxies the communication between the individual WordPress site and Google's OAuth authorization servers:
![Site Kit Service intercepts the redirect from the plugin to the OAuth consent screen, replacing the site credentials with the OAuth client credentials. It then intercepts the callback redirect from OAuth and redirects onwards, back to the plugin. The plugin then calls Site Kit service's token endpoint (instead of Google's OAuth token endpoint), where the service then proxies through the request to Google's OAuth endpoint.](./assets/The-Site-Kit-authentication-service/site-kit-service-as-a-proxy.png)

For a more detailed deep dive into the underlying problems with using OAuth in a CMS (using Site Kit Service as an example), watch [the "Accessing APIs using OAuth on the Federated (WordPress) web" presentation on wordpress.tv](https://wordpress.tv/2021/06/28/felix-arntz-accessing-apis-using-oauth-on-the-federated-wordpress-web/) ([presentation slides](https://www.slideshare.net/FelixArntz/accessing-apis-using-oauth-on-the-federated-wordpress-web)).

## Responsibilities during setup and authentication

The Site Kit authentication service handles both [site connection _and_ user authentication](./Site-connection-and-user-authentication.md), in a single combined setup flow. When a user wants to connect a site without site credentials (either an entirely new site or a site that reconnects e.g. after a Site Kit plugin reset), Site Kit Service will as part of the flow ensure that the site receives the site credentials - without that, completing user authentication would not even be possible, since the site needs the site credentials in order to request an OAuth access token from the service.

The exact setup flow between the plugin and the authentication service is as follows:
1. **User** clicks the "Sign in with Google" button in the plugin.
1. **Plugin** issues a request to **SKS** in order to receive the appropriate authentication URL to send the user to.
    * If the site already has site credentials, it essentially just pings the service to receive the URL.
    * If the site does not have credentials, it sends the URL and some other configuration data (e.g. a redirect URI) to the service, where it is then either looked up (if the site already was already connected to the service before) or registered (if the site is newly connecting). Note that the site _does not_ receive its site credentials just yet.
1. **Plugin** redirects **User** to the **SKS** OAuth consent proxy endpoint (`/o/oauth2/auth/`).
1. **SKS** redirects **User** onwards to the **Google** OAuth consent endpoint.
1. **User** grants **SKS** access to the **Google** OAuth scopes requested.
1. **Google** OAuth infrastructure redirects back to the callback URL on **SKS**, providing the temporary authorization code.
1. **SKS** then redirects the user onwards:
    * If the site already has received its site credentials:
        1. **SKS** essentially acts as a proxy and redirects **User** onwards to the **Plugin** redirect URI, passing the temporary authorization code.
        1. **Plugin** issues a request to the **SKS** OAuth token endpoint (`/o/oauth2/token/`) to exchange the authorization code for an access token.
        1. **SKS** proxies that request through to the **Google** OAuth token endpoint, from where it receives the token.
        1. **SKS** checks whether all requirements for the site to receive the token are met. This can only be the case if the current user already completed the setup flow at an earlier point and has not revoked any access since (which is typically the case for the case that an already-authenticated user is only requesting additional scopes). If the requirements are met, the plugin receives the token and the setup flow is essentially short-circuited and already complete. If not all requirements are met, the plugin receives a specific error which contains which requirement is not met.
        1. **Plugin** redirects **User** to the **SKS** setup endpoint where they will be able to complete the required steps for receiving an OAuth token.
    * If the site has not yet received its site credentials:
        1. **SKS** immediately redirects **User** onwards to the **SKS** setup endpoint where they will be able to complete the required steps for receiving an OAuth token (i.e. they are now at a similar place as after the above alternative step 5.).
1. **User** navigates through the three required steps on the **SKS** setup endpoint for authenticating and receiving an OAuth token.
    * The three steps are ["verification"](#step-1-verification), ["delegation consent"](#step-2-delegation-consent), and ["Search Console property"](#step-3-search-console-property) (see the [section below for details on the steps](#requirements-for-the-plugin-to-receive-an-oauth-token)). The user has to complete each step in order to successfully authenticate, which effectively for them just means to click the CTA button in each step, and Site Kit Service will take care of it.
    * As soon as the user is verified as a site owner (i.e. the "verification" step is complete), if the site has not yet received its site credentials, that can happen now.
        1. **SKS** redirects **User** to **Plugin** (hardly noticeable for the user) to indicate that the plugin can now request its site credentials, based on the current user being verified as a site owner.
        1. **Plugin** requests site credentials from **SKS**, and they are returned successfully as the current user is a verified owner of the site.
        1. **Plugin** then redirects **user** back to **SKS**, where they can complete any remaining steps.
    * Once the last step has been completed, the user lands on the "success" step.
1. **User** clicks the CTA button in the success step, which leads them back from **SKS** to **Plugin**, passing a temporary service-specific session code.
1. **Plugin** issues a request to the **SKS** OAuth token endpoint (`/o/oauth2/token/`) to exchange the session code for an access token, which is now possible since all three requirements are met. Now that the plugin has received the token for the user, the setup flow is complete.

### Requirements for the plugin to receive an OAuth token

As mentioned above, three requirements need to be fulfilled for the plugin to receive an OAuth token for a user. Site Kit Service's functionality and UI as part of the setup flow helps the user to complete those requirements. This section outlines them in more detail.

#### Step 1: Verification

Every authenticating user needs to verify their "site ownership", i.e. that they are in fact an owner of the site they want to connect. Site Kit Service allows to do that by sending a so-called "verification token" to the Site Kit plugin, which the plugin then places in either a virtual HTML verification file or in a `meta` tag in the site's HTML source code. Site Kit Service then checks the site for whether it includes the verification token - if yes, the user is verified as an owner of the site.

Behind the scenes, this uses the [Google Site Verification API](https://developers.google.com/site-verification). Since that API is also integrated in various other Google products, in some situations a user may already be a verified site owner even before using Site Kit. In that case, Site Kit Service is able to detect that and will bypass the step accordingly.

Note that this step is not only a requirement for the site to receive a token, it is also the (only) requirement for the site to receive its site credentials from Site Kit Service. While Site Kit Service generates credentials (site ID and site secret, see above) for a site as soon as it is registered, the site credentials are only exposed to the site once the current user is proven to be a verified site owner.

#### Step 2: Delegation Consent

During the regular OAuth flow, in the OAuth consent screen, the user grants the client application permission to access certain parts of their Google account data, based on the scopes requested. Since only Site Kit Service has access to the OAuth client credentials though, only Site Kit Service is directly connected to Google's OAuth authorization servers. In other words, when a user goes through the OAuth consent screen in the Site Kit setup flow, they technically only grant access to their Google account data to Site Kit Service, but not to the actual WordPress site with the Site Kit plugin.

For this purpose, a separate "delegation consent" exists. This step is a simple prompt, in which the user has to explicitly consent to delegating the access that previously was granted to Site Kit Service onwards to their WordPress site with the plugin.

#### Step 3: Search Console property

This requirement is slightly different from the first two, in that it is not a requirement for security and privacy reasons, but purely because the Site Kit plugin requires Search Console to be configured as a minimum foundation (see ["The modules of Site Kit"](./The-modules-of-Site-Kit.md)). For that reason, connecting a Search Console property is mandatory and included in the setup flow as a requirement.

Behind the scenes, this uses the [Google Search Console API](https://developers.google.com/webmaster-tools/search-console-api-original). This API also integrates with the aforementioned Site Verification API, and a user can only add a Search Console property for a site for which they are verified as an owner. Since [Search Console also offers a dedicated web frontend](https://search.google.com/search-console), it is possible that a user may already have created a Search Console property for their site before using Site Kit. In that case, Site Kit Service is able to detect that and will skip this step accordingly.

## Revoking access on the service

Google offers a dedicated [permissions UI](https://myaccount.google.com/permissions) where a user can manage which OAuth applications have access to their account data. For a user using Site Kit, this list of applications will include Site Kit Service, so they could revoke access at any time if they wanted to. However, this comes with a caveat for users that have more than one WordPress site with Site Kit active.

Because Site Kit Service is a single OAuth application, it is not possible through the regular OAuth UI to granularly revoke access, for example to only remove access for one of multiple WordPress sites that a user controls.

This is why Site Kit Service offers its own dedicated permissions screen which can be accessed from the plugin: In the Site Kit user menu on the upper right of the screen, there is an entry to "Manage permissions", which leads to the Site Kit Service permissions screen. This screen includes all Site Kit sites that have access to the current user's Google account data, and access can be revoked individually per site.

## Additional features of the service

While Site Kit Service was originally created to facilitate the authentication flow of granting a WordPress site with Site Kit access to Google services, over time it has evolved and received a few additional features. These features are typically auxiliary features and will not be covered in depth as part of this article. However, the following list provides a brief overview:

* Site Kit Service includes an endpoint which remotely controls Site Kit plugin feature flags and is regularly communicated with from the Site Kit plugin. [More information on feature flags and the role of that endpoint can be found in this article.](./Usage-of-feature-flags.md)
* Similar to the features endpoint, Site Kit Service also offers an endpoint with remote-controlled site notifications, which typically inform users of Site Kit of critical problems in their configuration.
* In addition to the site notifications endpoint, Site Kit Service also provides endpoints to control user surveys that can be rendered e.g. in the Site Kit dashboard in the plugin. The plugin can trigger/request surveys based on user interactions, and when a survey is rendered, any interactions with it will be sent as events to Site Kit Service. Note that while the Site Kit Service notifications mentioned above apply to an entire site, surveys are scoped per user.
* Site Kit Service offers additional proxy endpoints related to creating a Google Analytics account using the [Google Analytics Provisioning API](https://developers.google.com/analytics/devguides/config/provisioning/v3), since that API also encompasses a few requirements that would not be achievable in a centralized open-source ecosystem like WordPress.

A final note on the Site Kit authentication service: There is also a staging version available, which is sometimes needed for testing integrations between the plugin and an early Site Kit Service feature. For regular development though, the production version of Site Kit Service should be used. [Learn more in the dedicated article about the staging version of the authentication service.](./Developing-against-the-authentication-service-staging-version.md)
