<?php
/**
 * Page metrics section template.
 *
 * This template renders a section with grouped metric tables (e.g., top pages, authors, categories).
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var array    $section            Section configuration including title, icon, section_parts.
 * @var callable $render_part        Function to render a template part by name.
 * @var callable $render_shared_part Function to render a shared part by name.
 * @var callable $get_asset_url      Function to get asset URLs.
 */

use Google\Site_Kit\Core\Email_Reporting\Sections_Map;

$section_title = $section['title'];
$section_icon  = $section['icon'];
$dashboard_url = $section['dashboard_url'];
$section_parts = $section['section_parts'];

// Get the first item's change_context for the subtitle.
$first_part      = reset( $section_parts );
$first_data_item = ! empty( $first_part['data'] ) ? $first_part['data'] : array();
$subtitle        = $first_data_item['change_context'] ?? '';
?>
<table role="presentation" width="100%" style="margin-bottom:24px;">
	<tr>
		<td style="background-color: #FFFFFF; border-radius: 16px; padding: 16px;">
			<?php
			// Render section header.
			$icon_url = $get_asset_url( 'icon-' . esc_html( $section_icon ) . '.png' );
			$render_part(
				'section-header',
				array(
					'icon'     => $icon_url,
					'title'    => $section_title,
					'subtitle' => '',
				)
			);

			// Render each metric group.
			foreach ( $section_parts as $part_key => $part_config ) {
				$is_last_section_part = array_key_last( $section_parts ) === $part_key;
				$data                 = $part_config['data'];
				$part_label           = Sections_Map::get_part_label( $part_key );

				if ( empty( $data ) ) {
					continue;
				}

				$change_context = $data['change_context'] ?? '';
				?>
			<table role="presentation" width="100%" style="margin-bottom:16px;">
				<tr>
					<td style="font-size:12px; line-height:16px; font-weight:500; color:#6C726E; padding-bottom:8px;">
						<div style="width: 160px;">
							<?php echo esc_html( $part_label ); ?>
						</div>
					</td>
					<td
						style="font-size:12px; line-height:16px; font-weight:500; color:#6C726E; text-align:right; padding-bottom:8px; text-align:right; width: 110px;">
						<?php echo esc_html( $change_context ); ?>
					</td>
				</tr>
				<?php
				foreach ( $data['dimension_values'] as $index => $item ) {
					$is_last      = array_key_last( $data ) === $index;
					$border_style = $is_last && ! $is_last_section_part ? '1px solid #EBEEF0' : 'none';
					$has_url      = ! empty( $item['url'] );

					// Build entity dashboard URL from page URL.
					$entity_url = '';
					if ( $has_url ) {
						$entity_url = add_query_arg( 'permaLink', $item['url'], $dashboard_url ) . '#traffic';
					}
					?>
				<tr>
					<td colspan="2"
						style="border-bottom: <?php echo esc_attr( $border_style ); ?>; padding: 5px 0; <?php echo $is_last && ! $is_last_section_part ? 'padding-bottom: 16px;' : ''; ?>">
						<?php // Nested table required to ensure truncation works correctly for longer labels. ?>
						<table role="presentation" width="100%">
							<tr>
								<td
									style="font-size:14px; line-height:20px; font-weight:500; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
									<?php if ( $has_url ) : ?>
									<a href="<?php echo esc_url( $entity_url ); ?>"
										style="color:#161B18; text-decoration:underline;">
										<?php echo esc_html( $item['label'] ); ?>
									</a>
									<?php else : ?>
										<?php echo esc_html( $item ); ?>
									<?php endif; ?>
								</td>
								<td
									style="font-size:14px; line-height:20px; font-weight:500; text-align:right; width:80px;">
									<?php echo esc_html( $data['values'][ $index ] ?? 0 ); ?>
								</td>
								<td style="text-align:right; width:80px;">
									<?php
										$render_shared_part(
											'change-badge',
											array(
												'value' => $data['changes'][ $index ] ?? 0,
											)
										);
									?>
								</td>
							</tr>
						</table>
					</td>
				</tr>
					<?php
				}
				?>
			</table>
				<?php
			}

			// Render view more in dashboard link.
			$render_part(
				'view-more-in-dashboard',
				array(
					'url'           => $dashboard_url,
					'get_asset_url' => $get_asset_url,
				)
			);
			?>
		</td>
	</tr>
</table>
