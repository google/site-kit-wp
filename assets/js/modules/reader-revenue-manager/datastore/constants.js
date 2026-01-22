/**
 * `modules/reader-revenue-manager` data store constants.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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

export const ERROR_CODE_NON_HTTPS_SITE = 'non_https_site';

export const MODULES_READER_REVENUE_MANAGER = 'modules/reader-revenue-manager';

export const PUBLICATION_ONBOARDING_STATES = {
	ONBOARDING_COMPLETE: 'ONBOARDING_COMPLETE',
	ONBOARDING_ACTION_REQUIRED: 'ONBOARDING_ACTION_REQUIRED',
	PENDING_VERIFICATION: 'PENDING_VERIFICATION',
	UNSPECIFIED: 'ONBOARDING_STATE_UNSPECIFIED',
};

export const CONTENT_POLICY_STATES = {
	CONTENT_POLICY_STATE_OK: 'CONTENT_POLICY_STATE_OK',
	CONTENT_POLICY_VIOLATION_GRACE_PERIOD:
		'CONTENT_POLICY_VIOLATION_GRACE_PERIOD',
	CONTENT_POLICY_ORGANIZATION_VIOLATION_GRACE_PERIOD:
		'CONTENT_POLICY_ORGANIZATION_VIOLATION_GRACE_PERIOD',
	CONTENT_POLICY_VIOLATION_ACTIVE: 'CONTENT_POLICY_VIOLATION_ACTIVE',
	CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE:
		'CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE',
	CONTENT_POLICY_ORGANIZATION_VIOLATION_IMMEDIATE:
		'CONTENT_POLICY_ORGANIZATION_VIOLATION_IMMEDIATE',
};

export const PENDING_POLICY_VIOLATION_STATES = [
	CONTENT_POLICY_STATES.CONTENT_POLICY_VIOLATION_GRACE_PERIOD,
	CONTENT_POLICY_STATES.CONTENT_POLICY_ORGANIZATION_VIOLATION_GRACE_PERIOD,
];

export const ACTIVE_POLICY_VIOLATION_STATES = [
	CONTENT_POLICY_STATES.CONTENT_POLICY_VIOLATION_ACTIVE,
	CONTENT_POLICY_STATES.CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE,
	CONTENT_POLICY_STATES.CONTENT_POLICY_ORGANIZATION_VIOLATION_IMMEDIATE,
];

export const LEGACY_RRM_SETUP_BANNER_DISMISSED_KEY =
	'rrm_module_setup_banner_dismissed_key';

export const READER_REVENUE_MANAGER_SETUP_FORM =
	'readerRevenueManagerSetupForm';

export const READER_REVENUE_MANAGER_NOTICES_FORM =
	'readerRevenueManagerNoticesForm';

export const SHOW_PUBLICATION_CREATE = 'showPublicationCreate';

export const RESET_PUBLICATIONS = 'resetPublications';

export const SYNC_PUBLICATION = 'syncPublication';
