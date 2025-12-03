<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Audiences
 *
 * @package   Google\Site_Kit
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit_Dependencies\Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaAudience;

/**
 * Audience utility/service class for Analytics 4 module.
 *
 * @since n.e.x.t
 */
class Audiences {
	/**
	 * Audience type sort order.
	 *
	 * @since n.e.x.t
	 */
	const AUDIENCE_TYPE_SORT_ORDER = array(
		'DEFAULT_AUDIENCE'  => 10,
		'SITE_KIT_AUDIENCE' => 20,
		'USER_AUDIENCE'     => 30,
	);

	/**
	 * Callback used to persist available audiences.
	 *
	 * @var callable
	 */
	private $persist_callback;

	/**
	 * Constructor.
	 *
	 * @param callable $persist_callback Callback that accepts ( array $available_audiences ) and stores them.
	 */
	public function __construct( callable $persist_callback ) {
		$this->persist_callback = $persist_callback;
	}

	/**
	 * Sets and returns available audiences.
	 *
	 * @since n.e.x.t
	 *
	 * @param GoogleAnalyticsAdminV1alphaAudience[] $audiences Audiences to set.
	 * @return array Available audiences.
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

		// Persist via callback so Analytics_4 remains owner of settings storage.
		call_user_func( $this->persist_callback, $available_audiences );

		return $available_audiences;
	}

	/**
	 * Gets Site Kit-created audience display names from a list.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $audiences Audience list.
	 * @return array Display names for Site Kit-created audiences.
	 */
	public function get_site_kit_audiences( $audiences ) {
		if ( empty( $audiences ) || ! is_array( $audiences ) ) {
			return array();
		}

		$site_kit_audiences = array_filter(
			$audiences,
			fn ( $audience ) => ! empty( $audience['audienceType'] ) && ( 'SITE_KIT_AUDIENCE' === $audience['audienceType'] )
		);

		if ( empty( $site_kit_audiences ) ) {
			return array();
		}

		return wp_list_pluck( $site_kit_audiences, 'displayName' );
	}

	/**
	 * Gets audience slug.
	 *
	 * @since n.e.x.t
	 *
	 * @param GoogleAnalyticsAdminV1alphaAudience $audience Audience.
	 * @return string Audience slug.
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
			if ( $this->has_audience_site_kit_identifier( $filter_clauses, 'new_visitors' ) ) {
				return 'new-visitors';
			}

			if ( $this->has_audience_site_kit_identifier( $filter_clauses, 'returning_visitors' ) ) {
				return 'returning-visitors';
			}
		}

		return '';
	}

	/**
	 * Gets audience type by slug.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $audience_slug Audience slug.
	 * @return string Audience type.
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
	 * Recursively checks for Site Kit identifier.
	 *
	 * @since n.e.x.t
	 *
	 * @param array|object $data Data structure.
	 * @param mixed        $identifier Identifier.
	 * @return bool True if found.
	 */
	private function has_audience_site_kit_identifier( $data, $identifier ) {
		if ( is_array( $data ) || is_object( $data ) ) {
			foreach ( $data as $key => $value ) {
				if ( is_array( $value ) || is_object( $value ) ) {
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
