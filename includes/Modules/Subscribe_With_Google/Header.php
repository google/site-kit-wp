<?php
/**
 * Class Google\Site_Kit\Modules\Subscribe_With_Google\Header
 *
 * @package   Google\Site_Kit\Modules\Subscribe_With_Google
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Subscribe_With_Google;

/**
 * Adds to the <head> element on Post view pages.
 */
final class Header {

	/**
	 * Unique identifier for a SwG product.
	 *
	 * @var string
	 */
	private $product_id;

	/**
	 * Registers action.
	 *
	 * @param bool $is_amp True if an AMP request, false otherwise.
	 */
	public function __construct( $is_amp ) {
		$publication_id   = get_option( Key::from( 'publication_id' ) );
		$product          = get_post_meta( get_the_ID(), Key::from( 'product' ), true );
		$this->product_id = $publication_id . ':' . $product;

		if ( $is_amp ) {
			add_action( 'wp_head', array( $this, 'add_amp_scripts' ) );
		} else {
			add_action( 'wp_enqueue_scripts', array( $this, 'add_web_scripts_and_styles' ) );
		}

		add_action( 'wp_head', array( $this, 'add_config_json' ) );
	}

	/** Adds config JSON to the page. */
	public function add_config_json() {
		// SwG only renders on single post pages.
		if ( ! is_single() ) {
			return;
		}

		// Add ld+json for swg-js.
		$is_free = get_post_meta( get_the_ID(), Key::from( 'free' ), true );
		$is_free = $is_free ? $is_free : 'false';
		// TODO: Add this after the AMP WP plugin adds their ld+json.
		?>
		<script type=application/ld+json>
		{
			"@context": "http:\/\/schema.org",
			"@type": "NewsArticle",
			"isAccessibleForFree": <?php echo esc_js( $is_free ); ?>,
			"isPartOf": {
				"@type": ["CreativeWork", "Product"],
				"productID": "<?php echo esc_js( $this->product_id ); ?>"
			}
		}
		</script>
		<?php
	}

	/** Adds web scripts and styles to the page. */
	public function add_web_scripts_and_styles() {
		// SwG only renders on single post pages.
		if ( ! is_single() ) {
			return;
		}

		// SwG's open-source JavaScript library (https://github.com/subscriptions-project/swg-js).
		wp_enqueue_script(
			'swg-js',
			'https://news.google.com/swg/js/v1/swg.js',
			null,
			1,
			true
		);

		// JavaScript for SwgPress.
		wp_enqueue_script(
			'subscribe-with-google',
			plugins_url( '../../../dist/assets/js/subscribe-with-google--single-posts.js', __FILE__ ),
			null,
			1,
			true
		);

		// Styles for SwgPress.
		wp_enqueue_style(
			'subscribe-with-google',
			plugins_url( '../../../dist/assets/css/subscribe-with-google--single-posts.css', __FILE__ ),
			null,
			1
		);
	}

	/** Adds AMP scripts to the page. */
	public function add_amp_scripts() {
		// SwG only renders on single post pages.
		if ( ! is_single() ) {
			return;
		}

		// Add SwG's AMP extension.
		?>
		<script
			async
			custom-element="amp-subscriptions-google"
			src="https://cdn.ampproject.org/v0/amp-subscriptions-google-0.1.js"
		></script>

		<script type="application/json" id="amp-subscriptions">
		{
			"services": [
				{
					"serviceId": "subscribe.google.com"
				}
			],
			"fallbackEntitlement": {
				"source": "fallback",
				"granted": true,
				"grantReason": "METERING"
			}
		}
		</script>
		<?php
	}
}
