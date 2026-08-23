/**
 * Browser polyfills to guarantee 100% compatibility across all mobile WebViews,
 * Safari/iOS versions, and modern library runtimes (e.g., pdfjs-dist stream iteration).
 */

// 1. Polyfill ReadableStream async iterator and values for pdfjs-dist and stream consumers
if (typeof window !== 'undefined') {
  if (typeof ReadableStream !== 'undefined') {
    const proto = ReadableStream.prototype as any;

    if (!proto[Symbol.asyncIterator]) {
      proto[Symbol.asyncIterator] = function () {
        const reader = this.getReader();
        return {
          next() {
            return reader.read().then(({ done, value }: { done: boolean; value: any }) => {
              if (done) {
                try {
                  reader.releaseLock?.();
                } catch (e) {}
                return { done: true, value: undefined };
              }
              return { done: false, value };
            });
          },
          return() {
            try {
              reader.releaseLock?.();
            } catch (e) {}
            return Promise.resolve({ done: true, value: undefined });
          },
          [Symbol.asyncIterator]() {
            return this;
          },
        };
      };
    }

    if (!proto.values) {
      proto.values = proto[Symbol.asyncIterator];
    }
  }

  // 2. Polyfill Promise.withResolvers (required by modern pdfjs-dist)
  if (typeof (Promise as any).withResolvers === 'undefined') {
    (Promise as any).withResolvers = function <T>() {
      let resolve!: (value: T | PromiseLike<T>) => void;
      let reject!: (reason?: any) => void;
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }

  // 3. Polyfill Array.prototype.at if missing on older Safari/WebViews
  if (!Array.prototype.at) {
    Array.prototype.at = function (n: number) {
      n = Math.trunc(n) || 0;
      if (n < 0) n += this.length;
      if (n < 0 || n >= this.length) return undefined;
      return this[n];
    };
  }
}

export {};
