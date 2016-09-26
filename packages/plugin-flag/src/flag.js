/**!
 *
 * Copyright (c) 2015-2016 Cisco Systems, Inc. See LICENSE file.
 * @private
 */

import {map} from 'lodash';
import {SparkPlugin} from '@ciscospark/spark-core';

const Flag = SparkPlugin.extend({
  namespace: `Flag`,

  session: {
    connected: {
      default: false,
      type: `boolean`
    },
    connecting: {
      default: false,
      type: `boolean`
    },
    socket: `object`
  },

  derived: {
    listening: {
      deps: [`connected`],
      fn() {
        return this.connected;
      }
    }
  },

  /**
  * Archive a flag
  * @param {Object} flag
  * @returns {Promise<Object>} Resolves with the flag archival
  */
  archive(flag, options) {
    if (!flag.id) {
      return Promise.reject(new Error(`\`flag.id\` is required`));
    }
    options = options || {};
    const params = {
      method: `PUT`,
      uri: flag.url,
      options,
      body: {
        state: `archived`
      }
    };

    return this.spark.request(params)
      .then((res) => res.body);
  },

  /**
  * Flags an activity
  * @param {Object} activity
  * @returns {Promise<Object>} Resolves with the flag creation
  */
  flag(activity, options) {
    if (!activity.url) {
      return Promise.reject(new Error(`\`activity.url\` is required`));
    }
    options = options || {};
    const params = {
      method: `POST`,
      api: `userApps`,
      resource: `/flags`,
      options,
      body: {
        'flag-item': activity.url,
        state: `flagged`
      }
    };

    return this.spark.request(params)
      .then((res) => res.body);
  },

  /**
  * Gets a list of Flags for a user
  * @returns {Promise} Resolves with the fetched flags
  */
  list(options) {
    options = options || {};
    const params = {
      method: `GET`,
      api: `userApps`,
      resource: `/flags`,
      options,
      qs: {
        state: `flagged`
      }
    };

    return this.spark.request(params)
      .then((res) => res.body.items);
  },

  /**
  * Gets an array of activities where the status is 200
  * @param {Object} flags
  * @returns {Promise<Object>} Resolves with the activities
  * TODO: this should be implemented as a batched request when migrating to the modular sdk
  */
  mapToActivities(flags) {
    const activityUrls = map(flags, `flag-item`);

    const params = {
      method: `POST`,
      api: `conversation`,
      resource: `bulk_activities_fetch`,
      body: {
        activityUrls
      }
    };

    return this.spark.request(params)
      .then((res) => {
        let activitiesArr = [];
        res.body.multistatus.forEach((statusData) => {
          if (statusData.status === `200`) {
            activitiesArr.push(statusData.data.activity);
          }
        });
        return activitiesArr;
      });
  },

  /**
  * Delete a flag
  * @param {Object} flag
  * @returns {Promise<Object>} Resolves with the flag deletion
  */
  remove(flag, options) {
    if (!flag.id) {
      return Promise.reject(new Error('`flag.id` is required'));
    }
    options = options || {};
    const params = {
      method: `DELETE`,
      options,
      uri: flag.url
    };

    return this.request(params)
      .then((res) => res.body);
  },

  /**
  * UnFlags an activity
  * @param {Object} flag
  * @returns {Promise<Object>} Resolves with the flag removal
  */
  unflag(flag, options) {
    if (!flag.id) {
      return Promise.reject(new Error(`\`flag.id\` is required`));
    }
    options = options || {};
    const params = {
      method: `PUT`,
      uri: flag.url,
      options,
      body: {
        state: `unflagged`
      }
    };

    return this.spark.request(params)
      .then((res) => res.body);
  }

});

export default Flag;
