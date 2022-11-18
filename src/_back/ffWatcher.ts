import fs from 'fs';

import {
  FFNodeActionRes,
  FFNodeType,
} from '@_types/ff';

import {
  getFFNodeType,
  getName,
  getNormalizedPath,
  getPath,
  joinPath,
} from './services';

export default class FFWatcher {
  subscriptions = new Map<string, Set<(event: FFNodeActionRes) => void>>();
  watchers = new Map<string, fs.FSWatcher>();

  publish(pathName: string, action: FFNodeActionRes) {
    // skip if there's no subscriber
    const subscribers = this.subscriptions.get(pathName)
    if (!subscribers) return

    // call all of the subscribers
    for (let callback of subscribers) {
      callback(action)
    }
  }

  subscribe(pathName: string, callback: (action: FFNodeActionRes) => void) {
    // if there's no watcher, add watcher
    if (!this.watchers.get(pathName)) this.watch(pathName)

    // add the new callback to the subscribers
    let subscribers = this.subscriptions.get(pathName)
    if (!subscribers) {
      subscribers = new Set()
      this.subscriptions.set(pathName, subscribers)
    }
    subscribers.add(callback)

    console.log(`Subscribed to ${pathName} (${subscribers.size})`)
    return () => {
      // remove callback from the subscribers
      subscribers?.delete(callback)
      console.log(`Unsubscribing from ${pathName} (${subscribers?.size})`)
      if (subscribers?.size === 0) {
        // if there's no subscriber, remove the path subscription
        this.subscriptions.delete(pathName)
        this.unwatch(pathName)
      }
    }
  }

  async watch(pathName: string) {
    // Skip if the watch already exists
    if (this.watchers.get(pathName)) return

    //Setup watcher
    const watcher = fs.watch(pathName, async (actionType, ffName) => {
      const fullPath = getNormalizedPath(joinPath(pathName, ffName.replace(/\\/g, '')))

      // Check if the pathName+ffName is a valid node
      const nodeType: FFNodeType = await getFFNodeType(fullPath)
      if (nodeType !== 'unlink') {
        if (actionType == 'rename') { // Rename event
          this.publish(pathName, {
            type: 'rename',
            payload: {
              uid: fullPath,
              p_uid: getPath(fullPath),
              name: getName(fullPath),
              isEntity: nodeType === 'folder' ? false : true,
              children: [],
              data: {},
            },
          })
        } else {
          // File Content Change Event
        }
      } else {
        this.publish(pathName, {
          type: 'remove',
          payload: fullPath,
        })
      }
    })

    // Log and save the watcher
    console.log(`Watching ${pathName}`);
    this.watchers.set(pathName, watcher);
  }

  unwatch(pathName: string) {
    // Skip if the watch already non exists
    const watcher = this.watchers.get(pathName)
    if (!watcher) return

    // Log and remove the watcher
    watcher.close()
    this.watchers.delete(pathName)
  }
}
