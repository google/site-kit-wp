/**
 * Avatar image for test and story users.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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

// An inline image, so stories render the avatar without loading anything from
// the network, which visual regression tests don't allow.
export const USER_AVATAR_URL =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23c4c7c5'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23fff'/%3E%3Cpath d='M18 92c4-18 18-28 32-28s28 10 32 28' fill='%23fff'/%3E%3C/svg%3E";
