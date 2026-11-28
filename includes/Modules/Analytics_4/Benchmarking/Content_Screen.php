<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Benchmarking\Content_Screen
 *
 * @package   Google\Site_Kit\Modules\Analytics_4\Benchmarking
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4\Benchmarking;

use Google\Site_Kit_Dependencies\Normalizer as Normalizer_Polyfill;

/**
 * Screens the names a key factor card may show: search keywords, sources,
 * campaign names and post titles.
 *
 * It ports the service's screens (§5.9 "Multilingual Content Safety
 * Pre-filtering"), so a card never shows a name the service leaves out of
 * the insight: `IsSensitiveContent()` and `IsOpaqueOrPersonalLabel()` of
 * `internal/utils/sanitizer`, and the markers its output check rejects,
 * `hasOutputBlockedMarker()` of `internal/ai/validator.go`. The terms and
 * the rules must change with the service's.
 *
 * The sensitive-content screen normalizes a name, splits it into tokens and
 * matches a curated multilingual term set as whole tokens, stems or, for
 * scripts written without spaces and strings no ordinary word contains,
 * substrings:
 * - The name is put in Unicode NFKC and lower case, without Latin
 *   diacritics, Arabic harakat and tatweel, zero-width characters or soft
 *   hyphens, and with Arabic letter variants unified.
 * - In a token that holds a Latin letter, Cyrillic and Greek look-alikes,
 *   and the digits and symbols of leetspeak, become the Latin letters they
 *   stand for. A token written wholly in look-alike letters is also read as
 *   Latin.
 * - Repeated letters collapse, and runs of one-letter tokens join, so
 *   "xxx" is "x" and "s e x" is "sex".
 * It fails closed on the bare word: "sex education policy" is sensitive.
 *
 * A host without the intl extension normalizes with Symfony's polyfill, and
 * one without mbstring puts only ASCII letters in lower case.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Content_Screen {

	/**
	 * The characters Search Console and users put in place of the letters of
	 * a masked word.
	 *
	 * @since n.e.x.t
	 */
	const MASK_CHARACTERS = '*•#∗✱⁎';

	/**
	 * The markers the service's output check rejects, in lower case. The
	 * insight quotes names as they are, so a name with one would fail it.
	 *
	 * @since n.e.x.t
	 */
	const BLOCKED_MARKERS = array(
		'javascript:',
		'data:text/html',
		'vbscript:',
		'system:',
		'ignore previous instructions',
		'ignore all previous instructions',
		'you are now',
		'prompt override',
		'### system',
	);

	/**
	 * Terms matched against a whole token.
	 *
	 * @since n.e.x.t
	 */
	const EXACT_TERMS = array(
		// Latin. "chut" and "lund" have rules of their own.
		'nsfw',
		'nude',
		'nudes',
		'nudity',
		'naked',
		'nangi',
		'fuck',
		'fck',
		'fuk',
		'phuck',
		'pussy',
		'dick',
		'cock',
		'pron',
		'chutiya',
		'bokep',
		'ngentot',
		'memek',
		'follando',
		'desnuda',
		'desnudas',
		'desnudo',
		'desnudos',
		'puta',
		'putas',
		'redtube',
		'brazzers',
		'spankbang',
		'chaturbate',
		// Arabic, whole tokens only, since نيك is inside تقنيك and ميكانيك, and
		// كس inside عكس.
		'نيك',
		'النيك',
		'طيز',
		'كس',
		'جنسي',
		'سكسي',
		'بورن',
		'بورنو',
		'ملط',
		// Devanagari. लंड is inside लंडन, so it is a whole token.
		'लंड',
		'नंगी',
		'बीएफ',
		// Tamil.
		'ஓழ்',
	);

	/**
	 * Terms matched against the start of a token.
	 *
	 * @since n.e.x.t
	 */
	const STEM_TERMS = array(
		'fuck',
		'chud',
		'chod',
		'erotic',
		'erotik',
		'erotis',
		'sikis',
		// Arabic "naked", a stem since استعاري ("metaphorical") holds عاري.
		'عاري',
		'عريان',
	);

	/**
	 * Terms matched anywhere in a token. The Latin ones are strings no
	 * ordinary word holds, and the others are of scripts often written
	 * without spaces.
	 *
	 * @since n.e.x.t
	 */
	const SUBSTRING_TERMS = array(
		// Latin.
		'porn',
		'hentai',
		'xnx',
		'xhamster',
		'xhopen',
		// Arabic.
		'سكس',
		'اباحي',
		'نسوانجي',
		'شرموط',
		'قحب',
		// Devanagari.
		'चोद',
		'चुद',
		'चूत',
		'सेक्स',
		'पोर्न',
		'एक्सएक्स',
		'एक्सएनएक्स',
		'ब्लूफिल्म',
		// Bengali.
		'সেক্স',
		'চোদ',
		'চুদ',
		'পর্ন',
		'এক্সএক্স',
		// Tamil.
		'செக்ஸ',
		'ஆபாச',
		// Telugu.
		'సెక్స్',
		'దెంగ',
		'పోర్న్',
		'బూతు',
		// Cyrillic.
		'порн',
		'секс',
		'эротик',
		'эротич',
		// Chinese, Japanese and Korean. 成人影 alone is inside 成人影响 ("affects
		// adults").
		'色情',
		'情色',
		'成人网',
		'成人網',
		'成人影片',
		'成人影院',
		'成人影视',
		'成人影視',
		'成人视',
		'成人視',
		'成人站',
		'成人片',
		'黄色网',
		'黃色網',
		'黄色视',
		'黃色視',
		'黄色影',
		'黄片',
		'黃片',
		'a片',
		'av女优',
		'av女優',
		'无码',
		'無碼',
		'做爱',
		'做愛',
		'性交',
		'アダルト',
		'ポルノ',
		'セックス',
		'야동',
		'섹스',
		'포르노',
		// Thai.
		'เย็ด',
		'โป๊',
	);

	/**
	 * Terms matched against two adjacent tokens joined, so a site name or
	 * "xx" written as two words is caught.
	 *
	 * @since n.e.x.t
	 */
	const PAIR_SITE_TERMS = array( 'xnx', 'xhamster', 'xhopen', 'एक्सएक्स', 'এক্সএক্স', 'एक्सएनएक्स' );

	/**
	 * The letter x written in other scripts.
	 *
	 * @since n.e.x.t
	 */
	const X_TERMS = array( 'एक्स', 'এক্স', 'எக்ஸ்', 'ఎక్స్' );

	/**
	 * Video words in scripts other than Latin.
	 *
	 * @since n.e.x.t
	 */
	const SCRIPT_VIDEO_TERMS = array(
		'वीडियो',
		'विडियो',
		'विडीयो',
		'व्हिडिओ',
		'वीडियोज',
		'ভিডিও',
		'வீடியோ',
		'வீடியோஸ்',
		'వీడియో',
		'వీడియోలు',
		'видео',
		'видос',
	);

	/**
	 * The Hinglish and Hindi words skipped between two adjacent tokens, so
	 * "bf wala video" is read as "bf video".
	 *
	 * @since n.e.x.t
	 */
	const FILLER_TERMS = array( 'wala', 'wali', 'wale', 'vala', 'vali', 'vale', 'ka', 'ki', 'ke', 'वाला', 'वाली', 'वाले', 'का', 'की', 'के' );

	/**
	 * The words that keep "lund" when a name is about the Swedish city or its
	 * university.
	 *
	 * @since n.e.x.t
	 */
	const LUND_PLACE_TERMS = array( 'university', 'universitet', 'universitets', 'uni', 'sweden', 'sverige', 'skane', 'skåne', 'city', 'kommun', 'stad', 'malmo', 'malmö', 'lth', 'lu' );

	/**
	 * The Arabic words for "sex", also "gender" and "kind", which are adult
	 * only next to a word of `ARABIC_SEX_CONTEXT_TERMS`.
	 *
	 * @since n.e.x.t
	 */
	const ARABIC_SEX_TERMS = array( 'جنس', 'الجنس' );

	/**
	 * The Arabic film and picture words that make `ARABIC_SEX_TERMS` adult.
	 *
	 * @since n.e.x.t
	 */
	const ARABIC_SEX_CONTEXT_TERMS = array( 'فيديو', 'فيديوهات', 'افلام', 'فلم', 'فيلم', 'صور', 'مقاطع', 'مقطع' );

	/**
	 * Phrases matched against the tokens joined by single spaces.
	 *
	 * @since n.e.x.t
	 */
	const PHRASES = array( 'blue film', 'blue films', 'blue picture', 'ब्लू फिल्म', 'gand marne', 'gand mari', 'gand marna' );

	/**
	 * The Cyrillic and Greek letters that look like Latin ones, and the
	 * Turkish dotless i, with the Latin letter each stands for.
	 *
	 * @since n.e.x.t
	 */
	const LATIN_LOOKALIKES = array(
		'а' => 'a',
		'е' => 'e',
		'ё' => 'e',
		'і' => 'i',
		'ї' => 'i',
		'ј' => 'j',
		'к' => 'k',
		'о' => 'o',
		'р' => 'p',
		'с' => 'c',
		'у' => 'y',
		'х' => 'x',
		'ѕ' => 's',
		'ԁ' => 'd',
		'α' => 'a',
		'ε' => 'e',
		'ι' => 'i',
		'κ' => 'k',
		'ν' => 'v',
		'ο' => 'o',
		'ρ' => 'p',
		'τ' => 't',
		'υ' => 'u',
		'χ' => 'x',
		'ı' => 'i',
	);

	/**
	 * The digits and symbols that stand for Latin letters.
	 *
	 * @since n.e.x.t
	 */
	const LEETSPEAK = array(
		'0' => 'o',
		'1' => 'i',
		'3' => 'e',
		'4' => 'a',
		'5' => 's',
		'7' => 't',
		'@' => 'a',
		'$' => 's',
	);

	/**
	 * A Latin video word, after collapsing: video, vidio, vedio, videyo,
	 * vidieo, videos, videoz, and the Turkish videolar. Not vids.
	 *
	 * @since n.e.x.t
	 */
	const LATIN_VIDEO_PATTERN = '/^v[ie]d[eiy]{0,2}o(s|z|lar|lari)?$/u';

	/**
	 * "sex", its spellings and its compounds. "sussex", "essex", "unisex" and
	 * "sexta" don't match, since the token must start with the stem and end
	 * with one of the endings.
	 *
	 * @since n.e.x.t
	 */
	const LATIN_SEX_PATTERN = '/^(sex|seks|sxy|sxsi|sexsi)(y|i|o|e|s|vid.*|movie.*|film.*|tape.*|chat.*|cam.*)?$/u';

	/**
	 * The x and video family run together, after collapsing: xvideo, xvideos,
	 * xvidio, xvedio, xvideyo. Not the Xvid codec.
	 *
	 * @since n.e.x.t
	 */
	const X_VIDEO_PATTERN = '/^xv[ie]d[eiy]{0,2}o/u';

	/**
	 * The words that make "bf" a blue film rather than a boyfriend, and
	 * "dewasa" (Indonesian "adult", also "mature") an adult film rather than
	 * adult clothing.
	 *
	 * @since n.e.x.t
	 */
	const FILM_CONTEXT_PATTERN = '/^(film.*|movie.*|picture|pic|dikh.*|dekh.*|situs)$/u';

	/**
	 * A label that is only an ID: digits, possibly behind a short prefix, such
	 * as `20103244` or `wnc_376106`.
	 *
	 * @since n.e.x.t
	 */
	const OPAQUE_ID_PATTERN = '/^[A-Za-z]{0,4}[_-]?[0-9]{5,}$/D';

	/**
	 * A label that is only a capitalized first name and a long digit tag, a
	 * date stamp or an ID, such as `Maria_20250417`. A word and a year, such
	 * as `Summer 2024`, is how seasonal campaigns are named, so a tag of four
	 * digits or fewer, or any further words, keeps the label.
	 *
	 * @since n.e.x.t
	 */
	const LEADING_NAME_TAG_PATTERN = '/^\p{Lu}\p{Ll}+[\t\n\f\r _-]+[0-9]{5,}$/uD';

	/**
	 * A segment that ends in a capitalized first name, such as
	 * `Vinte e seis Elena`.
	 *
	 * @since n.e.x.t
	 */
	const TRAILING_NAME_PATTERN = '/(^|[\t\n\f\r ])\p{Lu}\p{Ll}+$/uD';

	/**
	 * The normalization forms, as `Normalizer` numbers them.
	 *
	 * @since n.e.x.t
	 */
	const FORM_D  = 4;
	const FORM_C  = 16;
	const FORM_KC = 32;

	/**
	 * The term lists, normalized the way a name's tokens are, by list.
	 *
	 * @since n.e.x.t
	 * @var array|null
	 */
	private static $terms = null;

	/**
	 * Tells whether a card may not show a name: it is sensitive, or carries a
	 * marker the service's output check rejects.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $name The name, such as a search keyword or a post title.
	 * @return bool True when no card may show it.
	 */
	public static function is_hidden( $name ) {
		return self::is_sensitive( $name ) || self::has_blocked_marker( $name );
	}

	/**
	 * Tells whether a name holds adult, sexually explicit or offensive terms.
	 *
	 * A name that isn't valid UTF-8 can't be read, so it is sensitive.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $name The name.
	 * @return bool True when it does.
	 */
	public static function is_sensitive( $name ) {
		$name = (string) $name;

		if ( ! preg_match( '//u', $name ) ) {
			return true;
		}

		$form = self::get_screen_form( $name );

		if ( ! preg_match( '/\S/u', $form ) ) {
			return false;
		}

		if ( preg_match( self::get_masked_word_pattern(), $form ) || preg_match( '/(^|[^イ])エロ/u', $form ) ) {
			return true;
		}

		$tokens = self::get_tokens( $form );

		if ( empty( $tokens ) ) {
			return false;
		}

		if ( self::are_sensitive( $tokens ) || self::is_lund_query( $tokens ) || self::has_unaccented_chut( $name ) ) {
			return true;
		}

		// A token written wholly in Cyrillic or Greek look-alike letters, such
		// as "ѕех", is read a second time as the Latin word it imitates.
		$reading = self::get_lookalike_reading( $tokens );

		return null !== $reading && self::are_sensitive( $reading );
	}

	/**
	 * Tells whether a name carries a marker the service's output check
	 * rejects, such as `javascript:` or `you are now`, anywhere in it and in
	 * any case.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $name The name.
	 * @return bool True when it does.
	 */
	public static function has_blocked_marker( $name ) {
		$name = self::to_lower( (string) $name );

		foreach ( self::BLOCKED_MARKERS as $marker ) {
			if ( false !== strpos( $name, $marker ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Tells whether a label someone typed into Analytics, such as a campaign
	 * name, must not be shown to a reader.
	 *
	 * It is empty, it is only an ID, which tells a reader nothing, or it is a
	 * first name tagged with digits or an ID, the shape ad platforms give
	 * creatives made per person: `Maria_20250417`, or
	 * `Vinte e seis Elena|120236364496010746`. It doesn't detect personal
	 * names in general: a name in a label that says what the campaign is,
	 * such as `Demand Gen (Becky test)`, is kept.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $label The label.
	 * @return bool True when no card may show it.
	 */
	public static function is_opaque_or_personal_label( $label ) {
		$label = trim( (string) $label );

		if ( '' === $label || preg_match( self::OPAQUE_ID_PATTERN, $label ) || preg_match( self::LEADING_NAME_TAG_PATTERN, $label ) ) {
			return true;
		}

		$segments = array_map( 'trim', explode( '|', $label ) );

		if ( count( $segments ) < 2 ) {
			return false;
		}

		$has_id   = false;
		$has_name = false;

		foreach ( $segments as $segment ) {
			$has_id   = $has_id || preg_match( self::OPAQUE_ID_PATTERN, $segment );
			$has_name = $has_name || preg_match( self::TRAILING_NAME_PATTERN, $segment );
		}

		return $has_id && $has_name;
	}

	/**
	 * Tells whether one reading of a name's tokens is sensitive: a token is a
	 * term, the tokens hold a phrase, or two adjacent tokens, with filler
	 * words skipped, form an adult query together.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $tokens The tokens, each with `plain` and `collapsed`.
	 * @return bool True when it is.
	 */
	private static function are_sensitive( array $tokens ) {
		foreach ( $tokens as $token ) {
			if ( self::is_sensitive_token( $token ) ) {
				return true;
			}
		}

		$terms  = self::get_terms();
		$joined = ' ' . implode( ' ', array_column( $tokens, 'collapsed' ) ) . ' ';

		foreach ( $terms['phrases'] as $phrase ) {
			if ( false !== strpos( $joined, " {$phrase} " ) ) {
				return true;
			}
		}

		$content = array_values( array_filter( $tokens, fn( $token ) => ! in_array( $token['collapsed'], $terms['fillers'], true ) ) );
		$count   = count( $content );

		for ( $index = 0; $index + 1 < $count; $index++ ) {
			if ( self::is_sensitive_pair( $content[ $index ], $content[ $index + 1 ] ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Tells whether a token is an adult term.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $token The token, with `plain` and `collapsed`.
	 * @return bool True when it is.
	 */
	private static function is_sensitive_token( array $token ) {
		$terms     = self::get_terms();
		$collapsed = $token['collapsed'];

		if ( in_array( $collapsed, $terms['exact'], true ) || preg_match( self::LATIN_SEX_PATTERN, $collapsed ) || preg_match( self::X_VIDEO_PATTERN, $collapsed ) ) {
			return true;
		}

		foreach ( $terms['stems'] as $stem ) {
			if ( 0 === strpos( $collapsed, $stem ) ) {
				return true;
			}
		}

		foreach ( $terms['substrings'] as $substring ) {
			if ( false !== strpos( $collapsed, $substring ) ) {
				return true;
			}
		}

		// Three x's or more, but not a clothing size such as "xxxl", or a code
		// such as "1xxx".
		return preg_match( '/x{3,}/', $token['plain'] ) && ! preg_match( '/^x{3,}l$/D', $token['plain'] ) && ! preg_match( '/[0-9]/', $token['plain'] );
	}

	/**
	 * Tells whether two adjacent tokens form an adult query together: an
	 * adult site's name or "xx" in another script, an "x" in any script or
	 * "bf" next to a video word, or جنس next to a film or picture word.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $first  The first token.
	 * @param array $second The token after it.
	 * @return bool True when they do.
	 */
	private static function is_sensitive_pair( array $first, array $second ) {
		$pair = $first['collapsed'] . $second['collapsed'];

		foreach ( self::get_terms()['pair_sites'] as $site ) {
			if ( false !== strpos( $pair, $site ) ) {
				return true;
			}
		}

		return preg_match( self::X_VIDEO_PATTERN, $pair ) || self::is_adult_next_to( $first, $second ) || self::is_adult_next_to( $second, $first );
	}

	/**
	 * Tells whether a token is adult next to another.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $token The token.
	 * @param array $other The token next to it.
	 * @return bool True when it is.
	 */
	private static function is_adult_next_to( array $token, array $other ) {
		$terms = self::get_terms();

		if ( 'x' === $token['collapsed'] || in_array( $token['collapsed'], $terms['x'], true ) ) {
			return self::is_video_token( $other );
		}

		if ( 'bf' === $token['collapsed'] || 'dewasa' === $token['collapsed'] ) {
			return self::is_video_token( $other ) || preg_match( self::FILM_CONTEXT_PATTERN, $other['collapsed'] );
		}

		if ( in_array( $token['collapsed'], $terms['arabic_sex'], true ) ) {
			return in_array( $other['collapsed'], $terms['arabic_sex_context'], true );
		}

		return false;
	}

	/**
	 * Tells whether a token is a video word.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $token The token.
	 * @return bool True when it is.
	 */
	private static function is_video_token( array $token ) {
		return preg_match( self::LATIN_VIDEO_PATTERN, $token['collapsed'] ) || in_array( $token['collapsed'], self::get_terms()['script_video'], true );
	}

	/**
	 * Tells whether a name has the token "lund", Hindi slang, and doesn't name
	 * the Swedish city or its university.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $tokens The tokens.
	 * @return bool True when it does.
	 */
	private static function is_lund_query( array $tokens ) {
		$collapsed = array_column( $tokens, 'collapsed' );

		return in_array( 'lund', $collapsed, true ) && empty( array_intersect( $collapsed, self::get_terms()['lund_places'] ) );
	}

	/**
	 * Tells whether a name has the token "chut" written without diacritics.
	 *
	 * The screen's form has no diacritics, which would make the Vietnamese
	 * "chút" ("a little") the Hindi term, so this reads the name before they
	 * are removed.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $name The name.
	 * @return bool True when it does.
	 */
	private static function has_unaccented_chut( $name ) {
		$light = self::to_lower( self::normalize( $name, self::FORM_KC ) );

		return in_array( 'chut', array_column( self::get_tokens( $light ), 'collapsed' ), true );
	}

	/**
	 * Reads every token written wholly in look-alike letters as Latin.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $tokens The tokens.
	 * @return array|null The tokens with those read as Latin, or null when no token is.
	 */
	private static function get_lookalike_reading( array $tokens ) {
		$changed = false;
		$reading = array();

		foreach ( $tokens as $token ) {
			if ( self::has_latin_letter( $token['plain'] ) || ! self::is_all_lookalikes( $token['plain'] ) ) {
				$reading[] = $token;
				continue;
			}

			$changed   = true;
			$plain     = strtr( $token['plain'], self::LATIN_LOOKALIKES );
			$reading[] = array(
				'plain'     => $plain,
				'collapsed' => self::collapse_repeats( self::map_leetspeak( $plain ) ),
			);
		}

		return $changed ? $reading : null;
	}

	/**
	 * Tells whether every letter of a token is a look-alike of a Latin one.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $token The token.
	 * @return bool True when it has a letter and every letter is.
	 */
	private static function is_all_lookalikes( $token ) {
		if ( ! preg_match_all( '/\p{L}/u', $token, $matches ) ) {
			return false;
		}

		foreach ( $matches[0] as $letter ) {
			if ( ! isset( self::LATIN_LOOKALIKES[ $letter ] ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Gets a name as the screen reads it: in NFKC and lower case, without
	 * Latin diacritics, Arabic harakat, tatweel, zero-width characters or soft
	 * hyphens, and with Arabic letter variants unified.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $name The name.
	 * @return string The name as the screen reads it.
	 */
	private static function get_screen_form( $name ) {
		$form = self::normalize( self::to_lower( self::normalize( $name, self::FORM_KC ) ), self::FORM_D );
		$form = preg_replace( '/[\x{0300}-\x{036F}\x{064B}-\x{065F}\x{0670}\x{0640}\x{200B}-\x{200D}\x{2060}\x{FEFF}\x{00AD}]/u', '', $form );
		$form = strtr(
			$form,
			array(
				'أ' => 'ا',
				'إ' => 'ا',
				'آ' => 'ا',
				'ة' => 'ه',
				'ى' => 'ي',
			)
		);

		return self::normalize( $form, self::FORM_C );
	}

	/**
	 * Splits a name in the screen's form into tokens, and joins runs of
	 * one-letter tokens.
	 *
	 * Mask characters stay in the word they mask, so "f*ck" is one token,
	 * and are then removed from it.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $form The name in the screen's form.
	 * @return array List of tokens, each with `plain`, its form with look-alikes mapped, and `collapsed`, also with leetspeak mapped and repeated letters collapsed.
	 */
	private static function get_tokens( $form ) {
		$words  = preg_split( '/[^\p{L}\p{M}\p{Nd}@$' . preg_quote( self::MASK_CHARACTERS, '/' ) . ']+/u', $form, -1, PREG_SPLIT_NO_EMPTY );
		$tokens = array();

		foreach ( $words ?: array() as $word ) {
			$plain = self::map_latin_lookalikes( $word );

			if ( '' === $plain ) {
				continue;
			}

			$tokens[] = array(
				'plain'     => $plain,
				'collapsed' => self::collapse_repeats( self::map_leetspeak( $plain ) ),
			);
		}

		$joined = array();

		foreach ( $tokens as $index => $token ) {
			if ( $index > 0 && self::is_one_letter( $token ) && self::is_one_letter( $tokens[ $index - 1 ] ) ) {
				$last = array_key_last( $joined );

				$joined[ $last ]['plain']    .= $token['plain'];
				$joined[ $last ]['collapsed'] = self::collapse_repeats( $joined[ $last ]['collapsed'] . $token['collapsed'] );
				continue;
			}

			$joined[] = $token;
		}

		return $joined;
	}

	/**
	 * Tells whether a token is written as one character. "xx" collapses to
	 * "x", but isn't.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $token The token.
	 * @return bool True when it is.
	 */
	private static function is_one_letter( array $token ) {
		return 1 === preg_match_all( '/./us', $token['plain'] );
	}

	/**
	 * Removes the mask characters of a token, and maps its look-alike letters
	 * to Latin ones when it holds a Latin letter.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $token The token.
	 * @return string The token.
	 */
	private static function map_latin_lookalikes( $token ) {
		$token = preg_replace( '/[' . preg_quote( self::MASK_CHARACTERS, '/' ) . ']/u', '', $token );

		return self::has_latin_letter( $token ) ? strtr( $token, self::LATIN_LOOKALIKES ) : $token;
	}

	/**
	 * Maps the leetspeak of a token that holds a Latin letter. A number on its
	 * own, such as "2026", and a token in another script are kept.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $token The token.
	 * @return string The token.
	 */
	private static function map_leetspeak( $token ) {
		return self::has_latin_letter( $token ) ? strtr( $token, self::LEETSPEAK ) : $token;
	}

	/**
	 * Tells whether a text holds a Latin letter.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $text The text.
	 * @return bool True when it does.
	 */
	private static function has_latin_letter( $text ) {
		return (bool) preg_match( '/\p{Latin}/u', $text );
	}

	/**
	 * Folds each run of a repeated character into one.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $text The text.
	 * @return string The text.
	 */
	private static function collapse_repeats( $text ) {
		return preg_replace( '/(.)\1+/us', '$1', $text );
	}

	/**
	 * Gets the pattern of a masked word: a letter followed by three mask
	 * characters or more, with at most one space between them, or a word of
	 * one letter followed by two, such as "x**".
	 *
	 * @since n.e.x.t
	 *
	 * @return string The pattern.
	 */
	private static function get_masked_word_pattern() {
		$mask = '[' . preg_quote( self::MASK_CHARACTERS, '/' ) . ']';

		return "/[\\p{L}\\p{M}] ?{$mask}{3,}|(?:^|[^\\p{L}\\p{M}])\\p{L}\\p{M}*{$mask}{2}/u";
	}

	/**
	 * Gets the term lists, normalized the way a name's tokens are.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The lists, by name.
	 */
	private static function get_terms() {
		if ( null === self::$terms ) {
			self::$terms = array(
				'exact'              => array_map( array( __CLASS__, 'normalize_term' ), self::EXACT_TERMS ),
				'stems'              => array_map( array( __CLASS__, 'normalize_term' ), self::STEM_TERMS ),
				'substrings'         => array_map( array( __CLASS__, 'normalize_term' ), self::SUBSTRING_TERMS ),
				'pair_sites'         => array_map( array( __CLASS__, 'normalize_term' ), self::PAIR_SITE_TERMS ),
				'x'                  => array_map( array( __CLASS__, 'normalize_term' ), self::X_TERMS ),
				'script_video'       => array_map( array( __CLASS__, 'normalize_term' ), self::SCRIPT_VIDEO_TERMS ),
				'fillers'            => array_map( array( __CLASS__, 'normalize_term' ), self::FILLER_TERMS ),
				'lund_places'        => array_map( array( __CLASS__, 'normalize_term' ), self::LUND_PLACE_TERMS ),
				'arabic_sex'         => array_map( array( __CLASS__, 'normalize_term' ), self::ARABIC_SEX_TERMS ),
				'arabic_sex_context' => array_map( array( __CLASS__, 'normalize_term' ), self::ARABIC_SEX_CONTEXT_TERMS ),
				'phrases'            => array_map(
					fn( $phrase ) => implode( ' ', array_map( array( __CLASS__, 'normalize_term' ), preg_split( '/\s+/u', $phrase ) ) ),
					self::PHRASES
				),
			);
		}

		return self::$terms;
	}

	/**
	 * Normalizes a term the way a name's token is.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $term The term.
	 * @return string The term.
	 */
	private static function normalize_term( $term ) {
		return self::collapse_repeats( self::map_leetspeak( self::map_latin_lookalikes( self::get_screen_form( $term ) ) ) );
	}

	/**
	 * Puts a text in a Unicode normalization form.
	 *
	 * Without the intl extension, it uses the polyfill's `Normalizer`, which
	 * also defines the global `Normalizer` its forms are read from.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $text The text.
	 * @param int    $form The form, such as `FORM_KC`.
	 * @return string The text in the form, or as it was when it can't be put in it.
	 */
	private static function normalize( $text, $form ) {
		$normalized = class_exists( 'Normalizer' ) ? \Normalizer::normalize( $text, $form ) : Normalizer_Polyfill::normalize( $text, $form );

		return is_string( $normalized ) ? $normalized : $text;
	}

	/**
	 * Puts a text in lower case.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $text The text.
	 * @return string The text in lower case, or with only its ASCII letters in lower case without mbstring.
	 */
	private static function to_lower( $text ) {
		if ( function_exists( 'mb_strtolower' ) ) {
			return mb_strtolower( $text, 'UTF-8' );
		}

		return preg_replace_callback( '/[A-Z]+/', fn( $matches ) => strtolower( $matches[0] ), $text );
	}
}
