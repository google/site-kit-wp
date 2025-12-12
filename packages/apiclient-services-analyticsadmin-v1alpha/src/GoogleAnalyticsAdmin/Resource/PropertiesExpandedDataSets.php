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

use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaExpandedDataSet;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListExpandedDataSetsResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleProtobufEmpty;

/**
 * The "expandedDataSets" collection of methods.
 * Typical usage is:
 *  <code>
 *   $analyticsadminService = new Google\Service\GoogleAnalyticsAdmin(...);
 *   $expandedDataSets = $analyticsadminService->properties_expandedDataSets;
 *  </code>
 */
class PropertiesExpandedDataSets extends \Google\Service\Resource
{
  /**
   * Creates a ExpandedDataSet. (expandedDataSets.create)
   *
   * @param string $parent Required. Example format: properties/1234
   * @param GoogleAnalyticsAdminV1alphaExpandedDataSet $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaExpandedDataSet
   * @throws \Google\Service\Exception
   */
  public function create($parent, GoogleAnalyticsAdminV1alphaExpandedDataSet $postBody, $optParams = [])
  {
    $params = ['parent' => $parent, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('create', [$params], GoogleAnalyticsAdminV1alphaExpandedDataSet::class);
  }
  /**
   * Deletes a ExpandedDataSet on a property. (expandedDataSets.delete)
   *
   * @param string $name Required. Example format:
   * properties/1234/expandedDataSets/5678
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
   * Lookup for a single ExpandedDataSet. (expandedDataSets.get)
   *
   * @param string $name Required. The name of the ExpandedDataSet to get. Example
   * format: properties/1234/expandedDataSets/5678
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaExpandedDataSet
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], GoogleAnalyticsAdminV1alphaExpandedDataSet::class);
  }
  /**
   * Lists ExpandedDataSets on a property.
   * (expandedDataSets.listPropertiesExpandedDataSets)
   *
   * @param string $parent Required. Example format: properties/1234
   * @param array $optParams Optional parameters.
   *
   * @opt_param int pageSize The maximum number of resources to return. If
   * unspecified, at most 50 resources will be returned. The maximum value is 200
   * (higher values will be coerced to the maximum).
   * @opt_param string pageToken A page token, received from a previous
   * `ListExpandedDataSets` call. Provide this to retrieve the subsequent page.
   * When paginating, all other parameters provided to `ListExpandedDataSet` must
   * match the call that provided the page token.
   * @return GoogleAnalyticsAdminV1alphaListExpandedDataSetsResponse
   * @throws \Google\Service\Exception
   */
  public function listPropertiesExpandedDataSets($parent, $optParams = [])
  {
    $params = ['parent' => $parent];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], GoogleAnalyticsAdminV1alphaListExpandedDataSetsResponse::class);
  }
  /**
   * Updates a ExpandedDataSet on a property. (expandedDataSets.patch)
   *
   * @param string $name Output only. The resource name for this ExpandedDataSet
   * resource. Format:
   * properties/{property_id}/expandedDataSets/{expanded_data_set}
   * @param GoogleAnalyticsAdminV1alphaExpandedDataSet $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Required. The list of fields to be updated.
   * Field names must be in snake case (e.g., "field_to_update"). Omitted fields
   * will not be updated. To replace the entire entity, use one path with the
   * string "*" to match all fields.
   * @return GoogleAnalyticsAdminV1alphaExpandedDataSet
   * @throws \Google\Service\Exception
   */
  public function patch($name, GoogleAnalyticsAdminV1alphaExpandedDataSet $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('patch', [$params], GoogleAnalyticsAdminV1alphaExpandedDataSet::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PropertiesExpandedDataSets::class, 'Google_Service_GoogleAnalyticsAdmin_Resource_PropertiesExpandedDataSets');
