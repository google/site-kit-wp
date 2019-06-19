/**
 * Test functions.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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

import {
	getTimeInSeconds,
	changeToPercent,
	prepareSecondsForDisplay,
	removeURLParameter,
	decodeHtmlEntity,
	readableLargeNumber,
	numberFormat,
	getDaysBetweenDates,
	getQueryParameter,
	extractForSparkline,
	getReAuthUrl,
	fillFilterWithComponent,
	getSiteKitAdminURL,
	isFrontendIframeLoaded,
	validateJSON,
	validateOptimizeID,
	appendNotificationsCount,
	sendAnalyticsTrackingEvent,
	storageAvailable,
	setCache,
	getCache,
	deleteCache,
	findTagInIframeContent,
	activateOrDeactivateModule,
	toggleConfirmModuleSettings,
	showErrorNotification,
} from 'GoogleUtil';
window.googlesitekit = window.googlesitekit || {};
googlesitekit.testFunctions = {
	getTimeInSeconds,
	changeToPercent,
	prepareSecondsForDisplay,
	removeURLParameter,
	decodeHtmlEntity,
	readableLargeNumber,
	numberFormat,
	getDaysBetweenDates,
	getQueryParameter,
	extractForSparkline,
	getReAuthUrl,
	fillFilterWithComponent,
	getSiteKitAdminURL,
	isFrontendIframeLoaded,
	validateJSON,
	validateOptimizeID,
	appendNotificationsCount,
	sendAnalyticsTrackingEvent,
	storageAvailable,
	setCache,
	getCache,
	deleteCache,
	findTagInIframeContent,
	activateOrDeactivateModule,
	toggleConfirmModuleSettings,
	showErrorNotification,
};
