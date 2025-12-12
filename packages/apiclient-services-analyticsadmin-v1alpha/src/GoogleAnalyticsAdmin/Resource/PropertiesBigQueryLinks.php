<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\GoogleAnalyticsAdmin\Resource;

use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaBigQueryLink;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListBigQueryLinksResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleProtobufEmpty;

/**
 * The "bigQueryLinks" collection of methods.
 * Typical usage is:
 *  <code>
 *   $analyticsadminService = new Google\Service\GoogleAnalyticsAdmin(...);
 *   $bigQueryLinks = $analyticsadminService->properties_bigQueryLinks;
 *  </code>
 */
class PropertiesBigQueryLinks extends \Google\Service\Resource
{
  /**
   * Creates a BigQueryLink. (bigQueryLinks.create)
   *
   * @param string $parent Required. Example format: properties/1234
   * @param GoogleAnalyticsAdminV1alphaBigQueryLink $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaBigQueryLink
   * @throws \Google\Service\Exception
   */
  public function create($parent, GoogleAnalyticsAdminV1alphaBigQueryLink $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('create', [$params], GoogleAnalyticsAdminV1alphaBigQueryLink::class);
  }
  /**
   * Deletes a BigQueryLink on a property. (bigQueryLinks.delete)
   *
   * @param string $name Required. The BigQueryLink to delete. Example format:
   * properties/1234/bigQueryLinks/5678
   * @param array $optParams Optional parameters.
   * @return GoogleProtobufEmpty
   * @throws \Google\Service\Exception
   */
  public function delete($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('delete', [$params], GoogleProtobufEmpty::class);
  }
  /**
   * Lookup for a single BigQuery Link. (bigQueryLinks.get)
   *
   * @param string $name Required. The name of the BigQuery link to lookup.
   * Format: properties/{property_id}/bigQueryLinks/{bigquery_link_id} Example:
   * properties/123/bigQueryLinks/456
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaBigQueryLink
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], GoogleAnalyticsAdminV1alphaBigQueryLink::class);
  }
  /**
   * Lists BigQuery Links on a property.
   * (bigQueryLinks.listPropertiesBigQueryLinks)
   *
   * @param string $parent Required. The name of the property to list BigQuery
   * links under. Format: properties/{property_id} Example: properties/1234
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize The maximum number of resources to return. The
   * service may return fewer than this value, even if there are additional pages.
   * If unspecified, at most 50 resources will be returned. The maximum value is
   * 200; (higher values will be coerced to the maximum)
   * @opt_param string pageToken A page token, received from a previous
   * `ListBigQueryLinks` call. Provide this to retrieve the subsequent page. When
   * paginating, all other parameters provided to `ListBigQueryLinks` must match
   * the call that provided the page token.
   * @return GoogleAnalyticsAdminV1alphaListBigQueryLinksResponse
   * @throws \Google\Service\Exception
   */
  public function listPropertiesBigQueryLinks($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], GoogleAnalyticsAdminV1alphaListBigQueryLinksResponse::class);
  }
  /**
   * Updates a BigQueryLink. (bigQueryLinks.patch)
   *
   * @param string $name Output only. Resource name of this BigQuery link. Format:
   * 'properties/{property_id}/bigQueryLinks/{bigquery_link_id}' Format:
   * 'properties/1234/bigQueryLinks/abc567'
   * @param GoogleAnalyticsAdminV1alphaBigQueryLink $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Required. The list of fields to be updated.
   * Field names must be in snake case (e.g., "field_to_update"). Omitted fields
   * will not be updated. To replace the entire entity, use one path with the
   * string "*" to match all fields.
   * @return GoogleAnalyticsAdminV1alphaBigQueryLink
   * @throws \Google\Service\Exception
   */
  public function patch($name, GoogleAnalyticsAdminV1alphaBigQueryLink $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('patch', [$params], GoogleAnalyticsAdminV1alphaBigQueryLink::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PropertiesBigQueryLinks::class, 'Google_Service_GoogleAnalyticsAdmin_Resource_PropertiesBigQueryLinks');
