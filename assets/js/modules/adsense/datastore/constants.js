/**
 * `modules/adsense` data store constants.
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

export const MODULES_ADSENSE = 'modules/adsense';

// Date range offset days for AdSense report requests.
export const DATE_RANGE_OFFSET = 1;

export const API_STATE_READY = 'READY';
export const API_STATE_NEEDS_ATTENTION = 'NEEDS_ATTENTION';
export const API_STATE_REQUIRES_REVIEW = 'REQUIRES_REVIEW';
export const API_STATE_GETTING_READY = 'GETTING_READY';

// State to determine whether background submission is allowable.
export const BACKGROUND_SUBMIT_SUSPENDED = 'background-submit-suspended';

export const AD_BLOCKING_RECOVERY_SETUP_SUCCESS_NOTIFICATION_ID =
	'ad-blocking-recovery-setup-success';
export const AD_BLOCKING_FORM_SETTINGS = 'adsenseAdBlockingFormSettings';

export const AD_BLOCKING_RECOVERY_SETUP_CREATE_MESSAGE_CTA_CLICKED =
	'googlesitekit-ad-blocking-recovery-setup-create-message-cta-clicked';

export const AD_BLOCKING_RECOVERY_MAIN_NOTIFICATION_KEY =
	'ad-blocking-recovery-notification';

// Various ad blocking recovery setup statuses.
export const ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS = {
	TAG_PLACED: 'tag-placed',
	SETUP_CONFIRMED: 'setup-confirmed',
};

// Zero-based index of the available ad blocking recovery setup steps.
export const ENUM_AD_BLOCKING_RECOVERY_SETUP_STEP = {
	PLACE_TAGS: 0,
	CREATE_MESSAGE: 1,
	COMPLETE: 2,
};
