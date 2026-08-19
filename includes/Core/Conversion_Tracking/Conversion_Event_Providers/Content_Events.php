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

/**
 * Class for handling generic content engagement events.
 *
 * @since n.e.x.t
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
	 * Flag indicating whether content hooks have been bootstrapped.
	 *
	 * @since n.e.x.t
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
	 * Gets the provider category.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @return array List of event names.
	 */
	public function get_event_names() {
		return array();
	}

	/**
	 * Registers the script for the provider.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 */
	protected function register_content_hooks() {
		add_filter( 'embed_oembed_html', array( $this, 'filter_embed_html' ) );

		add_filter(
			'render_block',
			function ( $block_content, $block ) {
				if ( ! isset( $block['blockName'] ) || 'core/embed' !== $block['blockName'] ) {
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
	 * Gets the inline config data for content events.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Inline config data.
	 */
	protected function get_inline_config() {
		return array(
			'postID'        => (int) get_queried_object_id(),
			'isSinglePost'  => is_singular( 'post' ),
			'hasVimeoEmbed' => (bool) $this->has_vimeo_embed,
		);
	}
}
