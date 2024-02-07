/**
 * Analytics datastore test factory: html-with-tag.
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

function tagHeadHTML( analyticsID ) {
	return `<!-- Global site tag (gtag.js) - Google Analytics -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=${ analyticsID }"></script>
	<script>
	  window.dataLayer = window.dataLayer || [];
	  function gtag(){dataLayer.push(arguments);}
	  gtag('js', new Date());
	
	  gtag('config', '${ analyticsID }');
	</script>`;
}

/**
 * Generates valid HTML with an Analytics tag.
 *
 * @since 1.13.0
 * @since n.e.x.t Migrated from analytics to analytics-4.
 *
 * @param {string} analyticsID Analytics ID to generate tag with.
 * @return {string} HTML.
 */
export function generateHTMLWithTag( analyticsID ) {
	return `
		<!DOCTYPE html>
		<html>
			<head>
				${ analyticsID && tagHeadHTML( analyticsID ) }
				<title>Test Title</title>
			</head>
			<body>
				<h1>Test Title</h1>
			</body>
		</html>
	`;
}
