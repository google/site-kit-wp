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

use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaAcknowledgeUserDataCollectionRequest;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaAcknowledgeUserDataCollectionResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaAttributionSettings;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaCreateConnectedSiteTagRequest;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaCreateConnectedSiteTagResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaCreateRollupPropertyRequest;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaCreateRollupPropertyResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaDataRetentionSettings;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaDeleteConnectedSiteTagRequest;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaFetchAutomatedGa4ConfigurationOptOutRequest;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaFetchAutomatedGa4ConfigurationOptOutResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaFetchConnectedGa4PropertyResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaGoogleSignalsSettings;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListConnectedSiteTagsRequest;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListConnectedSiteTagsResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaListPropertiesResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaProperty;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaProvisionSubpropertyRequest;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaProvisionSubpropertyResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaRunAccessReportRequest;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaRunAccessReportResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaSetAutomatedGa4ConfigurationOptOutRequest;
use Google\Service\GoogleAnalyticsAdmin\GoogleAnalyticsAdminV1alphaSetAutomatedGa4ConfigurationOptOutResponse;
use Google\Service\GoogleAnalyticsAdmin\GoogleProtobufEmpty;

/**
 * The "properties" collection of methods.
 * Typical usage is:
 *  <code>
 *   $analyticsadminService = new Google\Service\GoogleAnalyticsAdmin(...);
 *   $properties = $analyticsadminService->properties;
 *  </code>
 */
class Properties extends \Google\Service\Resource
{
  /**
   * Acknowledges the terms of user data collection for the specified property.
   * This acknowledgement must be completed (either in the Google Analytics UI or
   * through this API) before MeasurementProtocolSecret resources may be created.
   * (properties.acknowledgeUserDataCollection)
   *
   * @param string $property Required. The property for which to acknowledge user
   * data collection.
   * @param GoogleAnalyticsAdminV1alphaAcknowledgeUserDataCollectionRequest $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaAcknowledgeUserDataCollectionResponse
   * @throws \Google\Service\Exception
   */
  public function acknowledgeUserDataCollection($property, GoogleAnalyticsAdminV1alphaAcknowledgeUserDataCollectionRequest $postBody, $optParams = [])
  {
    $params = ['property' => $property, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('acknowledgeUserDataCollection', [$params], GoogleAnalyticsAdminV1alphaAcknowledgeUserDataCollectionResponse::class);
  }
  /**
   * Creates a Google Analytics property with the specified location and
   * attributes. (properties.create)
   *
   * @param GoogleAnalyticsAdminV1alphaProperty $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaProperty
   * @throws \Google\Service\Exception
   */
  public function create(GoogleAnalyticsAdminV1alphaProperty $postBody, $optParams = [])
  {
    $params = ['postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('create', [$params], GoogleAnalyticsAdminV1alphaProperty::class);
  }
  /**
   * Creates a connected site tag for a Universal Analytics property. You can
   * create a maximum of 20 connected site tags per property. Note: This API
   * cannot be used on GA4 properties. (properties.createConnectedSiteTag)
   *
   * @param GoogleAnalyticsAdminV1alphaCreateConnectedSiteTagRequest $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaCreateConnectedSiteTagResponse
   * @throws \Google\Service\Exception
   */
  public function createConnectedSiteTag(GoogleAnalyticsAdminV1alphaCreateConnectedSiteTagRequest $postBody, $optParams = [])
  {
    $params = ['postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('createConnectedSiteTag', [$params], GoogleAnalyticsAdminV1alphaCreateConnectedSiteTagResponse::class);
  }
  /**
   * Create a roll-up property and all roll-up property source links.
   * (properties.createRollupProperty)
   *
   * @param GoogleAnalyticsAdminV1alphaCreateRollupPropertyRequest $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaCreateRollupPropertyResponse
   * @throws \Google\Service\Exception
   */
  public function createRollupProperty(GoogleAnalyticsAdminV1alphaCreateRollupPropertyRequest $postBody, $optParams = [])
  {
    $params = ['postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('createRollupProperty', [$params], GoogleAnalyticsAdminV1alphaCreateRollupPropertyResponse::class);
  }
  /**
   * Marks target Property as soft-deleted (ie: "trashed") and returns it. This
   * API does not have a method to restore soft-deleted properties. However, they
   * can be restored using the Trash Can UI. If the properties are not restored
   * before the expiration time, the Property and all child resources (eg:
   * GoogleAdsLinks, Streams, AccessBindings) will be permanently purged.
   * https://support.google.com/analytics/answer/6154772 Returns an error if the
   * target is not found. (properties.delete)
   *
   * @param string $name Required. The name of the Property to soft-delete.
   * Format: properties/{property_id} Example: "properties/1000"
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaProperty
   * @throws \Google\Service\Exception
   */
  public function delete($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('delete', [$params], GoogleAnalyticsAdminV1alphaProperty::class);
  }
  /**
   * Deletes a connected site tag for a Universal Analytics property. Note: this
   * has no effect on GA4 properties. (properties.deleteConnectedSiteTag)
   *
   * @param GoogleAnalyticsAdminV1alphaDeleteConnectedSiteTagRequest $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleProtobufEmpty
   * @throws \Google\Service\Exception
   */
  public function deleteConnectedSiteTag(GoogleAnalyticsAdminV1alphaDeleteConnectedSiteTagRequest $postBody, $optParams = [])
  {
    $params = ['postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('deleteConnectedSiteTag', [$params], GoogleProtobufEmpty::class);
  }
  /**
   * Fetches the opt out status for the automated GA4 setup process for a UA
   * property. Note: this has no effect on GA4 property.
   * (properties.fetchAutomatedGa4ConfigurationOptOut)
   *
   * @param GoogleAnalyticsAdminV1alphaFetchAutomatedGa4ConfigurationOptOutRequest $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaFetchAutomatedGa4ConfigurationOptOutResponse
   * @throws \Google\Service\Exception
   */
  public function fetchAutomatedGa4ConfigurationOptOut(GoogleAnalyticsAdminV1alphaFetchAutomatedGa4ConfigurationOptOutRequest $postBody, $optParams = [])
  {
    $params = ['postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('fetchAutomatedGa4ConfigurationOptOut', [$params], GoogleAnalyticsAdminV1alphaFetchAutomatedGa4ConfigurationOptOutResponse::class);
  }
  /**
   * Given a specified UA property, looks up the GA4 property connected to it.
   * Note: this cannot be used with GA4 properties.
   * (properties.fetchConnectedGa4Property)
   *
   * @param array $optParams Optional parameters.
   *
   * @opt_param string property Required. The UA property for which to look up the
   * connected GA4 property. Note this request uses the internal property ID, not
   * the tracking ID of the form UA-XXXXXX-YY. Format:
   * properties/{internal_web_property_id} Example: properties/1234
   * @return GoogleAnalyticsAdminV1alphaFetchConnectedGa4PropertyResponse
   * @throws \Google\Service\Exception
   */
  public function fetchConnectedGa4Property($optParams = [])
  {
    $params = [];
    $params = array_merge($params, $optParams);
    return $this->call('fetchConnectedGa4Property', [$params], GoogleAnalyticsAdminV1alphaFetchConnectedGa4PropertyResponse::class);
  }
  /**
   * Lookup for a single GA Property. (properties.get)
   *
   * @param string $name Required. The name of the property to lookup. Format:
   * properties/{property_id} Example: "properties/1000"
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaProperty
   * @throws \Google\Service\Exception
   */
  public function get($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('get', [$params], GoogleAnalyticsAdminV1alphaProperty::class);
  }
  /**
   * Lookup for a AttributionSettings singleton.
   * (properties.getAttributionSettings)
   *
   * @param string $name Required. The name of the attribution settings to
   * retrieve. Format: properties/{property}/attributionSettings
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaAttributionSettings
   * @throws \Google\Service\Exception
   */
  public function getAttributionSettings($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('getAttributionSettings', [$params], GoogleAnalyticsAdminV1alphaAttributionSettings::class);
  }
  /**
   * Returns the singleton data retention settings for this property.
   * (properties.getDataRetentionSettings)
   *
   * @param string $name Required. The name of the settings to lookup. Format:
   * properties/{property}/dataRetentionSettings Example:
   * "properties/1000/dataRetentionSettings"
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaDataRetentionSettings
   * @throws \Google\Service\Exception
   */
  public function getDataRetentionSettings($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('getDataRetentionSettings', [$params], GoogleAnalyticsAdminV1alphaDataRetentionSettings::class);
  }
  /**
   * Lookup for Google Signals settings for a property.
   * (properties.getGoogleSignalsSettings)
   *
   * @param string $name Required. The name of the google signals settings to
   * retrieve. Format: properties/{property}/googleSignalsSettings
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaGoogleSignalsSettings
   * @throws \Google\Service\Exception
   */
  public function getGoogleSignalsSettings($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('getGoogleSignalsSettings', [$params], GoogleAnalyticsAdminV1alphaGoogleSignalsSettings::class);
  }
  /**
   * Returns child Properties under the specified parent Account. Properties will
   * be excluded if the caller does not have access. Soft-deleted (ie: "trashed")
   * properties are excluded by default. Returns an empty list if no relevant
   * properties are found. (properties.listProperties)
   *
   * @param array $optParams Optional parameters.
   *
   * @opt_param string filter Required. An expression for filtering the results of
   * the request. Fields eligible for filtering are: `parent:`(The resource name
   * of the parent account/property) or `ancestor:`(The resource name of the
   * parent account) or `firebase_project:`(The id or number of the linked
   * firebase project). Some examples of filters: ``` | Filter | Description |
   * |-----------------------------|-------------------------------------------| |
   * parent:accounts/123 | The account with account id: 123. | |
   * parent:properties/123 | The property with property id: 123. | |
   * ancestor:accounts/123 | The account with account id: 123. | |
   * firebase_project:project-id | The firebase project with id: project-id. | |
   * firebase_project:123 | The firebase project with number: 123. | ```
   * @opt_param int pageSize The maximum number of resources to return. The
   * service may return fewer than this value, even if there are additional pages.
   * If unspecified, at most 50 resources will be returned. The maximum value is
   * 200; (higher values will be coerced to the maximum)
   * @opt_param string pageToken A page token, received from a previous
   * `ListProperties` call. Provide this to retrieve the subsequent page. When
   * paginating, all other parameters provided to `ListProperties` must match the
   * call that provided the page token.
   * @opt_param bool showDeleted Whether to include soft-deleted (ie: "trashed")
   * Properties in the results. Properties can be inspected to determine whether
   * they are deleted or not.
   * @return GoogleAnalyticsAdminV1alphaListPropertiesResponse
   * @throws \Google\Service\Exception
   */
  public function listProperties($optParams = [])
  {
    $params = [];
    $params = array_merge($params, $optParams);
    return $this->call('list', [$params], GoogleAnalyticsAdminV1alphaListPropertiesResponse::class);
  }
  /**
   * Lists the connected site tags for a Universal Analytics property. A maximum
   * of 20 connected site tags will be returned. Note: this has no effect on GA4
   * property. (properties.listConnectedSiteTags)
   *
   * @param GoogleAnalyticsAdminV1alphaListConnectedSiteTagsRequest $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaListConnectedSiteTagsResponse
   * @throws \Google\Service\Exception
   */
  public function listConnectedSiteTags(GoogleAnalyticsAdminV1alphaListConnectedSiteTagsRequest $postBody, $optParams = [])
  {
    $params = ['postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('listConnectedSiteTags', [$params], GoogleAnalyticsAdminV1alphaListConnectedSiteTagsResponse::class);
  }
  /**
   * Updates a property. (properties.patch)
   *
   * @param string $name Output only. Resource name of this property. Format:
   * properties/{property_id} Example: "properties/1000"
   * @param GoogleAnalyticsAdminV1alphaProperty $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Required. The list of fields to be updated.
   * Field names must be in snake case (e.g., "field_to_update"). Omitted fields
   * will not be updated. To replace the entire entity, use one path with the
   * string "*" to match all fields.
   * @return GoogleAnalyticsAdminV1alphaProperty
   * @throws \Google\Service\Exception
   */
  public function patch($name, GoogleAnalyticsAdminV1alphaProperty $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('patch', [$params], GoogleAnalyticsAdminV1alphaProperty::class);
  }
  /**
   * Create a subproperty and a subproperty event filter that applies to the
   * created subproperty. (properties.provisionSubproperty)
   *
   * @param GoogleAnalyticsAdminV1alphaProvisionSubpropertyRequest $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaProvisionSubpropertyResponse
   * @throws \Google\Service\Exception
   */
  public function provisionSubproperty(GoogleAnalyticsAdminV1alphaProvisionSubpropertyRequest $postBody, $optParams = [])
  {
    $params = ['postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('provisionSubproperty', [$params], GoogleAnalyticsAdminV1alphaProvisionSubpropertyResponse::class);
  }
  /**
   * Returns a customized report of data access records. The report provides
   * records of each time a user reads Google Analytics reporting data. Access
   * records are retained for up to 2 years. Data Access Reports can be requested
   * for a property. Reports may be requested for any property, but dimensions
   * that aren't related to quota can only be requested on Google Analytics 360
   * properties. This method is only available to Administrators. These data
   * access records include GA UI Reporting, GA UI Explorations, GA Data API, and
   * other products like Firebase & Admob that can retrieve data from Google
   * Analytics through a linkage. These records don't include property
   * configuration changes like adding a stream or changing a property's time
   * zone. For configuration change history, see [searchChangeHistoryEvents](https
   * ://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/acc
   * ounts/searchChangeHistoryEvents). (properties.runAccessReport)
   *
   * @param string $entity The Data Access Report supports requesting at the
   * property level or account level. If requested at the account level, Data
   * Access Reports include all access for all properties under that account. To
   * request at the property level, entity should be for example 'properties/123'
   * if "123" is your Google Analytics property ID. To request at the account
   * level, entity should be for example 'accounts/1234' if "1234" is your Google
   * Analytics Account ID.
   * @param GoogleAnalyticsAdminV1alphaRunAccessReportRequest $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaRunAccessReportResponse
   * @throws \Google\Service\Exception
   */
  public function runAccessReport($entity, GoogleAnalyticsAdminV1alphaRunAccessReportRequest $postBody, $optParams = [])
  {
    $params = ['entity' => $entity, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('runAccessReport', [$params], GoogleAnalyticsAdminV1alphaRunAccessReportResponse::class);
  }
  /**
   * Sets the opt out status for the automated GA4 setup process for a UA
   * property. Note: this has no effect on GA4 property.
   * (properties.setAutomatedGa4ConfigurationOptOut)
   *
   * @param GoogleAnalyticsAdminV1alphaSetAutomatedGa4ConfigurationOptOutRequest $postBody
   * @param array $optParams Optional parameters.
   * @return GoogleAnalyticsAdminV1alphaSetAutomatedGa4ConfigurationOptOutResponse
   * @throws \Google\Service\Exception
   */
  public function setAutomatedGa4ConfigurationOptOut(GoogleAnalyticsAdminV1alphaSetAutomatedGa4ConfigurationOptOutRequest $postBody, $optParams = [])
  {
    $params = ['postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('setAutomatedGa4ConfigurationOptOut', [$params], GoogleAnalyticsAdminV1alphaSetAutomatedGa4ConfigurationOptOutResponse::class);
  }
  /**
   * Updates attribution settings on a property.
   * (properties.updateAttributionSettings)
   *
   * @param string $name Output only. Resource name of this attribution settings
   * resource. Format: properties/{property_id}/attributionSettings Example:
   * "properties/1000/attributionSettings"
   * @param GoogleAnalyticsAdminV1alphaAttributionSettings $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Required. The list of fields to be updated.
   * Field names must be in snake case (e.g., "field_to_update"). Omitted fields
   * will not be updated. To replace the entire entity, use one path with the
   * string "*" to match all fields.
   * @return GoogleAnalyticsAdminV1alphaAttributionSettings
   * @throws \Google\Service\Exception
   */
  public function updateAttributionSettings($name, GoogleAnalyticsAdminV1alphaAttributionSettings $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('updateAttributionSettings', [$params], GoogleAnalyticsAdminV1alphaAttributionSettings::class);
  }
  /**
   * Updates the singleton data retention settings for this property.
   * (properties.updateDataRetentionSettings)
   *
   * @param string $name Output only. Resource name for this DataRetentionSetting
   * resource. Format: properties/{property}/dataRetentionSettings
   * @param GoogleAnalyticsAdminV1alphaDataRetentionSettings $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Required. The list of fields to be updated.
   * Field names must be in snake case (e.g., "field_to_update"). Omitted fields
   * will not be updated. To replace the entire entity, use one path with the
   * string "*" to match all fields.
   * @return GoogleAnalyticsAdminV1alphaDataRetentionSettings
   * @throws \Google\Service\Exception
   */
  public function updateDataRetentionSettings($name, GoogleAnalyticsAdminV1alphaDataRetentionSettings $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('updateDataRetentionSettings', [$params], GoogleAnalyticsAdminV1alphaDataRetentionSettings::class);
  }
  /**
   * Updates Google Signals settings for a property.
   * (properties.updateGoogleSignalsSettings)
   *
   * @param string $name Output only. Resource name of this setting. Format:
   * properties/{property_id}/googleSignalsSettings Example:
   * "properties/1000/googleSignalsSettings"
   * @param GoogleAnalyticsAdminV1alphaGoogleSignalsSettings $postBody
   * @param array $optParams Optional parameters.
   *
   * @opt_param string updateMask Required. The list of fields to be updated.
   * Field names must be in snake case (e.g., "field_to_update"). Omitted fields
   * will not be updated. To replace the entire entity, use one path with the
   * string "*" to match all fields.
   * @return GoogleAnalyticsAdminV1alphaGoogleSignalsSettings
   * @throws \Google\Service\Exception
   */
  public function updateGoogleSignalsSettings($name, GoogleAnalyticsAdminV1alphaGoogleSignalsSettings $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('updateGoogleSignalsSettings', [$params], GoogleAnalyticsAdminV1alphaGoogleSignalsSettings::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(Properties::class, 'Google_Service_GoogleAnalyticsAdmin_Resource_Properties');
