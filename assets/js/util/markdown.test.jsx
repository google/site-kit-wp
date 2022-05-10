/**
 * Markdown tests.
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

import { markdownToHTML } from './markdown';

describe( 'markdownToHTML', () => {
	const testMarkdown = ( _, markdown, html ) =>
		expect( markdownToHTML( markdown ) ).toBe( html );

	describe( 'paragraphs', () => {
		it.each( [
			[
				'should correctly wrap a signle paragraph with <p> tag',
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec et ligula volutpat, bibendum felis vitae, commodo quam.',
				'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec et ligula volutpat, bibendum felis vitae, commodo quam.</p>',
			],
			[
				'should correctly wrap multiple paragraphs with <p> tag',
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n\nDonec et ligula volutpat, bibendum felis vitae, commodo quam.',
				'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p><p>Donec et ligula volutpat, bibendum felis vitae, commodo quam.</p>',
			],
		] )( '%s', testMarkdown );
	} );

	describe( 'line breaks', () => {
		it.each( [
			[
				'should correctly break a signle line',
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit.\nDonec et ligula volutpat, bibendum felis vitae, commodo quam.',
				'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.<br>Donec et ligula volutpat, bibendum felis vitae, commodo quam.</p>',
			],
			[
				'should correctly break multiple lines',
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit.\nDonec et ligula volutpat,\nbibendum felis vitae, commodo quam.',
				'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.<br>Donec et ligula volutpat,<br>bibendum felis vitae, commodo quam.</p>',
			],
		] )( '%s', testMarkdown );
	} );

	describe( 'links', () => {
		it.each( [
			[
				'should replace links at the beginning of the text',
				'[test](http://example.com/) link',
				'<p><a href="http://example.com/" target="_blank" rel="noopener noreferrer">test</a> link</p>',
			],
			[
				'should replace links at the end of the text',
				'link [test](http://example.com/)',
				'<p>link <a href="http://example.com/" target="_blank" rel="noopener noreferrer">test</a></p>',
			],
			[
				'should replace all links in the text',
				'Lorem ipsum [dolor](http://example.com/) sit amet, consectetur adipiscing elit.\nDonec et ligula volutpat, bibendum [felis](http://lipsum.com/) vitae, commodo quam.',
				'<p>Lorem ipsum <a href="http://example.com/" target="_blank" rel="noopener noreferrer">dolor</a> sit amet, consectetur adipiscing elit.<br>Donec et ligula volutpat, bibendum <a href="http://lipsum.com/" target="_blank" rel="noopener noreferrer">felis</a> vitae, commodo quam.</p>',
			],
		] )( '%s', testMarkdown );
	} );
} );
