<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking
 *
 * @package   Google\Site_Kit\Core\Modules
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Contact_Form_7;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Easy_Digital_Downloads;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Mailchimp;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\Ninja_Forms;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\OptinMonster;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\PopupMaker;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\WooCommerce;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Event_Providers\WPForms;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Tags\GTag;
use LogicException;

/**
 * Class for managing conversion tracking.
 *
 * @since 1.126.0
 * @access private
 * @ignore
 */
class Conversion_Tracking {

	/**
	 * Context object.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Conversion_Tracking_Settings instance.
	 *
	 * @since 1.127.0
	 * @var Conversion_Tracking_Settings
	 */
	protected $conversion_tracking_settings;

	/**
	 * Avaialble products on the page.
	 *
	 * @var Array
	 *
	 * @since n.e.x.t
	 */
	protected $products;

	/**
	 * Current product added to the cart.
	 *
	 * @since n.e.x.t
	 * @var Array
	 */
	protected $add_to_cart;

	/**
	 * REST_Conversion_Tracking_Controller instance.
	 *
	 * @since 1.127.0
	 * @var REST_Conversion_Tracking_Controller
	 */
	protected $rest_conversion_tracking_controller;

	/**
	 * Supported conversion event providers.
	 *
	 * @since 1.126.0
	 * @since 1.130.0 Added Ninja Forms class.
	 * @var array
	 */
	public static $providers = array(
		Contact_Form_7::CONVERSION_EVENT_PROVIDER_SLUG => Contact_Form_7::class,
		Easy_Digital_Downloads::CONVERSION_EVENT_PROVIDER_SLUG => Easy_Digital_Downloads::class,
		Mailchimp::CONVERSION_EVENT_PROVIDER_SLUG      => Mailchimp::class,
		Ninja_Forms::CONVERSION_EVENT_PROVIDER_SLUG    => Ninja_Forms::class,
		OptinMonster::CONVERSION_EVENT_PROVIDER_SLUG   => OptinMonster::class,
		PopupMaker::CONVERSION_EVENT_PROVIDER_SLUG     => PopupMaker::class,
		WooCommerce::CONVERSION_EVENT_PROVIDER_SLUG    => WooCommerce::class,
		WPForms::CONVERSION_EVENT_PROVIDER_SLUG        => WPForms::class,
	);

	/**
	 * Constructor.
	 *
	 * @since 1.126.0
	 *
	 * @param Context $context Plugin context.
	 * @param Options $options Optional. Option API instance. Default is a new instance.
	 */
	public function __construct( Context $context, Options $options = null ) {
		$this->context                             = $context;
		$options                                   = $options ?: new Options( $context );
		$this->conversion_tracking_settings        = new Conversion_Tracking_Settings( $options );
		$this->rest_conversion_tracking_controller = new REST_Conversion_Tracking_Controller( $this->conversion_tracking_settings );
	}

	/**
	 * Registers the class functionality.
	 *
	 * @since 1.126.0
	 */
	public function register() {
		$this->conversion_tracking_settings->register();
		$this->rest_conversion_tracking_controller->register();

		add_action( 'wp_enqueue_scripts', fn () => $this->maybe_enqueue_scripts(), 30 );

		$active_providers = $this->get_active_providers();

		array_walk(
			$active_providers,
			function ( Conversion_Events_Provider $active_provider ) {
				$active_provider->register_hooks();
			}
		);

		add_filter(
			'woocommerce_loop_add_to_cart_link',
			function ( $button, $product ) {
				$this->products[] = $this->get_formatted_product( $product );
				return $button;
			},
			10,
			2
		);

		add_action(
			'woocommerce_add_to_cart',
			function ( $cart_item_key, $product_id, $quantity, $variation_id, $variation ) {
				$product = wc_get_product( $variation_id ?: $product_id );

				$variation; // Should be checked as well.

				// What you want to pass to JS.
				$data = array(
					'id'       => $product->get_id(),
					'name'     => $product->get_name(),
					'price'    => (float) $product->get_price(),
					'quantity' => $quantity,
					'sku'      => $product->get_sku(),
				);

				$this->add_to_cart = $data;
			},
			10,
			5
		);

		add_action(
			'wp_footer',
			function () {
				?>
<script type="text/javascript">
window.wc = {};
window.wc.products = <?php echo wp_json_encode( $this->products ); ?>;
window.wc.add_to_cart = <?php echo wp_json_encode( $this->add_to_cart ); ?>;
</script>
				<?php
			}
		);
	}

	/**
	 * Enqueues conversion tracking scripts if conditions are satisfied.
	 */
	protected function maybe_enqueue_scripts() {
		if (
			// Do nothing if neither Ads nor Analytics *web* snippet has been inserted.
			! ( did_action( 'googlesitekit_ads_init_tag' ) || did_action( 'googlesitekit_analytics-4_init_tag' ) )
			|| ! $this->conversion_tracking_settings->is_conversion_tracking_enabled()
		) {
			return;
		}

		$active_providers = $this->get_active_providers();

		array_walk(
			$active_providers,
			function ( Conversion_Events_Provider $active_provider ) {
				$script_asset = $active_provider->register_script();
				$script_asset->enqueue();
			}
		);

		$gtag_event = '
			window._googlesitekit = window._googlesitekit || {};
			window._googlesitekit.throttledEvents = [];
			window._googlesitekit.gtagEvent = (name, data) => {
				var key = JSON.stringify( { name, data } );

				if ( !! window._googlesitekit.throttledEvents[ key ] ) {
					return;
				}
				window._googlesitekit.throttledEvents[ key ] = true;
				setTimeout( () => {
					delete window._googlesitekit.throttledEvents[ key ];
				}, 5 );

				gtag( "event", name, { ...data, event_source: "site-kit" } );
			};
		';

		wp_add_inline_script( GTag::HANDLE, preg_replace( '/\s+/', ' ', $gtag_event ) );
	}

	/**
	 * Gets the instances of active conversion event providers.
	 *
	 * @since 1.126.0
	 *
	 * @return array List of active Conversion_Events_Provider instances.
	 * @throws LogicException Thrown if an invalid conversion event provider class name is provided.
	 */
	public function get_active_providers() {
		$active_providers = array();

		foreach ( self::$providers as $provider_slug => $provider_class ) {
			if ( ! is_string( $provider_class ) || ! $provider_class ) {
				throw new LogicException(
					sprintf(
						/* translators: %s: provider slug */
						__( 'A conversion event provider class name is required to instantiate a provider: %s', 'google-site-kit' ),
						$provider_slug
					)
				);
			}

			if ( ! class_exists( $provider_class ) ) {
				throw new LogicException(
					sprintf(
						/* translators: %s: provider classname */
						__( "The '%s' class does not exist", 'google-site-kit' ),
						$provider_class
					)
				);
			}

			if ( ! is_subclass_of( $provider_class, Conversion_Events_Provider::class ) ) {
				throw new LogicException(
					sprintf(
						/* translators: 1: provider classname 2: Conversion_Events_Provider classname */
						__( "The '%1\$s' class must extend the base conversion event provider class: %2\$s", 'google-site-kit' ),
						$provider_class,
						Conversion_Events_Provider::class
					)
				);
			}

			$instance = new $provider_class( $this->context );

			if ( $instance->is_active() ) {
				$active_providers[ $provider_slug ] = $instance;
			}
		}

		return $active_providers;
	}

	/**
	 * Returns an array of product data in the required format
	 *
	 * @param WC_Product $product   The product to format.
	 * @param int        $variation_id Variation product ID.
	 * @param array|bool $variation An array containing product variation attributes to include in the product data.
	 *                              For the "variation" type products, we'll use product->get_attributes.
	 * @param bool|int   $quantity  Quantity to include in the formatted product object.
	 *
	 * @return array
	 */
	public function get_formatted_product( $product, $variation_id = 0, $variation = false, $quantity = false ): array {
		$product_id = $product->is_type( 'variation' ) ? $product->get_parent_id() : $product->get_id();
		$price      = $product->get_price();

		// Get product price from chosen variation if set.
		if ( $variation_id ) {
			$variation_product = wc_get_product( $variation_id );
			if ( $variation_product ) {
				$price = $variation_product->get_price();
			}
		}

		// Integration with Product Bundles.
		// Get the minimum price, as `get_price` may return 0 if the product is a bundle and the price is potentially a range.
		// Even a range containing a single value.
		if ( $product->is_type( 'bundle' ) && is_callable( array( $product, 'get_bundle_price' ) ) ) {
			$price = $product->get_bundle_price( 'min' );
		}

		$formatted = array(
			'id'         => $product_id,
			'name'       => $product->get_title(),
			'categories' => array_map(
				fn( $category ) => array( 'name' => $category->name ),
				wc_get_product_terms( $product_id, 'product_cat', array( 'number' => 5 ) )
			),
			'prices'     => array(
				'price'               => intval(
					round(
						( (float) wc_format_decimal( $price ) ) * ( 10 ** absint( wc_get_price_decimals() ) ),
						0
					)
				),
				'currency_minor_unit' => wc_get_price_decimals(),
			),
		);

		if ( $quantity ) {
			$formatted['quantity'] = (int) $quantity;
		}

		if ( $product->is_type( 'variation' ) ) {
			$variation = $product->get_attributes();
		}

		if ( is_array( $variation ) ) {
			$formatted['variation'] = implode(
				', ',
				array_map(
					function ( $attribute, $value ) {
						return sprintf(
							'%s: %s',
							str_replace( 'attribute_', '', $attribute ),
							$value
						);
					},
					array_keys( $variation ),
					array_values( $variation )
				)
			);
		}

		return $formatted;
	}
}