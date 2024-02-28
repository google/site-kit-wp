/**
 * E2E utilities.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export { activateAMPWithMode, setAMPMode } from './activate-amp-and-set-mode';
export { activatePlugins, deactivatePlugins } from './activate-plugins';
export { clearCookiesByPrefix } from './clear-cookies';
export { clearSessionStorage } from './clear-session-storage';
export { createWaitForFetchRequests } from './create-wait-for-fetch-requests';
export { deactivateUtilityPlugins } from './deactivate-utility-plugins';
export { evalWithWPData } from './eval-with-wp-data';
export { fetchPageContent } from './fetch-page-content';
export { getWPVersion } from './get-wp-version';
export { logoutUser } from './logout-user';
export { pageWait } from './page-wait';
export { pasteText } from './paste-text';
export { resetSiteKit } from './reset';
export { safeLoginUser } from './safe-login-user';
export { setAnalyticsExistingPropertyID } from './set-analytics-existing-property-id';
export { setAuthToken } from './set-auth-token';
export { setClientConfig } from './set-client-config';
export { setEditPostFeature } from './set-edit-post-feature';
export { setSearchConsoleProperty } from './set-search-console-property';
export { setSiteVerification } from './set-site-verification';
export { setupAdSense } from './setup-adsense';
export { setupAnalytics, setupAnalytics4 } from './setup-analytics';
export { setupSiteKit } from './setup-site-kit';
export { switchDateRange } from './switch-date-range';
export { testClientConfig } from './test-client-config';
export { testSiteNotification } from './test-site-notification';
export { useRequestInterception } from './use-request-interception';
export { useSharedRequestInterception } from './use-request-interception';
export { wpApiFetch } from './wp-api-fetch';
export * from './console';
export * from './features';
export * from './step-and-screenshot';
