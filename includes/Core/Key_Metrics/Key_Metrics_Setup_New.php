<?php
/**
 * Class Google\Site_Kit\Core\Key_Metrics\Key_Metrics_Setup_New
 *
 * @package   Google\Site_Kit\Core\Key_Metrics
 * @copyright 2023 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Key_Metrics;

use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for handling Key_Metrics_Setup_New state.
 *
 * @since 1.115.0
 * @access private
 * @ignore
 */
class Key_Metrics_Setup_New {

	use Method_Proxy_Trait;

	const TRANSIENT = 'googlesitekit_key_metrics_setup_new';

	/**
	 * Transients instance.
	 *
	 * @var Transients
	 */
	private $transients;

	/**
	 * Constructor.
	 *
	 * @since 1.115.0
	 *
	 * @param Transients $transients Transients instance.
	 */
	public function __construct( Transients $transients ) {
		$this->transients = $transients;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.115.0
	 */
	public function register() {
		add_action(
			'add_option_' . Key_Metrics_Setup_Completed_By::OPTION,
			$this->get_method_proxy( 'mark_setup_completed' ),
			10,
			2
		);

		add_filter( 'googlesitekit_inline_base_data', $this->get_method_proxy( 'inline_js_base_data' ) );
	}

	/**
	 * Marks Key Metrics setup as just completed for a limited period of time.
	 *
	 * @since 1.115.0
	 *
	 * @param string $option Key_Metrics_Setup_Completed_By option name.
	 * @param mixed  $value  Option value added.
	 */
	protected function mark_setup_completed( $option, $value ) {
		if ( $value ) {
			$this->transients->set( self::TRANSIENT, true, 2 * WEEK_IN_SECONDS );
		}
	}

	/**
	 * Extends base data with setup new state.
	 *
	 * @since 1.115.0
	 *
	 * @param array $data Inline base data.
	 * @return array
	 */
	protected function inline_js_base_data( $data ) {
		$data['keyMetricsSetupNew'] = (bool) $this->transients->get( self::TRANSIENT );

		return $data;
	}
}
