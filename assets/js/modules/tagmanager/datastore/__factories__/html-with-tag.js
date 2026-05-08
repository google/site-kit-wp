/**
 * Tag Manager datastore test factory: html-with-tag.
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

function tagHeadHTML( containerID ) {
	return `<!-- Google Tag Manager -->
		<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
		new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
		j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
		'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
		})(window,document,'script','dataLayer','${ containerID }');</script>
		<!-- End Google Tag Manager -->
	`;
}

function tagBodyOpenHTML( containerID ) {
	return `<!-- Google Tag Manager (noscript) -->
		<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${ containerID }"
		height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
		<!-- End Google Tag Manager (noscript) -->
	`;
}

/**
 * Generates valid HTML with or without a GTM tag.
 *
 * @since 1.11.0
 *
 * @param {string} [containerID] Optional. Container ID to generate tag with.
 * @return {string} HTML.
 */
export function generateHTMLWithTag( containerID ) {
	return `
		<!DOCTYPE html>
		<html>
			<head>
				<title>Test Title</title>
				${ containerID && tagHeadHTML( containerID ) }
			</head>
			<body>
				${ containerID && tagBodyOpenHTML( containerID ) }
				<h1>Test Title</h1>
			</body>
		</html>
	`;
}

/**
 * Generates valid HTML without a GTM tag.
 *
 * @since 1.11.0
 *
 * @return {string} HTML.
 */
export function generateHTMLWithNoTag() {
	return generateHTMLWithTag();
}
