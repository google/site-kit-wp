<?php
/**
 * Class Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization\CTA
 *
 * @package   Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization;

use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Cta as WCP_CTA;

/**
 * Class for synchronizing CTA data with Reader Revenue Manager settings.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class CTA {

	/**
	 * Cron event name for synchronizing CTA data.
	 */
	const CRON_SYNCHRONIZE_PUBLICATION_CTAS = 'googlesitekit_cron_synchronize_publication_ctas';

	/**
	 * Reader Revenue Manager settings.
	 *
	 * @since n.e.x.t
	 * @var Settings
	 */
	private $settings;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Settings $settings Reader Revenue Manager settings.
	 */
	public function __construct( Settings $settings ) {
		$this->settings = $settings;
	}

	/**
	 * Synchronizes CTAs with the module settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param WCP_CTA[] $ctas WCP CTA objects.
	 * @return void No return value.
	 */
	public function synchronize( array $ctas ) {
		$configured_ctas = array();

		foreach ( $ctas as $cta ) {
			if ( ! $cta instanceof WCP_CTA ) {
				continue;
			}

			$cta_id = $this->get_cta_id( $cta );

			if ( empty( $cta_id ) || empty( $cta->getType() ) ) {
				continue;
			}

			$configured_ctas[ $cta_id ] = $cta->getType();
		}

		$this->settings->merge( array( 'configuredCTAs' => $configured_ctas ) );
		$this->reschedule();
	}

	/**
	 * Gets the CTA ID from a WCP CTA resource name.
	 *
	 * @since n.e.x.t
	 *
	 * @param WCP_CTA $cta WCP CTA object.
	 * @return string CTA ID, or an empty string if none can be determined.
	 */
	private function get_cta_id( WCP_CTA $cta ) {
		$name = $cta->getName();

		if ( empty( $name ) ) {
			return '';
		}

		$parts  = explode( '/', $name );
		$cta_id = end( $parts );

		return is_string( $cta_id ) ? $cta_id : '';
	}

	/**
	 * Reschedules CTA synchronization to run in one hour.
	 *
	 * @since n.e.x.t
	 *
	 * @return void No return value.
	 */
	private function reschedule() {
		$cron_event = wp_next_scheduled( self::CRON_SYNCHRONIZE_PUBLICATION_CTAS );

		if ( $cron_event ) {
			wp_unschedule_event( $cron_event, self::CRON_SYNCHRONIZE_PUBLICATION_CTAS );
		}

		wp_schedule_single_event(
			time() + HOUR_IN_SECONDS,
			self::CRON_SYNCHRONIZE_PUBLICATION_CTAS
		);
	}
}
