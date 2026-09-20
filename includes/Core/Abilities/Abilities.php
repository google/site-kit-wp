<?php
/**
 * Class Google\Site_Kit\Core\Abilities\Abilities
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Abilities;

use Google\Site_Kit\Context;

/**
 * Registers core and module abilities with WordPress.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Abilities {

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_action(
			'wp_abilities_api_categories_init',
			function () {
				if ( ! function_exists( 'wp_register_ability_category' ) ) {
					return;
				}

				wp_register_ability_category(
					Ability::CATEGORY,
					array(
						'label'       => __( 'Site Kit', 'google-site-kit' ),
						'description' => __( 'Abilities for accessing and managing Google services through Site Kit.', 'google-site-kit' ),
					)
				);
			}
		);

		add_action(
			'wp_abilities_api_init',
			function () {
				if ( ! function_exists( 'wp_register_ability' ) ) {
					return;
				}

				foreach ( $this->get_abilities() as $ability ) {
					$ability->register();
				}
			}
		);
	}

	/**
	 * Gets available abilities.
	 *
	 * @since n.e.x.t
	 *
	 * @return Ability[] Core abilities and abilities contributed through the filter.
	 */
	private function get_abilities() {
		$abilities = array(
			new Reset_Site( $this->context ),
			new Disconnect_Authentication( $this->context ),
			new Subscribe_To_Email_Reports( $this->context ),
			new Personalize_Metrics( $this->context ),
		);

		/**
		 * Filters the list of available abilities.
		 *
		 * Core features and active modules can contribute ability definitions.
		 *
		 * @since n.e.x.t
		 *
		 * @param Ability[] $abilities List of ability definitions.
		 */
		return apply_filters( 'googlesitekit_abilities', $abilities );
	}
}
