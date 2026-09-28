/**
 * Features Menu constants
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

/**
 * Class name on the header button that opens the features menu.
 *
 * The email reports setup tooltip anchors to this button on mobile and
 * tablet, so the class is shared rather than repeated as a selector string.
 *
 * @since 1.186.0
 */
export const FEATURES_MENU_BUTTON_CLASS = 'googlesitekit-features-menu__button';

/**
 * Window width at or below which the main dashboard header feature actions
 * collapse into the features menu when the "Add features" button is shown.
 *
 * The "Add features" button widens the header actions enough to overlap the
 * logo above the tablet breakpoint (`960px`) when the WordPress admin menu is
 * expanded. The main dashboard also shows the PDF download button, so it needs
 * a wider threshold than the entity dashboard.
 *
 * @since n.e.x.t
 */
export const MAIN_DASHBOARD_FEATURES_MENU_COLLAPSE_WIDTH = 1060;

/**
 * Window width at or below which the entity dashboard header feature actions
 * collapse into the features menu when the "Add features" button is shown.
 *
 * @since n.e.x.t
 */
export const ENTITY_DASHBOARD_FEATURES_MENU_COLLAPSE_WIDTH = 1000;
