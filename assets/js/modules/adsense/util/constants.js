/**
 * AdSense constants.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

export const ACCOUNT_STATUS_NONE = 'none';
export const ACCOUNT_STATUS_DISAPPROVED = 'disapproved';
export const ACCOUNT_STATUS_GRAYLISTED = 'graylisted';
export const ACCOUNT_STATUS_MULTIPLE = 'multiple';
export const ACCOUNT_STATUS_DISAPPROVED_AFC = 'disapproved-afc';
export const ACCOUNT_STATUS_PENDING = 'pending';
export const ACCOUNT_STATUS_APPROVED = 'approved';

// TODO: If AdSense API exposes more information, site status can be determined
// much more accurately than the two statuses below.
export const SITE_STATUS_NONE = 'none';
export const SITE_STATUS_ADDED = 'added';
