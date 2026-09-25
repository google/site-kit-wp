/**
 * Error fingerprinting for OpenTelemetry reporting.
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
 * Why this file exists.
 *
 * One bug does not produce one error string. In the current GA reporting,
 * `Cannot destructure property 'triggerTourForView'` appears as at least seven
 * separate rows, because GA splits on the view context it happened in, and the
 * minified variable name inside the message (`(0 , l.useDispatch)`) changes
 * with every build — so the same bug looks like a different bug in every
 * release.
 *
 * A fingerprint collapses those back into one issue. We strip everything that
 * varies between builds, sites and page loads, keep what is invariant, and
 * hash the result.
 *
 * This is deliberately computed on the client rather than in the backend.
 * Site Kit has no Sentry, and neither Loki nor Cloud Logging will group errors
 * on its own — so grouping has to travel with the record if it is to survive a
 * change of backend. That portability is the whole reason for choosing
 * OpenTelemetry over a vendor SDK, and grouping is the place it pays off.
 *
 * Tuning note: the rules below trade two failure modes against each other.
 * Too aggressive and unrelated bugs merge into one issue (false grouping,
 * which hides bugs). Too timid and one bug splits across releases (false
 * splitting, which is what we have today). When in doubt, prefer splitting —
 * a duplicate issue is an annoyance, a hidden bug is a missed fix. Every
 * record carries `sitekit.fingerprint_input` so the normalised string can be
 * inspected and these rules tuned against real data rather than guesses.
 */

/**
 * Number of stack frames included in the fingerprint.
 *
 * Deep frames are noisy and vary with React internals; the top few are where
 * the identity of a bug actually lives.
 */
const FINGERPRINT_STACK_FRAMES = 3;

/**
 * Normalises an error string by removing everything that varies between
 * builds, sites and page loads.
 *
 * @since n.e.x.t
 *
 * @param {string} input Raw error text.
 * @return {string} Normalised text, safe to hash.
 */
export function normalizeForFingerprint( input: string ): string {
	if ( typeof input !== 'string' || ! input ) {
		return '';
	}

	return (
		input
			// URLs differ per site and carry the site's own domain.
			.replace( /https?:\/\/[^\s)]+/g, '<url>' )
			// Absolute filesystem paths differ per host, and leak the hosting
			// account name. Redacted for privacy elsewhere; removed here
			// because they also break grouping.
			.replace( /(?:\/[\w.@-]+){2,}/g, '<path>' )
			// `:line:col` suffixes shift on every build even when the code is
			// unchanged, which is one of the main causes of false splitting.
			.replace( /:\d+:\d+/g, '' )
			// Webpack chunk hashes and similar build-scoped identifiers. The
			// lookahead requires at least one a–f character: digits are valid
			// hex, so without it this rule swallows plain numbers — including
			// dates and IDs — before the digit rule below ever sees them.
			.replace( /\b(?=[0-9a-f]*[a-f])[0-9a-f]{8,}\b/gi, '<hash>' )
			// Minified identifiers: a one- or two-character name immediately
			// before a property access, as in `(0 , l.useDispatch)`. The `l`
			// is assigned by the minifier and changes between releases; the
			// property name after it does not, and is the part worth keeping.
			.replace( /\b[a-zA-Z_$]{1,2}\.(?=[a-zA-Z_$])/g, '*.' )
			// Long digit runs are IDs, counts and timestamps. The threshold is
			// six rather than three because React's minified error codes are
			// three digits (`error #152`, `#418`, `#423`) and they identify
			// the bug — collapsing them would merge genuinely different
			// errors into one issue, which is the failure mode that hides
			// bugs rather than merely duplicating them.
			.replace( /\b\d{6,}\b/g, '<n>' )
			.replace( /\s+/g, ' ' )
			.trim()
	);
}

/**
 * Computes a 32-bit FNV-1a hash of a UTF-8 string.
 *
 * FNV-1a is chosen for portability rather than cryptographic strength: it is
 * a few lines in any language, so the PHP emitter can produce byte-identical
 * fingerprints for the same normalised input. That matters — a browser error
 * and a PHP error arising from the same root cause should group together, and
 * they cannot if the two sides disagree about the hash.
 *
 * Bytes rather than UTF-16 code units are hashed, so that non-ASCII error text
 * fingerprints identically in both languages.
 *
 * @since n.e.x.t
 *
 * @param {string} input String to hash.
 * @return {string} Eight-character lowercase hex hash.
 */
export function fnv1a32( input: string ): string {
	const bytes = new TextEncoder().encode( input );

	let hash = 0x811c9dc5;

	// Bitwise arithmetic is inherent to FNV-1a; the alternative is not a
	// cleaner hash but a different, non-portable one.
	/* eslint-disable no-bitwise */
	for ( let index = 0; index < bytes.length; index++ ) {
		hash ^= bytes[ index ];
		// Math.imul keeps the multiply in 32-bit space; a plain `*` would lose
		// precision above 2^53 and diverge from the PHP implementation.
		hash = Math.imul( hash, 0x01000193 ) >>> 0;
	}
	/* eslint-enable no-bitwise */

	return hash.toString( 16 ).padStart( 8, '0' );
}

/**
 * Builds the string that gets hashed into a fingerprint.
 *
 * Exported separately from {@link getFingerprint} so it can be attached to
 * every record for tuning.
 *
 * @since n.e.x.t
 *
 * @param {string} type    Error constructor name, e.g. `TypeError`.
 * @param {string} message Error message.
 * @param {string} [stack] Optional. Stack or component stack.
 * @return {string} Normalised fingerprint input.
 */
export function getFingerprintInput(
	type: string,
	message: string,
	stack?: string
): string {
	const frames = ( stack || '' )
		.split( '\n' )
		.map( ( frame ) => frame.trim() )
		.filter( Boolean )
		.slice( 0, FINGERPRINT_STACK_FRAMES )
		.join( ' | ' );

	return [
		normalizeForFingerprint( type || 'Error' ),
		normalizeForFingerprint( message ),
		normalizeForFingerprint( frames ),
	]
		.filter( Boolean )
		.join( ' :: ' );
}

/**
 * Computes a stable fingerprint for an error.
 *
 * @since n.e.x.t
 *
 * @param {string} type    Error constructor name.
 * @param {string} message Error message.
 * @param {string} [stack] Optional. Stack or component stack.
 * @return {string} Fingerprint hash.
 */
export function getFingerprint(
	type: string,
	message: string,
	stack?: string
): string {
	return fnv1a32( getFingerprintInput( type, message, stack ) );
}
