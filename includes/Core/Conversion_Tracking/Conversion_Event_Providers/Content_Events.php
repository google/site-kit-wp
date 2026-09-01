<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Content_Events
 *
 * @package   Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers;

use Google\Site_Kit\Core\Assets\Script;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider;
use Google\Site_Kit\Core\Util\URL;
use IntlBreakIterator;

/**
 * Class for handling generic content engagement events.
 *
 * @since 1.186.0
 * @access private
 * @ignore
 */
class Content_Events extends Conversion_Events_Provider {

	const CONVERSION_EVENT_PROVIDER_SLUG = 'content-events';

	/**
	 * Hosts an embedded iframe's `src` belongs to for a YouTube video.
	 *
	 * @since n.e.x.t
	 */
	const YOUTUBE_EMBED_HOSTS = array( 'youtube.com', 'www.youtube.com', 'm.youtube.com' );

	/**
	 * Host an embedded iframe's `src` belongs to for a Vimeo video.
	 *
	 * @since n.e.x.t
	 */
	const VIMEO_EMBED_HOST = 'player.vimeo.com';

	/**
	 * Words an average visitor reads in a minute.
	 *
	 * @since n.e.x.t
	 */
	const WORDS_PER_MINUTE = 238;

	/**
	 * Percentage of the estimated reading time a visitor must stay.
	 *
	 * @since n.e.x.t
	 */
	const READ_TIME_THRESHOLD_PERCENT = 85;

	/**
	 * Shortest time a visitor must stay, in seconds, whatever the article's length.
	 *
	 * @since n.e.x.t
	 */
	const MINIMUM_READ_TIME_SECONDS = 5;

	/**
	 * Characters an average visitor reads in a minute in a script written
	 * without spaces between words.
	 *
	 * @since n.e.x.t
	 */
	const FALLBACK_CHARACTERS_PER_MINUTE = 500;

	/**
	 * Invisible marker appended to the end of a single post's content.
	 *
	 * `initializeReadArticle()` watches the marker to see when the end of the
	 * article reaches the screen. A span with no height never comes into view,
	 * so the marker is `1px` tall. The `-1px` margin keeps that pixel out of the
	 * layout.
	 *
	 * @since n.e.x.t
	 */
	const END_OF_CONTENT_MARKER = '<span class="googlesitekit-end-of-content" aria-hidden="true" style="display:block;height:1px;margin-bottom:-1px"></span>';

	/**
	 * Flag indicating whether content hooks have been bootstrapped.
	 *
	 * @since 1.186.0
	 * @var bool
	 */
	protected $bootstrapped = false;

	/**
	 * Flag indicating whether the current request has rendered a Vimeo embed.
	 *
	 * @since n.e.x.t
	 * @var bool
	 */
	protected $has_vimeo_embed = false;

	/**
	 * Flag indicating whether the post content has already been measured.
	 *
	 * @since n.e.x.t
	 * @var bool
	 */
	protected $content_measured = false;

	/**
	 * Number of words in the measured content, or `null` before it is measured.
	 *
	 * @since n.e.x.t
	 * @var int|null
	 */
	protected $word_count = null;

	/**
	 * Estimated reading time of the measured content in seconds, or `null`
	 * before it is measured.
	 *
	 * @since n.e.x.t
	 * @var int|null
	 */
	protected $estimated_read_time_seconds = null;

	/**
	 * Flag indicating whether the request renders the post's last page, or
	 * `null` before the content is measured.
	 *
	 * @since n.e.x.t
	 * @var bool|null
	 */
	protected $is_last_page_of_multi_page_post = null;

	/**
	 * Gets the provider category.
	 *
	 * @since 1.186.0
	 *
	 * @return string Provider category.
	 */
	public function get_category() {
		return self::CATEGORY_CONTENT;
	}

	/**
	 * Checks if the provider is active.
	 *
	 * Content events are always active and not conditional on any third-party plugin or feature flag.
	 *
	 * @since 1.186.0
	 *
	 * @return bool Content Events are always enabled, so this is always `true`.
	 */
	public function is_active() {
		return true;
	}

	/**
	 * Gets the conversion event names that are tracked by this provider.
	 *
	 * Content engagement events are not conversion actions and should not be included
	 * in conversion-event enumerations for Ads or ACR.
	 *
	 * @since 1.186.0
	 *
	 * @return array List of event names.
	 */
	public function get_event_names() {
		return array();
	}

	/**
	 * Gets the events this install can send, mapped to where each one can fire.
	 *
	 * Reports what the install makes possible, never what the current request did:
	 * whether a post is paginated, embeds a Vimeo video or carries a `mailto:` link
	 * is only knowable while a frontend page renders, and Site Health runs in
	 * wp-admin. Nothing here reads the current request. Whether bbPress is active is
	 * a site-wide fact, so `pagination_click` does report it.
	 *
	 * Keys are the event names as sent to GA and stay untranslated; the values are
	 * translated for display.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Map of event name to the pages or links it can fire on.
	 */
	public function get_eligible_events() {
		return array(
			'read_article'                                => __( 'single blog posts', 'google-site-kit' ),
			'pagination_click'                            => class_exists( 'bbPress' )
				? __( 'posts split into pages, bbPress topics', 'google-site-kit' )
				: __( 'posts split into pages', 'google-site-kit' ),
			'contact_link_click'                          => __( 'email, phone, SMS and messaging-app links', 'google-site-kit' ),
			'outbound_link_click'                         => __( 'external links with rel="sponsored", rel="ugc" or rel="nofollow"', 'google-site-kit' ),
			'video_start, video_progress, video_complete' => __( 'Vimeo embeds', 'google-site-kit' ),
		);
	}

	/**
	 * Gets the event names to show against this provider in Site Health.
	 *
	 * `get_event_names()` stays empty so these engagement events keep out of the Ads
	 * conversion labels, Analytics conversion reporting and the conversion feature
	 * metrics. That would leave this provider's Site Health row blank, so the row is
	 * built from the eligible events instead.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Comma separated list of event names.
	 */
	public function get_debug_data() {
		return implode( ', ', array_keys( $this->get_eligible_events() ) );
	}

	/**
	 * Registers the script for the provider.
	 *
	 * @since 1.186.0
	 *
	 * @return Script Script instance.
	 */
	public function register_script() {
		$script = new Script(
			'googlesitekit-events-provider-' . self::CONVERSION_EVENT_PROVIDER_SLUG,
			array(
				'src'       => $this->context->url( 'dist/assets/js/googlesitekit-events-provider-content-events.js' ),
				'execution' => 'defer',
			)
		);

		$script->register( $this->context );

		return $script;
	}

	/**
	 * Registers any actions/hooks for this provider.
	 *
	 * @since 1.186.0
	 */
	public function register_hooks() {
		$bootstrap = function () {
			if ( ! $this->bootstrapped ) {
				$this->register_content_hooks();
				$this->bootstrapped = true;
			}
		};

		add_action( 'googlesitekit_analytics-4_init_tag', $bootstrap );
		add_action( 'googlesitekit_ads_init_tag', $bootstrap );
	}

	/**
	 * Registers content hooks once tag initialization occurs.
	 *
	 * @since 1.186.0
	 */
	protected function register_content_hooks() {
		add_filter( 'embed_oembed_html', array( $this, 'filter_embed_html' ) );

		// Other plugins append share buttons and related posts at the default
		// priority. Priority 1 puts the marker directly after the author's
		// content, before them.
		add_filter( 'the_content', fn ( $content ) => $this->append_end_of_content_marker( $content ), 1 );

		add_filter(
			'render_block',
			function ( $block_content, $block ) {
				$block_name = $block['blockName'] ?? '';

				// `core/embed` is the consolidated block name; WordPress 5.2's original
				// oEmbed block split by provider, e.g. `core-embed/youtube`.
				if ( 'core/embed' !== $block_name && 0 !== strpos( $block_name, 'core-embed/' ) ) {
					return $block_content;
				}

				return $this->filter_embed_html( $block_content );
			},
			10,
			2
		);

		add_action(
			'wp_footer',
			function () {
				$script_handle = 'googlesitekit-events-provider-' . self::CONVERSION_EVENT_PROVIDER_SLUG;
				$config        = $this->get_inline_config();

				$inline_script = join(
					"\n",
					array(
						'window._googlesitekit = window._googlesitekit || {};',
						sprintf( 'window._googlesitekit.contentEvents = %s;', wp_json_encode( $config ) ),
					)
				);

				wp_add_inline_script( $script_handle, $inline_script, 'before' );
			}
		);
	}

	/**
	 * Adds `enablejsapi=1` to a YouTube embed's iframe `src`, and records a Vimeo embed.
	 *
	 * Only ever touches the `src` of an iframe whose host is a YouTube embed host: every
	 * other attribute, any wrapper markup around the iframe, and non-iframe embed markup
	 * pass through unchanged. A Vimeo iframe is left alone too, since its player already
	 * accepts the Vimeo Player SDK's messages without an opt-in parameter; only the
	 * `has_vimeo_embed` flag is set, for `get_inline_config()` to publish.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $html A single embed's HTML markup.
	 * @return string The embed's HTML markup, with `enablejsapi=1` added when it is a YouTube iframe.
	 */
	public function filter_embed_html( $html ) {
		if ( false === stripos( $html, '<iframe' ) ) {
			return $html;
		}

		return preg_replace_callback(
			'/<iframe\b[^>]*>/i',
			array( $this, 'filter_embed_iframe_tag' ),
			$html
		);
	}

	/**
	 * Filters a single `<iframe>` tag matched by `filter_embed_html()`.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $matches Regex matches; `$matches[0]` is the full `<iframe …>` tag.
	 * @return string The tag, with `enablejsapi=1` added to `src` when it is a YouTube embed.
	 */
	protected function filter_embed_iframe_tag( $matches ) {
		$iframe_tag = $matches[0];

		// Matches a quoted (single or double) or bare unquoted `src` value; the
		// `??` below picks whichever one actually matched.
		if ( ! preg_match( '/\ssrc=(?:"([^"]*)"|\'([^\']*)\'|([^\s"\'>]+))/i', $iframe_tag, $src_matches, PREG_UNMATCHED_AS_NULL ) ) {
			return $iframe_tag;
		}

		$src_attribute = $src_matches[0];
		$src           = $src_matches[1] ?? $src_matches[2] ?? $src_matches[3];
		$src           = html_entity_decode( $src );
		$host          = strtolower( (string) URL::parse( $src, PHP_URL_HOST ) );

		if ( in_array( $host, self::YOUTUBE_EMBED_HOSTS, true ) ) {
			$new_src = esc_url( add_query_arg( 'enablejsapi', 1, $src ) );

			// Keeping the regex's leading space here stops the rewritten src
			// from running into the previous attribute.
			return str_replace( $src_attribute, " src=\"$new_src\"", $iframe_tag );
		}

		if ( self::VIMEO_EMBED_HOST === $host ) {
			$this->has_vimeo_embed = true;
		}

		return $iframe_tag;
	}

	/**
	 * Measures a single post's content, and appends the end-of-content marker
	 * to it.
	 *
	 * `the_content` runs many times in one request. A nested loop and an
	 * automatic excerpt both run it, and neither renders the post the visitor is
	 * reading. Both get their content back unchanged.
	 *
	 * Only the last page of a paginated post gets the marker, so a post sends at
	 * most one `read_article` event per visit.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $content Post content.
	 * @return string The content, with the marker appended on a single post's last page.
	 */
	protected function append_end_of_content_marker( $content ) {
		if (
			$this->content_measured
			|| ! is_singular( 'post' )
			|| is_feed()
			|| is_embed()
			|| doing_filter( 'get_the_excerpt' )
			|| get_the_ID() !== get_queried_object_id()
		) {
			return $content;
		}

		$this->content_measured = true;

		// `setup_postdata()` fills these three globals while the loop runs. A
		// theme that renders the content outside the loop leaves them empty.
		global $page, $numpages, $multipage;

		$this->is_last_page_of_multi_page_post = ! $multipage || $page >= $numpages;

		$measurements = $this->measure_content( $content );

		$this->word_count                  = $measurements['word_count'];
		$this->estimated_read_time_seconds = $measurements['estimated_read_time_seconds'];

		if ( ! $this->is_last_page_of_multi_page_post ) {
			return $content;
		}

		return $content . self::END_OF_CONTENT_MARKER;
	}

	/**
	 * Counts the words in a piece of content and estimates how long it takes to read.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $content Post content, before the other `the_content` filters run.
	 * @return array Array with the `word_count` and `estimated_read_time_seconds` keys.
	 */
	protected function measure_content( $content ) {
		$text = wp_strip_all_tags( strip_shortcodes( $content ) );

		$word_count      = $this->count_words_with_intl( $text );
		$character_count = 0;

		if ( null === $word_count ) {
			// Without the `intl` extension, a paragraph written with no spaces
			// between words counts as one word, and the estimate comes out far
			// too short. Counting its characters instead corrects that.
			$word_count      = $this->count_words_by_spaces( $text );
			$character_count = $this->count_characters_without_word_spacing( $text );
		}

		$estimated_read_time_seconds = (int) round(
			(
				$word_count / self::WORDS_PER_MINUTE
				+ $character_count / self::FALLBACK_CHARACTERS_PER_MINUTE
			) * MINUTE_IN_SECONDS
		);

		return array(
			'word_count'                  => $word_count,
			'estimated_read_time_seconds' => $estimated_read_time_seconds,
		);
	}

	/**
	 * Counts the words in a piece of text with the word splitter of
	 * International Components for Unicode (ICU).
	 *
	 * ICU knows where a word ends in Chinese, Japanese, Thai, Khmer, Lao, and
	 * Burmese, which are written without spaces between words. ICU reads the
	 * same dictionaries for every locale, so the site language doesn't change
	 * the count.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $text Text with the tags and shortcodes already removed.
	 * @return int|null Word count, or `null` when ICU is missing.
	 */
	protected function count_words_with_intl( $text ) {
		if ( ! class_exists( 'IntlBreakIterator' ) ) {
			return null;
		}

		$iterator = IntlBreakIterator::createWordInstance( get_locale() );

		$iterator->setText( $text );

		return $this->count_word_parts( $iterator->getPartsIterator() );
	}

	/**
	 * Counts the pieces of text that hold at least one letter or digit.
	 *
	 * A word splitter returns a space and a punctuation mark as pieces of their
	 * own. Counting every piece would count those as words.
	 *
	 * @since n.e.x.t
	 *
	 * @param iterable $parts Pieces of text a word splitter returned.
	 * @return int Word count.
	 */
	protected function count_word_parts( $parts ) {
		$word_count = 0;

		foreach ( $parts as $part ) {
			// A space, a punctuation mark, and an emoji hold no letter or digit.
			if ( preg_match( '/[\p{L}\p{N}]/u', $part ) ) {
				++$word_count;
			}
		}

		return $word_count;
	}

	/**
	 * Counts the words in a piece of text by splitting it on spaces.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $text Text with the tags and shortcodes already removed.
	 * @return int Word count.
	 */
	protected function count_words_by_spaces( $text ) {
		$parts = preg_split( '/\s+/u', trim( $text ), -1, PREG_SPLIT_NO_EMPTY );

		// `preg_split()` returns `false` for text that isn't valid UTF-8, and a
		// `foreach` over `false` raises a warning.
		if ( false === $parts ) {
			return 0;
		}

		return $this->count_word_parts( $parts );
	}

	/**
	 * Counts the characters of the scripts that are written without spaces
	 * between words.
	 *
	 * Unicode counts `、`, `。`, `「`, and `」` as Han script, so `\p{Han}` matches
	 * them too. The class after the lookahead matches only a letter, a digit, or
	 * a mark, which keeps that punctuation out of the count.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $text Text with the tags and shortcodes already removed.
	 * @return int Character count.
	 */
	protected function count_characters_without_word_spacing( $text ) {
		$character_count = preg_match_all( '/(?=[\p{Han}\p{Hiragana}\p{Katakana}\p{Thai}\p{Lao}\p{Khmer}\p{Myanmar}])[\p{L}\p{N}\p{M}]/u', $text );

		return false === $character_count ? 0 : $character_count;
	}

	/**
	 * Gets the inline config data for content events.
	 *
	 * @since 1.186.0
	 * @since n.e.x.t Added the values the `read_article` event needs.
	 *
	 * @return array Inline config data.
	 */
	protected function get_inline_config() {
		$post_id                         = get_queried_object_id();
		$is_single_post                  = is_singular( 'post' );
		$word_count                      = 0;
		$estimated_read_time_seconds     = 0;
		$is_last_page_of_multi_page_post = false;

		if ( $this->content_measured ) {
			$word_count                      = $this->word_count;
			$estimated_read_time_seconds     = $this->estimated_read_time_seconds;
			$is_last_page_of_multi_page_post = $this->is_last_page_of_multi_page_post;
		} elseif ( $is_single_post ) {
			// A page builder can render the post content without ever running
			// `the_content`, so the queried post supplies the measurements
			// instead.
			$measurements = $this->measure_content( get_the_content( null, false, $post_id ) );

			$word_count                  = $measurements['word_count'];
			$estimated_read_time_seconds = $measurements['estimated_read_time_seconds'];

			// `is_singular( 'post' )` is true here, so the queried post exists
			// and `generate_postdata()` returns its pagination state.
			$postdata                        = generate_postdata( $post_id );
			$is_last_page_of_multi_page_post = ! $postdata['multipage'] || $postdata['page'] >= $postdata['numpages'];
		}

		return array(
			'postID'                    => (int) $post_id,
			'isSinglePost'              => $is_single_post,
			'hasVimeoEmbed'             => (bool) $this->has_vimeo_embed,
			'wordCount'                 => $word_count,
			'estimatedReadTimeSeconds'  => $estimated_read_time_seconds,
			'isLastPageOfMultiPagePost' => $is_last_page_of_multi_page_post,
			'readTimeThresholdPercent'  => self::READ_TIME_THRESHOLD_PERCENT,
			'minimumReadTimeSeconds'    => self::MINIMUM_READ_TIME_SECONDS,
		);
	}
}
