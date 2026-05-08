/**
 * `modules/tagmanager` data store constants.
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

export const MODULES_TAGMANAGER = 'modules/tagmanager';

// A special Account ID value used for the "Set up a new account" option.
export const ACCOUNT_CREATE = 'account_create';
// A special Container ID value used for the "Set up a new container" option.
export const CONTAINER_CREATE = 'container_create';
// Usage context for web containers.
export const CONTEXT_WEB = 'web';
// Usage context for AMP containers.
export const CONTEXT_AMP = 'amp';
// Form ID for the module setup form.
export const FORM_SETUP = 'tagmanagerSetup';
// OAuth scope needed for viewing containers.
export const READ_SCOPE = 'https://www.googleapis.com/auth/tagmanager.readonly';
// OAuth scope needed for creating containers.
export const EDIT_SCOPE =
	'https://www.googleapis.com/auth/tagmanager.edit.containers';
// A special setupMode value for when completing setup with Analytics.
export const SETUP_MODE_WITH_ANALYTICS = 'SETUP_WITH_ANALYTICS';
