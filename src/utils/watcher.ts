import { EventEmitter } from 'events';
import { FileError } from '../errors';
import { log } from './logger';

// Dynamically import chokidar to avoid ESM issues in pkg
let chokidarModule: any = null;

async function getChokidar() {
  if (!chokidarModule) {
    try {
      chokidarModule = await import('chokidar');
    } catch (error) {
      log.warn('Chokidar not available, file watching disabled', {
        module: 'watcher',
        error
      });
      return null;
    }
  }
  return chokidarModule?.default || chokidarModule;
}

/**
 * File watcher for schema hot-reload
 */
export class SchemaWatcher extends EventEmitter {
  private watcher: any | null = null;
  private watchedFiles: Set<string> = new Set();

  /**
   * Start watching a file for changes
   * @param filePath - Absolute path to the file to watch
   */
  async watch(filePath: string): Promise<void> {
    if (this.watchedFiles.has(filePath)) {
      log.debug(`Already watching file`, {
        module: 'watcher',
        filePath
      });
      return;
    }

    const chokidar = await getChokidar();
    if (!chokidar) {
      log.warn('File watching is not available in this environment', {
        module: 'watcher'
      });
      return;
    }

    if (!this.watcher) {
      this.watcher = chokidar.watch([], {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 500,
          pollInterval: 100
        }
      });

      this.watcher
        .on('change', (path: string) => {
          log.info(`Schema file changed`, {
            module: 'watcher',
            filePath: path
          });
          this.emit('change', path);
        })
        .on('error', (error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          log.error(`Watcher error: ${errorMessage}`, {
            module: 'watcher',
            error: error instanceof Error ? error : new Error(errorMessage),
            filePath
          });
          this.emit('error', new FileError(
            `File watcher error: ${errorMessage}`,
            filePath,
            'watch'
          ));
        });
    }

    this.watcher.add(filePath);
    this.watchedFiles.add(filePath);
    log.info(`Started watching file`, {
      module: 'watcher',
      filePath
    });
  }

  /**
   * Stop watching a file
   * @param filePath - Path to stop watching
   */
  unwatch(filePath: string): void {
    if (!this.watchedFiles.has(filePath)) {
      return;
    }

    if (this.watcher) {
      this.watcher.unwatch(filePath);
      this.watchedFiles.delete(filePath);
      log.debug(`Stopped watching file`, {
        module: 'watcher',
        filePath
      });
    }
  }

  /**
   * Stop watching all files and cleanup
   */
  async close(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      this.watchedFiles.clear();
      log.debug('File watcher closed', {
        module: 'watcher'
      });
    }
  }

  /**
   * Get list of watched files
   */
  getWatchedFiles(): string[] {
    return Array.from(this.watchedFiles);
  }

  /**
   * Check if a file is being watched
   */
  isWatching(filePath: string): boolean {
    return this.watchedFiles.has(filePath);
  }
}

/**
 * Create a schema watcher instance
 */
export function createWatcher(): SchemaWatcher {
  return new SchemaWatcher();
}
