<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Audience_Utilities
 *
 * @package   Google\Site_Kit\Modules\Analytics_4
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdminV1alpha\GoogleAnalyticsAdminV1alphaAudience;

/**
 * Utility class for manipulating Analytics 4 audiences.
 *
 * @since 1.172.0
 * @access private
 * @ignore
 */
class Audience_Utilities {

	/**
	 * Weights for audience types when sorting audiences in the selection panel
	 * and within the dashboard widget.
	 */
	const AUDIENCE_TYPE_SORT_ORDER = array(
		'USER_AUDIENCE'     => 0,
		'SITE_KIT_AUDIENCE' => 1,
		'DEFAULT_AUDIENCE'  => 2,
	);

	/**
	 * Audience_Settings instance.
	 *
	 * @var Audience_Settings
	 */
	protected $audience_settings;

	/**
	 * Constructor.
	 *
	 * @since 1.172.0
	 *
	 * @param Audience_Settings $audience_settings Audience_Settings instance.
	 */
	public function __construct( Audience_Settings $audience_settings ) {
		$this->audience_settings = $audience_settings;
	}

	/**
	 * Sets and returns available audiences.
	 *
	 * @since 1.172.0
	 *
	 * @param GoogleAnalyticsAdminV1alphaAudience[] $audiences The audiences to set.
	 * @return array The available audiences.
	 */
	public function set_available_audiences( $audiences ) {
		$available_audiences = array_map(
			function ( GoogleAnalyticsAdminV1alphaAudience $audience ) {
				$display_name  = $audience->getDisplayName();
				$audience_item = array(
					'name'        => $audience->getName(),
					'displayName' => ( 'All Users' === $display_name ) ? 'All visitors' : $display_name,
					'description' => $audience->getDescription(),
				);

				$audience_slug = $this->get_audience_slug( $audience );
				$audience_type = $this->get_audience_type( $audience_slug );

				$audience_item['audienceType'] = $audience_type;
				$audience_item['audienceSlug'] = $audience_slug;

				return $audience_item;
			},
			$audiences
		);

		usort(
			$available_audiences,
			function ( $audience_a, $audience_b ) use ( $available_audiences ) {
				$audience_index_a = array_search( $audience_a, $available_audiences, true );
				$audience_index_b = array_search( $audience_b, $available_audiences, true );

				if ( false === $audience_index_a || false === $audience_index_b ) {
					return 0;
				}

				$audience_a = $available_audiences[ $audience_index_a ];
				$audience_b = $available_audiences[ $audience_index_b ];

				$audience_type_a = $audience_a['audienceType'];
				$audience_type_b = $audience_b['audienceType'];

				if ( $audience_type_a === $audience_type_b ) {
					if ( 'SITE_KIT_AUDIENCE' === $audience_type_b ) {
						return 'new-visitors' === $audience_a['audienceSlug'] ? -1 : 1;
					}

					return $audience_index_a - $audience_index_b;
				}

				$weight_a = self::AUDIENCE_TYPE_SORT_ORDER[ $audience_type_a ];
				$weight_b = self::AUDIENCE_TYPE_SORT_ORDER[ $audience_type_b ];

				if ( $weight_a === $weight_b ) {
					return $audience_index_a - $audience_index_b;
				}

				return $weight_a - $weight_b;
			}
		);

		$this->audience_settings->merge(
			array(
				'availableAudiences'             => $available_audiences,
				'availableAudiencesLastSyncedAt' => time(),
			)
		);

		return $available_audiences;
	}

	/**
	 * Returns the Site Kit-created audience display names from the passed list of audiences.
	 *
	 * @since 1.172.0
	 *
	 * @param array $audiences List of audiences.
	 *
	 * @return array List of Site Kit-created audience display names.
	 */
	public function get_site_kit_audiences( $audiences ) {
		// Ensure that audiences are available, otherwise return an empty array.
		if ( empty( $audiences ) || ! is_array( $audiences ) ) {
			return array();
		}

		$site_kit_audiences = array_filter( $audiences, fn ( $audience ) => ! empty( $audience['audienceType'] ) && ( 'SITE_KIT_AUDIENCE' === $audience['audienceType'] ) );

		if ( empty( $site_kit_audiences ) ) {
			return array();
		}

		return wp_list_pluck( $site_kit_audiences, 'displayName' );
	}

	/**
	 * Gets the audience slug.
	 *
	 * @since 1.172.0
	 *
	 * @param GoogleAnalyticsAdminV1alphaAudience $audience The audience object.
	 * @return string The audience slug.
	 */
	private function get_audience_slug( GoogleAnalyticsAdminV1alphaAudience $audience ) {
		$display_name = $audience->getDisplayName();

		if ( 'All Users' === $display_name ) {
			return 'all-users';
		}

		if ( 'Purchasers' === $display_name ) {
			return 'purchasers';
		}

		$filter_clauses = $audience->getFilterClauses();

		if ( $filter_clauses ) {
			if ( $this->has_audience_site_kit_identifier(
				$filter_clauses,
				'new_visitors'
			) ) {
				return 'new-visitors';
			}

			if ( $this->has_audience_site_kit_identifier(
				$filter_clauses,
				'returning_visitors'
			) ) {
				return 'returning-visitors';
			}
		}

		// Return an empty string for user defined audiences.
		return '';
	}

	/**
	 * Gets the audience type based on the audience slug.
	 *
	 * @since 1.172.0
	 *
	 * @param string $audience_slug The audience slug.
	 * @return string The audience type.
	 */
	private function get_audience_type( $audience_slug ) {
		if ( ! $audience_slug ) {
			return 'USER_AUDIENCE';
		}

		switch ( $audience_slug ) {
			case 'all-users':
			case 'purchasers':
				return 'DEFAULT_AUDIENCE';
			case 'new-visitors':
			case 'returning-visitors':
				return 'SITE_KIT_AUDIENCE';
		}
	}

	/**
	 * Checks if an audience Site Kit identifier
	 * (e.g. `created_by_googlesitekit:new_visitors`) exists in a nested array or object.
	 *
	 * @since 1.172.0
	 *
	 * @param array|object $data The array or object to search.
	 * @param mixed        $identifier The identifier to search for.
	 * @return bool True if the value exists, false otherwise.
	 */
	private function has_audience_site_kit_identifier( $data, $identifier ) {
		if ( is_array( $data ) || is_object( $data ) ) {
			foreach ( $data as $key => $value ) {
				if ( is_array( $value ) || is_object( $value ) ) {
					// Recursively search the nested structure.
					if ( $this->has_audience_site_kit_identifier( $value, $identifier ) ) {
						return true;
					}
				} elseif (
					'fieldName' === $key &&
					'groupId' === $value &&
					isset( $data['stringFilter'] ) &&
					"created_by_googlesitekit:{$identifier}" === $data['stringFilter']['value']
				) {
					return true;
				}
			}
		}

		return false;
	}
}
