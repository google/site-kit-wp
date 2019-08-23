/**
 * firstPostWin function.
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

const { __ } = wp.i18n;

const firstPostWin = ( id ) => {

	const showNotification = 1 === parseInt( googlesitekit.admin.newSitePosts, 10 );

	if ( ! showNotification ) {
		return false;
	}

	return {
		id,
		title: __( 'Congrats on your first post!', 'google-site-kit' ),
		format: 'small',
		smallImage: `${googlesitekit.admin.assetsRoot}images/thumbs-up.png`,
		type: 'win-success',
		showOnce: true,
	};
};

export default firstPostWin;


